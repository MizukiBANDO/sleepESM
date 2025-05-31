const sleepStartItemList = [
  { type: 'number', key: 'sleepiness', label: '日中に眠気を感じましたか？',     record: '眠気', num: '5', numStart: '1', left: '全くない', right: '激しい眠気'},
  { type: 'number', key: 'stress',     label: '現在ストレスを感じていますか？', record: 'ストレス', num: '5', numStart: '1', left: '全くない', right: '非常に感じている'},
  { type: 'number', key: 'food',       label: '現在のおなかの状態は？',        record: '食べ物', num: '7', numStart: '0', left: 'かなり空腹', right: 'かなり満腹'},
  { type: 'check', key: 'concern',     label: '今日の睡眠に懸念がある',        record: '懸念' },
  { type: 'check', key: 'siesta',      label: '1時間以上の昼寝をした',          record: '昼寝' },
  { type: 'check', key: 'light',       label: '野外で日光を浴びた',             record: '日光' },
  { type: 'check', key: 'bath',        label: '寝る前に湯船に浸かった',          record: '入浴' },
  { type: 'check', key: 'exercise',    label: '日中に適度な運動をした',          record: '運動' },

  { type: 'check', key: 'caffeine',    label: '【4時間】カフェインを摂取した', record: 'カフェイン摂取' },
  { type: 'check', key: 'alcohol',     label: '【2時間】アルコール (酒類) を飲んだ', record: '飲酒' },
  { type: 'check', key: 'drink',       label: '【1時間】飲み物をたくさん飲んだ',     record: '飲み物' },

  { type: 'check', key: 'high-exercise', label: '【2時間】激しい運動をした', record: '激しい運動' },
  { type: 'check', key: 'nicotine',    label: '【2時間】刺激物 (ニコチン類) を摂取した', record: 'ニコチン' },
  { type: 'check', key: 'smartphone',  label: '【1時間】PC / スマホ / TVを注視していた',     record: 'スマホ使用' }

];

const sleepEndItemList = [
  { type: 'number',key: 'SleepQuality2',   label: '今日の睡眠には満足していますか？',    record: '睡眠の満足感', 
    num: '5', numStart: '1', left: '非常に不満', right: '非常に満足'},

  { type: 'check', key: 'bedridden',      label: 'しばらくは体を起こしたくない', record: '起床困難' },
  { type: 'check', key: 'difficultSleep', label: 'なかなか寝つけなかった',      record: '入眠困難' },
  { type: 'check', key: 'interrupted',    label: '途中で目が覚めた',            record: '中途覚醒' },
  { type: 'check', key: 'earlyAwaking',   label: '目が覚めるのが早すぎた',      record: '早朝覚醒' },
  { type: 'check', key: 'lookAtTheClock', label: '夜中に時計を見た',            record: '時計を見た' },

  { type: 'check', key: 'worry',          label: '悩み事がずっと頭をよぎっていた',   record: '悩み事' },
  { type: 'check', key: 'environment',    label: '寝るときの環境が悪かった',         record: '睡眠環境' },
  { type: 'check', key: 'tvAndMusic',     label: 'テレビや音楽をつけっぱなしで寝た', record: 'テレビや音楽' },
  { type: 'check', key: 'partner',        label: '同居人に睡眠を邪魔された',         record: '同居人' }
];

export { sleepStartItemList, sleepEndItemList };
