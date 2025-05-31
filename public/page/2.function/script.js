import { sleepStartItemList, sleepEndItemList } from '../../script/api.js';

const tempExists = localStorage.getItem('sleepTemp');
const defaultTabId = tempExists ? 'end-tab' : 'start-tab';

function showSleepStartInfo() {
  const sleepStartDisplay = document.getElementById('sleepStartDisplay');
  const temp = localStorage.getItem('sleepTemp');
  if (temp) {
    const { sleepStart } = JSON.parse(temp);
    if (sleepStart) {
      const formatted = new Date(sleepStart).toLocaleString('ja-JP', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit'
      });
      sleepStartDisplay.textContent = `🛏️ あなたは ${formatted} に寝始めました`;
    } else {
      sleepStartDisplay.textContent = '🛏️ 寝始めの時間は記録されていません';
    }
  } else {
    sleepStartDisplay.textContent = '';
  }
};

function handleStartSleep() {
  const now = new Date();
  const existingTemp = localStorage.getItem('sleepTemp');
  if (existingTemp) {
    const prev = JSON.parse(existingTemp);
    const prevDate = new Date(prev.sleepStart);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const records = JSON.parse(localStorage.getItem(prevKey) || '[]');
    records.push(prev);
    localStorage.setItem(prevKey, JSON.stringify(records));
    alert('⚠️ 前回の記録が未完了でした。そのまま保存します。');
  }

  const startChecklistValues = {};
  sleepStartItemList.forEach(item => {
    if (item.type === 'check') {
      const el = document.getElementById(`start-check-${item.key}`);
      startChecklistValues[item.key] = el ? el.checked : false;
    } else if (item.type === 'number') {
      const selected = document.querySelector(`input[name="${item.key}"]:checked`);
      startChecklistValues[item.key] = selected ? Number(selected.value) : null;
    }
  });

  const tempRecord = {
    id:              now.toISOString(),
    sleepStart:      now.toISOString(),
    sleepEnd:        null,
    completed:       false,
    startChecklist:  startChecklistValues
  };

  localStorage.setItem('sleepTemp', JSON.stringify(tempRecord));
  alert("🛏️ Sleep started!");

  new bootstrap.Tab(document.getElementById('end-tab')).show();
  showSleepStartInfo();
  resetChecklist('sleepStart');
}

function handleEndSleep() {
  const now = new Date();
  const temp = localStorage.getItem('sleepTemp');
  let record;

  if (temp) {
    record = JSON.parse(temp);
    record.sleepEnd = now.toISOString();
    record.completed = true;
    localStorage.removeItem('sleepTemp');
    alert("☀️ Sleep ended and saved!");
  } else {
    record = {
      id: now.toISOString(),
      sleepStart: null,
      sleepEnd: now.toISOString(),
      completed: false
    };
    alert("⚠️ sleepStart が未記録のまま sleepEnd を保存しました。");
  }
  const endChecklist = {};
  sleepEndItemList.forEach(item => {
    const checked = document.getElementById(`end-check-${item.key}`).checked;
    endChecklist[item.key] = checked;
  });

  record.endChecklist = endChecklist; // 追加して保存

  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  records.push(record);
  localStorage.setItem(key, JSON.stringify(records));

  // Startタブに戻る
  new bootstrap.Tab(document.getElementById('start-tab')).show();
  resetChecklist('sleepEnd');

  if (temp) {
    record = JSON.parse(temp);
    record.sleepEnd = now.toISOString();
    record.completed = true;
    localStorage.removeItem('sleepTemp');
  
    // ✅ ✅ ✅ 条件を満たしたら credit / point を 1 増やす
    const startDate = new Date(record.sleepStart);
    const diffMs = now - startDate;
    const diffHrs = diffMs / (1000 * 60 * 60); // 時間に変換
  
    if (diffHrs >= 0) { // 眠った時間数 test時は0時間
      const currentCredit = parseInt(localStorage.getItem('credit') || '0', 10);
      const currentPoint = parseInt(localStorage.getItem('point') || '0', 10);
      localStorage.setItem('credit', String(currentCredit + 1));
      localStorage.setItem('point', String(currentPoint + 1));
      alert("🎉 よくねました！creditとpointが1ずつ増えました");
    }
    // ✅ ✅ ✅ ここまで
  }
};

async function updateServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    alert('このブラウザはService Workerに対応していません。');
    return;
  }

  try {
    // キャッシュ削除
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }

    // Service Worker 更新
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      alert('🔄 キャッシュを削除し、Service Worker を更新しました。ページを再読み込みします。');
      location.reload();
    } else {
      alert('❗ Service Worker が登録されていません。');
    }
  } catch (err) {
    alert('❌ PWA更新中にエラーが発生しました');
    console.error('SW update error:', err);
  }
};

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('service-worker.js');
    alert('✅ Service Worker 登録完了');
    console.log('Service Worker registered:', registration);
  } catch (err) {
    alert('❌ 登録失敗');
    console.error('Service Worker registration error:', err);
  }
};

