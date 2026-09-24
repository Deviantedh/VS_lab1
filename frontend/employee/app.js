const API_URL = 'http://localhost:8080/api';

// Состояние личного кабинета
const state = {
  currentEmployeeId: localStorage.getItem('employee_current_id') || null,
  employees: [],
  currentEmployee: null,
  activeAttendanceRecord: null
};

// ================= Toast Уведомления =================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ================= Обработка Ошибок API =================
async function handleApiResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null;
    return await response.json();
  }

  let errorMsg = `Ошибка сервера (HTTP ${response.status})`;
  try {
    const errorBody = await response.json();
    if (errorBody.detail) {
      errorMsg = errorBody.detail;
    } else if (errorBody.message) {
      errorMsg = errorBody.message;
    }
  } catch (e) {}
  throw new Error(errorMsg);
}

// ================= Живые часы =================
function startLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');

  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('ru-RU');
    dateEl.textContent = now.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  update();
  setInterval(update, 1000);
}

// ================= Навигация по табам =================
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${target}`).classList.add('active');

      if (state.currentEmployeeId) {
        if (target === 'shifts') loadMyShifts();
        if (target === 'attendance') loadMyAttendance();
        if (target === 'requests') loadMyRequests();
        if (target === 'absences') loadMyAbsences();
        if (target === 'profile') renderProfile();
      }
    });
  });
}

// ================= Загрузка списка сотрудников =================
async function loadEmployeesList() {
  const select = document.getElementById('current-user-select');
  try {
    const res = await fetch(`${API_URL}/employees?size=50`).then(handleApiResponse);
    const employees = Array.isArray(res) ? res : (res.content || []);
    state.employees = employees;

    select.innerHTML = '';
    if (employees.length === 0) {
      select.innerHTML = '<option value="">Нет сотрудников (создайте в Admin)</option>';
      return;
    }

    employees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = `${emp.name} (${emp.status})`;
      select.appendChild(opt);
    });

    // Восстанавливаем выбранного или ставим первого
    if (state.currentEmployeeId && employees.some(e => e.id == state.currentEmployeeId)) {
      select.value = state.currentEmployeeId;
    } else {
      select.value = employees[0].id;
      state.currentEmployeeId = employees[0].id;
      localStorage.setItem('employee_current_id', employees[0].id);
    }

    onEmployeeChanged(select.value);
  } catch (err) {
    showToast('Не удалось подключиться к серверу API: ' + err.message, 'danger');
  }
}

function onEmployeeChanged(employeeId) {
  state.currentEmployeeId = Number(employeeId);
  localStorage.setItem('employee_current_id', employeeId);
  state.currentEmployee = state.employees.find(e => e.id == employeeId);

  // Перезагружаем текущие вкладки
  loadMyShifts();
  loadMyAttendance();
  loadMyRequests();
  loadMyAbsences();
  renderProfile();
}

// ================= 1. МОИ СМЕНЫ =================
async function loadMyShifts() {
  const container = document.getElementById('my-shifts-container');
  if (!state.currentEmployeeId) return;

  container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">Загрузка расписания...</p>';

  try {
    // Получаем все компании -> филиалы -> графики -> смены
    const companies = await fetch(`${API_URL}/companies`).then(handleApiResponse);
    const myShifts = [];

    for (const c of companies) {
      const branches = await fetch(`${API_URL}/branches/company/${c.id}`).then(handleApiResponse);
      for (const b of branches) {
        const schedules = await fetch(`${API_URL}/schedules/branch/${b.id}`).then(handleApiResponse);
        for (const s of schedules) {
          const shifts = await fetch(`${API_URL}/shifts/schedule/${s.id}?page=0&size=100`).then(handleApiResponse);
          for (const shift of shifts) {
            if (shift.assignedEmployees && shift.assignedEmployees.some(e => e.id === state.currentEmployeeId)) {
              myShifts.push({ ...shift, branchName: b.name });
            }
          }
        }
      }
    }

    // Сортировка по дате
    myShifts.sort((a, b) => a.date.localeCompare(b.date));

    container.innerHTML = '';
    if (myShifts.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: #fff; border-radius: var(--radius); border: 1px solid var(--border);">
          <p style="font-size: 16px; font-weight: 600; color: var(--text-muted);">
            У вас пока нет назначенных смен 🗓
          </p>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Попросите менеджера в панели управления назначить вас в график.
          </p>
        </div>
      `;
      return;
    }

    myShifts.forEach(shift => {
      const tile = document.createElement('div');
      tile.className = 'shift-tile';
      tile.innerHTML = `
        <div class="shift-tile-date">📅 ${shift.date}</div>
        <div class="shift-tile-time">⏰ ${shift.timeFrom.substring(0, 5)} — ${shift.timeTo.substring(0, 5)}</div>
        <div class="shift-tile-meta">🏢 Филиал: <strong>${escapeHtml(shift.branchName)}</strong></div>
        <div class="shift-tile-meta">Обед: ${shift.breakMinutes} минут • Смена #${shift.id}</div>
      `;
      container.appendChild(tile);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 2. ОТМЕТКА ЯВОК (CHECK-IN / OUT) =================
async function loadMyAttendance() {
  const tbody = document.getElementById('my-attendance-table-body');
  const statusText = document.getElementById('attendance-status-text');
  if (!state.currentEmployeeId) return;

  try {
    const records = await fetch(`${API_URL}/attendance/employee/${state.currentEmployeeId}`).then(handleApiResponse);
    tbody.innerHTML = '';

    // Проверяем, есть ли незакрытая смена
    const openRecord = records.find(r => r.actualStart && !r.actualEnd);
    state.activeAttendanceRecord = openRecord;

    if (openRecord) {
      statusText.innerHTML = `🟢 Вы находитесь на смене с ${formatTime(openRecord.actualStart)}`;
      document.getElementById('btn-clock-in').disabled = true;
      document.getElementById('btn-clock-in').style.opacity = '0.5';
      document.getElementById('btn-clock-out').disabled = false;
      document.getElementById('btn-clock-out').style.opacity = '1';
    } else {
      statusText.innerHTML = '⚪ Вы не на смене (готов к Check-in)';
      document.getElementById('btn-clock-in').disabled = false;
      document.getElementById('btn-clock-in').style.opacity = '1';
      document.getElementById('btn-clock-out').disabled = true;
      document.getElementById('btn-clock-out').style.opacity = '0.5';
    }

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Записей явок пока нет</td></tr>';
      return;
    }

    records.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${r.id}</strong></td>
        <td>${formatDateTime(r.plannedStart)}</td>
        <td>${formatDateTime(r.plannedEnd)}</td>
        <td>${r.actualStart ? formatDateTime(r.actualStart) : '<span style="color: var(--warning);">Не зафиксирован</span>'}</td>
        <td>${r.actualEnd ? formatDateTime(r.actualEnd) : '<span class="badge badge-green">На смене</span>'}</td>
        <td>${r.breakMinutes} мин.</td>
        <td>${escapeHtml(r.comment || '—')}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Кнопка: Начать смену (Check-in)
document.getElementById('btn-clock-in').addEventListener('click', async () => {
  if (!state.currentEmployeeId) return;

  const now = new Date();
  const plannedStart = new Date(now);
  plannedStart.setHours(9, 0, 0, 0);
  const plannedEnd = new Date(now);
  plannedEnd.setHours(18, 0, 0, 0);

  try {
    await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: state.currentEmployeeId,
        plannedStart: plannedStart.toISOString(),
        plannedEnd: plannedEnd.toISOString(),
        actualStart: now.toISOString(),
        breakMinutes: 30,
        comment: 'Приход на работу через Личный кабинет'
      })
    }).then(handleApiResponse);

    showToast('Смена успешно начата! Фактическое время прихода зафиксировано.', 'success');
    loadMyAttendance();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Кнопка: Завершить смену (Check-out)
document.getElementById('btn-clock-out').addEventListener('click', async () => {
  if (!state.activeAttendanceRecord) {
    showToast('У вас нет активной открытой смены!', 'warning');
    return;
  }

  const comment = prompt('Комментарий к смене (необязательно):', 'Смена завершена без происшествий');
  const now = new Date();

  try {
    await fetch(`${API_URL}/attendance/${state.activeAttendanceRecord.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actualEnd: now.toISOString(),
        comment: comment || state.activeAttendanceRecord.comment
      })
    }).then(handleApiResponse);

    showToast('Смена завершена! Фактическое время ухода зафиксировано.', 'info');
    loadMyAttendance();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// ================= 3. ЗАЯВКИ (ОТПУСК/БОЛЬНИЧНЫЙ) =================
async function loadMyRequests() {
  const tbody = document.getElementById('my-requests-table-body');
  if (!state.currentEmployeeId) return;

  try {
    const res = await fetch(`${API_URL}/requests/employee/${state.currentEmployeeId}`).then(handleApiResponse);
    const requests = Array.isArray(res) ? res : (res.content || []);
    tbody.innerHTML = '';

    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Вы пока не подавали заявок</td></tr>';
      return;
    }

    requests.forEach(req => {
      let datesStr = '—';
      try {
        const data = JSON.parse(req.requestData);
        datesStr = `${data.dateFrom} — ${data.dateTo}`;
      } catch (e) {
        datesStr = req.requestData;
      }

      let badgeClass = 'badge-yellow';
      if (req.status === 'APPROVED') badgeClass = 'badge-green';
      if (req.status === 'REJECTED') badgeClass = 'badge-red';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${req.id}</strong></td>
        <td><span class="badge badge-blue">${req.type}</span></td>
        <td>${datesStr}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
        <td>${escapeHtml(req.resolutionComment || 'Ожидает рассмотрения')}</td>
        <td>${formatDateTime(req.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Отправка новой заявки
document.getElementById('form-submit-request').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.currentEmployeeId) return;

  const type = document.getElementById('req-type').value;
  const dateFrom = document.getElementById('req-date-from').value;
  const dateTo = document.getElementById('req-date-to').value;
  const comment = document.getElementById('req-comment').value.trim();

  if (dateFrom > dateTo) {
    showToast('Дата начала не может быть позже даты окончания!', 'danger');
    return;
  }

  const requestData = JSON.stringify({
    dateFrom,
    dateTo,
    comment
  });

  try {
    await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: state.currentEmployeeId,
        type,
        requestData
      })
    }).then(handleApiResponse);

    showToast('Заявка успешно отправлена на согласование!', 'success');
    document.getElementById('form-submit-request').reset();
    loadMyRequests();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// ================= 4. МОИ ОТСУТСТВИЯ =================
async function loadMyAbsences() {
  const tbody = document.getElementById('my-absences-table-body');
  if (!state.currentEmployeeId) return;

  try {
    const absences = await fetch(`${API_URL}/absences/employee/${state.currentEmployeeId}`).then(handleApiResponse);
    tbody.innerHTML = '';

    if (absences.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">У вас нет зафиксированных периодов отсутствия</td></tr>';
      return;
    }

    absences.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${a.id}</strong></td>
        <td><span class="badge badge-blue">${a.type}</span></td>
        <td><strong>${a.dateFrom}</strong></td>
        <td><strong>${a.dateTo}</strong></td>
        <td>${escapeHtml(a.reason || 'Согласовано')}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 5. МОЙ ПРОФИЛЬ =================
function renderProfile() {
  const el = document.getElementById('profile-details');
  const emp = state.currentEmployee;
  if (!emp) {
    el.innerHTML = 'Сотрудник не выбран';
    return;
  }

  const assignmentsHtml = (emp.assignments && emp.assignments.length > 0)
    ? emp.assignments.map(a => `
        <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-sm); margin-top: 8px;">
          🏢 Филиал: <strong>${escapeHtml(a.branchName)}</strong><br>
          💼 Должность: <strong>${escapeHtml(a.positionTitle)}</strong><br>
          📅 Работает с: ${a.startedAt} (${a.isPrimary ? 'Основная ставка' : 'Совместительство'})
        </div>
      `).join('')
    : '<div style="color: var(--text-muted); margin-top: 4px;">Нет активных назначений на филиалы</div>';

  el.innerHTML = `
    <p>👤 <strong>ФИО:</strong> ${escapeHtml(emp.name)}</p>
    <p>📞 <strong>Телефон:</strong> ${escapeHtml(emp.phone)}</p>
    <p>🎂 <strong>Дата рождения:</strong> ${emp.birthDate || 'Не указана'}</p>
    <p>📅 <strong>Дата приема на работу:</strong> ${emp.hireDate || '—'}</p>
    <p>🏷 <strong>Текущий статус:</strong> <span class="badge badge-green">${emp.status}</span></p>
    <div style="margin-top: 14px;">
      <strong>Мои ставки и должности:</strong>
      ${assignmentsHtml}
    </div>
  `;
}

// Вспомогательные функции
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

// ================= Инициализация =================
window.addEventListener('DOMContentLoaded', async () => {
  startLiveClock();
  initTabs();

  // Дата по умолчанию для заявки: завтра
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('req-date-from').value = tomorrow.toISOString().substring(0, 10);
  document.getElementById('req-date-to').value = nextWeek.toISOString().substring(0, 10);

  // Селектор сотрудника
  document.getElementById('current-user-select').addEventListener('change', (e) => {
    onEmployeeChanged(e.target.value);
  });

  await loadEmployeesList();
});
