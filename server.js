const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const cron = require('node-cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// DB設定
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ミドルウェア
app.use(express.static('public'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.json());

// HTTPSリダイレクト（本番）
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// 認証ミドルウェア
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

////////////////////////////////////////////////
//
// WebPush
//
////////////////////////////////////////////////
// 設定の読み込み
// webpush.setVapidDetails(
//   process.env.VAPID_EMAIL,
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// // 公開鍵を返すAPI（GET /vapidPublicKey）
// app.get('/vapidPublicKey', (req, res) => {
//   res.status(200).send(process.env.VAPID_PUBLIC_KEY);
// });

app.post('/subscribe', authenticateToken, async (req, res) => {
    const { subscription, time } = req.body;
    const userId = req.user.userId;

    try {
        await pool.query(`
            INSERT INTO push_subscriptions (user_id, subscription, time)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE
            SET subscription = $2, time = $3
        `, [userId, subscription, time]);

        res.status(201).json({ success: true, message: 'Push subscription saved' });
    } catch (err) {
        console.error('Subscription保存エラー:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// cron.schedule('* * * * *', async () => {
//     const now = new Date();
//     const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
//     try {
//         const result = await pool.query(
//             `SELECT user_id, subscription FROM push_subscriptions WHERE time = $1`, [currentTime]
//         );

//         const payload = JSON.stringify({
//             title: '時間になりました！',
//             body: 'あなたの設定した時刻に通知が届きました📩',
//             url: '/2.function' // ← ここに遷移させたいURL
//         });

//         for (const row of result.rows) {
//             try {
//                 await webpush.sendNotification(row.subscription, payload);
//             } catch (err) {
//                 console.error(`通知失敗（user_id=${row.user_id}）`, err);
//                 // 失敗したらDBから削除するなどの処理を追加してもOK
//             }
//         }
//     } catch (err) {
//         console.error('通知スケジューリングエラー:', err);
//     }
// });

////////////////////////////////////////////////
//
// 開発環境用 ここから
// 
////////////////////////////////////////////////
app.post('/admin/sql', authenticateToken, async (req, res) => {
    const { query, params } = req.body;

    try {
        const result = await pool.query(query, params || []);
        res.json({ success: true, rows: result.rows });
    } catch (err) {
        console.error('SQLエラー:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// DB接続テスト
app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

////////////////////////////////////////////////
//
// 開発環境用 ここまで
// 
////////////////////////////////////////////////


// ユーザー登録
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        res.json({ success: true, message: 'User registered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ログイン（JWT発行）
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ログイン中のユーザー情報を取得（要JWT）
app.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT users.email, users.study_id, studies.study_name
            FROM users
            LEFT JOIN studies ON users.study_id = studies.id
            WHERE users.id = $1
        `, [req.user.userId]);

        const user = result.rows[0];
        res.json({
            email: user.email,
            study_id: user.study_id,
            study_name: user.study_name // 未使用 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ユーザー情報取得に失敗しました' });
    }
});


// study_idを登録するルート（要ログイン）
app.post('/set-study-id', authenticateToken, async (req, res) => {
    const { study_id } = req.body;

    if (!study_id) {
        return res.status(400).json({ success: false, message: 'study_id is required' });
    }

    try {
        // 募集中かチェック
        const studyCheck = await pool.query('SELECT recruiting FROM studies WHERE id = $1', [study_id]);
        if (!studyCheck.rows[0] || !studyCheck.rows[0].recruiting) {
            return res.status(400).json({ success: false, message: 'この研究には参加できません（募集終了）' });
        }

        await pool.query('UPDATE users SET study_id = $1 WHERE id = $2', [study_id, req.user.userId]);
        res.json({ success: true, message: 'study_id updated' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});



// study_idをnullにするルート（要ログイン）
app.post('/clear-study-id', authenticateToken, async (req, res) => {
    try {
        await pool.query('UPDATE users SET study_id = NULL WHERE id = $1', [req.user.userId]);
        res.json({ success: true, message: 'study_id cleared' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/available-studies', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM studies
            WHERE recruiting = TRUE
            AND (
                id != (SELECT study_id FROM users WHERE id = $1)
                OR (SELECT study_id FROM users WHERE id = $1) IS NULL
            )
        `, [req.user.userId]);

        res.json({ success: true, studies: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.post('/api/study00', authenticateToken, async (req, res) => {
    const { item01, item02, item03, item04, item05 } = req.body;
    const userId = req.user.userId;

    try {
        await pool.query(`
            INSERT INTO study00 ("user", item01, item02, item03, item04, item05)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, item01, item02, item03, item04, item05]);

        res.json({ success: true, message: 'データを保存しました' });
    } catch (err) {
        console.error('study00保存エラー:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});




////////////////////////////////////////////////
//
// ページルート一般 必ず最後においておく
// 
////////////////////////////////////////////////

app.get('/:page?', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

////////////////////////////////////////////////
//
// サーバー起動（環境によってHTTP/HTTPS切り替え）
// 
////////////////////////////////////////////////
if (process.env.NODE_ENV === 'development') {
    const sslOptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`✅ [DEV] HTTPS Server running at https://localhost:${PORT}`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`✅ [PROD] HTTP Server running at http://localhost:${PORT}`);
    });
}

//////
//
// サービスワーカー用の書き出しコード
//
//////

// const publicDir = path.join(__dirname, 'public'); // ← あなたのpublicフォルダパス
// const output = path.join(publicDir, 'sw-cache-list.js'); // 出力ファイル

// function walk(dir) {
//   let results = [];
//   const list = fs.readdirSync(dir);
//   list.forEach(file => {
//     const filepath = path.join(dir, file);
//     const stat = fs.statSync(filepath);
//     if (stat && stat.isDirectory()) {
//       results = results.concat(walk(filepath));
//     } else {
//       const relPath = filepath.replace(publicDir, '').replace(/\\/g, '/');
//       results.push(relPath.startsWith('/') ? relPath : '/' + relPath);
//     }
//   });
//   return results;
// }

// const files = walk(publicDir);

// // JavaScriptコードとして書き出す
// const js = `export const urlsToCache = ${JSON.stringify(files, null, 2)};\n`;

// fs.writeFileSync(output, js, 'utf8');
// console.log(`✅ キャッシュ対象リストを生成しました: ${output}`);