function resetChecklist(prefix, attempt = 1) {
  const container = document.getElementById(`${prefix}Checklist`);
  if (!container) {
    console.warn(`❌ ${prefix}Checklist が見つかりません`);
    return;
  }

  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  const radios = container.querySelectorAll('input[type="radio"]');

  if (checkboxes.length === 0 && radios.length === 0) {
    if (attempt >= 3) {
      console.warn(`❌ ${prefix}Checklist の初期化に失敗（最大試行回数）`);
      return;
    }

    console.warn(`⚠️ ${prefix}Checklist が未描画。再試行 (${attempt}/3)...`);
    setTimeout(() => resetChecklist(prefix, attempt + 1), 50);  // 次の試行へ
    return;
  }

  // ✅ checkbox のリセット
  checkboxes.forEach(el => el.checked = false);

  // ✅ radio のリセット
  radios.forEach(el => el.checked = false);

  console.log(`✅ ${prefix}Checklist のチェックと数値を初期化しました`);
}


setContent();
function setContent(){
  // ✅ 初期表示タブの決定
  new bootstrap.Tab(document.getElementById(defaultTabId)).show();
  showSleepStartInfo(); // 寝始めた時間の表示

  // ✅ Start Sleep / End Sleep 処理
  const startBtn = document.getElementById('startSleepBtn');
  const endBtn   = document.getElementById('endSleepBtn');
  startBtn.addEventListener('click', () => { handleStartSleep() });
  endBtn.addEventListener('click', () => { handleEndSleep() });

  // PWA登録・更新用ボタン制御    // 登録ボタン 更新ボタン
  const registerBtn = document.getElementById('registerSW');
  const updateBtn   = document.getElementById('updateSW');
  if ('serviceWorker' in navigator) {
    registerBtn.addEventListener('click', () => { registerServiceWorker() });
    updateBtn.addEventListener('click', () => { updateServiceWorker() });
  } else {
    alert('このブラウザはService Workerに対応していません。');
    registerBtn.disabled = true;
    updateBtn.disabled   = true;
  }
};


// 項目
// ✅ 睡眠開始用チェックリストの生成

function renderChecklist(containerId, itemList, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // 除外リストを読み込み（例: ['check:alcohol', 'number:stress']）
  const excluded = JSON.parse(localStorage.getItem('excludedItems') || '[]');

  itemList.forEach(item => {
    const itemId = `${item.type}:${item.key}`;
    if (excluded.includes(itemId)) return; // 除外対象ならスキップ

    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';

    if (item.type === 'check') {
      wrapper.classList.add('form-switch');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'form-check-input me-2';
      input.name = item.key;
      input.id = `${prefix}-check-${item.key}`;

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = item.label;

      wrapper.appendChild(input);
      wrapper.appendChild(label);

    } else if (item.type === 'number') {
      const max = parseInt(item.num, 10);
      const start = parseInt(item.numStart || '0', 10);
      const end = start + max - 1;
      const leftLabelText = item.left || '少ない';
      const rightLabelText = item.right || '多い';

      const label = document.createElement('label');
      label.className = 'form-label d-block fw-bold mb-1';
      label.textContent = item.label;
      wrapper.appendChild(label);

      const radioRow = document.createElement('div');
      radioRow.className = 'd-flex align-items-center gap-2 flex-wrap';

      const leftText = document.createElement('span');
      leftText.className = 'text-muted small me-2';
      leftText.textContent = leftLabelText;
      radioRow.appendChild(leftText);

      const radioGroup = document.createElement('div');
      radioGroup.className = 'btn-group';
      radioGroup.role = 'group';

      for (let i = start; i <= end; i++) {
        const id = `${prefix}-num-${item.key}-${i}`;

        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.name = item.key;
        input.id = id;
        input.value = i;

        const radioLabel = document.createElement('label');
        radioLabel.className = 'btn btn-outline-secondary';
        radioLabel.htmlFor = id;
        radioLabel.textContent = i;

        radioGroup.appendChild(input);
        radioGroup.appendChild(radioLabel);
      }

      radioRow.appendChild(radioGroup);

      const rightText = document.createElement('span');
      rightText.className = 'text-muted small ms-2';
      rightText.textContent = rightLabelText;
      radioRow.appendChild(rightText);

      wrapper.appendChild(radioRow);
    }

    container.appendChild(wrapper);
  });
}






renderChecklist('sleepStartChecklist', sleepStartItemList, 'start');
renderChecklist('sleepEndChecklist', sleepEndItemList, 'end');

