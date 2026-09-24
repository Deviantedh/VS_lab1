const API_URL = 'http://localhost:8080/api';

// Состояние приложения
const state = {
  companies: [],
  positions: [],
  branches: [],
  employees: [],
  selectedCompanyId: null,
  selectedBranchId: null,
  selectedScheduleId: null,
  attendancePage: 0,
  attendanceHasNext: false,
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

// ================= Обработка Ошибок API (RFC 7807) =================
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
  } catch (e) {
    // Не JSON ответ
  }
  throw new Error(errorMsg);
}

// ================= Проверка связи с бэкендом =================
async function checkBackendStatus() {
  const badge = document.getElementById('backend-status');
  const text = document.getElementById('backend-status-text');

  try {
    const res = await fetch(`${API_URL}/companies`, { method: 'GET' });
    if (res.ok) {
      badge.className = 'status-badge online';
      text.textContent = 'API Онлайн (Port 8080)';
      return true;
    }
  } catch (err) {
    badge.className = 'status-badge offline';
    text.textContent = 'API Офлайн (Запустите Spring Boot)';
    return false;
  }
}

// ================= Навигация по табам =================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const titleEl = document.getElementById('current-page-title');
  const subtitleEl = document.getElementById('current-page-subtitle');

  const titles = {
    dashboard: { title: 'Сводка системы', subtitle: 'Общий обзор состояния компаний и сотрудников' },
    organization: { title: 'Структура организации', subtitle: 'Управление компаниями, филиалами и должностями' },
    employees: { title: 'Кадровый состав', subtitle: 'Список сотрудников и их назначения в филиалы' },
    shifts: { title: 'Графики и Смены', subtitle: 'Планирование смен, назначение персонала и аудит-лог' },
    requests: { title: 'Заявки на согласование', subtitle: 'Отпуска, отгулы и больничные сотрудников' },
    attendance: { title: 'Табель рабочего времени', subtitle: 'Сравнение плановых и фактических явок (Slice)' }
  };

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.section;
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(`section-${target}`).classList.add('active');

      if (titles[target]) {
        titleEl.textContent = titles[target].title;
        subtitleEl.textContent = titles[target].subtitle;
      }

      // Подгрузка при переходе
      if (target === 'organization') loadOrganizationData();
      if (target === 'employees') loadEmployees();
      if (target === 'shifts') loadShiftsSection();
      if (target === 'requests') loadRequests();
      if (target === 'attendance') loadAttendance(true);
    });
  });
}

// ================= Модальные окна (<dialog>) =================
function initModals() {
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dialog = btn.closest('dialog');
      if (dialog) dialog.close();
    });
  });

  // Закрытие при клике по бэкдропу
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) dialog.close();
    });
  });
}

// ================= 1. СВОДКА (DASHBOARD) =================
async function loadDashboardStats() {
  try {
    const [companies, employees, requestsRes] = await Promise.all([
      fetch(`${API_URL}/companies`).then(handleApiResponse),
      fetch(`${API_URL}/employees`).then(handleApiResponse),
      fetch(`${API_URL}/requests?status=PENDING`).then(handleApiResponse)
    ]);

    state.companies = Array.isArray(companies) ? companies : (companies.content || []);
    state.employees = Array.isArray(employees) ? employees : (employees.content || []);

    const pendingCount = Array.isArray(requestsRes)
      ? requestsRes.length
      : (requestsRes.totalElements ?? (requestsRes.content ? requestsRes.content.length : 0));

    document.getElementById('stat-companies-count').textContent = state.companies.length;
    document.getElementById('stat-employees-count').textContent = state.employees.length;
    document.getElementById('stat-requests-count').textContent = pendingCount;

    // Считаем филиалы суммарно
    let branchTotal = 0;
    for (const c of state.companies) {
      try {
        const branches = await fetch(`${API_URL}/branches/company/${c.id}`).then(handleApiResponse);
        branchTotal += Array.isArray(branches) ? branches.length : 0;
      } catch (e) {}
    }
    document.getElementById('stat-branches-count').textContent = branchTotal;
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err);
  }
}

// ================= 2. ОРГАНИЗАЦИЯ =================
async function loadOrganizationData() {
  await Promise.all([loadCompanies(), loadPositions()]);
}

