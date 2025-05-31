import { sleepStartItemList, sleepEndItemList } from '../../script/api.js';

const recordList = document.getElementById('recordList');
const now = new Date();
const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

// 🔁 レコード削除関数
function deleteRecordById(key, id) {
  let records = JSON.parse(localStorage.getItem(key) || '[]');
  records = records.filter(r => r.id !== id);
  localStorage.setItem(key, JSON.stringify(records));
}

// 🔁 チェックリスト表示関数（check / number 対応）
function displayChecklist(title, checklistData, itemList) {
  if (!checklistData) return '';

  const items = Object.entries(checklistData)
    .filter(([, val]) => val !== undefined && val !== null && val !== false)
    .map(([key, val]) => {
      const item = itemList.find(i => i.key === key);
      if (!item) return `<li>${key}: ${val}</li>`;
      const label = item.record || key;
      return `<li>${item.type === 'number' ? `${label}: ${val}` : label}</li>`;
    }).join('');

  return items
    ? `<div class="mt-2"><strong>${title}</strong><ul class="mb-0 small">${items}</ul></div>`
    : '';
}

// 🔁 記録表示関数
function displayRecords(key, recordList, sleepStartItemList, sleepEndItemList, deleteCallback) {
  const records = JSON.parse(localStorage.getItem(key) || '[]')
    .sort((a, b) => new Date(b.id) - new Date(a.id)); // 降順ソート

  recordList.innerHTML = `<h2 class="h4">${key} の記録（${records.length}件）</h2>`;

  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  accordion.id = 'recordAccordion';

  records.forEach((rec, index) => {
    const startDateObj = rec.sleepStart ? new Date(rec.sleepStart) : null;
    const endDateObj = rec.sleepEnd ? new Date(rec.sleepEnd) : null;

    const formatTime = (dateObj) =>
      dateObj
        ? dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '--:--';

    const formatDate = (dateObj) =>
      dateObj
        ? dateObj.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
        : '';

    const displayDate = formatDate(startDateObj || endDateObj);
    const startTime = formatTime(startDateObj);
    const endTime = formatTime(endDateObj);

    let durationDisplay = '';
    if (startDateObj && endDateObj) {
      const diffMs = endDateObj - startDateObj;
      const diffMin = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMin / 60);
      const minutes = diffMin % 60;
      durationDisplay = `（${hours}h/${minutes}m）`;
    }

    const completedBadge = `<span class="badge ${rec.completed ? 'bg-success' : 'bg-warning text-dark'} ms-2">
      ${rec.completed ? '完了' : '未完了'}
    </span>`;

    const checklistHtml = `
      ${displayChecklist('睡眠前の記録', rec.startChecklist, sleepStartItemList)}
      ${displayChecklist('睡眠後の記録', rec.endChecklist, sleepEndItemList)}
    `;

    const card = document.createElement('div');
    card.className = 'accordion-item';

    card.innerHTML = `
      <h2 class="accordion-header" id="heading-${index}">
        <button class="accordion-button collapsed d-flex justify-content-between align-items-center" type="button"
          data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
          ${displayDate} <br> 🛏️${startTime} / ☀️${endTime} ${completedBadge} ${durationDisplay}
        </button>
      </h2>
      <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}" data-bs-parent="#recordAccordion">
        <div class="accordion-body">
          ${checklistHtml}
          <button class="btn btn-sm btn-outline-danger mt-3" id="delete-${index}">削除</button>
        </div>
      </div>
    `;

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary mt-3 ms-2';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      openEditModal(rec, key);
    });
    // ボタンを追加する
    card.querySelector('.accordion-body').appendChild(editBtn);

    accordion.appendChild(card);

    setTimeout(() => {
      const deleteBtn = document.getElementById(`delete-${index}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('この記録を削除しますか？')) {
            deleteCallback(key, rec.id);
            displayRecords(key, recordList, sleepStartItemList, sleepEndItemList, deleteCallback);
          }
        });
      }
    }, 0);
  });


  
  recordList.appendChild(accordion);
}



// 🔁 CSVエクスポート関数（check = 1/0, number = 実値）
function exportRecordsToCSV(key, sleepStartItemList, sleepEndItemList) {
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  if (records.length === 0) {
    alert('出力できる記録がありません。');
    return;
  }

  const userName = localStorage.getItem('userName') || '';

  const headers = [
    'userName',
    'id',
    'sleepStartDate', 'sleepStartTime',
    'sleepEndDate', 'sleepEndTime',
    'completed',
    ...sleepStartItemList.map(item => `start_${item.key}`),
    ...sleepEndItemList.map(item => `end_${item.key}`)
  ];

  const formatDateTime = (isoStr) => {
    const dateObj = new Date(isoStr);
    const date = dateObj.toLocaleDateString('ja-JP');
    const time = dateObj.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return [date, time];
  };

  const csvRows = records.map(rec => {
    const [startDate, startTime] = rec.sleepStart ? formatDateTime(rec.sleepStart) : ['', ''];
    const [endDate, endTime]     = rec.sleepEnd   ? formatDateTime(rec.sleepEnd)   : ['', ''];

    const getValue = (item, src) => {
      const val = src?.[item.key];
      if (val === undefined || val === null) return '';
      return item.type === 'check' ? (val ? '1' : '0') : val;
    };

    const row = [
      userName,
      rec.id,
      startDate, startTime,
      endDate, endTime,
      rec.completed ? 'TRUE' : 'FALSE',
      ...sleepStartItemList.map(item => getValue(item, rec.startChecklist)),
      ...sleepEndItemList.map(item => getValue(item, rec.endChecklist))
    ];

    return row.join(',');
  });

  // BOM付きCSV内容
  const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${key}_sleep_records.csv`;
  a.click();
  URL.revokeObjectURL(url);
}



// 🔁 初期化
function setContent2() {
  displayRecords(currentKey, recordList, sleepStartItemList, sleepEndItemList, deleteRecordById);
}
setContent2();

document.getElementById('exportCSV').addEventListener('click', () => {
  exportRecordsToCSV(currentKey, sleepStartItemList, sleepEndItemList);
});





function renderChecklist(containerId, itemList, prefix, values = {}) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  itemList.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-2';

    if (item.type === 'check') {
      wrapper.classList.add('form-switch');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'form-check-input me-2';
      input.name = item.key;
      input.id = `${prefix}-check-${item.key}`;
      input.checked = values[item.key] || false;

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = input.id;
      label.textContent = item.label;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
    }

    if (item.type === 'number') {
      const label = document.createElement('label');
      label.className = 'form-label d-block fw-bold mb-1';
      label.textContent = item.label;
      wrapper.appendChild(label);

      const max = parseInt(item.num, 10);
      const start = parseInt(item.numStart || '0', 10);
      const end = start + max - 1;

      const row = document.createElement('div');
      row.className = 'd-flex align-items-center gap-2 flex-wrap';

      const leftText = document.createElement('span');
      leftText.className = 'text-muted small me-2';
      leftText.textContent = item.left || '少ない';
      row.appendChild(leftText);

      const group = document.createElement('div');
      group.className = 'btn-group';
      group.role = 'group';

      for (let i = start; i <= end; i++) {
        const id = `${prefix}-num-${item.key}-${i}`;

        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.name = `${prefix}-num-${item.key}`;
        input.id = id;
        input.value = i;
        if (values[item.key] === i) {
          input.checked = true;
        }

        const radioLabel = document.createElement('label');
        radioLabel.className = 'btn btn-outline-secondary';
        radioLabel.htmlFor = id;
        radioLabel.textContent = i;

        group.appendChild(input);
        group.appendChild(radioLabel);
      }

      row.appendChild(group);

      const rightText = document.createElement('span');
      rightText.className = 'text-muted small ms-2';
      rightText.textContent = item.right || '多い';
      row.appendChild(rightText);

      wrapper.appendChild(row);
    }

    container.appendChild(wrapper);
  });
}




