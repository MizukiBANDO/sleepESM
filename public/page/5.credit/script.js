// コンポーネントを非同期で読み込み
function loadComponent(elementId, url) {
    return fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        });
}

// 認証確認関数
async function isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const res = await fetch('/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.ok;
    } catch {
        return false;
    }
}

// メイン処理
(async () => {
    const loggedIn = await isAuthenticated();

    if (loggedIn) {
        // ✅ ログイン済み：content2.html を読み込む
        Promise.all([
            loadComponent('mainContent', '../1.account/content2.html'),
        ]).then(async () => {

            console.log("ログイン済み。content2.html 読み込み完了");

            const logoutButton = document.getElementById('logoutButton');
            const userEmailDisplay = document.getElementById('userEmailDisplay');
            const userInfoCard = document.getElementById('loggedInUserInfo');

            async function fetchUserEmail(token) {
                try {
                    const res = await fetch('/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        userEmailDisplay.textContent = `ログイン中: ${data.email}`;
                        userInfoCard?.classList.remove('d-none');
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            const existingToken = localStorage.getItem('token');
            if (existingToken) {
                fetchUserEmail(existingToken);
            }

            logoutButton?.addEventListener('click', () => {
                localStorage.removeItem('token');
                userInfoCard?.classList.add('d-none');
                loginResult.textContent = 'ログアウトしました';
                loginResult.className = 'text-info';
            });

            document.getElementById('clear-study-id-button').addEventListener('click', async () => {
                const token = localStorage.getItem('token'); // ログイン後に保存している前提
                if (!token) {
                    alert('ログインしてください');
                    return;
                }

                const res = await fetch('/clear-study-id', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await res.json();
                document.getElementById('clear-result').textContent = result.message || 'エラーが発生しました';
            });




            const registerPushBtn = document.getElementById('registerPushBtn');

if (registerPushBtn) {
    registerPushBtn.addEventListener('click', async () => {
        const time = document.getElementById('notificationTime').value;
        if (!time || !/^\d{2}:\d{2}$/.test(time)) {
            alert('通知時刻を HH:MM 形式で入力してください');
            return;
        }

        try {
            // Service Worker 登録
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker 登録完了', registration);
            // 公開鍵取得
            const res = await fetch('/vapidPublicKey');
            const vapidPublicKey = await res.text();
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

            // Push購読
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            const token = localStorage.getItem('token');
            if (!token) throw new Error('認証トークンがありません');

            // 購読データをサーバーに送信
            const response = await fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription, time })
            });

            const result = await response.json();
            if (result.success) {
                alert('✅ 通知登録が完了しました');
            } else {
                alert('❌ 通知登録に失敗しました: ' + (result.error || result.message));
            }
        } catch (err) {
            console.error('Push登録エラー:', err);
            alert('❌ 通知登録エラーが発生しました');
        }
    });
}

// base64→Uint8Array変換関数（必要なら関数の外に移動）
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


        }).catch(error => {
            console.error('Error loading components (logged-in):', error);
        });

    } else {
        // ❌ 未ログイン：content.html を読み込む
        Promise.all([
            loadComponent('mainContent', '../1.account/content.html'),
        ]).then(async () => {
            console.log("未ログイン。content.html 読み込み完了");

            const registerForm     = document.getElementById('registerForm');
            const registerResult   = document.getElementById('registerResult');

            const loginForm        = document.getElementById('loginForm');
            const loginResult      = document.getElementById('loginResult');
            const userEmailDisplay = document.getElementById('userEmailDisplay');
            const userInfoCard     = document.getElementById('loggedInUserInfo');
            const logoutButton     = document.getElementById('logoutButton');

            async function fetchUserEmail(token) {
                try {
                    const res = await fetch('/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        userEmailDisplay.textContent = `ログイン中: ${data.email}`;
                        userInfoCard?.classList.remove('d-none');
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            const existingToken = localStorage.getItem('token');
            if (existingToken) {
                fetchUserEmail(existingToken);
            }

            if (registerForm) {
                registerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('registerEmail').value;
                    const password = document.getElementById('registerPassword').value;

                    try {
                        const res = await fetch('/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });
                        const data = await res.json();
                        registerResult.textContent = data.success
                            ? '✅ 登録に成功しました！'
                            : `❌ 登録に失敗しました: ${data.error || data.message}`;
                        registerResult.className = data.success ? 'text-success' : 'text-danger';
                    } catch (err) {
                        registerResult.textContent = '❌ ネットワークエラー';
                        registerResult.className = 'text-danger';
                    }
                });
            }

            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('loginEmail').value;
                    const password = document.getElementById('loginPassword').value;

                    try {
                        const res = await fetch('/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password })
                        });
                        const data = await res.json();

                        if (data.success && data.token) {
                            localStorage.setItem('token', data.token);
                            loginResult.textContent = '✅ ログイン成功';
                            loginResult.className = 'text-success';
                            fetchUserEmail(data.token);
                        } else {
                            loginResult.textContent = '❌ ログイン失敗: ' + (data.message || data.error);
                            loginResult.className = 'text-danger';
                        }
                    } catch (err) {
                        loginResult.textContent = '❌ 通信エラー';
                        loginResult.className = 'text-danger';
                    }
                });
            }

            logoutButton?.addEventListener('click', () => {
                localStorage.removeItem('token');
                userInfoCard?.classList.add('d-none');
                loginResult.textContent = 'ログアウトしました';
                loginResult.className = 'text-info';
            });

        }).catch(error => {
            console.error('Error loading components (not logged-in):', error);
        });
    }
})();





function getStoredValue(key) {
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  }
  
  function updateRewardDisplay() {
    const credit = getStoredValue('credit');
    const point = getStoredValue('point');
    document.getElementById('creditDisplay').textContent = credit;
    document.getElementById('pointDisplay').textContent = point;
  }
  
  function incrementReward({ creditInc = 0, pointInc = 0 }) {
    const newCredit = getStoredValue('credit') + creditInc;
    const newPoint = getStoredValue('point') + pointInc;
    localStorage.setItem('credit', newCredit);
    localStorage.setItem('point', newPoint);
    updateRewardDisplay();
  }
  updateRewardDisplay();