async function loadCompanies() {
  const tbody = document.getElementById('companies-table-body');
  const select = document.getElementById('branch-company-select');
  const modalSelect = document.getElementById('modal-branch-company-select');

  try {
    const companies = await fetch(`${API_URL}/companies`).then(handleApiResponse);
    state.companies = companies;

    tbody.innerHTML = '';
    select.innerHTML = '<option value="">Выберите компанию...</option>';
    modalSelect.innerHTML = '<option value="">Выберите компанию...</option>';

    if (companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Компаний пока нет</td></tr>';
      return;
    }

    companies.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${c.id}</strong></td>
        <td>${escapeHtml(c.name)}</td>
        <td>
          <button class="btn btn-danger btn-sm" data-id="${c.id}" onclick="deleteCompany(${c.id})">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);

      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
      modalSelect.appendChild(opt.cloneNode(true));
    });

    if (state.selectedCompanyId) {
      select.value = state.selectedCompanyId;
      loadBranchesForCompany(state.selectedCompanyId);
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadPositions() {
  const tbody = document.getElementById('positions-table-body');
  try {
    const positions = await fetch(`${API_URL}/positions`).then(handleApiResponse);
    state.positions = positions;

    tbody.innerHTML = '';
    if (positions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Должностей пока нет</td></tr>';
      return;
    }

    positions.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${p.id}</strong></td>
        <td>${escapeHtml(p.title)}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deletePosition(${p.id})">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadBranchesForCompany(companyId) {
  const tbody = document.getElementById('branches-table-body');
  if (!companyId) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Выберите компанию для просмотра филиалов</td></tr>';
    return;
  }

  try {
    const branches = await fetch(`${API_URL}/branches/company/${companyId}`).then(handleApiResponse);
    state.branches = branches;

    tbody.innerHTML = '';
    if (branches.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">У этой компании нет филиалов</td></tr>';
      return;
    }

    branches.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${b.id}</strong></td>
        <td>${escapeHtml(b.name)}</td>
        <td>${escapeHtml(b.address)}</td>
        <td>${escapeHtml(b.phone || '—')}</td>
        <td><span class="badge ${b.isActive ? 'badge-green' : 'badge-red'}">${b.isActive ? 'Активен' : 'Закрыт'}</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteBranch(${b.id})">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 3. СОТРУДНИКИ =================
async function loadEmployees() {
  const tbody = document.getElementById('employees-table-body');
  try {
    const res = await fetch(`${API_URL}/employees?size=50`).then(handleApiResponse);
    const employees = Array.isArray(res) ? res : (res.content || []);
    state.employees = employees;

    tbody.innerHTML = '';
    if (employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Сотрудников пока нет</td></tr>';
      return;
    }

    employees.forEach(emp => {
      const tr = document.createElement('tr');
      const assignmentsHtml = (emp.assignments && emp.assignments.length > 0)
        ? emp.assignments.map(a => `
            <div style="font-size: 12px; margin-bottom: 4px;">
              🏢 <strong>${escapeHtml(a.branchName)}</strong> — ${escapeHtml(a.positionTitle)}
              ${a.isPrimary ? '<span class="badge badge-blue">Основная</span>' : '<span class="badge badge-gray">Совмещение</span>'}
            </div>
          `).join('')
        : '<span style="color: var(--text-muted); font-size: 12px;">Не назначен</span>';

      let statusBadge = 'badge-green';
      if (emp.status === 'ON_LEAVE') statusBadge = 'badge-yellow';
      if (emp.status === 'DISMISSED') statusBadge = 'badge-red';

      tr.innerHTML = `
        <td><strong>#${emp.id}</strong></td>
        <td><strong>${escapeHtml(emp.name)}</strong></td>
        <td>${escapeHtml(emp.phone)}</td>
        <td>${emp.hireDate || '—'}</td>
        <td><span class="badge ${statusBadge}">${emp.status}</span></td>
        <td>${assignmentsHtml}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${emp.id})">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 4. СМЕНЫ И ГРАФИКИ =================
async function loadShiftsSection() {
  const branchSelect = document.getElementById('schedule-branch-select');
  const scheduleSelect = document.getElementById('schedule-list-select');

  // Загружаем все филиалы
  const allBranches = [];
  for (const c of state.companies) {
    const bList = await fetch(`${API_URL}/branches/company/${c.id}`).then(handleApiResponse);
    allBranches.push(...bList);
  }
  state.allBranches = allBranches;

  branchSelect.innerHTML = '<option value="">Выберите филиал...</option>';
  allBranches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.address})`;
    branchSelect.appendChild(opt);
  });

  if (state.selectedBranchId) {
    branchSelect.value = state.selectedBranchId;
    loadSchedulesForBranch(state.selectedBranchId);
  }
}

async function loadSchedulesForBranch(branchId) {
  const scheduleSelect = document.getElementById('schedule-list-select');
  scheduleSelect.innerHTML = '<option value="">Выберите график...</option>';

  if (!branchId) return;

  try {
    const schedules = await fetch(`${API_URL}/schedules/branch/${branchId}`).then(handleApiResponse);
    schedules.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `График #${s.id} (${s.dateFrom} — ${s.dateTo})`;
      scheduleSelect.appendChild(opt);
    });

    if (schedules.length > 0) {
      scheduleSelect.value = schedules[0].id;
      state.selectedScheduleId = schedules[0].id;
      loadShiftsForSchedule(schedules[0].id);
    } else {
      document.getElementById('shifts-list-container').innerHTML = `
        <p style="color: var(--text-muted); text-align: center; padding: 20px;">
          У этого филиала пока нет графиков. Нажмите «+ Создать график».
        </p>
      `;
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadShiftsForSchedule(scheduleId) {
  const container = document.getElementById('shifts-list-container');
  if (!scheduleId) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Выберите график для отображения смен.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/shifts/schedule/${scheduleId}?page=0&size=50`);
    const totalCount = res.headers.get('X-Total-Count');
    const shifts = await handleApiResponse(res);

    container.innerHTML = '';
    if (shifts.length === 0) {
      container.innerHTML = `
        <p style="color: var(--text-muted); text-align: center; padding: 20px;">
          В этом графике ещё нет смен. Нажмите «+ Добавить смену».
        </p>
      `;
      return;
    }

    const headerNote = document.createElement('div');
    headerNote.style.marginBottom = '12px';
    headerNote.innerHTML = `<span class="badge badge-blue">Всего смен в графике: ${totalCount || shifts.length}</span>`;
    container.appendChild(headerNote);

    shifts.forEach(shift => {
      const card = document.createElement('div');
      card.className = 'shift-card';

      const employeesList = (shift.assignedEmployees && shift.assignedEmployees.length > 0)
        ? shift.assignedEmployees.map(e => `
            <span class="badge badge-green" style="display: inline-flex; align-items: center; gap: 4px;">
              👤 ${escapeHtml(e.name)}
              <button style="border: none; background: none; color: #b91c1c; cursor: pointer; font-weight: bold; margin-left: 2px;"
                      onclick="removeEmployeeFromShift(${shift.id}, ${e.id}, '${escapeHtml(e.name)}')">✕</button>
            </span>
          `).join('')
        : '<span style="color: var(--text-muted); font-size: 13px;">Никто не назначен</span>';

      card.innerHTML = `
        <div class="shift-info">
          <div class="shift-time">📅 ${shift.date} • ⏰ ${shift.timeFrom.substring(0, 5)} — ${shift.timeTo.substring(0, 5)}</div>
          <div class="shift-meta">Перерыв: ${shift.breakMinutes} мин. | Смена #${shift.id}</div>
          <div class="shift-employees-list">${employeesList}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-secondary btn-sm" onclick="openShiftLogsModal(${shift.id})">📜 Аудит</button>
          <button class="btn btn-primary btn-sm" onclick="openAssignShiftModal(${shift.id}, '${shift.date}', '${shift.timeFrom.substring(0, 5)}-${shift.timeTo.substring(0, 5)}')">+ Сотрудник</button>
          <button class="btn btn-danger btn-sm" onclick="deleteShift(${shift.id})">Удалить</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 5. ЗАЯВКИ =================
async function loadRequests() {
  const tbody = document.getElementById('requests-table-body');
  const filter = document.getElementById('filter-request-status').value;
  let url = `${API_URL}/requests`;
  if (filter) url += `?status=${filter}`;

  try {
    const res = await fetch(url).then(handleApiResponse);
    const requests = Array.isArray(res) ? res : (res.content || []);
    tbody.innerHTML = '';

    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Заявок с выбранным фильтром нет</td></tr>';
      return;
    }

    requests.forEach(req => {
      let datesStr = '—';
      try {
        const data = JSON.parse(req.requestData);
        datesStr = `${data.dateFrom || ''} — ${data.dateTo || ''}`;
      } catch (e) {
        datesStr = req.requestData;
      }

      let badgeClass = 'badge-yellow';
      if (req.status === 'APPROVED') badgeClass = 'badge-green';
      if (req.status === 'REJECTED') badgeClass = 'badge-red';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${req.id}</strong></td>
        <td><strong>${escapeHtml(req.employeeName)}</strong></td>
        <td><span class="badge badge-blue">${req.type}</span></td>
        <td>${datesStr}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span></td>
        <td>${escapeHtml(req.resolutionComment || '—')}</td>
        <td>
          ${req.status === 'PENDING' ? `
            <button class="btn btn-primary btn-sm" onclick="openProcessRequestModal(${req.id}, '${escapeHtml(req.employeeName)}', '${req.type}', '${datesStr}')">Рассмотреть</button>
          ` : '<span style="color: var(--text-muted); font-size: 12px;">Завершена</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= 6. ТАБЕЛЬ (SLICE / БЕСКОНЕЧНАЯ ПРОКРУТКА) =================
async function loadAttendance(reset = false) {
  const tbody = document.getElementById('attendance-table-body');
  const btnMore = document.getElementById('btn-load-more-attendance');

  if (reset) {
    state.attendancePage = 0;
    tbody.innerHTML = '';
  }

  try {
    const res = await fetch(`${API_URL}/attendance?page=${state.attendancePage}&size=10`).then(handleApiResponse);
    const content = res.content || [];
    state.attendanceHasNext = res.hasNext;

    if (reset && content.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Записей явок пока нет</td></tr>';
      btnMore.style.display = 'none';
      return;
    }

    content.forEach(r => {
      const tr = document.createElement('tr');
      const plannedStart = formatDateTime(r.plannedStart);
      const plannedEnd = formatDateTime(r.plannedEnd);
      const actualStart = r.actualStart ? formatDateTime(r.actualStart) : '<span style="color: var(--warning);">Не зафиксирован</span>';
      const actualEnd = r.actualEnd ? formatDateTime(r.actualEnd) : '<span style="color: var(--text-muted);">В процессе</span>';

      tr.innerHTML = `
        <td><strong>#${r.id}</strong></td>
        <td><strong>${escapeHtml(r.employeeName)}</strong></td>
        <td>${plannedStart}</td>
        <td>${plannedEnd}</td>
        <td>${actualStart}</td>
        <td>${actualEnd}</td>
        <td>${r.breakMinutes} мин.</td>
        <td>${escapeHtml(r.comment || '—')}</td>
      `;
      tbody.appendChild(tr);
    });

    btnMore.style.display = state.attendanceHasNext ? 'inline-block' : 'none';
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// ================= ОПЕРАЦИИ БИЗНЕС-ЛОГИКИ =================

// Создание компании
document.getElementById('form-company').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('company-name').value.trim();
  try {
    await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(handleApiResponse);

    showToast('Компания успешно создана!', 'success');
    document.getElementById('modal-company').close();
    document.getElementById('form-company').reset();
    loadCompanies();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Создание филиала
document.getElementById('form-branch').addEventListener('submit', async (e) => {
  e.preventDefault();
  const companyId = document.getElementById('modal-branch-company-select').value;
  const name = document.getElementById('branch-name').value.trim();
  const address = document.getElementById('branch-address').value.trim();
  const phone = document.getElementById('branch-phone').value.trim();

  try {
    await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: Number(companyId), name, address, phone, isActive: true })
    }).then(handleApiResponse);

    showToast('Филиал успешно добавлен!', 'success');
    document.getElementById('modal-branch').close();
    document.getElementById('form-branch').reset();
    if (state.selectedCompanyId == companyId) {
      loadBranchesForCompany(companyId);
    }
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Создание должности
document.getElementById('form-position').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('position-title').value.trim();
  try {
    await fetch(`${API_URL}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    }).then(handleApiResponse);

    showToast('Должность добавлена в справочник!', 'success');
    document.getElementById('modal-position').close();
    document.getElementById('form-position').reset();
    loadPositions();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Создание сотрудника
document.getElementById('form-employee').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('emp-name').value.trim();
  let phone = document.getElementById('emp-phone').value.trim();
  
  // Очистка от пробелов, скобок и дефисов: "+7 (999) 123-45-67" -> "+79991234567"
  phone = phone.replace(/[\s\(\)\-]/g, '');
  if (!phone.startsWith('+')) {
    if (phone.startsWith('8')) {
      phone = '+7' + phone.substring(1);
    } else if (phone.startsWith('7')) {
      phone = '+' + phone;
    } else {
      phone = '+7' + phone;
    }
  }

  const birthDate = document.getElementById('emp-birth').value || null;
  const hireDate = document.getElementById('emp-hire').value || new Date().toISOString().substring(0, 10);

  try {
    await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, birthDate, hireDate, status: 'ACTIVE' })
    }).then(handleApiResponse);

    showToast(`Сотрудник "${name}" успешно зарегистрирован!`, 'success');
    document.getElementById('modal-employee').close();
    document.getElementById('form-employee').reset();
    document.getElementById('emp-hire').value = new Date().toISOString().substring(0, 10);
    loadEmployees();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Привязка сотрудника к филиалу и должности
document.getElementById('form-assign-employee').addEventListener('submit', async (e) => {
  e.preventDefault();
  const employeeId = document.getElementById('assign-emp-id').value;
  const branchId = document.getElementById('assign-branch-id').value;
  const positionId = document.getElementById('assign-pos-id').value;
  const startedAt = document.getElementById('assign-started-at').value;
  const isPrimary = document.getElementById('assign-is-primary').checked;

  try {
    await fetch(`${API_URL}/employees/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: Number(employeeId),
        branchId: Number(branchId),
        positionId: Number(positionId),
        startedAt,
        isPrimary
      })
    }).then(handleApiResponse);

    showToast('Ставка сотрудника успешно привязана!', 'success');
    document.getElementById('modal-assign-employee').close();
    loadEmployees();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Создание графика
document.getElementById('form-schedule').addEventListener('submit', async (e) => {
  e.preventDefault();
  const branchId = document.getElementById('sched-branch-id').value;
  const dateFrom = document.getElementById('sched-date-from').value;
  const dateTo = document.getElementById('sched-date-to').value;

  try {
    const created = await fetch(`${API_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId: Number(branchId), dateFrom, dateTo })
    }).then(handleApiResponse);

    showToast('График успешно создан!', 'success');
    document.getElementById('modal-schedule').close();
    loadSchedulesForBranch(branchId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Создание смены
document.getElementById('form-shift').addEventListener('submit', async (e) => {
  e.preventDefault();
  const scheduleId = state.selectedScheduleId;
  const date = document.getElementById('shift-date').value;
  const timeFrom = document.getElementById('shift-time-from').value + ':00';
  const timeTo = document.getElementById('shift-time-to').value + ':00';
  const breakMinutes = Number(document.getElementById('shift-break').value) || 0;

  try {
    await fetch(`${API_URL}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: Number(scheduleId),
        date,
        timeFrom,
        timeTo,
        breakMinutes
      })
    }).then(handleApiResponse);

    showToast('Смена успешно добавлена в расписание!', 'success');
    document.getElementById('modal-shift').close();
    loadShiftsForSchedule(scheduleId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Назначение сотрудника на смену (Транзакционный сценарий)
document.getElementById('form-assign-shift').addEventListener('submit', async (e) => {
  e.preventDefault();
  const shiftId = document.getElementById('assign-shift-id').value;
  const employeeId = document.getElementById('shift-assign-emp-id').value;

  try {
    await fetch(`${API_URL}/shifts/${shiftId}/assign/${employeeId}`, {
      method: 'POST'
    }).then(handleApiResponse);

    showToast('Сотрудник назначен на смену (записано в аудит-лог)!', 'success');
    document.getElementById('modal-assign-shift').close();
    loadShiftsForSchedule(state.selectedScheduleId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Снятие сотрудника со смены
async function removeEmployeeFromShift(shiftId, employeeId, empName) {
  if (!confirm(`Снять сотрудника "${empName}" с этой смены?`)) return;

  try {
    await fetch(`${API_URL}/shifts/${shiftId}/remove/${employeeId}`, {
      method: 'DELETE'
    }).then(handleApiResponse);

    showToast(`Сотрудник "${empName}" снят со смены`, 'info');
    loadShiftsForSchedule(state.selectedScheduleId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Просмотр аудит-лога смены
async function openShiftLogsModal(shiftId) {
  const dialog = document.getElementById('modal-shift-logs');
  const tbody = document.getElementById('shift-logs-table-body');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Загрузка истории...</td></tr>';
  dialog.showModal();

  try {
    const logs = await fetch(`${API_URL}/shifts/${shiftId}/logs`).then(handleApiResponse);
    tbody.innerHTML = '';
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Записей в аудит-логе пока нет</td></tr>';
      return;
    }

    logs.forEach(l => {
      const tr = document.createElement('tr');
      const actionBadge = l.action === 'ASSIGNED' 
        ? '<span class="badge badge-green">Назначен (ASSIGNED)</span>' 
        : '<span class="badge badge-red">Снят (REMOVED)</span>';

      tr.innerHTML = `
        <td>${formatDateTime(l.createdAt)}</td>
        <td><strong>${escapeHtml(l.employeeName)}</strong></td>
        <td>${actionBadge}</td>
        <td>${escapeHtml(l.createdByName || 'Система')}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Рассмотрение заявки на отпуск (Транзакционный сценарий)
function openProcessRequestModal(requestId, empName, type, dates) {
  document.getElementById('process-request-id').value = requestId;
  document.getElementById('process-request-info').innerHTML = `
    Заявка <strong>#${requestId}</strong>: <strong>${escapeHtml(empName)}</strong><br>
    Тип: <span class="badge badge-blue">${type}</span><br>
    Период: <strong>${dates}</strong>
  `;
  document.getElementById('modal-process-request').showModal();
}

document.getElementById('form-process-request').addEventListener('submit', async (e) => {
  e.preventDefault();
  const requestId = document.getElementById('process-request-id').value;
  const status = document.getElementById('process-decision').value;
  const resolutionComment = document.getElementById('process-comment').value.trim();

  try {
    await fetch(`${API_URL}/requests/${requestId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionComment })
    }).then(handleApiResponse);

    if (status === 'APPROVED') {
      showToast('Заявка ОДОБРЕНА! Отпуск создан, конфликтующие смены автоматически отвязаны.', 'success');
    } else {
      showToast('Заявка ОТКЛОНЕНА.', 'info');
    }

    document.getElementById('modal-process-request').close();
    document.getElementById('form-process-request').reset();
    loadRequests();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// Открытие модалки назначения сотрудника на смену
function openAssignShiftModal(shiftId, date, time) {
  document.getElementById('assign-shift-id').value = shiftId;
  document.getElementById('assign-shift-details').textContent = `Смена #${shiftId} на ${date} (${time})`;

  const select = document.getElementById('shift-assign-emp-id');
  select.innerHTML = '<option value="">Выберите сотрудника...</option>';
  state.employees.filter(e => e.status !== 'DISMISSED').forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} (${e.phone})`;
    select.appendChild(opt);
  });

  document.getElementById('modal-assign-shift').showModal();
}

// Удаление сущностей
async function deleteCompany(id) {
  if (!confirm(`Удалить компанию #${id}? Все связанные филиалы будут удалены.`)) return;
  try {
    await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' }).then(handleApiResponse);
    showToast('Компания удалена', 'info');
    loadCompanies();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deletePosition(id) {
  if (!confirm(`Удалить должность #${id}?`)) return;
  try {
    await fetch(`${API_URL}/positions/${id}`, { method: 'DELETE' }).then(handleApiResponse);
    showToast('Должность удалена', 'info');
    loadPositions();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteBranch(id) {
  if (!confirm(`Удалить филиал #${id}?`)) return;
  try {
    await fetch(`${API_URL}/branches/${id}`, { method: 'DELETE' }).then(handleApiResponse);
    showToast('Филиал удален', 'info');
    loadBranchesForCompany(state.selectedCompanyId);
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteEmployee(id) {
  if (!confirm(`Удалить сотрудника #${id}?`)) return;
  try {
    await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' }).then(handleApiResponse);
    showToast('Сотрудник удален', 'info');
    loadEmployees();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteShift(id) {
  if (!confirm(`Удалить смену #${id}?`)) return;
  try {
    await fetch(`${API_URL}/shifts/${id}`, { method: 'DELETE' }).then(handleApiResponse);
    showToast('Смена удалена из расписания', 'info');
    loadShiftsForSchedule(state.selectedScheduleId);
  } catch (err) {
    showToast(err.message, 'danger');
  }
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

// ================= Инициализация =================
window.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initModals();

  // Быстрые кнопки на дашборде
  document.getElementById('btn-quick-add-company').addEventListener('click', () => {
    document.getElementById('modal-company').showModal();
  });
  document.getElementById('btn-add-company').addEventListener('click', () => {
    document.getElementById('modal-company').showModal();
  });

  document.getElementById('btn-quick-add-branch').addEventListener('click', () => {
    document.getElementById('modal-branch').showModal();
  });
  document.getElementById('btn-add-branch').addEventListener('click', () => {
    document.getElementById('modal-branch').showModal();
  });

  document.getElementById('btn-add-position').addEventListener('click', () => {
    document.getElementById('modal-position').showModal();
  });

  document.getElementById('btn-quick-add-employee').addEventListener('click', () => {
    document.getElementById('emp-hire').value = new Date().toISOString().substring(0, 10);
    document.getElementById('modal-employee').showModal();
  });
  document.getElementById('btn-add-employee').addEventListener('click', () => {
    document.getElementById('emp-hire').value = new Date().toISOString().substring(0, 10);
    document.getElementById('modal-employee').showModal();
  });

  document.getElementById('btn-assign-employee-branch').addEventListener('click', () => {
    const empSelect = document.getElementById('assign-emp-id');
    const branchSelect = document.getElementById('assign-branch-id');
    const posSelect = document.getElementById('assign-pos-id');

    empSelect.innerHTML = '<option value="">Выберите сотрудника...</option>';
    state.employees.forEach(e => {
      empSelect.innerHTML += `<option value="${e.id}">${escapeHtml(e.name)}</option>`;
    });

    branchSelect.innerHTML = '<option value="">Выберите филиал...</option>';
    (state.allBranches || []).forEach(b => {
      branchSelect.innerHTML += `<option value="${b.id}">${escapeHtml(b.name)}</option>`;
    });

    posSelect.innerHTML = '<option value="">Выберите должность...</option>';
    (state.positions || []).forEach(p => {
      posSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.title)}</option>`;
    });

    document.getElementById('assign-started-at').value = new Date().toISOString().substring(0, 10);
    document.getElementById('modal-assign-employee').showModal();
  });

  document.getElementById('btn-create-schedule').addEventListener('click', () => {
    const branchSelect = document.getElementById('sched-branch-id');
    branchSelect.innerHTML = '<option value="">Выберите филиал...</option>';
    (state.allBranches || []).forEach(b => {
      branchSelect.innerHTML += `<option value="${b.id}">${escapeHtml(b.name)}</option>`;
    });
    if (state.selectedBranchId) branchSelect.value = state.selectedBranchId;
    document.getElementById('modal-schedule').showModal();
  });

  document.getElementById('btn-create-shift').addEventListener('click', () => {
    if (!state.selectedScheduleId) {
      showToast('Сначала выберите график филиала!', 'warning');
      return;
    }
    document.getElementById('shift-date').value = new Date().toISOString().substring(0, 10);
    document.getElementById('modal-shift').showModal();
  });

  document.getElementById('btn-refresh-all').addEventListener('click', () => {
    loadDashboardStats();
    showToast('Данные обновлены', 'info');
  });

  // Фильтры и селекторы
  document.getElementById('branch-company-select').addEventListener('change', (e) => {
    state.selectedCompanyId = e.target.value;
    loadBranchesForCompany(e.target.value);
  });

  document.getElementById('schedule-branch-select').addEventListener('change', (e) => {
    state.selectedBranchId = e.target.value;
    loadSchedulesForBranch(e.target.value);
  });

  document.getElementById('schedule-list-select').addEventListener('change', (e) => {
    state.selectedScheduleId = e.target.value;
    loadShiftsForSchedule(e.target.value);
  });

  document.getElementById('filter-request-status').addEventListener('change', () => {
    loadRequests();
  });

  document.getElementById('btn-load-more-attendance').addEventListener('click', () => {
    state.attendancePage++;
    loadAttendance(false);
  });

  // Запуск
  await checkBackendStatus();
  await loadDashboardStats();
  setInterval(checkBackendStatus, 10000);
});