function populateSelect(select, start, end, pad = true) {
  select.innerHTML = '';
  for (let i = start; i <= end; i++) {
    const val = pad ? String(i).padStart(2, '0') : i;
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  }
}

function setDateDropdowns(prefix, date) {
  document.getElementById(`${prefix}-year`).value   = String(date.getFullYear()).slice(-2);
  document.getElementById(`${prefix}-month`).value  = String(date.getMonth() + 1).padStart(2, '0');
  document.getElementById(`${prefix}-day`).value    = String(date.getDate()).padStart(2, '0');
  document.getElementById(`${prefix}-hour`).value   = String(date.getHours()).padStart(2, '0');
  document.getElementById(`${prefix}-minute`).value = String(date.getMinutes()).padStart(2, '0');
}

function getDatetimeFromDropdowns(prefix) {
  const yy = document.getElementById(`${prefix}-year`).value;
  const yyyy = '20' + yy;
  const mm = document.getElementById(`${prefix}-month`).value;
  const dd = document.getElementById(`${prefix}-day`).value;
  const hh = document.getElementById(`${prefix}-hour`).value;
  const mi = document.getElementById(`${prefix}-minute`).value;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00`).toISOString();
}

function initDateDropdowns() {
  ['start', 'end'].forEach(prefix => {
    populateSelect(document.getElementById(`${prefix}-year`), 23, 35);   // 2023〜2035年
    populateSelect(document.getElementById(`${prefix}-month`), 1, 12);
    populateSelect(document.getElementById(`${prefix}-day`), 1, 31);
    populateSelect(document.getElementById(`${prefix}-hour`), 0, 23);
    populateSelect(document.getElementById(`${prefix}-minute`), 0, 59);
  });
}



let editingRecordId = null;

function openEditModal(record, key) {
  editingRecordId = record.id;
  initDateDropdowns();

  const start = record.sleepStart ? new Date(record.sleepStart) : new Date();
  const end   = record.sleepEnd   ? new Date(record.sleepEnd)   : new Date();

  setDateDropdowns('start', start);
  setDateDropdowns('end', end);

  renderChecklist('editStartChecklist', sleepStartItemList, 'editStart', record.startChecklist || {});
  renderChecklist('editEndChecklist', sleepEndItemList, 'editEnd', record.endChecklist || {});

  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();

  document.getElementById('editForm').onsubmit = function (e) {
    e.preventDefault();

    const newStartTime = getDatetimeFromDropdowns('start');
    const newEndTime   = getDatetimeFromDropdowns('end');

    const newStartChecklist = {};
    sleepStartItemList.forEach(item => {
      if (item.type === 'check') {
        const el = document.getElementById(`editStart-check-${item.key}`);
        if (el) newStartChecklist[item.key] = el.checked;
      } else if (item.type === 'number') {
        const selected = document.querySelector(`input[name="editStart-num-${item.key}"]:checked`);
        if (selected) newStartChecklist[item.key] = parseInt(selected.value, 10);
      }
    });

    const newEndChecklist = {};
    sleepEndItemList.forEach(item => {
      if (item.type === 'check') {
        const el = document.getElementById(`editEnd-check-${item.key}`);
        if (el) newEndChecklist[item.key] = el.checked;
      } else if (item.type === 'number') {
        const selected = document.querySelector(`input[name="editEnd-num-${item.key}"]:checked`);
        if (selected) newEndChecklist[item.key] = parseInt(selected.value, 10);
      }
    });

    const records = JSON.parse(localStorage.getItem(key) || '[]').map(r => {
      if (r.id === editingRecordId) {
        return {
          ...r,
          sleepStart: newStartTime,
          sleepEnd: newEndTime,
          startChecklist: newStartChecklist,
          endChecklist: newEndChecklist
        };
      }
      return r;
    });

    localStorage.setItem(key, JSON.stringify(records));
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    displayRecords(key, recordList, sleepStartItemList, sleepEndItemList, deleteRecordById);
  };
}

