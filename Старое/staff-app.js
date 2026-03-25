// ═══════════════════════════════════════════════════════
// RAVEZ ONE — Staff Portal
// ═══════════════════════════════════════════════════════

// ── API CONFIG ──
const SAPI = {
  get base() {
    // Универсальное определение API URL (работает из любой папки)
    const cached = localStorage.getItem('ravez_api_url');
    if (cached) return cached;
    
    const path = window.location.pathname;
    const basePath = path.substring(0, path.lastIndexOf('/'));
    return window.location.origin + basePath + '/backend/api.php';
  },
  get token() { return localStorage.getItem('ravez_staff_token') || ''; },
  _url(path) {
    // path может быть 'staff/me' или 'analytics/data?months=6'
    const [action, qs] = path.split('?');
    return this.base + '?a=' + encodeURIComponent(action) + (qs ? '&' + qs : '');
  },
  async get(path) {
    try {
      const r = await fetch(this._url(path), {
        headers: { 'Accept': 'application/json', 'X-Staff-Token': this.token }
      });
      if (r.status === 401) { staffLogout(); return null; }
      return r.ok ? r.json() : null;
    } catch { return null; }
  },
  async post(path, data) {
    try {
      const r = await fetch(this._url(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Staff-Token': this.token },
        body: JSON.stringify(data)
      });
      if (r.status === 401) { staffLogout(); return null; }
      return r.ok ? r.json() : null;
    } catch { return null; }
  }
};

// ── CURRENT USER ──
let CU = {}; // current user object
let staffCache = []; // кеш списка сотрудников

// ── CONSTANTS ──
const ROLE_LABELS = {
  hq:'Владелец сети', owner:'Владелец', director:'Директор', dev_director:'Директор по развитию',
  art_director:'Арт директор', admin:'Администратор', hostess:'Хостес',
  dj:'DJ', smm:'СММ', designer:'Дизайнер', stories_maker:'Сторис мейкер',
  light_tech:'Светотехник', ambassador_manager:'Менеджер амбассадоров',
  ambassador:'Амбассадор', bartender:'Бармен', security:'Охранник',
  promoter:'Промоутер', accountant:'Бухгалтер'
};

const ALL_ROLES = ['hq','owner','director','dev_director','art_director','admin','hostess','dj','smm','designer','stories_maker','light_tech','ambassador_manager','ambassador','bartender','security','promoter','accountant'];

const TABS_CONFIG = [
  { key:'dashboard',   label:'Дашборд',   icon:'🏠', roles: ALL_ROLES },
  { key:'owner',       label:'Владелец',  icon:'👑', roles:['hq','owner','director','dev_director'] },
  { key:'bookings',    label:'Брони',     icon:'📋', roles:['owner','director','dev_director','admin','hostess'] },
  { key:'entry',       label:'Вход',      icon:'🚪', roles:['owner','director','admin','hostess','security'] },
  { key:'djs',         label:'Диджеи',    icon:'🎧', roles:['owner','director','art_director','dj'] },
  { key:'events',      label:'События',   icon:'📅', roles:['owner','director','art_director','smm','admin','dj','promoter','ambassador'] },
  { key:'party',       label:'Вечеринки', icon:'🎉', roles:['owner','director','dev_director','art_director','smm','designer','promoter','ambassador'] },
  { key:'tasks',       label:'Задачи',    icon:'✅', roles: ALL_ROLES },
  { key:'content',     label:'Контент',   icon:'📱', roles:['owner','director','art_director','smm','designer','stories_maker'] },
  { key:'thursdays',   label:'Четверги',  icon:'🌙', roles:['owner','director','dev_director','art_director','admin'] },
  { key:'shifts',      label:'Смены',     icon:'🗓', roles: ALL_ROLES },
  { key:'finances',    label:'Финансы',   icon:'💰', roles:['owner','director','dev_director','accountant'] },
  { key:'analytics',   label:'Аналитика', icon:'📊', roles:['owner','director','dev_director','smm','accountant'] },
  { key:'promoters',   label:'Промоутеры',icon:'📢', roles:['owner','director','dev_director','art_director','admin','promoter'] },
  { key:'guests',      label:'Гости',     icon:'🪪', roles:['owner','director','dev_director','admin','hostess','accountant'] },
  { key:'loyalty',    label:'Лояльность',icon:'🎖', roles:['owner','director','dev_director','admin'] },
  { key:'salary',      label:'Зарплаты',  icon:'💵', roles:['owner','director','accountant'] },
  { key:'team',        label:'Команда',   icon:'👥', roles:['owner','director','dev_director','admin'] },
  { key:'permissions', label:'Права',     icon:'🔐', roles:['owner'] },
  { key:'ai',          label:'AI',        icon:'🤖', roles:['owner','director','dev_director','art_director','dj','smm','designer'] },
  { key:'profile',     label:'Профиль',   icon:'👤', roles: ALL_ROLES },
  { key:'integrations',label:'Интеграции',icon:'🔌', roles:['hq','owner','director','admin'] },
];

function myTabs() {
  return TABS_CONFIG.filter(t => t.roles.includes(CU.role));
}

// ── AUTH ──
async function doStaffLogin() {
  const username = document.getElementById('s-login').value.trim();
  const password = document.getElementById('s-pass').value;
  const errEl    = document.getElementById('login-err');
  const btn      = document.getElementById('login-btn');

  if (!username || !password) { errEl.style.display='block'; errEl.textContent='Введите логин и пароль'; return; }
  btn.textContent = '...'; btn.disabled = true;
  try {
    const res = await fetch(SAPI.base + '?a=staff%2Flogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      localStorage.setItem('ravez_staff_token', data.token);
      localStorage.setItem('ravez_staff_role',  data.staff.role);
      localStorage.setItem('ravez_staff_name',  data.staff.name);
      localStorage.setItem('ravez_staff_id',    data.staff.id);
      CU = data.staff;
      initStaffUI();
    } else {
      errEl.style.display = 'block';
      errEl.textContent   = data.error || 'Неверный логин или пароль';
    }
  } catch {
    errEl.style.display = 'block';
    errEl.textContent   = 'Нет соединения с сервером';
  }
  btn.textContent = 'Войти'; btn.disabled = false;
}

function staffLogout() {
  localStorage.removeItem('ravez_staff_token');
  localStorage.removeItem('ravez_staff_role');
  localStorage.removeItem('ravez_staff_name');
  localStorage.removeItem('ravez_staff_id');
  CU = {};
  window.location.replace('auth.html');
}

// Очистить все токены (для сброса)
function clearAllTokens() {
  localStorage.removeItem('ravez_staff_token');
  localStorage.removeItem('ravez_staff_role');
  localStorage.removeItem('ravez_staff_name');
  localStorage.removeItem('ravez_staff_id');
  localStorage.removeItem('ravez_guest_token');
  localStorage.removeItem('ravez_api_url');
  localStorage.removeItem('ravez_api_key');
  console.log('[Staff] Все токены очищены');
}

async function checkSession() {
  const token = localStorage.getItem('ravez_staff_token');
  const role  = localStorage.getItem('ravez_staff_role');
  const name  = localStorage.getItem('ravez_staff_name');
  const staffUI = document.getElementById('staff-ui');

  // Нет токена — на страницу входа
  if (!token || !role) {
    window.location.replace('auth.html');
    return;
  }

  // Восстанавливаем из localStorage, чтобы не мигала пустая страница
  CU = { id: parseInt(localStorage.getItem('ravez_staff_id')||'0'), name, role, token };

  // Проверяем сессию на сервере
  const me = await SAPI.get('staff/me');
  if (me && !me.error) {
    CU = me;
    localStorage.setItem('ravez_staff_role', me.role);
    localStorage.setItem('ravez_staff_name', me.name);
    if (staffUI) staffUI.style.display = 'block';
    buildNav();
    const firstTab = myTabs()[0];
    if (firstTab) showPanel(firstTab.key);
    loadStaffCache();
    updateNotifBadge();
  } else {
    // Сессия невалидна
    staffLogout();
  }
}

// ── INIT UI ──
function initStaffUI() {
  document.getElementById('staff-ui').style.display = 'block';

  document.getElementById('nav-name').innerHTML =
    `${CU.name} <span class="rb r-${CU.role}">${ROLE_LABELS[CU.role]||CU.role}</span>`;

  buildNav();
  const firstTab = myTabs()[0];
  if (firstTab) showPanel(firstTab.key);
  loadStaffCache();
  updateNotifBadge();
}

// Группы навигации — порядок задаёт визуальные разделители
const NAV_GROUPS = [
  { label: 'Операции',   keys: ['dashboard','owner','bookings','entry'] },
  { label: 'Команда',    keys: ['tasks','shifts','salary','team','permissions'] },
  { label: 'Контент',    keys: ['events','party','thursdays','djs','content'] },
  { label: 'Гости',      keys: ['guests','loyalty','promoters'] },
  { label: 'Управление', keys: ['finances','analytics','ai','integrations','profile'] },
];

// Приоритетные табы для bottom nav по роли
const BNAV_PRIORITY = {
  hostess:    ['dashboard','bookings','entry','tasks','guests'],
  security:   ['dashboard','entry','tasks','shifts','profile'],
  bartender:  ['dashboard','entry','shifts','tasks','profile'],
  promoter:   ['dashboard','events','tasks','guests','profile'],
  dj:         ['dashboard','events','djs','tasks','profile'],
  smm:        ['dashboard','content','events','party','tasks'],
  accountant: ['dashboard','finances','salary','analytics','profile'],
  admin:      ['dashboard','bookings','entry','tasks','guests'],
  director:   ['dashboard','tasks','bookings','finances','team'],
  art_director:['dashboard','events','party','djs','tasks'],
  dev_director:['dashboard','analytics','loyalty','finances','team'],
  owner:      ['dashboard','owner','finances','team','analytics'],
  hq:         ['dashboard','owner','finances','analytics','team'],
};
const DEFAULT_BNAV = ['dashboard','tasks','bookings','entry','profile'];

function buildNav() {
  const tabs    = myTabs();
  const tabMap  = Object.fromEntries(tabs.map(t => [t.key, t]));
  const tabList = document.getElementById('tab-list');

  // Строим top nav с группами
  let html = '';
  let firstInGroup = true;
  for (const group of NAV_GROUPS) {
    const groupTabs = group.keys.map(k => tabMap[k]).filter(Boolean);
    if (!groupTabs.length) continue;
    if (!firstInGroup) {
      html += `<div class="tab-sep"></div>`;
    }
    html += `<span class="tab-group-label">${group.label}</span>`;
    html += groupTabs.map(t =>
      `<button class="tab-btn" id="tab-${t.key}" onclick="showPanel('${t.key}')">${t.icon} ${t.label}</button>`
    ).join('');
    firstInGroup = false;
  }
  // Любые табы вне групп (на всякий случай)
  const groupedKeys = NAV_GROUPS.flatMap(g => g.keys);
  const extras = tabs.filter(t => !groupedKeys.includes(t.key));
  if (extras.length) {
    html += `<div class="tab-sep"></div>`;
    html += extras.map(t =>
      `<button class="tab-btn" id="tab-${t.key}" onclick="showPanel('${t.key}')">${t.icon} ${t.label}</button>`
    ).join('');
  }
  tabList.innerHTML = html;

  // Bottom nav — умный выбор по роли
  const bnav   = document.getElementById('bottom-nav');
  const prio   = BNAV_PRIORITY[CU.role] || DEFAULT_BNAV;
  const bTabs  = prio.map(k => tabMap[k]).filter(Boolean).slice(0, 5);
  bnav.innerHTML = bTabs.map(t =>
    `<button class="bnav-btn" id="bnav-${t.key}" onclick="showPanel('${t.key}')">
      <span>${t.icon}</span><span>${t.label}</span>
    </button>`
  ).join('');
}

function showPanel(name, btn) {
  const main = document.getElementById('staff-main');

  // Рендерим панель
  const renderFn = PANEL_RENDERERS[name];
  if (renderFn) {
    main.innerHTML = `<div class="panel active" id="panel-${name}"></div>`;
    renderFn(document.getElementById('panel-' + name));
  }

  // Подсветка таба
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const tb = document.getElementById('tab-' + name);
  const bb = document.getElementById('bnav-' + name);
  if (tb) { tb.classList.add('active'); tb.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); }
  if (bb) bb.classList.add('active');

  // Заголовок вкладки браузера
  const tabCfg = TABS_CONFIG.find(t => t.key === name);
  if (tabCfg) document.title = `${tabCfg.icon} ${tabCfg.label} — RAVEZ`;
}

async function loadStaffCache() {
  const data = await SAPI.get('staff/list');
  if (data) staffCache = data;
}

// ── HELPERS ──
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (type ? ' toast-' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), type === 'error' ? 3500 : 2500);
}
function toastErr(msg) { toast(msg, 'error'); }
function toastOk(msg)  { toast(msg, 'success'); }

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  // Close on backdrop click
  el._backdropFn = (e) => { if (e.target === el) closeModal(id); };
  el.addEventListener('click', el._backdropFn);
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  if (el._backdropFn) { el.removeEventListener('click', el._backdropFn); el._backdropFn = null; }
}

// Escape closes topmost open modal
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.modal-overlay.open')].pop();
  if (open) open.classList.remove('open');
});

// Mark required fields with * in forms
function markRequired(formId, fieldIds) {
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const fg = el.closest('.form-group');
    if (!fg) return;
    const lbl = fg.querySelector('label');
    if (lbl && !lbl.querySelector('.req')) lbl.insertAdjacentHTML('beforeend', '<span class="req">*</span>');
  });
}

// Highlight invalid field and show toast
function fieldError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.classList.add('input-err');
    el.focus();
    setTimeout(() => el.classList.remove('input-err'), 2000);
  }
  toastErr(msg);
}

// Skeleton loader HTML helper
function skeletonList(rows = 4) {
  return Array.from({length: rows}, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line wide"></div>
      <div class="skeleton skeleton-line med" style="margin-top:.5rem"></div>
    </div>`).join('');
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('ru-RU');
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function moneyFmt(n) { return Number(n||0).toLocaleString('ru-RU') + ' ₽'; }
function statusLabel(s) {
  const m = {todo:'К выполн.',in_progress:'В работе',review:'На проверке',done:'Готово',cancelled:'Отменено'};
  return m[s] || s;
}
function partyStatusLabel(s) {
  const m = {idea:'Идея',planning:'Планирование',confirmed:'Подтверждено',done:'Готово',cancelled:'Отменено'};
  return m[s] || s;
}
function esc(str) {
  if (!str && str !== 0) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}
function fileToBase64(file) {
  return new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(file); });
}
function isManager() {
  return ['owner','director','dev_director','art_director'].includes(CU.role);
}

// ── СТАТУСНЫЕ ЧИПЫ (единые для всего ОС) ─────────────────
function chip(status, customLabel) {
  const map = {
    // Задачи
    todo:        ['chip-gray',   'К выполн.'],
    in_progress: ['chip-blue',  'В работе'],
    review:      ['chip-yellow','Проверка'],
    done:        ['chip-green', 'Готово'],
    cancelled:   ['chip-red',   'Отменено'],
    // Бронирования
    pending:     ['chip-yellow','Ожидает'],
    confirmed:   ['chip-cyan',  'Подтверждено'],
    paid:        ['chip-green', 'Оплачено'],
    // Смены
    planned:     ['chip-gray',  'Запланировано'],
    completed:   ['chip-green', 'Отработано'],
    absent:      ['chip-red',   'Не вышел'],
    // Начисления
    calculated:  ['chip-blue',  'Рассчитано'],
    approved:    ['chip-yellow','Согласовано'],
    // Прочее
    active:      ['chip-green', 'Активен'],
    inactive:    ['chip-gray',  'Неактивен'],
    sent:        ['chip-green', 'Отправлено'],
    draft:       ['chip-gray',  'Черновик'],
    scheduled:   ['chip-blue',  'Запланировано'],
  };
  const [cls, label] = map[status] || ['chip-gray', status || '—'];
  return `<span class="chip ${cls}">${customLabel || label}</span>`;
}

function emptyState(icon, title, ctaLabel, ctaFn) {
  return `<div class="empty-cta">
    <div class="empty-icon">${icon}</div>
    <p>${title}</p>
    ${ctaLabel ? `<button class="btn-sm" onclick="${ctaFn}">${ctaLabel}</button>` : ''}
  </div>`;
}

// ==========================================================
// PANEL RENDERERS
// ==========================================================
const PANEL_RENDERERS = {};

// ── OWNER DASHBOARD (DRILLDOWN) ──
PANEL_RENDERERS.owner = async (el) => {
  el.innerHTML = `
    <div class="panel-title">👑 Владелец — Углубление</div>
    <p style="font-size:.6rem;color:var(--gl);margin-bottom:1rem">Выберите объект для детального просмотра или начните поиск</p>
    
    <div class="owner-search-wrap">
      <input type="text" class="owner-search" id="owner-search" placeholder="Поиск: вечеринка, сотрудник, гость, задача..." oninput="ownerSearch(this.value)">
      <div class="owner-search-hint">Например: "Пятница", "Анна", "Алексей", "афиша"</div>
    </div>
    
    <div class="drill-cards" id="owner-drill-cards">
      <div class="drill-card" onclick="ownerDrilldown('event')">
        <div class="drill-icon">🎉</div>
        <div class="drill-title">Вечеринки</div>
        <div class="drill-count" id="owner-events-count">Загрузка...</div>
      </div>
      <div class="drill-card" onclick="ownerDrilldown('staff')">
        <div class="drill-icon">👥</div>
        <div class="drill-title">Сотрудники</div>
        <div class="drill-count" id="owner-staff-count">Загрузка...</div>
      </div>
      <div class="drill-card" onclick="ownerDrilldown('guest')">
        <div class="drill-icon">👤</div>
        <div class="drill-title">Гости</div>
        <div class="drill-count" id="owner-guests-count">Загрузка...</div>
      </div>
      <div class="drill-card" onclick="ownerDrilldown('task')">
        <div class="drill-icon">✅</div>
        <div class="drill-title">Задачи</div>
        <div class="drill-count" id="owner-tasks-count">Загрузка...</div>
      </div>
    </div>
    
    <div id="owner-drilldown-view" style="display:none"></div>
  `;
  
  // Загружаем статистику
  loadOwnerStats();
};

async function loadOwnerStats() {
  const stats = await SAPI.get('owner/stats');
  if (!stats) return;
  const ec = document.getElementById('owner-events-count');
  const sc = document.getElementById('owner-staff-count');
  const tc = document.getElementById('owner-tasks-count');
  const gc = document.getElementById('owner-guests-count');
  if (ec) ec.textContent = (stats.events?.total || 0) + ' событий';
  if (sc) sc.textContent = (stats.staff?.total || 0) + ' активных';
  if (tc) tc.textContent = (stats.tasks?.total || 0) + ' задач';
  if (gc) gc.textContent = (stats.guests?.total || 0) + ' гостей';
}

async function ownerSearch(query) {
  if (!query || query.length < 2) return;
  const results = await SAPI.get('owner/search?q=' + encodeURIComponent(query)) || [];
  const container = document.getElementById('owner-drill-cards');
  if (!results.length) {
    container.innerHTML = '<div style="color:var(--gl);font-size:.65rem;padding:2rem;text-align:center">Ничего не найдено</div>';
  } else {
    container.innerHTML = results.map(r => `
      <div class="drill-card" onclick="ownerDrilldown('${r.type}', ${r.id})">
        <div class="drill-icon">${r.type === 'event' ? '🎉' : r.type === 'staff' ? '👥' : r.type === 'guest' ? '👤' : '✅'}</div>
        <div class="drill-title">${esc(r.title)}</div>
        <div class="drill-count">${esc(r.subtitle||'')}</div>
      </div>
    `).join('');
  }
}

async function ownerDrilldown(type, id = null) {
  const container = document.getElementById('owner-drilldown-view');
  const cardsContainer = document.getElementById('owner-drill-cards');
  
  if (!id) {
    // Показываем список всех объектов типа
    let items = [];
    let title = '';
    
    if (type === 'event') {
      items = await SAPI.get('events/list') || [];
      title = 'Все события';
    } else if (type === 'staff') {
      items = (await SAPI.get('staff/list') || []).filter(s => s.active);
      title = 'Все сотрудники';
    } else if (type === 'task') {
      items = await SAPI.get('tasks') || [];
      title = 'Все задачи';
    } else if (type === 'guest') {
      const gd = await SAPI.get('guests?limit=50') || {};
      items = gd.guests || [];
      title = 'Гости';
    }
    
    cardsContainer.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = `
      <button class="drill-back" onclick="ownerDrilldownBack()">← Назад</button>
      <div class="breadcrumb">
        <span class="bcrumb-item" onclick="ownerDrilldownBack()">Владелец</span>
        <span class="bcrumb-sep">/</span>
        <span class="bcrumb-item">${title}</span>
      </div>
      <div class="panel-title">${title}</div>
      <div class="drill-cards">
        ${items.map(item => `
          <div class="drill-card" onclick="ownerDrilldown('${type}', ${item.id})">
            <div class="drill-icon">${type === 'event' ? '🎉' : type === 'staff' ? '👥' : '✅'}</div>
            <div class="drill-title">${item.name || item.title || 'Без названия'}</div>
            <div class="drill-count">${type === 'event' ? fmtDate(item.event_date||item.date) : type === 'staff' ? (ROLE_LABELS[item.role]||item.role) : type === 'guest' ? (item.loyalty_tier||'guest') : statusLabel(item.status)}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    // Показываем детальный просмотр
    let item, detailHTML;
    
    if (type === 'event') {
      item = await SAPI.get('event/beo?id=' + id) || {};
      if (!item || item.error) return;
      const rdns = item.readiness || 0;
      const rdnsColor = rdns >= 80 ? '#4caf50' : rdns >= 50 ? '#ffc107' : '#f44336';
      detailHTML = `
        <div class="stat-row"><span class="stat-label">Дата</span><span class="stat-value">${fmtDate(item.event_date)}</span></div>
        <div class="stat-row"><span class="stat-label">Статус</span><span class="stat-value">${item.status||'—'}</span></div>
        <div class="stat-row"><span class="stat-label">Готовность</span><span class="stat-value" style="color:${rdnsColor}">${rdns}%</span></div>
        <div class="stat-row"><span class="stat-label">Доход</span><span class="stat-value" style="color:#4caf50">${moneyFmt(item.income_total)}</span></div>
        <div class="stat-row"><span class="stat-label">Расход</span><span class="stat-value" style="color:#f44336">${moneyFmt(item.expense_total)}</span></div>
        <div class="stat-row"><span class="stat-label">Прибыль</span><span class="stat-value" style="color:#7c6af7">${moneyFmt(item.profit)}</span></div>
        <div class="stat-row"><span class="stat-label">Задачи</span><span class="stat-value">${item.task_stats?.done||0}/${item.task_stats?.total||0}</span></div>
        <div class="stat-row"><span class="stat-label">Смены</span><span class="stat-value">${item.shifts_stats?.confirmed||0}/${item.shifts_stats?.total||0}</span></div>
      `;
    } else if (type === 'staff') {
      item = await SAPI.get('owner/drilldown/staff?id=' + id) || {};
      if (!item || item.error) return;
      const tasks = item.tasks || [];
      const shifts = item.shifts || [];
      
      detailHTML = `
        <div class="drill-detail">
          <div class="dd-icon">👤</div>
          <div class="dd-body">
            <div class="dd-title">Роль</div>
            <div class="dd-sub"><span class="rb r-${item.role}">${ROLE_LABELS[item.role]||item.role}</span></div>
          </div>
        </div>
        <div class="drill-detail">
          <div class="dd-icon">📞</div>
          <div class="dd-body">
            <div class="dd-title">Контакты</div>
            <div class="dd-sub">${item.phone || '—'} · ${item.email || '—'}</div>
          </div>
        </div>
        <div class="drill-detail">
          <div class="dd-icon">✈️</div>
          <div class="dd-body">
            <div class="dd-title">Telegram</div>
            <div class="dd-sub">${item.telegram_username || item.telegram_id ? 'Привязан' : 'Не привязан'}</div>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-label">Задач в работе</span>
          <span class="stat-value">${tasks.filter(t=>t.status==='in_progress').length}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Смен отработано</span>
          <span class="stat-value">${shifts.filter(s=>s.status==='completed').length}</span>
        </div>
      `;
    } else if (type === 'task') {
      const tasks = await SAPI.get('tasks') || [];
      item = tasks.find(t => t.id == id);
      if (!item) return;
      
      detailHTML = `
        <div class="drill-detail">
          <div class="dd-icon">📝</div>
          <div class="dd-body">
            <div class="dd-title">Описание</div>
            <div class="dd-sub">${item.description || '—'}</div>
          </div>
        </div>
        <div class="drill-detail">
          <div class="dd-icon">👤</div>
          <div class="dd-body">
            <div class="dd-title">Исполнитель</div>
            <div class="dd-sub">${item.assigned_to_name || '—'}</div>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-label">Дедлайн</span>
          <span class="stat-value">${fmtDate(item.due_date)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Приоритет</span>
          <span class="stat-value">${item.priority}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Статус</span>
          <span class="stat-value">${statusLabel(item.status)}</span>
        </div>
      `;
    }
    
    cardsContainer.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = `
      <button class="drill-back" onclick="ownerDrilldownBack()">← Назад</button>
      <div class="breadcrumb">
        <span class="bcrumb-item" onclick="ownerDrilldownBack()">Владелец</span>
        <span class="bcrumb-sep">/</span>
        <span class="bcrumb-item" onclick="ownerDrilldown('${type}')">${type === 'event' ? 'Вечеринки' : type === 'staff' ? 'Сотрудники' : 'Задачи'}</span>
        <span class="bcrumb-sep">/</span>
        <span class="bcrumb-item">${item.name || item.title || 'Объект'}</span>
      </div>
      <div class="panel-title">${item.name || item.title || 'Объект'}</div>
      <div class="card">
        ${detailHTML}
      </div>
    `;
  }
}

function ownerDrilldownBack() {
  document.getElementById('owner-drilldown-view').style.display = 'none';
  document.getElementById('owner-drill-cards').style.display = 'grid';
  loadOwnerStats();
}

// ── DASHBOARD ──
// Быстрые действия по роли
const ROLE_QUICK_ACTIONS = {
  hostess:     [{icon:'🚪',label:'Отметить вход',    fn:"showPanel('entry')"},
                {icon:'📋',label:'Новая бронь',       fn:"showPanel('bookings')"},
                {icon:'👤',label:'Найти гостя',        fn:"showPanel('guests')"}],
  security:    [{icon:'🚪',label:'Вход',             fn:"showPanel('entry')"},
                {icon:'🗓',label:'Моя смена',          fn:"showPanel('shifts')"}],
  bartender:   [{icon:'🚪',label:'Проверить вход',   fn:"showPanel('entry')"},
                {icon:'🗓',label:'График смен',        fn:"showPanel('shifts')"}],
  admin:       [{icon:'📋',label:'Брони',             fn:"showPanel('bookings')"},
                {icon:'🚪',label:'Вход',              fn:"showPanel('entry')"},
                {icon:'✅',label:'Задачи',             fn:"showPanel('tasks')"},
                {icon:'👤',label:'Гости',              fn:"showPanel('guests')"}],
  director:    [{icon:'📊',label:'Аналитика',         fn:"showPanel('analytics')"},
                {icon:'💰',label:'Финансы',            fn:"showPanel('finances')"},
                {icon:'✅',label:'Задачи',             fn:"showPanel('tasks')"},
                {icon:'👥',label:'Команда',            fn:"showPanel('team')"}],
  art_director:[{icon:'📅',label:'События',           fn:"showPanel('events')"},
                {icon:'🎉',label:'Вечеринки',          fn:"showPanel('party')"},
                {icon:'🎧',label:'Диджеи',             fn:"showPanel('djs')"}],
  smm:         [{icon:'📱',label:'Контент',           fn:"showPanel('content')"},
                {icon:'📅',label:'События',            fn:"showPanel('events')"},
                {icon:'🎉',label:'Вечеринки',          fn:"showPanel('party')"}],
  accountant:  [{icon:'💰',label:'Финансы',           fn:"showPanel('finances')"},
                {icon:'💵',label:'Зарплаты',           fn:"showPanel('salary')"},
                {icon:'📊',label:'Аналитика',          fn:"showPanel('analytics')"}],
  owner:       [{icon:'👑',label:'Сводка',            fn:"showPanel('owner')"},
                {icon:'📊',label:'Аналитика',          fn:"showPanel('analytics')"},
                {icon:'💰',label:'Финансы',            fn:"showPanel('finances')"},
                {icon:'👥',label:'Команда',            fn:"showPanel('team')"}],
  dev_director:[{icon:'📊',label:'Аналитика',         fn:"showPanel('analytics')"},
                {icon:'💰',label:'Финансы',            fn:"showPanel('finances')"},
                {icon:'✅',label:'Задачи',             fn:"showPanel('tasks')"},
                {icon:'👥',label:'Команда',            fn:"showPanel('team')"}],
  hq:          [{icon:'👑',label:'Сводка',            fn:"showPanel('owner')"},
                {icon:'📊',label:'Аналитика',          fn:"showPanel('analytics')"},
                {icon:'💰',label:'Финансы',            fn:"showPanel('finances')"},
                {icon:'👥',label:'Команда',            fn:"showPanel('team')"}],
};

PANEL_RENDERERS.dashboard = async (el) => {
  const todayStr = new Date().toLocaleDateString('ru-RU', {day:'numeric',month:'long'});
  const quickActions = ROLE_QUICK_ACTIONS[CU.role] || ROLE_QUICK_ACTIONS.admin;

  el.innerHTML = `
    <div class="panel-title">${greeting()}, ${CU.name.split(' ')[0]}
      <span class="rb r-${CU.role}">${ROLE_LABELS[CU.role]||CU.role}</span>
    </div>
    <div style="font-size:.65rem;color:var(--gl);font-family:var(--fm);margin-top:-.75rem;margin-bottom:1rem">${todayStr}</div>

    <!-- Быстрые действия -->
    <div class="quick-actions">
      ${quickActions.map(a=>`<button class="qa-btn" onclick="${a.fn}"><span class="qa-icon">${a.icon}</span>${a.label}</button>`).join('')}
    </div>

    <!-- Статы -->
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val" id="ds-entries">—</div><div class="stat-lbl">Вошло сегодня</div></div>
      <div class="stat-card"><div class="stat-val" id="ds-tasks">—</div><div class="stat-lbl">Моих задач</div></div>
      <div class="stat-card"><div class="stat-val" id="ds-bookings">—</div><div class="stat-lbl">Броней</div></div>
      <div class="stat-card"><div class="stat-val" id="ds-revenue">—</div><div class="stat-lbl">Выручка входа</div></div>
    </div>

    <!-- Задачи и события -->
    <div class="dash-row">
      <div class="card">
        <div class="card-title">Мои задачи</div>
        <div id="dash-tasks">${skeletonList(2)}</div>
        <button class="btn-out" style="width:100%;margin-top:.75rem;font-size:.65rem" onclick="showPanel('tasks')">Все задачи →</button>
      </div>
      <div class="card">
        <div class="card-title">Ближайшие события</div>
        <div id="dash-events">${skeletonList(2)}</div>
        <button class="btn-out" style="width:100%;margin-top:.75rem;font-size:.65rem" onclick="showPanel('events')">Все события →</button>
      </div>
    </div>`;

  // Загружаем данные параллельно
  const [tasks, events, entries] = await Promise.all([
    SAPI.get('tasks?status=in_progress').catch(()=>null),
    SAPI.get('events').catch(()=>null),
    SAPI.get('entries/today').catch(()=>null),
  ]);

  // Задачи
  if (tasks) {
    const mine = (tasks||[]).filter(t=>t.assigned_to==CU.id);
    const ds = document.getElementById('ds-tasks');
    if (ds) ds.textContent = mine.length;
    const dt = document.getElementById('dash-tasks');
    if (dt) dt.innerHTML = mine.length
      ? mine.slice(0,4).map(t=>`
          <div class="task-card" onclick="openTaskModal(${t.id})">
            <div class="task-prio prio-${t.priority||''}"></div>
            <div class="task-body">
              <div class="task-title">${esc(t.title)}</div>
              <div class="task-meta">
                ${t.due_date?`<span>📅 ${fmtDate(t.due_date)}</span>`:''}
                <span class="task-status s-${t.status}">${statusLabel(t.status)}</span>
              </div>
            </div>
          </div>`).join('')
      : `<div class="empty-cta"><div class="empty-icon">✅</div><p>Нет задач в работе</p>
          <button class="btn-sm" onclick="openTaskModal()">+ Создать задачу</button></div>`;
  }

  // События
  if (events) {
    const today = new Date().toISOString().slice(0,10);
    const upcoming = (events||[]).filter(e=>e.date>=today).slice(0,3);
    const db = document.getElementById('ds-bookings');
    if (db) db.textContent = upcoming.length;
    const de = document.getElementById('dash-events');
    if (de) de.innerHTML = upcoming.length
      ? upcoming.map(e=>`
          <div class="task-card" onclick="showPanel('events')">
            <div class="task-body">
              <div class="task-title">${esc(e.name)}</div>
              <div class="task-meta"><span>📅 ${fmtDate(e.date)}</span>
                ${e.status?`<span class="chip chip-cyan">${e.status}</span>`:''}
              </div>
            </div>
          </div>`).join('')
      : `<div class="empty-cta"><div class="empty-icon">📅</div><p>Нет запланированных событий</p>
          <button class="btn-sm" onclick="showPanel('events')">+ Создать событие</button></div>`;
  }

  // Вход
  if (entries) {
    const di = document.getElementById('ds-entries');
    if (di) di.textContent = entries.total_count || 0;
    const dr = document.getElementById('ds-revenue');
    if (dr) dr.textContent = moneyFmt(entries.total_revenue || 0);
  }
};

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Ночь';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

// ── TASKS ──
let tasksData = [];
let tasksFilter = 'all';

PANEL_RENDERERS.tasks = async (el) => {
  // Non-managers default to "mine" so they see their own tasks first
  if (!isManager() && tasksFilter === 'all') tasksFilter = 'mine';
  el.innerHTML = `
    <div class="panel-title">Задачи
      <div class="actions">${isManager()?'<button class="btn btn-cy" onclick="openTaskModal()">+ Задача</button>':''}</div>
    </div>
    <div class="filter-bar">
      <button class="filter-btn${tasksFilter==='mine'?' active':''}" onclick="setTaskFilter('mine',this)">Мои</button>
      <button class="filter-btn${tasksFilter==='all'?' active':''}" onclick="setTaskFilter('all',this)">Все</button>
      <button class="filter-btn${tasksFilter==='todo'?' active':''}" onclick="setTaskFilter('todo',this)">К выполн.</button>
      <button class="filter-btn${tasksFilter==='in_progress'?' active':''}" onclick="setTaskFilter('in_progress',this)">В работе</button>
      <button class="filter-btn${tasksFilter==='review'?' active':''}" onclick="setTaskFilter('review',this)">Проверка</button>
      <button class="filter-btn${tasksFilter==='done'?' active':''}" onclick="setTaskFilter('done',this)">Готово</button>
    </div>
    <div class="task-list" id="task-list-container"></div>`;
  await renderTaskList();
};

async function renderTaskList() {
  const container = document.getElementById('task-list-container');
  if (!container) return;
  container.innerHTML = skeletonList(3);

  const url = (tasksFilter === 'all' || tasksFilter === 'mine') ? 'tasks' : `tasks?status=${tasksFilter}`;
  tasksData = await SAPI.get(url) || [];
  const displayData = tasksFilter === 'mine' ? tasksData.filter(t => t.assigned_to == CU.id) : tasksData;

  if (!displayData.length) {
    container.innerHTML = emptyState('✅', 'Нет задач', isManager() ? '+ Создать задачу' : null, 'openTaskModal()');
    return;
  }
  container.innerHTML = displayData.map(t => `
    <div class="task-card" onclick="openTaskModal(${t.id})">
      <div class="task-prio prio-${t.priority}"></div>
      <div class="task-body">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          ${t.assigned_to_name?`<span>👤 ${t.assigned_to_name}</span>`:''}
          ${t.due_date?`<span>📅 ${fmtDate(t.due_date)}</span>`:''}
          ${t.category?`<span>📂 ${t.category}</span>`:''}
          ${t.party_plan_id?'<span>🎉 Вечеринка</span>':''}
        </div>
      </div>
      <span class="task-status s-${t.status}">${statusLabel(t.status)}</span>
    </div>`).join('');
}

function setTaskFilter(f, btn) {
  tasksFilter = f;
  document.querySelectorAll('#staff-main .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTaskList();
}

async function openTaskModal(id) {
  let t = null;
  if (id) t = tasksData.find(x => x.id === id) || (await SAPI.get('tasks')||[]).find(x=>x.id===id);

  // заполняем список сотрудников
  const assignSel = document.getElementById('tm-assigned');
  if (!assignSel) { console.error('tm-assigned not found'); return; }
  assignSel.innerHTML = '<option value="">— Без назначения —</option>' +
    staffCache.map(s=>`<option value="${s.id}">${s.name} (${ROLE_LABELS[s.role]||s.role})</option>`).join('');

  const assignRow = document.getElementById('tm-assign-row');
  if (assignRow) assignRow.style.display = isManager() ? 'grid' : 'none';

  document.getElementById('task-modal-title').textContent = t ? 'Редактировать задачу' : 'Новая задача';
  document.getElementById('tm-id').value         = t ? t.id : '';
  document.getElementById('tm-title').value      = t ? t.title : '';
  document.getElementById('tm-desc').value       = t ? (t.description||'') : '';
  document.getElementById('tm-priority').value   = t ? t.priority : 'normal';
  document.getElementById('tm-status').value     = t ? t.status : 'todo';
  document.getElementById('tm-assigned').value   = t ? (t.assigned_to||'') : '';
  document.getElementById('tm-category').value   = t ? (t.category||'') : '';
  document.getElementById('tm-due').value        = t ? (t.due_date||'') : '';

  const delBtn = document.getElementById('tm-delete-btn');
  delBtn.style.display = (t && (isManager() || t.assigned_by == CU.id)) ? 'inline-block' : 'none';

  // Non-managers can only change status
  const readOnly = !isManager();
  ['tm-title','tm-desc','tm-due','tm-assigned','tm-priority','tm-category'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = readOnly;
    el.style.opacity = readOnly ? '.5' : '1';
  });

  openModal('task-modal');
}

async function saveTaskModal() {
  const id    = document.getElementById('tm-id').value;
  const title = document.getElementById('tm-title').value.trim();
  if (!title) { fieldError('tm-title', 'Введите заголовок задачи'); return; }

  const data = {
    title,
    description: document.getElementById('tm-desc').value,
    priority:    document.getElementById('tm-priority').value,
    status:      document.getElementById('tm-status').value,
    assigned_to: parseInt(document.getElementById('tm-assigned').value)||null,
    category:    document.getElementById('tm-category').value||null,
    due_date:    document.getElementById('tm-due').value||null,
  };
  if (id) data.id = parseInt(id);

  const res = await SAPI.post('task/save', data);
  if (res && res.ok) {
    closeModal('task-modal');
    renderTaskList();
    toast('Задача сохранена ✓');
  } else toastErr(res?.error || 'Ошибка сохранения');
}

async function deleteTaskFromModal() {
  const id = parseInt(document.getElementById('tm-id').value);
  if (!id || !confirm('Удалить задачу?')) return;
  const res = await SAPI.post('task/delete', {id});
  if (res && res.ok) { closeModal('task-modal'); renderTaskList(); toast('Удалено'); }
  else toastErr(res?.error || 'Ошибка удаления');
}

// ── PARTY PLANS ──
let partyData = [];

PANEL_RENDERERS.party = async (el) => {
  const canEdit = ['owner','director','dev_director','art_director','smm'].includes(CU.role);
  el.innerHTML = `
    <div class="panel-title">Вечеринки
      <div class="actions">${canEdit?'<button class="btn btn-cy" onclick="openPartyModal()">+ Добавить</button>':''}</div>
    </div>
    <div class="party-grid" id="party-grid"></div>`;
  await renderPartyGrid();
};

async function renderPartyGrid() {
  const grid = document.getElementById('party-grid');
  if (!grid) return;
  partyData = await SAPI.get('party/list') || [];
  if (!partyData.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🎉</div><p>Нет вечеринок. Создайте первую!</p></div>';
    return;
  }
  grid.innerHTML = partyData.map(p => `
    <div class="party-card" onclick="openPartyModal(${p.id})">
      <div class="party-title">${p.title}</div>
      <div class="party-date">📅 ${p.event_date ? fmtDate(p.event_date) : 'Дата не задана'}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="party-status ps-${p.status}">${partyStatusLabel(p.status)}</span>
        ${p.responsible_name?`<span style="font-size:.5rem;color:var(--gl)">👤 ${p.responsible_name}</span>`:''}
      </div>
      ${p.task_count>0?`<div style="font-size:.45rem;color:var(--gl);margin-top:.4rem">📋 ${p.task_count} задач</div>`:''}
    </div>`).join('');
}

async function openPartyModal(id) {
  let p = id ? partyData.find(x=>x.id===id) : null;

  document.getElementById('party-modal-title').textContent = p ? p.title : 'Новая вечеринка';
  document.getElementById('pm-id').value           = p ? p.id : '';
  document.getElementById('pm-title').value        = p ? p.title : '';
  document.getElementById('pm-date').value         = p ? (p.event_date||'') : '';
  document.getElementById('pm-time').value         = p ? (p.start_time||'23:00') : '23:00';
  document.getElementById('pm-theme').value        = p ? (p.theme||'') : '';
  document.getElementById('pm-concept').value      = p ? (p.concept||'') : '';
  document.getElementById('pm-desc').value         = p ? (p.description||'') : '';
  document.getElementById('pm-budget').value       = p ? (p.budget||'') : '';
  document.getElementById('pm-status').value       = p ? (p.status||'idea') : 'idea';

  // Populate responsible select from staffCache
  const respSel = document.getElementById('pm-responsible');
  if (respSel && staffCache) {
    const opts = staffCache.map(s => `<option value="${s.id}"${p && p.responsible_id==s.id?' selected':''}>${s.name}</option>`).join('');
    respSel.innerHTML = '<option value="">— выбрать —</option>' + opts;
  }

  const delBtn = document.getElementById('pm-delete-btn');
  if (delBtn) delBtn.style.display = p ? 'inline-block' : 'none';

  openModal('party-modal');
}

async function savePartyModal() {
  const id    = document.getElementById('pm-id').value;
  const title = document.getElementById('pm-title').value.trim();
  if (!title) { fieldError('pm-title', 'Введите название вечеринки'); return; }

  const data = {
    title,
    event_date:     document.getElementById('pm-date').value||null,
    theme:          document.getElementById('pm-theme').value||null,
    concept:        document.getElementById('pm-concept').value||null,
    status:         document.getElementById('pm-status').value,
    responsible_id: parseInt(document.getElementById('pm-responsible').value)||null,
  };
  if (id) data.id = parseInt(id);

  const res = await SAPI.post('party/save', data);
  if (res && res.ok) {
    const autoTasks = res.auto_tasks || 0;
    closeModal('party-modal');
    renderPartyGrid();
    toast(autoTasks ? `Вечеринка сохранена ✓ — создано ${autoTasks} задач` : 'Вечеринка сохранена ✓');
  } else toastErr(res?.error || 'Ошибка сохранения');
}

async function confirmParty() {
  document.getElementById('pm-status').value = 'confirmed';
  await savePartyModal();
}

async function deletePartyFromModal() {
  const id = parseInt(document.getElementById('pm-id').value);
  if (!id || !confirm('Удалить вечеринку и все связанные задачи?')) return;
  const res = await SAPI.post('party/delete', {id});
  if (res && res.ok) { closeModal('party-modal'); renderPartyGrid(); toast('Удалено'); }
  else toastErr(res?.error || 'Ошибка удаления');
}

// ── CONTENT ──
let contentData = [];
let calYear, calMonth;

PANEL_RENDERERS.content = async (el) => {
  const canEdit = ['owner','director','art_director','smm','designer'].includes(CU.role);
  const now = new Date();
  calYear = now.getFullYear(); calMonth = now.getMonth();

  el.innerHTML = `
    <div class="panel-title">Контент-план
      <div class="actions">
        ${canEdit?'<button class="btn btn-cy" onclick="openPostModal()">+ Пост</button>':''}
        <button class="btn btn-out" id="view-toggle" onclick="toggleContentView(this)">📅 Календарь</button>
      </div>
    </div>
    <div id="content-calendar" style="display:none">
      <div class="cal-month-nav">
        <button class="cal-nav-btn" onclick="changeCalMonth(-1)">◀</button>
        <span class="cal-month-label" id="cal-month-lbl"></span>
        <button class="cal-nav-btn" onclick="changeCalMonth(1)">▶</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    </div>
    <div id="content-list">
      <div class="filter-bar">
        <button class="filter-btn active" onclick="setPostFilter('',this)">Все</button>
        <button class="filter-btn" onclick="setPostFilter('instagram',this)">Instagram</button>
        <button class="filter-btn" onclick="setPostFilter('telegram',this)">Telegram</button>
        <button class="filter-btn" onclick="setPostFilter('draft',this,'status')">Черновики</button>
        <button class="filter-btn" onclick="setPostFilter('scheduled',this,'status')">Запланировано</button>
      </div>
      <div class="post-list" id="post-list"></div>
    </div>`;
  await renderPostList();
};

let postPlatFilter = '', postStatFilter = '';

async function renderPostList() {
  const container = document.getElementById('post-list');
  if (!container) return;
  let url = 'content/posts';
  const params = [];
  if (postPlatFilter) params.push('platform='+postPlatFilter);
  if (postStatFilter) params.push('status='+postStatFilter);
  if (params.length) url += '?' + params.join('&');

  contentData = await SAPI.get(url) || [];
  if (!contentData.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📱</div><p>Нет публикаций</p></div>';
    return;
  }
  container.innerHTML = contentData.map(p => {
    const icon = p.platform === 'instagram' ? '📸' : p.platform === 'telegram' ? '✈️' : '📲';
    const pcls = `pi-${p.platform}`;
    return `<div class="post-card" onclick="openPostModal(${p.id})">
      <div class="platform-icon ${pcls}">${icon}</div>
      <div class="task-body">
        <div class="task-title">${p.title||p.content.slice(0,50)}</div>
        <div class="task-meta">
          ${p.scheduled_at?`<span>📅 ${fmtDateTime(p.scheduled_at)}</span>`:''}
          ${p.created_by_name?`<span>👤 ${p.created_by_name}</span>`:''}
          ${p.ai_generated?'<span>🤖 AI</span>':''}
        </div>
      </div>
      <span class="task-status s-${p.status==='published'?'done':p.status==='draft'?'todo':'in_progress'}">${{draft:'Черновик',scheduled:'Запланировано',published:'Опубликовано',cancelled:'Отменено'}[p.status]||p.status}</span>
    </div>`;
  }).join('');
}

function setPostFilter(val, btn, type) {
  if (type === 'status') { postStatFilter = val; postPlatFilter = ''; }
  else { postPlatFilter = val; postStatFilter = ''; }
  document.querySelectorAll('#staff-main .filter-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPostList();
  renderCalendar();
}

function toggleContentView(btn) {
  const cal  = document.getElementById('content-calendar');
  const list = document.getElementById('content-list');
  const isCal = cal.style.display === 'block';
  cal.style.display  = isCal ? 'none' : 'block';
  list.style.display = isCal ? 'block' : 'none';
  btn.textContent = isCal ? '📅 Календарь' : '📋 Список';
  if (!isCal) renderCalendar();
}

function changeCalMonth(dir) { calMonth += dir; if(calMonth>11){calMonth=0;calYear++;}if(calMonth<0){calMonth=11;calYear--;} renderCalendar(); }

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  const lbl  = document.getElementById('cal-month-lbl');
  if (!grid) return;
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  lbl.textContent = months[calMonth] + ' ' + calYear;

  const days = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const first = new Date(calYear, calMonth, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const today = new Date().toISOString().slice(0,10);

  let html = days.map(d=>`<div class="cal-head">${d}</div>`).join('');
  for (let i=0; i<startDay; i++) html += '<div></div>';
  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasPosts = contentData.some(p => p.scheduled_at && p.scheduled_at.slice(0,10) === dateStr);
    html += `<div class="cal-day${dateStr===today?' today':''}${hasPosts?' has-posts':''}" onclick="showDayPosts('${dateStr}')">
      <div class="cal-num">${d}</div>
      ${hasPosts?'<div class="cal-dot"></div>':''}
    </div>`;
  }
  grid.innerHTML = html;
}

function showDayPosts(dateStr) {
  const posts = contentData.filter(p => p.scheduled_at && p.scheduled_at.slice(0,10) === dateStr);
  if (!posts.length) return;
  toast(`📱 ${posts.length} поста на ${dateStr}`);
}

function openPostModal(id) {
  let p = id ? contentData.find(x=>x.id===id) : null;
  document.getElementById('post-modal-title').textContent = p ? 'Редактировать пост' : 'Новый пост';
  document.getElementById('postm-id').value          = p ? p.id : '';
  document.getElementById('postm-platform').value    = p ? p.platform : 'instagram';
  document.getElementById('postm-title').value       = p ? (p.title||'') : '';
  document.getElementById('postm-content').value     = p ? p.content : '';
  document.getElementById('postm-scheduled').value   = p ? (p.scheduled_at ? p.scheduled_at.slice(0,16) : '') : '';
  document.getElementById('postm-status').value      = p ? p.status : 'draft';
  document.getElementById('postm-chars').textContent = (p ? p.content.length : 0);
  document.getElementById('postm-delete-btn').style.display = p ? 'inline-block' : 'none';
  document.getElementById('postm-ai-result').style.display  = 'none';
  openModal('post-modal');
}
// Обработчик изменения количества символов
const postmContentEl = document.getElementById('postm-content');
if (postmContentEl) {
  postmContentEl.addEventListener('input', function(){
    document.getElementById('postm-chars').textContent = this.value.length;
  });
}

async function savePostModal() {
  const id   = document.getElementById('postm-id').value;
  const cont = document.getElementById('postm-content').value.trim();
  if (!cont) { toastErr('Введите текст поста'); return; }
  const data = {
    platform:     document.getElementById('postm-platform').value,
    title:        document.getElementById('postm-title').value||null,
    content:      cont,
    scheduled_at: document.getElementById('postm-scheduled').value||null,
    status:       document.getElementById('postm-status').value,
  };
  if (id) data.id = parseInt(id);
  const res = await SAPI.post('content/post/save', data);
  if (res && res.ok) { closeModal('post-modal'); renderPostList(); toast('Пост сохранён ✓'); }
  else toastErr(res?.error || 'Ошибка сохранения');
}

async function deletePostFromModal() {
  const id = parseInt(document.getElementById('postm-id').value);
  if (!id || !confirm('Удалить пост?')) return;
  const res = await SAPI.post('content/post/delete', {id});
  if (res && res.ok) { closeModal('post-modal'); renderPostList(); toast('Удалено'); }
}

async function generatePostWithAI() {
  const platform = document.getElementById('postm-platform').value;
  const title    = document.getElementById('postm-title').value || 'RAVEZ ONE';
  const resEl    = document.getElementById('postm-ai-result');
  const preset   = platform === 'telegram'
    ? 'Ты SMM-менеджер RAVEZ ONE. Пиши Telegram-посты — разговорный стиль, без лишних хэштегов.'
    : 'Ты SMM-менеджер RAVEZ ONE. Пиши вовлекающие Instagram-посты с эмодзи и хэштегами на русском.';
  const prompt = `Напиши пост для ${platform==='telegram'?'Telegram':'Instagram'} про: ${title}. Клуб RAVEZ ONE, Казань.`;

  resEl.style.display = 'block';
  resEl.className = 'ai-result loading';
  resEl.textContent = 'Генерирую...';

  const res = await SAPI.post('ai/generate', {provider:'groq', prompt, system: preset});
  if (res && res.text) {
    resEl.className = 'ai-result';
    resEl.textContent = res.text;
    // кнопка "использовать"
    const useBtn = document.createElement('button');
    useBtn.className = 'btn btn-cy btn-sm';
    useBtn.textContent = '✓ Использовать';
    useBtn.onclick = () => {
      document.getElementById('postm-content').value = res.text;
      document.getElementById('postm-chars').textContent = res.text.length;
      resEl.style.display = 'none';
    };
    resEl.appendChild(document.createElement('br'));
    resEl.appendChild(useBtn);
  } else {
    resEl.className = 'ai-result';
    resEl.textContent = 'Ошибка генерации. Проверьте AI настройки.';
  }
}

// ── ENTRY (фиксация входа) ──
let entryTiers = [];

PANEL_RENDERERS.entry = async (el) => {
  el.innerHTML = `
    <div class="panel-title">Фиксация входа</div>
    <div style="font-size:.55rem;color:var(--gl);margin-bottom:1rem">Нажмите на тариф — запись добавится автоматически</div>
    <div class="entry-grid" id="entry-btns"></div>
    <div class="stats-grid" style="margin-bottom:1rem">
      <div class="stat-card"><div class="stat-val" id="en-count">0</div><div class="stat-lbl">Вошло сегодня</div></div>
      <div class="stat-card"><div class="stat-val" id="en-rev">0 ₽</div><div class="stat-lbl">Выручка входа</div></div>
    </div>
    <div style="font-size:.55rem;font-family:var(--fm);color:var(--cy);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">По тарифам</div>
    <div id="en-by-tier" style="margin-bottom:1rem"></div>
    <div style="font-size:.55rem;font-family:var(--fm);color:var(--cy);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">Последние записи</div>
    <div id="en-log" class="entry-log"></div>`;

  // Загружаем тарифы
  entryTiers = await SAPI.get('tiers') || [];
  renderEntryButtons();
  await refreshEntryStats();
};

function renderEntryButtons() {
  const grid = document.getElementById('entry-btns');
  if (!grid) return;
  const btns = entryTiers.map(t =>
    `<button class="entry-btn" id="ebtn-${t.id}" onclick="addEntry('${t.id}','${t.name}',${t.price||0})">
      <div class="entry-tier">${t.name}</div>
      <div class="entry-price">${t.price ? moneyFmt(t.price) : 'Бесплатно'}</div>
      <span class="entry-ok">✓</span>
    </button>`
  ).join('');
  grid.innerHTML = btns + `
    <button class="entry-btn" id="ebtn-free" onclick="addEntry('free','Без тарифа',0)">
      <div class="entry-tier">Без тарифа</div>
      <div class="entry-price" style="color:var(--gl)">Бесплатно</div>
      <span class="entry-ok">✓</span>
    </button>`;
}

async function addEntry(tierId, tierName, price) {
  const btn = document.getElementById('ebtn-' + tierId);
  if (btn) { btn.classList.add('fired'); setTimeout(()=>btn.classList.remove('fired'), 1200); }

  const res = await SAPI.post('entries/add', {tier_id: tierId, tier_name: tierName, price});
  if (res && res.ok) {
    document.getElementById('en-count').textContent = res.total_count;
    document.getElementById('en-rev').textContent   = moneyFmt(res.total_revenue);
    await refreshEntryLog();
    // Вибрация на мобильных
    if (navigator.vibrate) navigator.vibrate(50);
  } else {
    toast('Ошибка записи');
  }
}

async function refreshEntryStats() {
  const data = await SAPI.get('entries/today');
  if (!data) return;
  const countEl = document.getElementById('en-count');
  const revEl   = document.getElementById('en-rev');
  const tierEl  = document.getElementById('en-by-tier');
  if (countEl) countEl.textContent = data.total_count || 0;
  if (revEl)   revEl.textContent   = moneyFmt(data.total_revenue || 0);
  if (tierEl && data.by_tier) {
    tierEl.innerHTML = data.by_tier.map(t =>
      `<div style="display:flex;justify-content:space-between;font-size:.6rem;padding:.3rem .5rem;background:rgba(255,255,255,.02);border-radius:5px;margin-bottom:.3rem">
        <span>${t.tier_name||'Без тарифа'}</span>
        <span style="color:var(--gl)">${t.cnt} чел. · ${moneyFmt(t.revenue)}</span>
      </div>`).join('') || '<div style="color:var(--g);font-size:.58rem">Пока никто не входил</div>';
  }
  await refreshEntryLog(data.entries);
}

async function refreshEntryLog(entries) {
  if (!entries) {
    const data = await SAPI.get('entries/today');
    entries = data ? data.entries : [];
  }
  const log = document.getElementById('en-log');
  if (!log) return;
  const recent = (entries || []).slice(0,10);
  const now = Date.now();
  const canDelete = ['owner','director','admin'].includes(CU.role);
  log.innerHTML = recent.length
    ? recent.map(e => {
        const ts = new Date(e.created_at).getTime();
        const canDel = canDelete && (now - ts < 5*60*1000);
        return `<div class="entry-log-item">
          <span class="elt">${e.tier_name||'Без тарифа'} · ${new Date(e.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span>
          <span class="elp">${moneyFmt(e.price)}</span>
          ${canDel?`<span class="elr" onclick="deleteEntry(${e.id})">✕</span>`:''}
        </div>`;
      }).join('')
    : '<div style="color:var(--g);font-size:.58rem">Записей нет</div>';
}

async function deleteEntry(id) {
  if (!confirm('Отменить запись?')) return;
  const res = await SAPI.post('entries/delete', {id});
  if (res && res.ok) {
    document.getElementById('en-count').textContent = res.total_count;
    document.getElementById('en-rev').textContent   = moneyFmt(res.total_revenue);
    await refreshEntryLog();
    toast('Запись отменена');
  } else toastErr('Нельзя отменить — запись старше 5 минут');
}

// ── BOOKINGS ──
PANEL_RENDERERS.bookings = async (el) => {
  const canFull = ['owner','director','dev_director','admin'].includes(CU.role);
  el.innerHTML = `
    <div class="panel-title">Брони
      <div class="actions">${canFull?'<button class="btn btn-out btn-sm" onclick="exportBookingsCSV()">⬇ CSV</button>':''}</div>
    </div>
    <div class="filter-bar">
      <input type="text" id="bk-search" placeholder="Поиск по коду или имени..." style="background:rgba(255,255,255,.05);border:1px solid var(--cb);color:var(--w);padding:.4rem .7rem;border-radius:6px;font-size:.65rem;outline:none;flex:1;min-width:150px;font-family:var(--fb)" oninput="renderBookingsList()">
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead><tr>
          <th>Код</th><th>Имя</th><th>Телефон</th><th>Тариф</th><th>Цена</th><th>Дата</th><th>Статус</th>${canFull?'<th></th>':''}
        </tr></thead>
        <tbody id="bookings-tbody"></tbody>
      </table>
    </div>`;
  await renderBookingsList();
};

let bookingsCache = [];
async function renderBookingsList() {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;
  const q = (document.getElementById('bk-search')?.value||'').toLowerCase();
  if (!bookingsCache.length || !q) {
    bookingsCache = await SAPI.get('bookings') || [];
  }
  const canFull = ['owner','director','dev_director','admin'].includes(CU.role);
  let list = bookingsCache;
  if (q) list = list.filter(b=>(b.code||'').toLowerCase().includes(q)||(b.name||'').toLowerCase().includes(q));
  tbody.innerHTML = list.slice(0,50).map(b=>`<tr>
    <td style="font-family:var(--fm);color:var(--cy)">${b.code}</td>
    <td>${esc(b.name)||'—'}</td>
    <td>${esc(b.phone)||'—'}</td>
    <td>${esc(b.tier_name||b.tier)||'—'}</td>
    <td>${b.price?moneyFmt(b.price):'—'}</td>
    <td>${fmtDate(b.date)}</td>
    <td>${chip(b.status)}</td>
    ${canFull?`<td><button class="btn-xs" onclick="verifyBooking('${b.code}')">✓ Верифицировать</button></td>`:''}
  </tr>`).join('') || `<tr><td colspan="8">${emptyState('📋','Броней нет','+ Создать бронь',"showPanel('bookings')")}</td></tr>`;
}

async function verifyBooking(code) {
  const res = await SAPI.post('booking/verify', {code});
  if (res && res.ok) { bookingsCache=[]; await renderBookingsList(); toast('Верифицирован ✓'); }
  else toastErr('Ошибка верификации');
}

async function exportBookingsCSV() {
  const list = await SAPI.get('bookings') || [];
  const rows=[['Код','Имя','Телефон','Email','Тариф','Цена','Дата','Статус']];
  list.forEach(b=>rows.push([b.code,b.name,b.phone,b.email,b.tier_name||b.tier,b.price,b.date,b.status]));
  const csv=rows.map(r=>r.map(c=>'"'+(c||'')+'"').join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ravez_bookings_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}

// ── DJ PANEL ──
PANEL_RENDERERS.djs = async (el) => {
  el.innerHTML = `<div class="panel-title">Диджеи</div><div id="dj-list-staff"></div>`;
  const djs = await SAPI.get('djs') || [];
  const container = document.getElementById('dj-list-staff');
  if (!djs.length) { container.innerHTML = '<div class="empty"><div class="empty-icon">🎧</div><p>Нет диджеев</p></div>'; return; }

  const myDJ = CU.role === 'dj' ? djs.find(d=>d.name && d.name.toLowerCase().includes(CU.name.toLowerCase())) : null;
  const showList = myDJ ? [myDJ] : djs;

  container.innerHTML = showList.map(d=>`
    <div class="card" style="display:flex;gap:1rem;align-items:flex-start">
      ${d.photo?`<img src="${d.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0">`:`<div style="width:64px;height:64px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">🎧</div>`}
      <div>
        <div style="font-size:.85rem;font-weight:700;margin-bottom:.2rem">${d.name}</div>
        <div style="font-size:.6rem;color:var(--gl);margin-bottom:.5rem">${d.genre||''}</div>
      </div>
    </div>`).join('');
};

// ── EVENTS / BEO ──────────────────────────────────────────────
PANEL_RENDERERS.events = async (el) => {
  el.innerHTML = `
    <div class="panel-title">События — BEO
      <span style="float:right;display:flex;gap:.4rem">
        <button class="btn-sm" onclick="openEventForm(null)">＋ Событие</button>
        <button class="btn-sm" onclick="openTemplatesPanel()">📋 Шаблоны</button>
      </span>
    </div>
    <div style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap">
      <select id="ev-status-filter" onchange="loadEventsList()">
        <option value="">Все статусы</option>
        <option value="planning">Планируется</option>
        <option value="confirmed">Подтверждено</option>
        <option value="done">Завершено</option>
        <option value="idea">Идея</option>
      </select>
      <select id="ev-type-filter" onchange="loadEventsList()">
        <option value="">Все типы</option>
        <option value="party">Вечеринка</option>
        <option value="thursday">Четверг</option>
        <option value="private">Приват</option>
      </select>
    </div>
    <div id="ev-list-beo"></div>
    <!-- Event Form Modal -->
    <div id="ev-form-modal" class="modal-overlay" onclick="if(event.target===this)closeModal('ev-form-modal')">
      <div class="modal" style="max-width:480px;max-height:90vh;overflow-y:auto">
        <div class="modal-header"><span id="ev-form-title">Новое событие</span><button onclick="closeModal('ev-form-modal')">✕</button></div>
        <div id="ev-form-body"></div>
      </div>
    </div>
    <!-- BEO Detail Modal -->
    <div id="beo-modal" class="modal-overlay" onclick="if(event.target===this)closeModal('beo-modal')">
      <div class="modal" style="max-width:600px;max-height:92vh;overflow-y:auto">
        <div class="modal-header"><span id="beo-title">BEO</span><button onclick="closeModal('beo-modal')">✕</button></div>
        <div id="beo-body"></div>
      </div>
    </div>
    <!-- Templates Modal -->
    <div id="tpl-modal" class="modal-overlay" onclick="if(event.target===this)closeModal('tpl-modal')">
      <div class="modal" style="max-width:480px;max-height:85vh;overflow-y:auto">
        <div class="modal-header"><span>📋 Шаблоны событий</span><button onclick="closeModal('tpl-modal')">✕</button></div>
        <div id="tpl-body"></div>
      </div>
    </div>`;
  loadEventsList();
};

async function loadEventsList() {
  const status = document.getElementById('ev-status-filter')?.value || '';
  const type   = document.getElementById('ev-type-filter')?.value || '';
  const p = new URLSearchParams();
  if (status) p.set('status', status);
  if (type)   p.set('type', type);
  const data = await SAPI.get('events/list?' + p.toString());
  const el = document.getElementById('ev-list-beo');
  if (!el) return;
  if (!data?.length) { el.innerHTML='<div class="empty"><div class="empty-icon">📅</div><p>Нет событий</p></div>'; return; }

  const statusColor = {idea:'#888',planning:'#7c6af7',confirmed:'#4caf50',done:'#aaa',cancelled:'#f44336'};
  const statusLabel = {idea:'Идея',planning:'Планирование',confirmed:'Подтверждено',done:'Завершено',cancelled:'Отменено'};
  el.innerHTML = data.map(e => {
    const rdns = parseInt(e.readiness||0);
    const rdnsColor = rdns >= 80 ? '#4caf50' : rdns >= 50 ? '#ffc107' : '#f44336';
    return `<div class="task-card" style="cursor:pointer" onclick="openBEO('${e.id}')">
      <div class="task-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="task-title">${esc(e.name)}</div>
          <div style="display:flex;align-items:center;gap:.4rem">
            <div style="font-size:.65rem;color:${rdnsColor};font-weight:700">${rdns}%</div>
            <div style="width:40px;height:5px;background:#222;border-radius:99px;overflow:hidden">
              <div style="width:${rdns}%;height:100%;background:${rdnsColor};border-radius:99px"></div>
            </div>
          </div>
        </div>
        <div class="task-meta">
          <span>📅 ${fmtDate(e.event_date)}</span>
          ${e.time_start?`<span>⏰ ${e.time_start}</span>`:''}
          <span style="color:${statusColor[e.status]}">${statusLabel[e.status]||e.status}</span>
          ${e.task_stats?`<span>✅ ${e.task_stats.done||0}/${e.task_stats.total||0} задач</span>`:''}
          ${e.shifts_stats?`<span>👥 ${e.shifts_stats.confirmed||0}/${e.shifts_stats.total||0} смен</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

async function openBEO(id) {
  const data = await SAPI.get('event/beo?id=' + id);
  if (!data || data.error) { toast('Ошибка загрузки BEO'); return; }
  document.getElementById('beo-title').textContent = data.name;
  const rdns = data.readiness || 0;
  const rdnsColor = rdns >= 80 ? '#4caf50' : rdns >= 50 ? '#ffc107' : '#f44336';
  document.getElementById('beo-body').innerHTML = `
    <!-- Readiness -->
    <div style="background:#0e0e16;border-radius:12px;padding:.75rem;margin-bottom:.75rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
        <span style="font-size:.7rem;color:var(--gl)">Готовность события</span>
        <span style="font-weight:700;color:${rdnsColor}">${rdns}%</span>
      </div>
      <div style="background:#1a1a22;border-radius:99px;height:10px;overflow:hidden">
        <div style="width:${rdns}%;height:100%;background:${rdnsColor};border-radius:99px;transition:width .4s"></div>
      </div>
    </div>
    <!-- Info -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem;font-size:.68rem">
      <div style="background:#0e0e16;border-radius:8px;padding:.5rem"><div style="color:var(--gl)">Дата</div><b>${fmtDate(data.event_date)}</b></div>
      <div style="background:#0e0e16;border-radius:8px;padding:.5rem"><div style="color:var(--gl)">Время</div><b>${data.time_start||'—'} – ${data.time_end||'—'}</b></div>
      <div style="background:#0e0e16;border-radius:8px;padding:.5rem"><div style="color:var(--gl)">Дресс-код</div><b>${esc(data.dress_code||'—')}</b></div>
      <div style="background:#0e0e16;border-radius:8px;padding:.5rem"><div style="color:var(--gl)">Музыка</div><b>${esc(data.music_genre||'—')}</b></div>
    </div>
    <!-- Finances -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-bottom:.75rem;font-size:.68rem">
      <div style="background:#0e2a0e;border-radius:8px;padding:.5rem;text-align:center"><div style="color:#4caf50">Доход</div><b>${moneyFmt(data.income_total)}</b></div>
      <div style="background:#2a0e0e;border-radius:8px;padding:.5rem;text-align:center"><div style="color:#f44336">Расход</div><b>${moneyFmt(data.expense_total)}</b></div>
      <div style="background:#0e0e2a;border-radius:8px;padding:.5rem;text-align:center"><div style="color:#7c6af7">Прибыль</div><b>${moneyFmt(data.profit)}</b></div>
    </div>
    <!-- Tasks -->
    <div style="margin-bottom:.75rem">
      <div style="font-size:.7rem;font-weight:600;margin-bottom:.4rem">Задачи (${data.tasks?.length||0})</div>
      ${data.tasks?.length ? data.tasks.slice(0,6).map(t=>`
        <div style="display:flex;align-items:center;gap:.5rem;padding:.35rem 0;border-bottom:1px solid #1a1a22;font-size:.65rem">
          <span style="color:${t.status==='done'?'#4caf50':t.status==='in_progress'?'#7c6af7':'#aaa'}">${t.status==='done'?'✅':t.status==='in_progress'?'🔄':'⬜'}</span>
          <span style="flex:1">${esc(t.title)}</span>
          <span style="color:var(--gl)">${fmtDate(t.due_date)}</span>
        </div>`).join('') : '<p style="color:var(--gl);font-size:.65rem">Нет задач</p>'}
      ${data.tasks?.length > 6 ? `<div style="font-size:.62rem;color:var(--gl);margin-top:.3rem">...ещё ${data.tasks.length-6}</div>` : ''}
    </div>
    <!-- Shifts -->
    <div style="margin-bottom:.75rem">
      <div style="font-size:.7rem;font-weight:600;margin-bottom:.4rem">Смены (${data.shifts?.length||0})</div>
      ${data.shifts?.length ? data.shifts.slice(0,5).map(s=>`
        <div style="display:flex;align-items:center;gap:.5rem;padding:.35rem 0;border-bottom:1px solid #1a1a22;font-size:.65rem">
          <span style="color:${s.status==='confirmed'?'#4caf50':s.status==='completed'?'#aaa':'#ffc107'}">${s.status==='confirmed'?'✅':s.status==='completed'?'☑️':'⏳'}</span>
          <span style="flex:1">${esc(s.staff_name||'—')}</span>
          <span style="color:var(--gl)">${s.time_start||'—'} – ${s.time_end||'—'}</span>
        </div>`).join('') : '<p style="color:var(--gl);font-size:.65rem">Нет смен</p>'}
    </div>
    <!-- Entries -->
    ${data.entry_count !== undefined ? `<div style="font-size:.7rem;margin-bottom:.5rem">
      <b>${data.entry_count}</b> <span style="color:var(--gl)">входов записано</span>
    </div>` : ''}
    <!-- Buttons -->
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem">
      <button class="btn-sm" onclick="closeModal('beo-modal');openEventForm('${data.id}')">✏️ Редактировать</button>
    </div>`;
  openModal('beo-modal');
}

async function openEventForm(id) {
  let e = {};
  if (id) {
    const data = await SAPI.get('event/beo?id=' + id);
    if (data && !data.error) e = data;
  }
  // Load templates for selector
  const tpls = await SAPI.get('event/templates') || [];
  document.getElementById('ev-form-title').textContent = id ? 'Редактировать событие' : 'Новое событие';
  document.getElementById('ev-form-body').innerHTML = `
    <div class="form-group"><label>Название *</label><input id="ef-name" value="${esc(e.name||'')}" /></div>
    <div class="form-group"><label>Дата *</label><input type="date" id="ef-date" value="${e.event_date||''}" /></div>
    <div class="form-group"><label>Начало</label><input type="time" id="ef-tstart" value="${e.time_start||''}" /></div>
    <div class="form-group"><label>Конец</label><input type="time" id="ef-tend" value="${e.time_end||''}" /></div>
    <div class="form-group"><label>Тип</label>
      <select id="ef-type">
        ${['party','thursday','private','other'].map(t=>`<option value="${t}" ${e.type===t?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Статус</label>
      <select id="ef-status">
        ${['idea','planning','confirmed','done','cancelled'].map(s=>`<option value="${s}" ${e.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Дресс-код</label><input id="ef-dress" value="${esc(e.dress_code||'')}" /></div>
    <div class="form-group"><label>Жанр музыки</label><input id="ef-music" value="${esc(e.music_genre||'')}" /></div>
    <div class="form-group"><label>Вместимость</label><input type="number" id="ef-cap" value="${e.capacity||''}" /></div>
    <div class="form-group"><label>Концепция</label><textarea id="ef-concept">${esc(e.concept||'')}</textarea></div>
    ${!id && tpls.length ? '<div class="form-group"><label>Создать задачи из шаблона</label><select id="ef-tpl"><option value="">— без шаблона —</option>' + tpls.map(t=>'<option value="'+t.id+'">'+esc(t.name)+'</option>').join('') + '</select></div>' : ''}
    <div style="display:flex;gap:.5rem;margin-top:.75rem">
      <button class="btn" onclick="saveEventForm(${id ? "'"+id+"'" : 'null'})" style="flex:1">💾 Сохранить</button>
      ${id ? '<button class="btn-danger" onclick="deleteEventConfirm(\''+id+'\')">🗑</button>' : ''}
    </div>`;
  openModal('ev-form-modal');
}

async function saveEventForm(id) {
  const b = {
    name:        document.getElementById('ef-name').value.trim(),
    event_date:  document.getElementById('ef-date').value,
    time_start:  document.getElementById('ef-tstart').value || null,
    time_end:    document.getElementById('ef-tend').value || null,
    type:        document.getElementById('ef-type').value,
    status:      document.getElementById('ef-status').value,
    dress_code:  document.getElementById('ef-dress').value.trim() || null,
    music_genre: document.getElementById('ef-music').value.trim() || null,
    capacity:    parseInt(document.getElementById('ef-cap').value) || 0,
    concept:     document.getElementById('ef-concept').value.trim() || null,
  };
  if (id) b.id = id;
  const tplEl = document.getElementById('ef-tpl');
  if (tplEl?.value) b.template_id = parseInt(tplEl.value);
  if (!b.name || !b.event_date) { toast('Введите название и дату'); return; }
  const res = await SAPI.post('event/save', b);
  if (res?.ok) { toast('Сохранено'); closeModal('ev-form-modal'); loadEventsList(); }
  else toast(res?.error || 'Ошибка');
}

async function deleteEventConfirm(id) {
  if (!confirm('Отменить событие?')) return;
  const res = await SAPI.post('event/delete', {id});
  if (res?.ok) { toast('Событие отменено'); closeModal('ev-form-modal'); closeModal('beo-modal'); loadEventsList(); }
  else toast(res?.error || 'Ошибка');
}

async function openTemplatesPanel() {
  const data = await SAPI.get('event/templates') || [];
  const body = document.getElementById('tpl-body');
  body.innerHTML = `
    <div style="margin-bottom:.75rem">
      ${data.length ? data.map(t=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem 0;border-bottom:1px solid #222;font-size:.7rem">
        <span style="flex:1"><b>${esc(t.name)}</b> <span style="color:var(--gl)">(${t.task_count||0} задач)</span></span>
        <button class="btn-xs" onclick="createEventFromTpl(${t.id},'${esc(t.name)}')">Создать событие</button>
      </div>`).join('') : '<p style="color:var(--gl);font-size:.65rem">Шаблонов нет</p>'}
    </div>
    <hr style="border-color:#333;margin:.5rem 0">
    <div style="font-size:.7rem;font-weight:600;margin-bottom:.4rem">Создать шаблон</div>
    <div class="form-group"><label>Название шаблона</label><input id="tpl-name" /></div>
    <div class="form-group"><label>Описание</label><input id="tpl-desc" /></div>
    <button class="btn" style="width:100%" onclick="saveTplForm()">Сохранить шаблон</button>`;
  openModal('tpl-modal');
}

async function saveTplForm() {
  const b = { name: document.getElementById('tpl-name').value.trim(), description: document.getElementById('tpl-desc').value.trim() };
  if (!b.name) { toast('Введите название'); return; }
  const res = await SAPI.post('event/template/save', b);
  if (res?.ok) { toast('Шаблон создан'); openTemplatesPanel(); }
  else toast(res?.error || 'Ошибка');
}

async function createEventFromTpl(tplId, tplName) {
  const date = prompt(`Создать событие из шаблона "${tplName}".\nВведите дату (ГГГГ-ММ-ДД):`);
  if (!date) return;
  const name = prompt('Название события:', tplName);
  if (!name) return;
  const res = await SAPI.post('event/from-template', {template_id: tplId, event_date: date, name});
  if (res?.ok) { toast('Событие создано с задачами!'); closeModal('tpl-modal'); loadEventsList(); }
  else toast(res?.error || 'Ошибка');
}

// ── ANALYTICS ──
// ── АНАЛИТИКА (полная) ──────────────────────────────────────────
PANEL_RENDERERS.analytics = async (el) => {
  let anMonths = 6;
  el.innerHTML = `
    <div class="panel-title">Аналитика
      <div class="actions">
        <select id="an-months-sel" onchange="anChangeMonths(this.value)" style="font-size:.72rem;padding:.3rem .6rem;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid var(--cb);color:var(--w)">
          <option value="3">3 месяца</option>
          <option value="6" selected>6 месяцев</option>
          <option value="12">Год</option>
        </select>
      </div>
    </div>
    <div class="stats" id="an-summary">
      <div class="stat-card"><div class="stat-val" id="an-income">—</div><div class="stat-lbl">Выручка мес.</div><div class="stat-diff" id="an-income-diff" style="font-size:.55rem;margin-top:.2rem"></div></div>
      <div class="stat-card"><div class="stat-val" id="an-expense" style="color:#f44336">—</div><div class="stat-lbl">Расходы мес.</div></div>
      <div class="stat-card"><div class="stat-val" id="an-profit">—</div><div class="stat-lbl">Прибыль мес.</div></div>
      <div class="stat-card"><div class="stat-val" id="an-entries">—</div><div class="stat-lbl">Гостей мес.<br><span class="stat-diff" id="an-entries-diff" style="font-size:.55rem"></span></div></div>
      <div class="stat-card"><div class="stat-val" id="an-bookings">—</div><div class="stat-lbl">Броней мес.</div></div>
    </div>

    <div class="card">
      <div class="card-title">📈 Выручка и расходы по месяцам</div>
      <div style="position:relative;height:160px"><canvas id="an-revenue-chart" style="width:100%;height:100%"></canvas></div>
      <div id="an-revenue-legend" style="display:flex;gap:1rem;margin-top:.5rem;font-size:.6rem;color:var(--gl)"></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <div class="card">
        <div class="card-title">📅 Посещаемость по дням недели</div>
        <div style="height:120px"><canvas id="an-days-chart" style="width:100%;height:100%"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">🏆 Топ промоутеры месяца</div>
        <div id="an-promoters-list" style="font-size:.72rem"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 Заполняемость событий</div>
      <div id="an-fill-table"></div>
    </div>`;

  await anLoad(anMonths);
};

window.anChangeMonths = async function(val) {
  await anLoad(parseInt(val));
};

async function anLoad(months) {
  const data = await SAPI.get('analytics/data?months=' + months);
  if (!data) { toast('Нет данных аналитики'); return; }

  const s = data.summary;

  // Сводка
  document.getElementById('an-income').textContent   = moneyFmt(s.income);
  document.getElementById('an-expense').textContent  = moneyFmt(s.expense);
  document.getElementById('an-profit').textContent   = moneyFmt(s.profit);
  document.getElementById('an-entries').textContent  = s.entries;
  document.getElementById('an-bookings').textContent = s.bookings;

  const fmtDiff = (v) => v > 0 ? `<span style="color:#4caf50">▲ ${v}%</span>` : v < 0 ? `<span style="color:#f44336">▼ ${Math.abs(v)}%</span>` : '';
  document.getElementById('an-income-diff').innerHTML  = fmtDiff(s.income_diff);
  document.getElementById('an-entries-diff').innerHTML = fmtDiff(s.entries_diff);

  // График выручки по месяцам (ручной canvas)
  _anBarChart('an-revenue-chart', data.revenue_by_month, [
    { key:'income',  color:'#00e6c8', label:'Выручка' },
    { key:'expense', color:'#f44336', label:'Расходы' },
  ]);
  document.getElementById('an-revenue-legend').innerHTML =
    '<span style="color:#00e6c8">■ Выручка</span><span style="color:#f44336">■ Расходы</span>';

  // График по дням недели
  _anBarChart('an-days-chart', data.visitors_by_day, [
    { key:'total_entries', color:'#7c6af7', label:'Гости', labelKey:'day_label' }
  ], 'day_label');

  // Топ промоутеры
  const pl = document.getElementById('an-promoters-list');
  if (data.top_promoters?.length) {
    pl.innerHTML = data.top_promoters.map((p, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <span>${['🥇','🥈','🥉','4.','5.'][i]||''} ${esc(p.name)}</span>
        <span style="color:var(--cy);font-weight:700">${p.uses} чел.</span>
      </div>`).join('');
  } else {
    pl.innerHTML = '<div class="empty" style="padding:.75rem 0;font-size:.7rem">Нет данных</div>';
  }

  // Заполняемость
  const ft = document.getElementById('an-fill-table');
  if (data.fill_rate?.length) {
    ft.innerHTML = `<table class="data-table">
      <tr><th>Событие</th><th>Дата</th><th>Вместимость</th><th>Вошло</th><th>%</th></tr>
      ${data.fill_rate.map(r => {
        const pct = r.capacity > 0 ? Math.round(r.actual_entries / r.capacity * 100) : '—';
        const color = typeof pct === 'number' ? (pct >= 80 ? '#4caf50' : pct >= 50 ? '#ffd700' : '#f44336') : 'var(--gl)';
        return `<tr>
          <td class="elp" style="max-width:180px">${esc(r.name)}</td>
          <td>${fmtDate(r.event_date)}</td>
          <td style="color:var(--gl)">${r.capacity || '—'}</td>
          <td>${r.actual_entries}</td>
          <td style="color:${color};font-weight:700">${pct}${typeof pct==='number'?'%':''}</td>
        </tr>`;
      }).join('')}
    </table>`;
  } else {
    ft.innerHTML = '<div class="empty" style="font-size:.7rem;padding:.75rem 0">Нет данных о событиях</div>';
  }
}

function _anBarChart(canvasId, data, series, labelKey = 'month') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data?.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 300;
  const H = canvas.offsetHeight || 160;
  canvas.width = W; canvas.height = H;

  const pad = { top:10, right:10, bottom:28, left:50 };
  const maxVal = Math.max(...data.flatMap(d => series.map(s => Number(d[s.key]||0))), 1);
  const barW = Math.floor((W - pad.left - pad.right) / (data.length * series.length + data.length));
  const groupW = barW * series.length + 4;

  ctx.clearRect(0, 0, W, H);

  // Фон сетки
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (H - pad.top - pad.bottom) * i / 4;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    const val = maxVal * (4-i) / 4;
    ctx.fillText(val >= 1000 ? Math.round(val/1000)+'k' : Math.round(val), pad.left - 4, y + 3);
  }

  // Бары
  data.forEach((d, gi) => {
    const x0 = pad.left + gi * (groupW + 4);
    series.forEach((s, si) => {
      const val = Number(d[s.key]||0);
      const barH = (H - pad.top - pad.bottom) * val / maxVal;
      const x = x0 + si * (barW + 1);
      const y = H - pad.bottom - barH;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barW, barH, [3,3,0,0]) : ctx.rect(x, y, barW, barH);
      ctx.fill();
    });

    // Метка
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const label = d[labelKey] ? String(d[labelKey]).slice(-5) : '';
    ctx.fillText(label, x0 + groupW/2, H - pad.bottom + 12);
  });
}

// ── ПРОМОУТЕРЫ ──────────────────────────────────────────────────
PANEL_RENDERERS.promoters = async (el) => {
  const isPromoter = CU.role === 'promoter';
  if (isPromoter) {
    await _renderMyPromo(el);
  } else {
    await _renderPromoManager(el);
  }
};

async function _renderMyPromo(el) {
  el.innerHTML = `<div class="panel-title">Мой промо-код</div><div id="promo-body"><div class="empty"><div class="empty-icon">⏳</div><p>Загрузка...</p></div></div>`;
  const data = await SAPI.get('promo/my');
  const body = document.getElementById('promo-body');
  if (!data || !data.promos?.length) {
    body.innerHTML = `<div class="empty"><div class="empty-icon">📢</div><p>У вас нет активных промо-кодов.<br>Обратитесь к директору.</p></div>`;
    return;
  }
  body.innerHTML = data.promos.map(p => `
    <div class="card" style="background:linear-gradient(135deg,#0d0d1a,#1a0d2e);border-color:#4a2f7a">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div style="font-family:var(--fm);font-size:1.6rem;font-weight:700;color:var(--cy);letter-spacing:.2em">${esc(p.code)}</div>
        <div style="text-align:right">
          <div style="font-size:1.5rem;font-weight:700;color:var(--w)">${p.uses_this_month}</div>
          <div style="font-size:.55rem;color:var(--gl)">чел. в этом месяце</div>
        </div>
      </div>
      <div class="stats" style="margin:0;grid-template-columns:repeat(3,1fr)">
        <div class="stat-card" style="padding:.75rem"><div class="stat-val" style="font-size:1.3rem">${p.uses_count}</div><div class="stat-lbl">Всего</div></div>
        <div class="stat-card" style="padding:.75rem"><div class="stat-val" style="font-size:1.3rem">${p.uses_this_month}</div><div class="stat-lbl">Месяц</div></div>
        <div class="stat-card" style="padding:.75rem"><div class="stat-val" style="font-size:1.3rem">${p.uses_today||0}</div><div class="stat-lbl">Сегодня</div></div>
      </div>
      ${p.notes ? `<p style="font-size:.65rem;color:var(--gl);margin-top:.75rem">${esc(p.notes)}</p>` : ''}
    </div>`).join('') +
    `<div class="card"><div class="card-title">📋 Последние использования</div>
    <div id="promo-uses-list">` +
    (data.uses?.length
      ? data.uses.map(u => `<div class="entry-log-item"><span>${fmtDateTime(u.created_at)}</span><span style="color:var(--gl)">${u.event_date||'—'}</span></div>`).join('')
      : '<p style="color:var(--gl);font-size:.65rem">Использований пока нет</p>'
    ) + `</div></div>`;
}

async function _renderPromoManager(el) {
  el.innerHTML = `
    <div class="panel-title">Промоутеры
      <div class="actions">
        <button class="btn btn-cy" onclick="openPromoModal(0)">+ Код</button>
      </div>
    </div>
    <div class="stats" id="promo-summary">
      <div class="stat-card"><div class="stat-val" id="ps-total">—</div><div class="stat-lbl">Использований в месяц</div></div>
      <div class="stat-card"><div class="stat-val" id="ps-codes">—</div><div class="stat-lbl">Активных кодов</div></div>
    </div>
    <div class="card"><div class="card-title">🏆 Рейтинг промоутеров (месяц)</div><div id="promo-ranking"></div></div>
    <div class="card"><div class="card-title">🎫 Все промо-коды</div><div id="promo-codes-list"></div></div>
    <div class="modal-overlay" id="promo-modal" onclick="if(event.target===this)closeModal('promo-modal')">
      <div class="modal" style="max-width:400px">
        <div class="modal-header"><span>Промо-код</span><button onclick="closeModal('promo-modal')">✕</button></div>
        <div class="modal-body">
          <input type="hidden" id="pm-id">
          <div class="form-group"><label>Промоутер *</label><select id="pm-promoter" class="form-control"></select></div>
          <div class="form-group"><label>Код (латиница, без пробелов) *</label>
            <div style="display:flex;gap:.5rem">
              <input type="text" id="pm-code" placeholder="PROMO123" style="text-transform:uppercase;flex:1">
              <button class="btn-sm" onclick="autoGenPromoCode()">Авто</button>
            </div>
          </div>
          <div class="form-group"><label>Заметка</label><textarea id="pm-notes" rows="2"></textarea></div>
          <div class="form-group" style="display:flex;align-items:center;gap:.5rem">
            <input type="checkbox" id="pm-active" checked> <label for="pm-active" style="font-size:.75rem;text-transform:none;margin:0">Активен</label>
          </div>
          <div class="form-actions">
            <button class="btn btn-cy" onclick="savePromoModal()">Сохранить</button>
            <button class="btn-out" onclick="closeModal('promo-modal')">Отмена</button>
            <button class="btn-danger" id="pm-del-btn" style="display:none" onclick="deletePromoModal()">Удалить</button>
          </div>
        </div>
      </div>
    </div>`;

  const [stats, codes] = await Promise.all([SAPI.get('promo/stats'), SAPI.get('promos')]);

  if (stats) {
    document.getElementById('ps-total').textContent = stats.total_uses_month;
    document.getElementById('ps-codes').textContent = stats.active_codes;

    const rank = document.getElementById('promo-ranking');
    if (stats.promoters?.length) {
      rank.innerHTML = stats.promoters.map((p, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.04)">
          <div style="display:flex;align-items:center;gap:.5rem">
            <span style="font-size:.85rem">${['🥇','🥈','🥉'][i]||'▸'}</span>
            <div>
              <div style="font-size:.75rem;font-weight:600">${esc(p.name)}</div>
              <div style="font-size:.55rem;color:var(--gl)">${esc(p.codes||'нет кодов')}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.9rem;font-weight:700;color:var(--cy)">${p.uses_month}</div>
            <div style="font-size:.5rem;color:var(--gl)">за месяц</div>
          </div>
        </div>`).join('');
    } else {
      rank.innerHTML = '<div class="empty" style="padding:.75rem 0;font-size:.7rem">Нет данных за этот месяц</div>';
    }
  }

  if (codes) {
    const list = document.getElementById('promo-codes-list');
    list.innerHTML = codes.length
      ? `<table class="data-table">
          <tr><th>Код</th><th>Промоутер</th><th>Месяц</th><th>Всего</th><th>Статус</th><th></th></tr>
          ${codes.map(c => `<tr>
            <td><span style="font-family:var(--fm);font-weight:700;color:var(--cy)">${esc(c.code)}</span></td>
            <td>${esc(c.promoter_name||'—')}</td>
            <td style="font-weight:700">${c.uses_this_month}</td>
            <td>${c.uses_count}</td>
            <td><span class="badge ${c.active ? 'badge-regular' : 'badge-guest'}">${c.active ? 'Активен' : 'Откл.'}</span></td>
            <td><button class="btn-xs" onclick="openPromoModal(${JSON.stringify(c).replace(/"/g,'&quot;')})">✏️</button></td>
          </tr>`).join('')}
        </table>`
      : '<div class="empty" style="font-size:.7rem;padding:1rem 0">Нет промо-кодов. Создайте первый!</div>';
  }
}

let _promoData = null;
async function openPromoModal(data) {
  _promoData = typeof data === 'object' && data ? data : null;
  const id = _promoData?.id || 0;

  // Заполним список промоутеров
  const promoSel = document.getElementById('pm-promoter');
  if (staffCache.length) {
    const promoters = staffCache.filter(s => s.role === 'promoter');
    promoSel.innerHTML = promoters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  document.getElementById('pm-id').value = id;
  document.getElementById('pm-code').value = _promoData?.code || '';
  document.getElementById('pm-notes').value = _promoData?.notes || '';
  document.getElementById('pm-active').checked = _promoData ? !!_promoData.active : true;
  if (_promoData?.promoter_id) promoSel.value = _promoData.promoter_id;
  document.getElementById('pm-del-btn').style.display = id ? 'inline-block' : 'none';
  openModal('promo-modal');
}

async function savePromoModal() {
  const id = parseInt(document.getElementById('pm-id').value)||0;
  const code = document.getElementById('pm-code').value.trim().toUpperCase();
  const promoterId = parseInt(document.getElementById('pm-promoter').value)||0;
  if (!code || !promoterId) { toast('Заполните промо-код и выберите промоутера'); return; }
  const res = await SAPI.post('promo/save', {
    id, code, promoter_id: promoterId,
    notes: document.getElementById('pm-notes').value,
    active: document.getElementById('pm-active').checked ? 1 : 0,
  });
  if (res?.ok) { closeModal('promo-modal'); showPanel('promoters'); toast('Сохранено ✓'); }
  else toast(res?.error || 'Ошибка сохранения');
}

async function deletePromoModal() {
  if (!_promoData?.id || !confirm('Удалить промо-код и всю историю?')) return;
  const res = await SAPI.post('promo/delete', {id: _promoData.id});
  if (res?.ok) { closeModal('promo-modal'); showPanel('promoters'); toast('Удалено'); }
}

async function autoGenPromoCode() {
  const promoterId = parseInt(document.getElementById('pm-promoter').value)||0;
  if (!promoterId) { toast('Сначала выберите промоутера'); return; }
  const res = await SAPI.post('promo/generate', {promoter_id: promoterId});
  if (res?.code) document.getElementById('pm-code').value = res.code;
}

// ── AI CHATBOT ────────────────────────────────────────────────
let aiProvider  = 'groq';
let aiMessages  = [];   // {role:'user'|'assistant', content:'...'}
let aiTyping    = false;

const AI_QUICK = [
  { label:'🎉 Концепция вечеринки', text:'Придумай концепцию пятничной вечеринки на следующий месяц' },
  { label:'📸 Пост Instagram',      text:'Напиши пост для Instagram про ближайшее мероприятие' },
  { label:'✅ Создать задачу',       text:'Создай задачу: сделать афишу для следующей пятницы, срок — 3 дня' },
  { label:'📊 Что нужно сделать',    text:'Что мне нужно сделать сегодня и на этой неделе?' },
  { label:'🎧 Биo для DJ',           text:'Напиши биo для диджея, который играет техно и house' },
  { label:'📝 ТЗ дизайнеру',        text:'Составь ТЗ дизайнеру на создание афиши для субботней вечеринки' },
];

PANEL_RENDERERS.ai = (el) => {
  aiMessages = [];
  el.innerHTML = `
    <style>
      #ai-chat-wrap { display:flex; flex-direction:column; height:calc(100vh - 160px); min-height:400px; }
      #ai-chat-header { display:flex; align-items:center; justify-content:space-between; padding:.5rem 0 .75rem; flex-shrink:0; }
      #ai-messages { flex:1; overflow-y:auto; padding:.25rem 0; display:flex; flex-direction:column; gap:.6rem; }
      .ai-bubble { max-width:85%; padding:.65rem .85rem; border-radius:14px; font-size:.72rem; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
      .ai-bubble.user { background:#1e1b4b; color:#c4b5fd; align-self:flex-end; border-bottom-right-radius:4px; }
      .ai-bubble.assistant { background:#12121a; border:1px solid #222; color:var(--w); align-self:flex-start; border-bottom-left-radius:4px; }
      .ai-bubble.typing { color:var(--gl); font-style:italic; }
      .ai-action-card { background:#0e2a1e; border:1px solid #4caf5055; border-radius:12px; padding:.75rem; margin-top:.4rem; font-size:.68rem; }
      .ai-action-card .act-title { font-weight:700; color:#4caf50; margin-bottom:.4rem; }
      .ai-action-btns { display:flex; gap:.5rem; margin-top:.6rem; }
      #ai-input-row { display:flex; gap:.5rem; padding:.75rem 0 0; flex-shrink:0; align-items:flex-end; }
      #ai-input { flex:1; background:#12121a; border:1px solid #333; color:var(--w); border-radius:10px; padding:.6rem .8rem;
                   font-size:.72rem; font-family:var(--fb); resize:none; max-height:120px; outline:none; line-height:1.5; }
      #ai-input:focus { border-color:#7c6af7; }
      #ai-send-btn { background:#7c6af7; color:#fff; border:none; border-radius:10px; padding:.6rem .9rem; font-size:.8rem;
                      cursor:pointer; flex-shrink:0; transition:filter .15s; height:38px; }
      #ai-send-btn:hover { filter:brightness(1.15); }
      #ai-send-btn:disabled { opacity:.4; cursor:default; }
      .ai-quick-btns { display:flex; gap:.35rem; flex-wrap:wrap; margin-bottom:.6rem; }
      .ai-quick-btn { background:#1a1a2a; border:1px solid #333; color:var(--gl); border-radius:20px; padding:.25rem .6rem;
                       font-size:.6rem; cursor:pointer; transition:all .15s; white-space:nowrap; }
      .ai-quick-btn:hover { border-color:#7c6af7; color:var(--w); }
      .ai-copy-btn { background:none; border:none; color:var(--gl); font-size:.6rem; cursor:pointer; padding:.1rem .3rem;
                      border-radius:4px; opacity:.6; }
      .ai-copy-btn:hover { opacity:1; color:var(--w); }
    </style>
    <div id="ai-chat-wrap">
      <div id="ai-chat-header">
        <div>
          <span style="font-size:.8rem;font-weight:700">🤖 AI Ассистент</span>
          <span style="font-size:.6rem;color:var(--gl);margin-left:.5rem" id="ai-prov-label">Groq</span>
        </div>
        <div style="display:flex;gap:.4rem;align-items:center">
          <select id="ai-prov-sel" onchange="setAiProvider(this.value)"
            style="background:#12121a;border:1px solid #333;color:var(--w);border-radius:8px;padding:.3rem .5rem;font-size:.65rem">
            <option value="groq">⚡ Groq (быстро)</option>
            <option value="gigachat">🧠 GigaChat</option>
          </select>
          <button class="btn-xs" onclick="clearAiChat()">🗑 Очистить</button>
        </div>
      </div>
      <div class="ai-quick-btns">
        ${AI_QUICK.map(q=>`<button class="ai-quick-btn" onclick="aiQuickSend(${JSON.stringify(q.text).replace(/'/g,"\\'")})">${q.label}</button>`).join('')}
      </div>
      <div id="ai-messages">
        <div class="ai-bubble assistant">👋 Привет, ${CU.name}! Я знаю расписание событий и твои задачи. Могу написать тексты, создать задачи или просто помочь с вопросами по клубу.</div>
      </div>
      <div id="ai-input-row">
        <textarea id="ai-input" rows="1" placeholder="Напиши сообщение..."
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAiMessage();}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
        <button id="ai-send-btn" onclick="sendAiMessage()">➤</button>
      </div>
    </div>`;
};

function setAiProvider(val) {
  aiProvider = val;
  const lbl = document.getElementById('ai-prov-label');
  if (lbl) lbl.textContent = val === 'groq' ? 'Groq' : 'GigaChat';
}

function clearAiChat() {
  aiMessages = [];
  const msgs = document.getElementById('ai-messages');
  if (msgs) msgs.innerHTML = `<div class="ai-bubble assistant">Чат очищен. Чем могу помочь?</div>`;
}

function aiQuickSend(text) {
  const input = document.getElementById('ai-input');
  if (input) { input.value = text; input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight,120) + 'px'; }
  sendAiMessage();
}

async function sendAiMessage() {
  if (aiTyping) return;
  const input = document.getElementById('ai-input');
  const text  = input?.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  // Добавить сообщение пользователя
  aiMessages.push({ role: 'user', content: text });
  _aiRenderMessages();

  // Показать typing
  aiTyping = true;
  const sendBtn = document.getElementById('ai-send-btn');
  if (sendBtn) sendBtn.disabled = true;
  _aiAppendBubble('assistant', '...', true);

  const res = await SAPI.post('ai/generate', {
    provider: aiProvider,
    messages: aiMessages,
  });

  // Убрать typing
  const typingEl = document.querySelector('.ai-bubble.typing');
  if (typingEl) typingEl.remove();
  aiTyping = false;
  if (sendBtn) sendBtn.disabled = false;

  if (res?.text) {
    // Убираем action-блок из текста для отображения
    const displayText = res.text.replace(/<<<ACTION[\s\S]*?>>>ACTION/g, '').trim();
    aiMessages.push({ role: 'assistant', content: res.text }); // сохраняем полный для контекста
    _aiAppendBubble('assistant', displayText, false, res.action);
  } else {
    _aiAppendBubble('assistant', res?.error || 'Ошибка. Проверьте API-ключ в настройках.');
  }
}

function _aiRenderMessages() {
  const container = document.getElementById('ai-messages');
  if (!container) return;
  container.innerHTML = aiMessages.map(m => {
    const displayText = m.content.replace(/<<<ACTION[\s\S]*?>>>ACTION/g, '').trim();
    return `<div class="ai-bubble ${m.role}">${_aiEscapeHtml(displayText)}</div>`;
  }).join('');
  _aiScrollBottom();
}

function _aiAppendBubble(role, text, typing = false, action = null) {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'ai-bubble ' + role + (typing ? ' typing' : '');
  div.textContent = text;

  // Кнопка копирования для ассистента
  if (role === 'assistant' && !typing && text.length > 30) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'ai-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Копировать';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(text).then(() => toast('Скопировано ✓')).catch(() => {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        toast('Скопировано ✓');
      });
    };
    div.appendChild(copyBtn);
  }

  // Action card
  if (action && action.type) {
    const card = _aiMakeActionCard(action);
    div.appendChild(card);
  }

  container.appendChild(div);
  _aiScrollBottom();
}

function _aiMakeActionCard(action) {
  const card = document.createElement('div');
  card.className = 'ai-action-card';

  const actionMeta = {
    create_task: { icon: '✅', label: 'Создать задачу' },
    create_event: { icon: '📅', label: 'Создать событие' },
    create_shift: { icon: '🗓', label: 'Создать смену' },
  };
  const meta = actionMeta[action.type] || { icon: '⚡', label: action.type };

  card.innerHTML = `
    <div class="act-title">${meta.icon} ${meta.label}</div>
    ${action.title  ? `<div><b>Название:</b> ${_aiEscapeHtml(action.title)}</div>` : ''}
    ${action.due_date ? `<div><b>Срок:</b> ${action.due_date}</div>` : ''}
    ${action.priority ? `<div><b>Приоритет:</b> ${action.priority}</div>` : ''}
    ${action.note   ? `<div style="color:var(--gl)">${_aiEscapeHtml(action.note)}</div>` : ''}
    <div class="ai-action-btns">
      <button class="btn" style="padding:.4rem .85rem;font-size:.65rem" onclick="aiConfirmAction(this, ${JSON.stringify(action).replace(/"/g,'&quot;')})">✅ Выполнить</button>
      <button class="btn-sm" onclick="this.closest('.ai-action-card').remove()">✕ Отмена</button>
    </div>`;
  return card;
}

async function aiConfirmAction(btn, action) {
  btn.disabled = true;
  btn.textContent = '...';

  let res = null;
  if (action.type === 'create_task') {
    res = await SAPI.post('task/save', {
      title:      action.title || 'Новая задача',
      due_date:   action.due_date || null,
      priority:   action.priority || 'medium',
      note:       action.note || null,
      status:     'todo',
      assigned_to: CU.id,
    });
  } else if (action.type === 'create_event') {
    res = await SAPI.post('event/save', {
      name:       action.title || 'Новое событие',
      event_date: action.due_date || null,
      status:     'planning',
    });
  }

  if (res?.ok) {
    toast(action.type === 'create_task' ? '✅ Задача создана!' : '📅 Событие создано!');
    btn.closest('.ai-action-card').innerHTML = `<div style="color:#4caf50;font-size:.68rem">✅ Выполнено!</div>`;
  } else {
    toast(res?.error || 'Ошибка');
    btn.disabled = false;
    btn.textContent = '✅ Выполнить';
  }
}

function _aiScrollBottom() {
  const c = document.getElementById('ai-messages');
  if (c) c.scrollTop = c.scrollHeight;
}

function _aiEscapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── PROFILE ──
PANEL_RENDERERS.profile = async (el) => {
  el.innerHTML = `
    <div class="panel-title">Профиль</div>
    <div class="profile-header">
      <div class="profile-avatar" id="prof-avatar" onclick="document.getElementById('prof-photo-input').click()">
        ${CU.photo?`<img src="${CU.photo}">`:`<span style="color:var(--cy)">${(CU.name||'?')[0]}</span>`}
      </div>
      <input type="file" id="prof-photo-input" accept="image/*" style="display:none" onchange="uploadProfilePhoto(this)">
      <div>
        <div style="font-size:1rem;font-weight:700">${CU.name}</div>
        <div style="font-size:.58rem;color:var(--gl);margin:.2rem 0">${CU.username||''}</div>
        <span class="rb r-${CU.role}">${ROLE_LABELS[CU.role]||CU.role}</span>
      </div>
    </div>
    <div class="card">
      <h3>Личные данные</h3>
      <label>Имя</label>
      <input type="text" id="prof-name" value="${CU.name||''}">
      <label>Телефон</label>
      <input type="text" id="prof-phone" value="${CU.phone||''}">
      <label>Email</label>
      <input type="email" id="prof-email" value="${CU.email||''}">
      <label>О себе</label>
      <textarea id="prof-bio">${CU.bio||''}</textarea>
      <button class="btn btn-cy" onclick="saveProfile()" style="margin-top:.8rem">Сохранить</button>
    </div>
    <div class="card">
      <h3>Смена пароля</h3>
      <label>Текущий пароль</label>
      <input type="password" id="prof-cur-pw" placeholder="Текущий пароль">
      <label>Новый пароль</label>
      <input type="password" id="prof-new-pw" placeholder="Минимум 6 символов">
      <label>Повторить</label>
      <input type="password" id="prof-new-pw2" placeholder="Повторите новый пароль">
      <button class="btn btn-cy" onclick="changePassword()" style="margin-top:.8rem">Изменить пароль</button>
    </div>
    <div class="card">
      <h3>Telegram привязка</h3>
      ${CU.telegram_id
        ? `<p style="font-size:.65rem;color:#22c55e">✅ Telegram привязан: @${CU.telegram_username||CU.telegram_id}</p>`
        : `<p style="font-size:.6rem;color:var(--gl);margin-bottom:.8rem">Привяжите Telegram аккаунт для получения уведомлений и входа через бота.</p>
           <button class="btn btn-cy" onclick="getTgCode()">Получить код привязки</button>`}
      <div id="tg-code-block" style="display:none"></div>
    </div>`;
};

async function saveProfile() {
  const data = {
    name:  document.getElementById('prof-name').value.trim(),
    phone: document.getElementById('prof-phone').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    bio:   document.getElementById('prof-bio').value,
  };
  const res = await SAPI.post('staff/profile/save', data);
  if (res && res.ok) {
    CU.name = data.name;
    localStorage.setItem('ravez_staff_name', data.name);
    document.getElementById('nav-name').innerHTML =
      `${CU.name} <span class="rb r-${CU.role}">${ROLE_LABELS[CU.role]||CU.role}</span>`;
    toast('Профиль сохранён ✓');
  } else toastErr(res?.error || 'Ошибка сохранения');
}

async function changePassword() {
  const cur  = document.getElementById('prof-cur-pw')?.value;
  const newp = document.getElementById('prof-new-pw')?.value;
  const newp2= document.getElementById('prof-new-pw2')?.value;
  if (!cur || !newp) { toastErr('Заполните все поля'); return; }
  if (newp !== newp2) { toastErr('Пароли не совпадают'); return; }
  if (newp.length < 6) { toastErr('Пароль минимум 6 символов'); return; }
  const res = await SAPI.post('staff/profile/save', { current_password: cur, password: newp });
  if (res && res.ok) {
    document.getElementById('prof-cur-pw').value='';
    document.getElementById('prof-new-pw').value='';
    document.getElementById('prof-new-pw2').value='';
    toast('Пароль изменён ✓');
  } else toastErr(res?.error || 'Ошибка смены пароля');
}

async function uploadProfilePhoto(input) {
  const file = input.files[0]; if (!file) return;
  const b64 = await fileToBase64(file);
  const res = await SAPI.post('staff/profile/save', { photo: b64 });
  if (res && res.ok) {
    CU.photo = b64;
    document.getElementById('prof-avatar').innerHTML = `<img src="${b64}">`;
    toast('Фото обновлено ✓');
  }
}

async function getTgCode() {
  const res = await SAPI.post('staff/telegram-code', {});
  if (!res || !res.code) { toastErr('Ошибка. Проверьте подключение к серверу.'); return; }

  const block = document.getElementById('tg-code-block');
  block.style.display = 'block';
  block.innerHTML = `
    <div class="tg-code-box">
      <span style="font-size:.6rem;color:var(--gl)">Отправьте боту команду:</span>
      <span class="tg-code">${res.code}</span>
      <div class="tg-timer" id="tg-timer">Действителен: <span id="tg-countdown">10:00</span></div>
      <div style="font-size:.58rem;color:var(--gl);margin-top:.5rem"><code style="color:var(--cy)">/link ${res.code}</code></div>
    </div>`;

  let seconds = res.expires_in || 600;
  const interval = setInterval(() => {
    seconds--;
    const m = Math.floor(seconds/60), s = seconds%60;
    const cd = document.getElementById('tg-countdown');
    if (cd) cd.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (seconds <= 0) {
      clearInterval(interval);
      if (cd) cd.closest('.tg-code-box').innerHTML = '<p style="color:#ff5252;font-size:.6rem">Код истёк. Запросите новый.</p>';
    }
  }, 1000);

  // Автопроверка привязки каждые 30 сек
  const checkInterval = setInterval(async () => {
    const me = await SAPI.get('staff/me');
    if (me && me.telegram_id) {
      clearInterval(checkInterval);
      clearInterval(interval);
      CU.telegram_id = me.telegram_id;
      toast('Telegram успешно привязан! ✓');
      showPanel('profile');
    }
  }, 30000);
}

// ── CUSTOM SELECT ──
function csToggle(wrapId) {
  const wrap = document.getElementById(wrapId);
  const list = document.getElementById(wrapId + '-list');
  const disp = document.getElementById(wrapId + '-display');
  const open = list.style.display === 'none';
  // Закрыть все открытые
  document.querySelectorAll('.cs-list').forEach(l => l.style.display = 'none');
  document.querySelectorAll('.cs-val').forEach(v => v.classList.remove('open'));
  if (open) { list.style.display = 'block'; disp.classList.add('open'); }
}
function csPick(wrapId, val, label) {
  document.getElementById(wrapId.replace('-wrap','') || wrapId).value = val;
  // find the hidden input — it's id is the wrap id minus "-wrap"
  const inputId = wrapId.replace('-wrap','');
  const hiddenInput = document.getElementById(inputId);
  if (hiddenInput) hiddenInput.value = val;
  const textEl = document.getElementById(wrapId + '-text');
  if (textEl) { textEl.textContent = label; }
  const disp = document.getElementById(wrapId + '-display');
  if (disp) { disp.classList.remove('placeholder'); disp.classList.remove('open'); }
  document.getElementById(wrapId + '-list').style.display = 'none';
  // пометить выбранный
  document.querySelectorAll('#' + wrapId + '-list .cs-opt').forEach(o => {
    o.classList.toggle('selected', o.dataset.val === val);
  });
}
function csReset(wrapId) {
  const inputId = wrapId.replace('-wrap','');
  const hiddenInput = document.getElementById(inputId);
  if (hiddenInput) hiddenInput.value = '';
  const textEl = document.getElementById(wrapId + '-text');
  if (textEl) { textEl.textContent = '— Выберите должность *'; }
  const disp = document.getElementById(wrapId + '-display');
  if (disp) disp.classList.add('placeholder');
  document.querySelectorAll('#' + wrapId + '-list .cs-opt').forEach(o => o.classList.remove('selected'));
}
// Закрывать при клике вне
document.addEventListener('click', e => {
  if (!e.target.closest('.cs-wrap')) {
    document.querySelectorAll('.cs-list').forEach(l => l.style.display = 'none');
    document.querySelectorAll('.cs-val').forEach(v => v.classList.remove('open'));
  }
});

// ── REGISTRATION ──
function showRegister() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('register-box').style.display = 'block';
}
function showLogin() {
  document.getElementById('register-box').style.display = 'none';
  document.getElementById('login-box').style.display = 'block';
}

async function doStaffRegister() {
  const name  = document.getElementById('r-name').value.trim();
  const login = document.getElementById('r-login').value.trim();
  const pass  = document.getElementById('r-pass').value;
  const phone = document.getElementById('r-phone').value.trim();
  const role  = document.getElementById('r-role').value;
  const errEl = document.getElementById('reg-err');
  const okEl  = document.getElementById('reg-ok');
  const btn   = document.getElementById('reg-btn');

  errEl.style.display = 'none'; okEl.style.display = 'none';
  if (!name || !login || !pass || !role) {
    errEl.textContent = 'Заполните все обязательные поля'; errEl.style.display = 'block'; return;
  }
  btn.textContent = '...'; btn.disabled = true;
  try {
    const res = await fetch(SAPI.base + '?a=staff%2Fregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username: login, password: pass, phone, role })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      okEl.style.display = 'block';
      btn.textContent = 'Заявка отправлена';
      ['r-name','r-login','r-pass','r-phone'].forEach(id => document.getElementById(id).value = '');
      csReset('r-role-wrap');
    } else {
      errEl.textContent = data.error || 'Ошибка отправки'; errEl.style.display = 'block';
      btn.textContent = 'Отправить заявку'; btn.disabled = false;
    }
  } catch(e) {
    errEl.textContent = 'Ошибка сети'; errEl.style.display = 'block';
    btn.textContent = 'Отправить заявку'; btn.disabled = false;
  }
}

// ── TEAM PANEL (управление командой + заявки) ──
PANEL_RENDERERS.team = async (el) => {
  const isOwnerDir = ['owner','director','dev_director','admin'].includes(CU.role);
  el.innerHTML = `
    <div class="panel-title">Команда</div>
    <div style="display:flex;gap:.5rem;margin-bottom:1.2rem;flex-wrap:wrap">
      <button class="btn btn-cy btn-sm" onclick="teamShowTab('members',this)">Сотрудники</button>
      <button class="btn btn-out btn-sm" onclick="teamShowTab('pending',this)">Заявки <span id="pending-badge"></span></button>
      ${isOwnerDir ? '<button class="btn btn-out btn-sm" onclick="openModal(\'add-staff-modal\')">+ Добавить вручную</button>' : ''}
    </div>
    <div id="team-members"></div>
    <div id="team-pending" style="display:none"></div>`;
  await loadTeamMembers();
  await loadTeamPending();
};

async function loadTeamMembers() {
  const el = document.getElementById('team-members'); if (!el) return;
  const data = await SAPI.get('staff/list');
  if (!data) { el.innerHTML = '<p style="color:var(--gl)">Ошибка загрузки</p>'; return; }
  const active = data.filter(s => s.active == 1);
  el.innerHTML = active.length ? active.map(s => `
    <div class="pending-card" style="cursor:pointer" onclick='openStaffDetail(${JSON.stringify(s).replace(/'/g,"&#39;")})'>
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
        ${s.photo ? `<img src="${esc(s.photo)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">` : '👤'}
      </div>
      <div class="pending-info">
        <div class="pending-name">${esc(s.name)} <span class="rb r-${esc(s.role)}">${esc(ROLE_LABELS[s.role]||s.role)}</span></div>
        <div class="pending-meta">${esc(s.username)}${s.phone?' · '+esc(s.phone):''}${s.telegram_id?' · ✈ Telegram':''}</div>
      </div>
      <div style="color:var(--gl);font-size:.75rem;flex-shrink:0">›</div>
    </div>`).join('') : '<p style="color:var(--gl);font-size:.65rem">Нет активных сотрудников</p>';
}

async function loadTeamPending() {
  const el = document.getElementById('team-pending'); if (!el) return;
  const data = await SAPI.get('staff/registrations');
  const badge = document.getElementById('pending-badge');
  if (badge) badge.textContent = data && data.length ? `(${data.length})` : '';
  if (!data || !data.length) {
    el.innerHTML = '<p style="color:var(--gl);font-size:.65rem">Новых заявок нет</p>'; return;
  }
  el.innerHTML = data.map(s => `
    <div class="pending-card" id="pending-${s.id}">
      <div class="pending-info">
        <div class="pending-name">${s.name} <span class="rb r-${s.role}">${ROLE_LABELS[s.role]||s.role}</span></div>
        <div class="pending-meta">${s.username}${s.phone?' · '+s.phone:''} · Подал: ${fmtDate(s.created_at)}</div>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        <button class="btn btn-cy btn-sm" onclick="approveStaff(${s.id})">✓ Принять</button>
        <button class="btn btn-red btn-sm" onclick="rejectStaff(${s.id})">✕ Отклонить</button>
      </div>
    </div>`).join('');
}

function teamShowTab(tab, btn) {
  document.getElementById('team-members').style.display = tab === 'members' ? 'block' : 'none';
  document.getElementById('team-pending').style.display = tab === 'pending' ? 'block' : 'none';
  document.querySelectorAll('.panel-title ~ div .btn').forEach(b => b.classList.remove('btn-cy'));
  btn.classList.add('btn-cy'); btn.classList.remove('btn-out');
}

async function approveStaff(id) {
  const res = await SAPI.post('staff/approve', { id });
  if (res && res.ok) {
    toast('Сотрудник принят ✓');
    document.getElementById(`pending-${id}`)?.remove();
    await loadTeamMembers();
    await loadTeamPending();
  } else toastErr(res?.error || 'Ошибка');
}

async function rejectStaff(id) {
  if (!confirm('Отклонить заявку?')) return;
  const res = await SAPI.post('staff/reject', { id });
  if (res && res.ok) {
    toast('Заявка отклонена');
    document.getElementById(`pending-${id}`)?.remove();
    await loadTeamPending();
  } else toastErr(res?.error || 'Ошибка');
}

async function saveNewStaff() {
  const name     = document.getElementById('as-name').value.trim();
  const role     = document.getElementById('as-role').value;
  const username = document.getElementById('as-username').value.trim();
  const password = document.getElementById('as-password').value;
  const phone    = document.getElementById('as-phone').value.trim();
  const email    = document.getElementById('as-email').value.trim();
  const statusEl = document.getElementById('as-status');

  if (!name || !role || !username || !password) {
    statusEl.textContent = 'Заполните имя, роль, логин и пароль';
    statusEl.style.color = '#f44336';
    return;
  }
  if (password.length < 6) {
    statusEl.textContent = 'Пароль должен быть не менее 6 символов';
    statusEl.style.color = '#f44336';
    return;
  }

  statusEl.textContent = 'Создание...';
  statusEl.style.color = 'var(--gl)';

  const res = await SAPI.post('staff/save', { name, role, username, password, phone, email });
  if (res?.ok) {
    toast('✅ Сотрудник создан');
    closeModal('add-staff-modal');
    // Сброс формы
    ['as-name','as-username','as-password','as-phone','as-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    statusEl.textContent = '';
    await loadStaffCache();
    await loadTeamMembers();
  } else {
    statusEl.textContent = '❌ ' + (res?.error || 'Ошибка создания');
    statusEl.style.color = '#f44336';
  }
}

// ════════════════════════════════════════════════════════
// МОДАЛКА СОТРУДНИКА (детали + редактирование)
// ════════════════════════════════════════════════════════
function openStaffDetail(s) {
  const canEdit = ['owner','director'].includes(CU.role);
  const ava = s.photo
    ? `<img src="${s.photo}">`
    : `<span>${(s.name||'?')[0].toUpperCase()}</span>`;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'staff-detail-modal';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <div class="staff-detail-header">
        <div class="staff-detail-ava">${ava}</div>
        <div class="staff-detail-info">
          <div class="staff-detail-name">${esc(s.name)}</div>
          <div style="margin-bottom:.4rem"><span class="rb r-${s.role}">${ROLE_LABELS[s.role]||s.role}</span>
            <span style="font-size:.55rem;color:${s.active?'#22c55e':'#ff5252'};margin-left:.5rem">${s.active?'● Активен':'● Деактивирован'}</span>
          </div>
          ${s.telegram_id ? `<div class="staff-detail-row">✈ Telegram: @${esc(s.telegram_username||'привязан')}</div>` : '<div class="staff-detail-row" style="color:#f97316">⚠ Telegram не привязан</div>'}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem">
        ${s.phone ? `<div class="staff-detail-row">📞 ${esc(s.phone)}</div>` : ''}
        ${s.email ? `<div class="staff-detail-row">✉ ${esc(s.email)}</div>` : ''}
        <div class="staff-detail-row">🪪 @${esc(s.username)}</div>
        <div class="staff-detail-row">📅 С ${fmtDate(s.created_at)}</div>
      </div>
      ${s.bio ? `<div style="font-size:.65rem;color:var(--gl);margin-bottom:1rem;padding:.7rem;background:var(--card);border-radius:8px">${esc(s.bio)}</div>` : ''}
      ${canEdit ? `
      <div style="border-top:1px solid var(--cb);padding-top:.8rem;margin-top:.3rem">
        <div style="font-size:.48rem;color:var(--cy);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem">Управление</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-out btn-sm" onclick="quickEditRole(${s.id},'${s.role}')">Изменить роль</button>
          <button class="btn ${s.active?'btn-red':'btn-cy'} btn-sm" onclick="toggleStaffActive(${s.id},${s.active?0:1})">${s.active?'Деактивировать':'Активировать'}</button>
        </div>
      </div>` : ''}
      <div class="modal-footer" style="margin-top:1rem">
        <button class="btn btn-out" onclick="document.getElementById('staff-detail-modal').remove()">Закрыть</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function toggleStaffActive(id, active) {
  const res = await SAPI.post('staff/save', { id, active });
  if (res?.ok) {
    document.getElementById('staff-detail-modal')?.remove();
    toast(active ? 'Сотрудник активирован' : 'Сотрудник деактивирован');
    showPanel('team');
  } else toastErr(res?.error || 'Ошибка');
}

function quickEditRole(id, currentRole) {
  const roles = Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner');
  const select = roles.map(([v,l]) => `<option value="${v}" ${v===currentRole?'selected':''}>${l}</option>`).join('');
  const html = `<div style="padding:.5rem 0">
    <span class="modal-label">Новая роль</span>
    <select class="modal-select" id="qe-role">${select}</select>
    <div class="modal-footer" style="margin-top:.8rem">
      <button class="btn btn-cy" onclick="saveQuickRole(${id})">Сохранить</button>
      <button class="btn btn-out" onclick="document.getElementById('qe-modal').remove()">Отмена</button>
    </div>
  </div>`;
  const m = document.createElement('div');
  m.className = 'modal-overlay open'; m.id = 'qe-modal';
  m.onclick = e => { if(e.target===m) m.remove(); };
  m.innerHTML = `<div class="modal-box" style="max-width:320px"><h3>Изменить роль</h3>${html}</div>`;
  document.body.appendChild(m);
}

async function saveQuickRole(id) {
  const role = document.getElementById('qe-role').value;
  const res  = await SAPI.post('staff/save', { id, role });
  if (res?.ok) {
    document.getElementById('qe-modal')?.remove();
    document.getElementById('staff-detail-modal')?.remove();
    toast('Роль обновлена ✓');
    showPanel('team');
  } else toastErr(res?.error || 'Ошибка');
}

// ════════════════════════════════════════════════════════
// УВЕДОМЛЕНИЯ
// ════════════════════════════════════════════════════════
const NOTIF_ICONS = { task:'📋', shift:'🗓', finance:'💰', thursday:'🌙', team:'👥', system:'📣' };

PANEL_RENDERERS.notifications = async (el) => {
  const data = await SAPI.get('notifications?limit=50');
  el.innerHTML = `
    <div class="panel-title">Уведомления
      <div class="actions">
        <button class="btn btn-out btn-sm" onclick="markAllRead()">Всё прочитано</button>
      </div>
    </div>
    <div id="notif-list"></div>`;

  if (!data || !data.items?.length) {
    document.getElementById('notif-list').innerHTML =
      '<div class="empty"><div class="empty-icon">🔔</div><p>Нет уведомлений</p></div>';
    return;
  }
  document.getElementById('notif-list').innerHTML = data.items.map(n => `
    <div class="notif-item ${n.is_read?'':'unread'}" onclick="readNotif(${n.id},'${n.link||''}',this)">
      <div class="notif-icon">${NOTIF_ICONS[n.type]||'📣'}</div>
      <div class="notif-body">
        <div class="notif-title">${esc(n.title)}</div>
        ${n.body ? `<div class="notif-text">${esc(n.body)}</div>` : ''}
        <div class="notif-time">${fmtDateTime(n.created_at)}</div>
      </div>
    </div>`).join('');
};

async function readNotif(id, link, el) {
  if (!el.classList.contains('unread')) {
    if (link) { showPanel(link); return; }
    return;
  }
  await SAPI.post('notifications/read', { id });
  el.classList.remove('unread');
  updateNotifBadge();
  if (link) showPanel(link);
}

async function markAllRead() {
  await SAPI.post('notifications/read-all', {});
  toast('Все прочитаны ✓');
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  updateNotifBadge(0);
}

async function updateNotifBadge(count = null) {
  const dot = document.getElementById('notif-count');
  if (!dot) return;
  if (count === null) {
    const data = await SAPI.get('notifications?limit=1');
    count = data?.unread || 0;
  }
  dot.textContent = count > 9 ? '9+' : count;
  dot.style.display = count > 0 ? 'flex' : 'none';
}

// ════════════════════════════════════════════════════════
// СМЕНЫ
// ════════════════════════════════════════════════════════
const SHIFT_STATUS_LABELS = {
  planned:'Запланировано', scheduled:'Запланировано', confirmed:'Подтверждено',
  completed:'Отработано', absent:'Не вышел', cancelled:'Отменено'
};
const FINANCE_CAT_LABELS = {
  entry:'Вход', bar:'Бар', booking:'Бронирование', private_event:'Приватное мероприятие',
  sponsorship:'Спонсорство', other_income:'Прочие доходы',
  salary:'Зарплата', rent:'Аренда', equipment:'Оборудование', marketing:'Маркетинг',
  alcohol:'Алкоголь', food:'Еда', utilities:'Коммунальные', taxes:'Налоги', other_expense:'Прочие расходы'
};

PANEL_RENDERERS.shifts = async (el) => {
  const canManage = ['owner','director','admin'].includes(CU.role);
  const today = new Date().toISOString().split('T')[0];
  // Для менеджеров — все смены, для остальных — свои
  const path = canManage ? 'shifts' : 'shifts/my';
  const data = await SAPI.get(path + '?from=' + _monthStart() + '&to=' + today);

  el.innerHTML = `
    <div class="panel-title">Смены
      <div class="actions">
        ${canManage ? `<button class="btn btn-cy btn-sm" onclick="openShiftModal()">+ Добавить</button>` : ''}
      </div>
    </div>
    <div id="shifts-list"></div>
    <div class="modal-overlay" id="shift-modal" onclick="if(event.target===this)closeModal('shift-modal')">
      <div class="modal-box">
        <h3>Смена</h3>
        <input type="hidden" id="sm-id">
        <span class="modal-label">Сотрудник *</span>
        <select class="modal-select" id="sm-staff">
          ${staffCache.map(s=>`<option value="${s.id}">${s.name} (${ROLE_LABELS[s.role]||s.role})</option>`).join('')}
        </select>
        <div class="row2">
          <div><span class="modal-label">Дата *</span><input class="modal-input" type="date" id="sm-date"></div>
          <div><span class="modal-label">Роль</span><input class="modal-input" type="text" id="sm-role-label" placeholder="Напр.: бармен смена 1"></div>
        </div>
        <div class="row2">
          <div><span class="modal-label">Начало</span><input class="modal-input" type="time" id="sm-start"></div>
          <div><span class="modal-label">Конец</span><input class="modal-input" type="time" id="sm-end"></div>
        </div>
        <span class="modal-label">Статус</span>
        <select class="modal-select" id="sm-status">
          <option value="planned">Запланировано</option>
          <option value="confirmed">Подтверждено</option>
          <option value="completed">Отработано</option>
          <option value="absent">Не вышел</option>
          <option value="cancelled">Отменено</option>
        </select>
        <span class="modal-label">Заметка</span>
        <textarea class="modal-textarea" id="sm-note" rows="2"></textarea>
        <div class="modal-footer">
          <button class="btn btn-cy" onclick="saveShiftModal()">Сохранить</button>
          <button class="btn btn-out" onclick="closeModal('shift-modal')">Отмена</button>
          <button class="btn btn-red" id="sm-delete-btn" style="display:none" onclick="deleteShiftFromModal()">Удалить</button>
        </div>
      </div>
    </div>`;

  renderShiftsList(data || []);
};

function renderShiftsList(shifts) {
  const el = document.getElementById('shifts-list'); if (!el) return;
  if (!shifts.length) {
    el.innerHTML = emptyState('🗓', 'Нет смен за период',
      ['owner','director','admin'].includes(CU.role) ? '+ Добавить смену' : null,
      "openShiftModal()");
    return;
  }
  const canEdit = ['owner','director','admin'].includes(CU.role);
  el.innerHTML = `<div class="card" style="padding:.5rem 0">` +
    shifts.map(s => `
    <div class="shift-row" ${canEdit ? `onclick="openShiftModal(${JSON.stringify(s).replace(/"/g,'&quot;')})"` : ''}>
      <span class="shift-date">${fmtDate(s.event_date)}</span>
      <span class="shift-who">${esc(s.staff_name||'—')} <span class="rb r-${s.staff_role||''}">${ROLE_LABELS[s.staff_role]||''}</span></span>
      <span class="shift-time">${s.time_start||'—'} – ${s.time_end||'—'}</span>
      ${s.role_label?`<span style="font-size:.55rem;color:var(--gl)">${esc(s.role_label)}</span>`:''}
      ${chip(s.status, SHIFT_STATUS_LABELS[s.status]||s.status)}
    </div>`).join('') + `</div>`;
}

function openShiftModal(shift = null) {
  document.getElementById('sm-id').value = shift ? shift.id : '';
  document.getElementById('sm-date').value = shift ? shift.event_date : new Date().toISOString().split('T')[0];
  document.getElementById('sm-start').value = shift ? (shift.time_start||'') : '';
  document.getElementById('sm-end').value = shift ? (shift.time_end||'') : '';
  document.getElementById('sm-role-label').value = shift ? (shift.role_label||'') : '';
  document.getElementById('sm-note').value = shift ? (shift.note||'') : '';
  document.getElementById('sm-status').value = shift ? (shift.status === 'scheduled' ? 'planned' : shift.status) : 'planned';
  if (shift && shift.staff_id) document.getElementById('sm-staff').value = shift.staff_id;
  document.getElementById('sm-delete-btn').style.display = shift ? '' : 'none';
  openModal('shift-modal');
}

async function saveShiftModal() {
  const id = parseInt(document.getElementById('sm-id').value)||0;
  const res = await SAPI.post('shift/save', {
    id: id||undefined,
    staff_id: parseInt(document.getElementById('sm-staff').value),
    event_date: document.getElementById('sm-date').value,
    time_start: document.getElementById('sm-start').value||null,
    time_end:   document.getElementById('sm-end').value||null,
    role_label: document.getElementById('sm-role-label').value||null,
    status:     document.getElementById('sm-status').value,
    note:       document.getElementById('sm-note').value||null,
  });
  if (res?.ok) { closeModal('shift-modal'); toast('Смена сохранена ✓'); showPanel('shifts'); }
  else toastErr(res?.error || 'Ошибка');
}

async function deleteShiftFromModal() {
  const id = parseInt(document.getElementById('sm-id').value);
  if (!id || !confirm('Удалить смену?')) return;
  const res = await SAPI.post('shift/delete', { id });
  if (res?.ok) { closeModal('shift-modal'); toast('Смена удалена'); showPanel('shifts'); }
  else toastErr(res?.error || 'Ошибка');
}


// ════════════════════════════════════════════════════════
// ФИНАНСЫ
// ════════════════════════════════════════════════════════
PANEL_RENDERERS.finances = async (el) => {
  const canManage = ['owner','director','accountant'].includes(CU.role);
  const summary = await SAPI.get('finances/summary?from=' + _monthStart() + '&to=' + new Date().toISOString().split('T')[0]);
  const list    = await SAPI.get('finances?from=' + _monthStart());

  const s = summary || { income:0, expense:0, profit:0 };
  el.innerHTML = `
    <div class="panel-title">Финансы
      <div class="actions">
        ${canManage ? `<button class="btn btn-cy btn-sm" onclick="openFinanceModal()">+ Запись</button>` : ''}
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:1.2rem">
      <div class="stat-card"><div class="stat-val">${moneyFmt(s.income)}</div><div class="stat-lbl">Доходы за месяц</div></div>
      <div class="stat-card"><div class="stat-val">${moneyFmt(s.expense)}</div><div class="stat-lbl">Расходы за месяц</div></div>
      <div class="stat-card"><div class="stat-val ${s.profit>=0?'profit-positive':'profit-negative'}">${moneyFmt(s.profit)}</div><div class="stat-lbl">Прибыль</div></div>
    </div>
    <div id="finances-list"></div>
    <div class="modal-overlay" id="finance-modal" onclick="if(event.target===this)closeModal('finance-modal')">
      <div class="modal-box">
        <h3>Финансовая запись</h3>
        <input type="hidden" id="fm-id">
        <div class="row2">
          <div>
            <span class="modal-label">Тип *</span>
            <select class="modal-select" id="fm-type" onchange="updateFinCats()">
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
          <div>
            <span class="modal-label">Категория *</span>
            <select class="modal-select" id="fm-category"></select>
          </div>
        </div>
        <div class="row2">
          <div><span class="modal-label">Сумма (₽) *</span><input class="modal-input" type="number" id="fm-amount" placeholder="0"></div>
          <div><span class="modal-label">Дата *</span><input class="modal-input" type="date" id="fm-date"></div>
        </div>
        <span class="modal-label">Описание</span>
        <input class="modal-input" type="text" id="fm-desc" placeholder="Пояснение...">
        <div class="modal-footer">
          <button class="btn btn-cy" onclick="saveFinanceModal()">Сохранить</button>
          <button class="btn btn-out" onclick="closeModal('finance-modal')">Отмена</button>
          <button class="btn btn-red" id="fm-delete-btn" style="display:none" onclick="deleteFinanceModal()">Удалить</button>
        </div>
      </div>
    </div>`;

  const rows = list || [];
  const listEl = document.getElementById('finances-list');
  if (!rows.length) { listEl.innerHTML = '<div class="empty"><div class="empty-icon">💰</div><p>Нет записей за месяц</p></div>'; return; }
  listEl.innerHTML = rows.map(f => `
    <div class="fin-row fin-type-${f.type}" ${canManage ? `onclick="openFinanceModal(${JSON.stringify(f).replace(/"/g,'&quot;')})"` : ''} style="cursor:${canManage?'pointer':'default'}">
      <span class="fin-date">${fmtDate(f.date)}</span>
      <span class="fin-cat">${FINANCE_CAT_LABELS[f.category]||f.category}</span>
      <span class="fin-desc">${f.description||'—'}</span>
      <span class="fin-amount ${f.type==='income'?'profit-positive':'profit-negative'}">${f.type==='income'?'+':'-'}${moneyFmt(f.amount)}</span>
    </div>`).join('');

  updateFinCats();
};

const FIN_CATS = {
  income:  ['entry','bar','booking','private_event','sponsorship','other_income'],
  expense: ['salary','rent','equipment','marketing','alcohol','food','utilities','taxes','other_expense']
};

function updateFinCats() {
  const type = document.getElementById('fm-type')?.value || 'income';
  const sel  = document.getElementById('fm-category'); if (!sel) return;
  sel.innerHTML = FIN_CATS[type].map(c => `<option value="${c}">${FINANCE_CAT_LABELS[c]||c}</option>`).join('');
}

function openFinanceModal(fin = null) {
  document.getElementById('fm-id').value = fin ? fin.id : '';
  document.getElementById('fm-type').value = fin ? fin.type : 'income';
  updateFinCats();
  document.getElementById('fm-category').value = fin ? fin.category : '';
  document.getElementById('fm-amount').value = fin ? fin.amount : '';
  document.getElementById('fm-date').value = fin ? fin.date : new Date().toISOString().split('T')[0];
  document.getElementById('fm-desc').value = fin ? (fin.description||'') : '';
  document.getElementById('fm-delete-btn').style.display = fin ? '' : 'none';
  openModal('finance-modal');
}

async function saveFinanceModal() {
  const id = parseInt(document.getElementById('fm-id').value)||0;
  const res = await SAPI.post('finance/save', {
    id: id||undefined,
    type:        document.getElementById('fm-type').value,
    category:    document.getElementById('fm-category').value,
    amount:      parseFloat(document.getElementById('fm-amount').value),
    date:        document.getElementById('fm-date').value,
    description: document.getElementById('fm-desc').value||null,
  });
  if (res?.ok) { closeModal('finance-modal'); toast('Запись сохранена ✓'); showPanel('finances'); }
  else toastErr(res?.error || 'Ошибка');
}

async function deleteFinanceModal() {
  const id = parseInt(document.getElementById('fm-id').value);
  if (!id || !confirm('Удалить запись?')) return;
  const res = await SAPI.post('finance/delete', { id });
  if (res?.ok) { closeModal('finance-modal'); toast('Удалено'); showPanel('finances'); }
  else toastErr(res?.error || 'Ошибка');
}

// ════════════════════════════════════════════════════════
// ЧЕТВЕРГИ
// ════════════════════════════════════════════════════════
PANEL_RENDERERS.thursdays = async (el) => {
  const canManage = ['owner','director','dev_director','art_director'].includes(CU.role);
  const data = await SAPI.get('thursdays?from=' + _monthStart(-3));

  el.innerHTML = `
    <div class="panel-title">Четверги
      <div class="actions">
        ${canManage ? `<button class="btn btn-cy btn-sm" onclick="openThuModal()">+ Четверг</button>` : ''}
      </div>
    </div>
    <div id="thu-list"></div>
    <div class="modal-overlay" id="thu-modal" onclick="if(event.target===this)closeModal('thu-modal')">
      <div class="modal-box">
        <h3 id="thu-modal-title">Четверг</h3>
        <input type="hidden" id="thm-id">
        <span class="modal-label">Дата *</span>
        <input class="modal-input" type="date" id="thm-date">
        <span class="modal-label">Тема</span>
        <input class="modal-input" type="text" id="thm-theme" placeholder="Напр.: R&B Night">
        <span class="modal-label">Концепция</span>
        <textarea class="modal-textarea" id="thm-concept" rows="2"></textarea>
        <span class="modal-label">DJ</span>
        <select class="modal-select" id="thm-dj">
          <option value="">— Без DJ —</option>
          ${(window._djsCache||[]).map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
        <span class="modal-label">Статус</span>
        <select class="modal-select" id="thm-status">
          <option value="planned">Запланировано</option>
          <option value="done">Проведено</option>
          <option value="cancelled">Отменено</option>
        </select>
        <div id="thu-report-section" style="display:none">
          <div style="border-top:1px solid var(--cb);margin:.8rem 0;padding-top:.8rem">
            <span style="font-size:.55rem;color:var(--cy);text-transform:uppercase;letter-spacing:.08em">Итоги вечера</span>
          </div>
          <div class="row2">
            <div><span class="modal-label">Гостей</span><input class="modal-input" type="number" id="thm-count" placeholder="0"></div>
            <div><span class="modal-label">Выручка вход (₽)</span><input class="modal-input" type="number" id="thm-revenue" placeholder="0"></div>
          </div>
          <span class="modal-label">Выручка бар (₽)</span>
          <input class="modal-input" type="number" id="thm-bar" placeholder="0">
        </div>
        <span class="modal-label">Заметки</span>
        <textarea class="modal-textarea" id="thm-notes" rows="2"></textarea>
        <div class="modal-footer">
          <button class="btn btn-cy" onclick="saveThuModal()">Сохранить</button>
          <button class="btn btn-out" onclick="closeModal('thu-modal')">Отмена</button>
          <button class="btn btn-red" id="thm-delete-btn" style="display:none" onclick="deleteThuModal()">Удалить</button>
        </div>
      </div>
    </div>`;

  // Загружаем DJ если нет кэша
  if (!window._djsCache) {
    const djs = await SAPI.get('djs');
    window._djsCache = djs || [];
    document.getElementById('thm-dj').innerHTML = `<option value="">— Без DJ —</option>` +
      (window._djsCache).map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
  }

  const listEl = document.getElementById('thu-list');
  if (!data || !data.length) { listEl.innerHTML = '<div class="empty"><div class="empty-icon">🌙</div><p>Нет четвергов за период</p></div>'; return; }
  listEl.innerHTML = data.map(t => `
    <div class="thu-card" onclick="openThuModal(${JSON.stringify(t).replace(/"/g,'&quot;')})">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="thu-date">${fmtDate(t.date)}</span>
        <span class="thu-status thu-${t.status}">${{planned:'Запланировано',done:'Проведено',cancelled:'Отменено'}[t.status]||t.status}</span>
      </div>
      ${t.theme?`<div class="thu-theme">${t.theme}${t.dj_name?' · DJ '+t.dj_name:''}</div>`:''}
      <div class="thu-stats">
        <span>Гостей: <b>${t.entry_count||0}</b></span>
        <span>Вход: <b>${moneyFmt(t.revenue)}</b></span>
        <span>Бар: <b>${moneyFmt(t.bar_revenue)}</b></span>
      </div>
    </div>`).join('');
};

function openThuModal(thu = null) {
  document.getElementById('thm-id').value      = thu ? thu.id : '';
  document.getElementById('thm-date').value    = thu ? thu.date : _nextThursday();
  document.getElementById('thm-theme').value   = thu ? (thu.theme||'') : '';
  document.getElementById('thm-concept').value = thu ? (thu.concept||'') : '';
  document.getElementById('thm-dj').value      = thu ? (thu.dj_id||'') : '';
  document.getElementById('thm-status').value  = thu ? thu.status : 'planned';
  document.getElementById('thm-notes').value   = thu ? (thu.notes||'') : '';
  document.getElementById('thm-count').value   = thu ? (thu.entry_count||'') : '';
  document.getElementById('thm-revenue').value = thu ? (thu.revenue||'') : '';
  document.getElementById('thm-bar').value     = thu ? (thu.bar_revenue||'') : '';
  document.getElementById('thu-report-section').style.display = thu ? '' : 'none';
  document.getElementById('thm-delete-btn').style.display = thu ? '' : 'none';
  document.getElementById('thu-modal-title').textContent = thu ? 'Четверг ' + fmtDate(thu.date) : 'Новый четверг';
  openModal('thu-modal');
}

async function saveThuModal() {
  const id = parseInt(document.getElementById('thm-id').value)||0;
  const status = document.getElementById('thm-status').value;

  if (id && status === 'done') {
    // Сохраняем основные данные
    await SAPI.post('thursday/save', {
      id, date: document.getElementById('thm-date').value,
      theme: document.getElementById('thm-theme').value||null,
      concept: document.getElementById('thm-concept').value||null,
      dj_id: document.getElementById('thm-dj').value||null,
      status, notes: document.getElementById('thm-notes').value||null,
    });
    // Сохраняем итоги
    const res = await SAPI.post('thursday/report', {
      id,
      entry_count: parseInt(document.getElementById('thm-count').value)||0,
      revenue:     parseInt(document.getElementById('thm-revenue').value)||0,
      bar_revenue: parseInt(document.getElementById('thm-bar').value)||0,
      notes:       document.getElementById('thm-notes').value||null,
    });
    if (res?.ok) { closeModal('thu-modal'); toast('Итоги сохранены ✓'); showPanel('thursdays'); }
    else toastErr(res?.error || 'Ошибка');
  } else {
    const res = await SAPI.post('thursday/save', {
      id: id||undefined,
      date:    document.getElementById('thm-date').value,
      theme:   document.getElementById('thm-theme').value||null,
      concept: document.getElementById('thm-concept').value||null,
      dj_id:   document.getElementById('thm-dj').value||null,
      status,
      notes:   document.getElementById('thm-notes').value||null,
    });
    if (res?.ok) { closeModal('thu-modal'); toast('Сохранено ✓'); showPanel('thursdays'); }
    else toastErr(res?.error || 'Ошибка');
  }
}

async function deleteThuModal() {
  const id = parseInt(document.getElementById('thm-id').value);
  if (!id || !confirm('Удалить четверг?')) return;
  const res = await SAPI.post('thursday/delete', { id });
  if (res?.ok) { closeModal('thu-modal'); toast('Удалено'); showPanel('thursdays'); }
  else toastErr(res?.error || 'Ошибка');
}

function _nextThursday() {
  const d = new Date();
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().split('T')[0];
}

function _monthStart(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

// ════════════════════════════════════════════════════════
// МАТРИЦА ПРАВ
// ════════════════════════════════════════════════════════
const PERM_MODULE_LABELS = {
  dashboard:'Дашборд', bookings:'Брони', entry:'Вход', djs:'Диджеи',
  events:'События', party:'Вечеринки', tasks:'Задачи', content:'Контент',
  analytics:'Аналитика', team:'Команда', ai:'AI', shifts:'Смены',
  finances:'Финансы', thursdays:'Четверги', permissions:'Права доступа', profile:'Профиль',
  guests:'Гости CRM', salary:'Зарплаты', loyalty:'Лояльность'
};

PANEL_RENDERERS.permissions = async (el) => {
  el.innerHTML = `<div class="panel-title">Матрица прав доступа</div>
    <p style="font-size:.6rem;color:var(--gl);margin-bottom:1rem">Настройте какие роли имеют доступ к каждому модулю. Изменения применяются сразу.</p>
    <div id="perm-loading" style="color:var(--gl);font-size:.65rem">Загрузка...</div>
    <div id="perm-content"></div>`;

  const data = await SAPI.get('permissions/all');
  document.getElementById('perm-loading').style.display = 'none';
  if (!data) { document.getElementById('perm-content').innerHTML = '<p style="color:#ff5252">Ошибка загрузки</p>'; return; }

  const { matrix, modules, actions, roles } = data;
  // Отображаем только роли начиная с director (owner всегда имеет всё)
  const displayRoles = roles.filter(r => r !== 'owner');
  const shortRoles = { director:'Дир', dev_director:'Дев дир', art_director:'Арт дир',
    admin:'Адм', hostess:'Хостес', dj:'DJ', smm:'СММ', designer:'Дизайнер',
    ambassador:'Амб', bartender:'Бармен', security:'Охр', promoter:'Промо',
    stories_maker:'Стори', accountant:'Бух' };

  const contentEl = document.getElementById('perm-content');
  let html = `<div class="perm-table-wrap"><table class="perm-table">
    <thead><tr><th>Модуль / Действие</th>${displayRoles.map(r=>`<th title="${ROLE_LABELS[r]||r}">${shortRoles[r]||r}</th>`).join('')}</tr></thead>
    <tbody>`;

  for (const mod of modules) {
    for (const action of actions) {
      const actionLabel = action === 'access' ? '👁 просмотр' : '✏️ управление';
      html += `<tr>
        <td><b>${PERM_MODULE_LABELS[mod]||mod}</b> — ${actionLabel}</td>`;
      for (const role of displayRoles) {
        const checked = matrix[mod]?.[action]?.[role] ? 'checked' : '';
        html += `<td><input type="checkbox" class="perm-check" ${checked}
          data-role="${role}" data-module="${mod}" data-action="${action}"
          onchange="togglePerm(this)"></td>`;
      }
      html += `</tr>`;
    }
  }
  html += `</tbody></table></div>`;
  contentEl.innerHTML = html;
};

async function togglePerm(el) {
  const { role, module: mod, action } = el.dataset;
  const allowed = el.checked;
  const res = await SAPI.post('permissions/save', { role, module: mod, action, allowed });
  if (res?.ok) {
    toast(`${PERM_MODULE_LABELS[mod]||mod} — ${ROLE_LABELS[role]||role} ${allowed?'✓':'✕'}`);
  } else {
    el.checked = !allowed; // откатить чекбокс
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

// ── GUESTS CRM ────────────────────────────────────────────────
PANEL_RENDERERS.guests = async (el) => {
  el.innerHTML = `
    <div class="panel-title">Гости <button class="btn-sm" onclick="openGuestForm(0)" style="float:right">＋ Добавить</button></div>
    <div style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap">
      <input id="guest-search" placeholder="🔍 Имя, телефон, Instagram..." style="flex:1;min-width:160px"
        oninput="debounce(loadGuests,400)()" />
      <select id="guest-tier-filter" onchange="loadGuests()">
        <option value="">Все тиры</option>
        <option value="guest">Guest</option>
        <option value="regular">Regular</option>
        <option value="vip">VIP</option>
        <option value="platinum">Platinum</option>
      </select>
      <select id="guest-bl-filter" onchange="loadGuests()">
        <option value="">Все</option>
        <option value="0">Активные</option>
        <option value="1">Чёрный список</option>
      </select>
    </div>
    <div id="guest-stats-bar" style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap"></div>
    <div id="guest-list"></div>`;

  loadGuestsStats();
  loadGuests();
};

let _guestDebTimer;
function debounce(fn, ms) { return (...args) => { clearTimeout(_guestDebTimer); _guestDebTimer = setTimeout(()=>fn(...args), ms); }; }

async function loadGuestsStats() {
  const s = await SAPI.get('guests/stats');
  if (!s) return;
  const bar = document.getElementById('guest-stats-bar');
  if (!bar) return;
  bar.innerHTML = [
    {label:'Всего', val:s.total, col:'#7c6af7'},
    {label:'VIP/Platinum', val:s.vip, col:'#ffd700'},
    {label:'Новых/мес', val:s.new_this_month, col:'#4caf50'},
    {label:'Blacklist', val:s.blacklisted, col:'#f44336'},
  ].map(x=>`<div style="background:${x.col}22;border:1px solid ${x.col}55;border-radius:8px;padding:.35rem .6rem;font-size:.65rem">
    <div style="font-size:.85rem;font-weight:700;color:${x.col}">${x.val}</div>
    <div style="color:var(--gl)">${x.label}</div>
  </div>`).join('');
}

async function loadGuests() {
  const q   = document.getElementById('guest-search')?.value.trim() || '';
  const tier = document.getElementById('guest-tier-filter')?.value || '';
  const bl  = document.getElementById('guest-bl-filter')?.value;
  const params = new URLSearchParams({limit:50});
  if (q)    params.set('q', q);
  if (tier) params.set('tier', tier);
  if (bl !== '' && bl !== undefined) params.set('blacklisted', bl);
  const data = await SAPI.get('guests?' + params.toString());
  const el = document.getElementById('guest-list');
  if (!el) return;
  if (!data?.guests?.length) {
    el.innerHTML = emptyState('🪪', 'Гостей не найдено', '+ Добавить гостя', "openGuestForm(0)");
    return;
  }

  const tierColor = {guest:'#aaa', regular:'#7c6af7', vip:'#ffd700', platinum:'#e040fb'};
  const tierIcon  = {guest:'👤', regular:'⭐', vip:'💎', platinum:'👑'};
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Имя</th><th>Телефон</th><th>Тир</th><th>Визитов</th><th>Потрачено</th><th>Действия</th></tr></thead>
    <tbody>${data.guests.map(g=>`<tr style="${g.blacklisted?'opacity:.5':''}">
      <td><b>${esc(g.name)}</b>${g.blacklisted?' <span style="color:#f44336;font-size:.6rem">&#x26D4;</span>':''}</td>
      <td style="font-size:.65rem">${g.phone||'—'}</td>
      <td><span style="color:${tierColor[g.loyalty_tier]||'#aaa'}">${tierIcon[g.loyalty_tier]||'👤'} ${g.loyalty_tier||'guest'}</span></td>
      <td style="text-align:center">${g.total_visits||0}</td>
      <td>${moneyFmt(g.total_spent)}</td>
      <td>
        <button class="btn-xs" onclick="openGuestDetail(${g.id})">Карточка</button>
        <button class="btn-xs" onclick="openGuestForm(${g.id})">✏️</button>
      </td>
    </tr>`).join('')}</tbody>
  </table>
  <div style="font-size:.6rem;color:var(--gl);margin-top:.5rem">Показано ${data.guests.length} из ${data.total}</div>`;
}

async function openGuestDetail(id) {
  const data = await SAPI.get('guest/get?id=' + id);
  if (!data || data.error) { toast('Ошибка загрузки'); return; }
  const tierColor = {guest:'#aaa', regular:'#7c6af7', vip:'#ffd700', platinum:'#e040fb'};
  const tierIcon  = {guest:'👤', regular:'⭐', vip:'💎', platinum:'👑'};
  document.getElementById('gd-title').textContent = data.name;
  document.getElementById('guest-detail-body').innerHTML = `
    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <div style="flex:1;min-width:180px">
        <div style="font-size:1.2rem;font-weight:700;color:${tierColor[data.loyalty_tier]}">${tierIcon[data.loyalty_tier]} ${data.name}</div>
        <div style="font-size:.65rem;color:var(--gl)">${data.phone||'—'} · ${data.instagram?'@'+data.instagram:'—'}</div>
        <div style="margin-top:.5rem;font-size:.65rem">
          <b>Тир:</b> ${data.loyalty_tier} &nbsp;|&nbsp; <b>Баллы:</b> ${data.loyalty_points}
          &nbsp;|&nbsp; <b>Визитов:</b> ${data.total_visits} &nbsp;|&nbsp; <b>Потрачено:</b> ${moneyFmt(data.total_spent)}
        </div>
        ${data.note ? `<div style="margin-top:.4rem;font-size:.62rem;color:var(--gl)">${esc(data.note)}</div>` : ''}
        ${data.blacklisted ? `<div style="margin-top:.4rem;color:#f44336;font-size:.65rem">⛔ Чёрный список${data.blacklist_reason?': '+esc(data.blacklist_reason):''}</div>` : ''}
      </div>
    </div>
    <div style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap">
      <button class="btn-sm" onclick="openLoyaltyModal(${data.id}, '${esc(data.name)}')">💎 Баллы</button>
      <button class="btn-sm" onclick="toggleBlacklist(${data.id}, ${data.blacklisted?0:1}, '${esc(data.name)}')">${data.blacklisted?'✅ Снять ЧС':'⛔ Чёрный список'}</button>
      <button class="btn-sm" onclick="openGuestForm(${data.id})">✏️ Редактировать</button>
      <a class="btn-sm" href="auth.html" target="_blank" style="text-decoration:none">🪪 Кабинет</a>
    </div>
    <div style="font-size:.7rem;font-weight:600;margin-bottom:.4rem">Последние визиты</div>
    ${data.recent_visits?.length
      ? '<table class="data-table"><thead><tr><th>Дата</th><th>Событие</th></tr></thead><tbody>'
        + data.recent_visits.map(v=>'<tr><td>'+fmtDate(v.visited_at)+'</td><td>'+esc(v.event_name||'—')+'</td></tr>').join('')
        + '</tbody></table>'
      : '<p style="font-size:.65rem;color:var(--gl)">Визитов нет</p>'}
    ${data.bookings?.length
      ? '<div style="font-size:.7rem;font-weight:600;margin:.75rem 0 .4rem">Бронирования</div>'
        + '<table class="data-table"><thead><tr><th>Дата</th><th>Пакет</th><th>Статус</th></tr></thead><tbody>'
        + data.bookings.map(b=>'<tr><td>'+fmtDate(b.event_date)+'</td><td>'+esc(b.package_name||'—')+'</td><td>'+b.status+'</td></tr>').join('')
        + '</tbody></table>'
      : ''}`;
  openModal('guest-detail-modal');
}

async function openGuestForm(id) {
  let g = {};
  if (id) {
    const data = await SAPI.get('guest/get?id=' + id);
    if (data && !data.error) g = data;
  }
  document.getElementById('guest-modal-title').textContent = id ? 'Редактировать гостя' : 'Новый гость';
  document.getElementById('guest-modal-body').innerHTML = `
    <div class="form-group"><label>Имя *</label><input id="gf-name" value="${esc(g.name||'')}" /></div>
    <div class="form-group"><label>Телефон</label><input id="gf-phone" value="${esc(g.phone||'')}" placeholder="+7..." /></div>
    <div class="form-group"><label>Instagram</label><input id="gf-ig" value="${esc(g.instagram||'')}" placeholder="@handle" /></div>
    <div class="form-group"><label>Email</label><input id="gf-email" value="${esc(g.email||'')}" /></div>
    <div class="form-group"><label>День рождения</label><input type="date" id="gf-bday" value="${g.birthday||''}" /></div>
    <div class="form-group"><label>Сегмент</label>
      <select id="gf-seg">
        ${['new','returning','regular','vip','platinum','blocked'].map(s=>`<option value="${s}" ${g.segment===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Источник</label>
      <select id="gf-source">
        ${['walk-in','booking','bot','referral','social'].map(s=>`<option value="${s}" ${g.source===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Заметка</label><textarea id="gf-note">${esc(g.note||'')}</textarea></div>
    <div style="display:flex;gap:.5rem;margin-top:.75rem">
      <button class="btn" onclick="saveGuestForm(${id})" style="flex:1">💾 Сохранить</button>
      ${id?`<button class="btn-danger" onclick="deleteGuestConfirm(${id})">🗑</button>`:''}
    </div>`;
  openModal('guest-modal');
}

async function saveGuestForm(id) {
  const b = {
    id, name: document.getElementById('gf-name').value.trim(),
    phone: document.getElementById('gf-phone').value.trim(),
    instagram: document.getElementById('gf-ig').value.trim(),
    email: document.getElementById('gf-email').value.trim(),
    birthday: document.getElementById('gf-bday').value,
    segment: document.getElementById('gf-seg').value,
    source: document.getElementById('gf-source').value,
    note: document.getElementById('gf-note').value.trim(),
  };
  if (!b.name) { toast('Введите имя'); return; }
  const res = await SAPI.post('guest/save', b);
  if (res?.ok) { toast('Сохранено'); closeModal('guest-modal'); loadGuests(); }
  else if (res?.error === 'duplicate_phone') { toast('Гость с таким телефоном уже есть (ID: ' + res.existing_id + ')'); }
  else toast(res?.error || 'Ошибка');
}

async function deleteGuestConfirm(id) {
  if (!confirm('Удалить гостя?')) return;
  const res = await SAPI.post('guest/delete', {id});
  if (res?.ok) { toast('Удалено'); closeModal('guest-modal'); loadGuests(); }
  else toast(res?.error || 'Ошибка');
}

async function toggleBlacklist(id, bl, name) {
  const reason = bl ? prompt(`Причина занесения ${name} в ЧС:`, '') : null;
  if (bl && reason === null) return; // cancel
  const res = await SAPI.post('guest/blacklist', {id, blacklisted: bl, reason});
  if (res?.ok) { toast(bl ? '⛔ В чёрном списке' : '✅ Снят с ЧС'); closeModal('guest-detail-modal'); loadGuests(); }
  else toast(res?.error || 'Ошибка');
}

let _loyaltyGuestId = 0;
async function openLoyaltyModal(guestId, name) {
  _loyaltyGuestId = guestId;
  const log = await SAPI.get('guest/loyalty/log?guest_id=' + guestId);
  const prev = document.getElementById('guest-detail-modal');
  // mini-modal inline
  const modal = document.createElement('div');
  modal.id = 'loyalty-modal';
  modal.className = 'modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `<div class="modal" style="max-width:380px">
    <div class="modal-header"><span>💎 Баллы — ${esc(name)}</span><button onclick="document.getElementById('loyalty-modal').remove()">✕</button></div>
    <div class="form-group"><label>Баллы (+ начислить / − списать)</label>
      <input type="number" id="lp-pts" placeholder="например 100 или -50" /></div>
    <div class="form-group"><label>Тип</label>
      <select id="lp-type">
        <option value="earn">Начисление</option>
        <option value="redeem">Списание</option>
        <option value="bonus">Бонус</option>
        <option value="manual">Ручная корректировка</option>
      </select>
    </div>
    <div class="form-group"><label>Комментарий</label><input id="lp-note" /></div>
    <button class="btn" style="width:100%" onclick="submitLoyalty()">Применить</button>
    <hr style="margin:.75rem 0;border-color:#333">
    <div style="font-size:.65rem;color:var(--gl);margin-bottom:.3rem">История баллов</div>
    <div style="max-height:160px;overflow-y:auto">
    ${log?.length ? log.map(l=>`<div style="display:flex;justify-content:space-between;font-size:.63rem;padding:.15rem 0;border-bottom:1px solid #222">
      <span>${fmtDate(l.created_at)} — ${l.type}</span>
      <span style="color:${l.points>0?'#4caf50':'#f44336'};font-weight:600">${l.points>0?'+':''}${l.points}</span>
    </div>`).join('') : '<p style="color:var(--gl)">Нет истории</p>'}
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function submitLoyalty() {
  const pts  = parseInt(document.getElementById('lp-pts').value);
  const type = document.getElementById('lp-type').value;
  const note = document.getElementById('lp-note').value;
  if (!pts) { toast('Введите количество баллов'); return; }
  const res = await SAPI.post('guest/loyalty/add', {guest_id: _loyaltyGuestId, points: pts, type, note});
  if (res?.ok) {
    toast(`Баллы: ${res.loyalty_points} (${res.loyalty_tier})`);
    document.getElementById('loyalty-modal')?.remove();
    openGuestDetail(_loyaltyGuestId);
  } else toast(res?.error || 'Ошибка');
}

// ── ЗАРПЛАТЫ (РЕНДЕР) ─────────────────────────────────────
PANEL_RENDERERS.salary = async (el) => {
  el.innerHTML = `
    <div class="panel-title">💵 Зарплаты</div>

    <!-- Секция 1: настройки зарплат -->
    <div class="card" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div class="card-title">Настройки зарплат сотрудников</div>
        <button class="btn-sm" onclick="openSalarySettings()">➕ Настроить</button>
      </div>
      <div id="salary-settings-list">${skeletonList(3)}</div>
    </div>

    <!-- Секция 2: начисления за текущий месяц -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div style="display:flex;align-items:center;gap:.5rem">
          <button class="btn-xs" onclick="salaryNavMonth(-1)">◀</button>
          <div class="card-title" id="salary-period-label"></div>
          <button class="btn-xs" onclick="salaryNavMonth(1)">▶</button>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn-sm" onclick="openSalaryAccrual()">➕ Начислить</button>
          <button class="btn-sm" onclick="recalcAllSalaries()">🧮 Пересчитать всех</button>
          <button class="btn-sm btn-out" onclick="openFinesBonuses()">⚠️ Штраф / Бонус</button>
        </div>
      </div>
      <div id="salary-accruals-list">${skeletonList(3)}</div>
      <div id="salary-fot-row" style="display:none;border-top:1px solid rgba(255,255,255,.07);margin-top:.75rem;padding-top:.75rem;display:flex;justify-content:flex-end">
        <span style="color:var(--gl);font-size:.7rem;margin-right:.5rem">Итого ФОТ:</span>
        <span id="salary-fot-total" style="font-family:var(--fd);color:var(--cy)">0 ₽</span>
      </div>
    </div>`;

  // Инициализируем текущий месяц, загружаем данные
  window._salaryCurrentPeriod = new Date().toISOString().slice(0, 7);
  loadSalaryStaffFilters();
  loadSalarySettingsList();
  loadSalaryAccrualsList();
};

function toggleSalaryFields() {
  const type = document.getElementById('ss-type').value;
  const show = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.style.display = cond ? 'block' : 'none';
  };
  show('ss-fixed-group',           type === 'fixed'   || type === 'mixed');
  show('ss-hourly-group',          type === 'hourly'  || type === 'mixed');
  show('ss-percent-profit-group',  type === 'percent_profit');
  show('ss-percent-bar-group',     type === 'percent_bar');
  show('ss-percent-deposit-group', type === 'percent_deposit');
  show('ss-per-shift-group',       type === 'per_shift');
  show('ss-mixed-group',           type === 'mixed');
}

async function loadSalaryStaffFilters() {
  // Используем staffCache — он уже загружен при старте приложения
  const list = (staffCache || []).filter(s => s.active != 0);
  ['ss-staff', 'sa-staff'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Выберите сотрудника —</option>'
      + list.map(s => `<option value="${s.id}">${s.name} (${ROLE_LABELS[s.role]||s.role})</option>`).join('');
  });
}

// Обратная совместимость
function showSalarySettings() { loadSalarySettingsList(); }

async function openSalarySettings(staffId = null) {
  // Сброс формы
  document.getElementById('ss-staff-id').value = '';
  document.getElementById('ss-staff').value = '';
  document.getElementById('ss-type').value = 'fixed';
  ['ss-fixed','ss-hourly','ss-percent-profit','ss-percent-bar',
   'ss-percent-deposit','ss-per-shift','ss-min-guarantee','ss-max-cap']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const mixEl = document.getElementById('ss-mixed-config');
  if (mixEl) mixEl.value = '';
  toggleSalaryFields();

  // Если передан staffId — загружаем существующие настройки
  if (staffId) {
    document.getElementById('ss-staff').value = staffId;
    document.getElementById('ss-staff').disabled = true; // зафиксировать
    const st = document.getElementById('salary-settings-status');
    if (st) st.textContent = 'Загрузка настроек...';

    const res = await SAPI.get('salary/settings/get?staff_id=' + staffId).catch(() => null);
    if (st) st.textContent = '';
    if (res && !res.error) {
      document.getElementById('ss-staff-id').value = res.id || '';
      document.getElementById('ss-type').value = res.salary_type || 'fixed';
      const v = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      v('ss-fixed',            res.fixed_amount);
      v('ss-hourly',           res.hourly_rate);
      v('ss-percent-profit',   res.percent_profit);
      v('ss-percent-bar',      res.percent_bar);
      v('ss-percent-deposit',  res.percent_deposit);
      v('ss-per-shift',        res.per_shift_amount);
      v('ss-min-guarantee',    res.min_guarantee);
      v('ss-max-cap',          res.max_cap);
      if (res.salary_type === 'mixed' && res.mixed_config) {
        const mc = document.getElementById('ss-mixed-config');
        if (mc) mc.value = typeof res.mixed_config === 'string'
          ? res.mixed_config : JSON.stringify(res.mixed_config, null, 2);
      }
      toggleSalaryFields();
    }
  } else {
    document.getElementById('ss-staff').disabled = false;
  }

  openModal('salary-settings-modal');
}

async function saveSalarySettings() {
  const staff_id    = parseInt(document.getElementById('ss-staff').value);
  const salary_type = document.getElementById('ss-type').value;
  if (!staff_id) { toastErr('Выберите сотрудника'); return; }

  const n = (id) => parseFloat(document.getElementById(id)?.value) || 0;
  const payload = {
    staff_id,
    salary_type,
    fixed_amount:      n('ss-fixed'),
    hourly_rate:       n('ss-hourly'),
    percent_profit:    n('ss-percent-profit'),
    percent_bar:       n('ss-percent-bar'),
    percent_deposit:   n('ss-percent-deposit'),
    per_shift_amount:  n('ss-per-shift'),
    min_guarantee:     n('ss-min-guarantee'),
    max_cap:           n('ss-max-cap'),
  };

  const res = await SAPI.post('salary/settings/save', payload);
  if (res?.ok) {
    toast('✅ Настройки сохранены');
    document.getElementById('ss-staff').disabled = false;
    closeModal('salary-settings-modal');
    loadSalarySettingsList();
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

// ── Загрузить список настроек зарплат сотрудников ─────────
async function loadSalarySettingsList() {
  const el = document.getElementById('salary-settings-list');
  if (!el) return;

  const list = await SAPI.get('salary/settings/list').catch(() => null);
  const rows = Array.isArray(list) ? list : [];

  const typeLabel = {
    fixed: 'Оклад', hourly: 'Почасовая', percent_profit: '% от прибыли',
    percent_bar: '% от бара', percent_deposit: '% от депозитов',
    per_shift: 'За смену', mixed: 'Смешанная',
  };
  const rateText = (r) => {
    switch (r.salary_type) {
      case 'fixed':           return moneyFmt(r.fixed_amount || 0) + '/мес';
      case 'hourly':          return moneyFmt(r.hourly_rate || 0) + '/час';
      case 'percent_profit':  return (r.percent_profit || 0) + '%';
      case 'percent_bar':     return (r.percent_bar || 0) + '%';
      case 'percent_deposit': return (r.percent_deposit || 0) + '%';
      case 'per_shift':       return moneyFmt(r.per_shift_amount || 0) + '/смена';
      case 'mixed':           return 'Смешанная';
      default:                return '—';
    }
  };

  if (!rows.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">💼</div>
      <p>Настройки не заданы.<br>Нажмите «➕ Настроить».</p>
    </div>`;
    return;
  }

  el.innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:.75rem">
        <thead>
          <tr style="color:var(--gl);border-bottom:1px solid rgba(255,255,255,.07)">
            <th style="text-align:left;padding:.4rem .5rem">Сотрудник</th>
            <th style="text-align:left;padding:.4rem .5rem">Тип</th>
            <th style="text-align:right;padding:.4rem .5rem">Ставка</th>
            <th style="padding:.4rem .5rem"></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr style="border-bottom:1px solid rgba(255,255,255,.04)">
              <td style="padding:.5rem">${r.staff_name || '—'}</td>
              <td style="padding:.5rem;color:var(--gl)">${typeLabel[r.salary_type] || r.salary_type}</td>
              <td style="padding:.5rem;text-align:right;font-family:var(--fd);color:var(--cy)">${rateText(r)}</td>
              <td style="padding:.5rem;text-align:right">
                <button class="btn-xs" onclick="openSalarySettings(${r.staff_id})">✏️</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Загрузить начисления за текущий период ─────────────────
async function loadSalaryAccrualsList() {
  const listEl  = document.getElementById('salary-accruals-list');
  const labelEl = document.getElementById('salary-period-label');
  const fotEl   = document.getElementById('salary-fot-total');
  const fotRow  = document.getElementById('salary-fot-row');
  if (!listEl) return;

  const period = window._salaryCurrentPeriod || new Date().toISOString().slice(0, 7);
  if (labelEl) {
    const [y, m] = period.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    labelEl.textContent = d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  }

  listEl.innerHTML = '<div style="padding:.75rem;color:var(--gl)">Загрузка...</div>';

  const data = await SAPI.get('salary/accrual/get?period=' + period + '-01').catch(() => []);
  const rows = Array.isArray(data) ? data : [];

  const statusColor = { calculated: '#2196f3', approved: '#ff9800', paid: '#4caf50' };
  const statusLabel = { calculated: 'Рассчитано', approved: 'Согласовано', paid: 'Выплачено' };

  if (!rows.length) {
    listEl.innerHTML = `<div class="empty">
      <div class="empty-icon">💵</div>
      <p>Начислений нет. Нажмите «➕ Начислить».</p>
    </div>`;
    if (fotRow) fotRow.style.display = 'none';
    return;
  }

  const totalFot = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  if (fotEl) fotEl.textContent = moneyFmt(totalFot);
  if (fotRow) fotRow.style.display = 'flex';

  listEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:.4rem">
    ${rows.map(r => `
      <div class="task-card" style="cursor:pointer" onclick="openSalaryAccrualEdit(${r.id})">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>${r.staff_name || '—'}</b>
            <span style="color:var(--gl);font-size:.65rem;margin-left:.4rem">${ROLE_LABELS[r.staff_role] || ''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem">
            <b style="color:var(--cy)">${moneyFmt(r.total || 0)}</b>
            <span style="font-size:.65rem;padding:.15rem .4rem;border-radius:4px;background:${statusColor[r.status] || 'var(--gl)'}22;color:${statusColor[r.status] || 'var(--gl)'}">${statusLabel[r.status] || r.status}</span>
            ${r.status !== 'paid' ? `<button class="btn-xs" style="background:#4caf50" onclick="event.stopPropagation();paySalaryById(${r.id})">✅</button>` : ''}
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── Открыть начисление для редактирования по id ────────────
async function openSalaryAccrualEdit(accrualId) {
  const data = await SAPI.get('salary/accrual/get?id=' + accrualId).catch(() => null);
  const r = Array.isArray(data) ? data[0] : data;
  if (!r) { toast('Не удалось загрузить начисление'); return; }

  document.getElementById('sa-id').value = r.id;
  document.getElementById('sa-staff').value = r.staff_id || '';
  document.getElementById('sa-period').value = (r.period || '').slice(0, 7);
  document.getElementById('sa-base').value = r.base_salary || 0;
  document.getElementById('sa-shifts').value = r.shift_pay || 0;
  document.getElementById('sa-bonus').value = r.bonus || 0;
  document.getElementById('sa-fine').value = r.fine || 0;
  document.getElementById('sa-comment').value = r.comment || '';
  updateSalaryTotal();

  const paid = r.status === 'paid';
  document.getElementById('sa-delete-btn').style.display = 'inline-flex';
  document.getElementById('sa-pay-btn').style.display    = paid ? 'none' : 'inline-flex';
  openModal('salary-accrual-modal');
}

// ── Навигация по месяцам ──────────────────────────────────
function salaryNavMonth(delta) {
  const [y, m] = (window._salaryCurrentPeriod || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  window._salaryCurrentPeriod = d.toISOString().slice(0, 7);
  loadSalaryAccrualsList();
}

// ── Пересчитать всех сотрудников за период ────────────────
async function recalcAllSalaries() {
  const period = window._salaryCurrentPeriod || new Date().toISOString().slice(0, 7);
  const res = await SAPI.post('salary/calculate', { period: period + '-01' }).catch(() => null);
  if (res?.ok || res?.calculated !== undefined) {
    toast(`✅ Пересчитано: ${res?.calculated || 0} сотрудников`);
    loadSalaryAccrualsList();
  } else {
    toast(res?.error || 'Ошибка расчёта');
  }
}

// ── Обратная совместимость: старое имя ────────────────────
function showSalaryAccruals() { loadSalaryAccrualsList(); }

function openSalaryAccrual(staff_id = '', period = '') {
  document.getElementById('sa-id').value = '';
  document.getElementById('sa-staff').value = staff_id || '';
  document.getElementById('sa-period').value = period || window._salaryCurrentPeriod || new Date().toISOString().slice(0,7);
  document.getElementById('sa-base').value = 0;
  document.getElementById('sa-shifts').value = 0;
  document.getElementById('sa-bonus').value = 0;
  document.getElementById('sa-fine').value = 0;
  document.getElementById('sa-comment').value = '';
  document.getElementById('sa-total').textContent = '0 ₽';
  document.getElementById('sa-delete-btn').style.display = 'none';
  document.getElementById('sa-pay-btn').style.display = 'none';
  openModal('salary-accrual-modal');
}

function updateSalaryTotal() {
  const base = parseInt(document.getElementById('sa-base').value) || 0;
  const shifts = parseInt(document.getElementById('sa-shifts').value) || 0;
  const bonus = parseInt(document.getElementById('sa-bonus').value) || 0;
  const fine = parseInt(document.getElementById('sa-fine').value) || 0;
  const total = base + shifts + bonus - fine;
  document.getElementById('sa-total').textContent = total.toLocaleString('ru-RU') + ' ₽';
}

// Add event listeners for auto-calc
['sa-base','sa-shifts','sa-bonus','sa-fine'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateSalaryTotal);
});

async function saveSalaryAccrual() {
  const staff_id = parseInt(document.getElementById('sa-staff').value);
  const period = document.getElementById('sa-period').value + '-01';
  const base_salary = parseInt(document.getElementById('sa-base').value) || 0;
  const shift_pay = parseInt(document.getElementById('sa-shifts').value) || 0;
  const bonus = parseInt(document.getElementById('sa-bonus').value) || 0;
  const fine = parseInt(document.getElementById('sa-fine').value) || 0;
  const comment = document.getElementById('sa-comment').value;
  
  if (!staff_id) { toastErr('Выберите сотрудника'); return; }
  
  const res = await SAPI.post('salary/accrual/create', {
    staff_id, period, base_salary, shift_pay, bonus, fine, comment
  });
  
  if (res?.ok) {
    toast('✅ Начисление создано');
    closeModal('salary-accrual-modal');
    loadSalaryAccrualsList();
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

async function deleteSalaryAccrual() {
  const id = parseInt(document.getElementById('sa-id').value);
  if (!id || !confirm('Удалить начисление?')) return;

  const res = await SAPI.post('salary/accrual/delete', {id});
  if (res?.ok) {
    toast('✅ Удалено');
    closeModal('salary-accrual-modal');
    loadSalaryAccrualsList();
  } else {
    toastErr(res?.error || 'Ошибка');
  }
}

async function paySalaryAccrual() {
  const id = parseInt(document.getElementById('sa-id').value);
  if (!id || !confirm('Отметить как выплачено?')) return;

  const res = await SAPI.post('salary/accrual/pay', {id});
  if (res?.ok) {
    toast('✅ Выплата отмечена');
    closeModal('salary-accrual-modal');
    loadSalaryAccrualsList();
  } else {
    toastErr(res?.error || 'Ошибка');
  }
}

async function showSalaryStats() {
  const data = await SAPI.get('salary/stats').catch(() => null);

  // API возвращает: { by_period, current_month[], total_fot, period }
  const current = Array.isArray(data?.current_month) ? data.current_month : [];
  const totalBase   = current.reduce((s, r) => s + (r.base_salary || 0), 0);
  const totalShifts = current.reduce((s, r) => s + (r.shift_pay || 0), 0);
  const totalFot    = data?.total_fot || 0;

  const _sc = document.getElementById('salary-content') || document.getElementById('salary-accruals-list');
  if (!_sc) return;
  _sc.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:1rem">ФОТ — ${new Date().toLocaleString('ru-RU',{month:'long',year:'numeric'})}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem">
        <div class="stat-card">
          <div class="stat-val" style="font-family:var(--fd);font-size:1.8rem;color:var(--cy)">${current.length}</div>
          <div class="stat-lbl">Сотрудников</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="font-family:var(--fd);font-size:1.8rem;color:#4caf50">${moneyFmt(totalBase)}</div>
          <div class="stat-lbl">Оклады</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="font-family:var(--fd);font-size:1.8rem;color:#2196f3">${moneyFmt(totalShifts)}</div>
          <div class="stat-lbl">Смены/проценты</div>
        </div>
        <div class="stat-card" style="border-color:var(--cy)">
          <div class="stat-val" style="font-family:var(--fd);font-size:1.8rem;color:var(--cy)">${moneyFmt(totalFot)}</div>
          <div class="stat-lbl">Итого ФОТ</div>
        </div>
      </div>
    </div>

    ${current.length ? `
    <div class="card" style="margin-top:1rem">
      <div class="card-title" style="margin-bottom:.75rem">По сотрудникам</div>
      <div style="display:flex;flex-direction:column;gap:.3rem">
        ${current.map(r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.35rem .5rem;border-bottom:1px solid rgba(255,255,255,.04);font-size:.72rem">
            <span><b>${r.name||'—'}</b> <span style="color:var(--gl)">${ROLE_LABELS[r.role]||''}</span></span>
            <span style="color:${r.status==='paid'?'#4caf50':r.status==='approved'?'#ff9800':'var(--cy)'}">
              ${moneyFmt(r.total||0)} ${r.status==='paid'?'✅':r.status==='approved'?'🟡':''}
            </span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="card" style="margin-top:1rem">
      <div class="card-title" style="margin-bottom:.5rem">Действия</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn-sm" onclick="openSalaryAccrual()">➕ Создать начисление</button>
        <button class="btn-sm" onclick="showSalaryAccruals()">📋 Все начисления</button>
        <button class="btn-sm btn-out" onclick="openSalarySettings()">⚙️ Настройки зарплат</button>
        <button class="btn-sm btn-out" onclick="showSalaryList()">📊 Сводная таблица</button>
      </div>
    </div>`;
}

async function openFinesBonuses() {
  document.getElementById('fines-body').innerHTML = `
    <div style="display:flex;gap:.5rem;margin-bottom:.75rem">
      <button class="btn-sm active" onclick="showFineForm('fine')">⚠️ Штраф</button>
      <button class="btn-sm" onclick="showFineForm('bonus')">🎁 Бонус</button>
    </div>
    <div id="fb-form"></div>`;
  openModal('fines-modal');
  showFineForm('fine');
}

function showFineForm(type) {
  const isFine = type === 'fine';
  document.getElementById('fb-form').innerHTML = `
    <div class="form-group"><label>Сотрудник</label>
      <select id="fb-staff">${(staffCache||[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Сумма (₽)</label><input type="number" id="fb-amount" /></div>
    <div class="form-group"><label>Причина *</label><input id="fb-reason" /></div>
    <div class="form-group"><label>Дата</label><input type="date" id="fb-date" value="${new Date().toISOString().slice(0,10)}" /></div>
    <div class="form-group"><label>Доп. заметка</label><input id="fb-note" /></div>
    <button class="btn${isFine?'-danger':''}" style="width:100%" onclick="submitFineBonus('${type}')">${isFine?'⚠️ Выписать штраф':'🎁 Начислить бонус'}</button>`;
}

async function submitFineBonus(type) {
  const b = {
    staff_id: parseInt(document.getElementById('fb-staff').value),
    amount: parseFloat(document.getElementById('fb-amount').value),
    reason: document.getElementById('fb-reason').value.trim(),
    date: document.getElementById('fb-date').value,
    note: document.getElementById('fb-note').value.trim(),
  };
  if (!b.amount || !b.reason) { toast('Заполните сумму и причину'); return; }
  const endpoint = type === 'fine' ? 'fine/save' : 'bonus/save';
  const res = await SAPI.post(endpoint, b);
  if (res?.ok) { toast(type==='fine'?'⚠️ Штраф выписан':'🎁 Бонус начислен'); closeModal('fines-modal'); }
  else toast(res?.error || 'Ошибка');
}

// ── ИНТЕГРАЦИИ ────────────────────────────────────────────

// Показать список интеграций
async function showIntegrationsList() {
  const data = await SAPI.get('integrations/list') || [];
  const body = document.getElementById('integrations-list-body');
  
  if (!data.length) {
    body.innerHTML = '<p style="color:var(--gl);text-align:center;padding:2rem">Интеграции не настроены</p>';
  } else {
    body.innerHTML = data.map(int => `
      <div style="padding:1rem;border:1px solid var(--cb);border-radius:8px;margin-bottom:.75rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
          <span style="font-weight:600">${int.integration_type.toUpperCase()}</span>
          <span style="color:${int.enabled ? '#4caf50' : '#f44336'}">${int.enabled ? '✅ Включено' : '❌ Выключено'}</span>
        </div>
        ${int.bot_name ? `<div style="font-size:.7rem;color:var(--gl)">Бот: ${int.bot_name}</div>` : ''}
        ${int.last_sync ? `<div style="font-size:.7rem;color:var(--gl)">Синхронизация: ${int.last_sync}</div>` : ''}
        ${int.error_message ? `<div style="font-size:.7rem;color:#f44336">Ошибка: ${int.error_message}</div>` : ''}
        <div style="display:flex;gap:.5rem;margin-top:.75rem">
          <button class="btn-sm" onclick="editIntegration('${int.integration_type}')">⚙️ Настроить</button>
          <button class="btn-sm" onclick="testIntegration('${int.integration_type}')">🔍 Тест</button>
        </div>
      </div>
    `).join('');
  }
  
  openModal('integrations-list-modal');
}

// Редактировать интеграцию
function editIntegration(type) {
  closeModal('integrations-list-modal');
  if (type === 'telegram') {
    openModal('telegram-settings-modal');
  } else if (type === 'max') {
    openModal('max-settings-modal');
  }
}

// Тест интеграции
async function testIntegration(type) {
  const res = await SAPI.post('integrations/test', { integration_type: type });
  if (res?.success) {
    toast(`✅ ${type}: ${res.message}`);
  } else {
    toast(`❌ ${type}: ${res?.error || 'Ошибка'}`);
  }
}

// Сохранить настройки Telegram
async function saveTelegramSettings() {
  const token = document.getElementById('tg-token').value.trim();
  const webhook = document.getElementById('tg-webhook').value.trim();
  const botName = document.getElementById('tg-bot-name').value.trim();
  const statusEl = document.getElementById('telegram-status');
  
  if (!token) {
    statusEl.textContent = '❌ Введите токен';
    statusEl.style.color = '#f44336';
    return;
  }
  
  statusEl.textContent = 'Сохранение...';
  statusEl.style.color = 'var(--gl)';
  
  const res = await SAPI.post('integrations/settings/save', {
    integration_type: 'telegram',
    bot_token: token,
    webhook_url: webhook,
    bot_name: botName,
    enabled: 1,
    settings: {}
  });
  
  if (res?.ok) {
    statusEl.textContent = '✅ Сохранено!';
    statusEl.style.color = '#4caf50';
    setTimeout(() => {
      closeModal('telegram-settings-modal');
      showIntegrationsList();
    }, 1000);
  } else {
    statusEl.textContent = '❌ Ошибка: ' + (res?.error || 'Неизвестная');
    statusEl.style.color = '#f44336';
  }
}

// Тест Telegram
async function testTelegram() {
  const token = document.getElementById('tg-token').value.trim();
  const statusEl = document.getElementById('telegram-status');
  
  if (!token) {
    statusEl.textContent = '❌ Введите токен';
    statusEl.style.color = '#f44336';
    return;
  }
  
  statusEl.textContent = 'Тестирование...';
  statusEl.style.color = 'var(--gl)';
  
  const res = await SAPI.post('integrations/test', {
    integration_type: 'telegram',
    bot_token: token
  });
  
  if (res?.success) {
    statusEl.textContent = '✅ ' + res.message;
    statusEl.style.color = '#4caf50';
  } else {
    statusEl.textContent = '❌ ' + (res?.error || 'Ошибка подключения');
    statusEl.style.color = '#f44336';
  }
}

// Сохранить настройки MAX
async function saveMAXSettings() {
  const token = document.getElementById('max-token').value.trim();
  const webhook = document.getElementById('max-webhook').value.trim();
  const statusEl = document.getElementById('max-status');
  
  if (!token) {
    statusEl.textContent = '❌ Введите токен';
    statusEl.style.color = '#f44336';
    return;
  }
  
  statusEl.textContent = 'Сохранение...';
  statusEl.style.color = 'var(--gl)';
  
  const res = await SAPI.post('integrations/settings/save', {
    integration_type: 'max',
    bot_token: token,
    webhook_url: webhook,
    enabled: 0, // Пока выключено по умолчанию
    settings: {}
  });
  
  if (res?.ok) {
    statusEl.textContent = '✅ Сохранено!';
    statusEl.style.color = '#4caf50';
    setTimeout(() => {
      closeModal('max-settings-modal');
      showIntegrationsList();
    }, 1000);
  } else {
    statusEl.textContent = '❌ Ошибка: ' + (res?.error || 'Неизвестная');
    statusEl.style.color = '#f44336';
  }
}


// Расчёт зарплаты
async function calculateSalary() {
  const staff_id = parseInt(document.getElementById('sc-staff-select').value);
  const period = document.getElementById('sc-period').value + '-01';
  
  if (!staff_id) {
    toastErr('Выберите сотрудника');
    return;
  }
  
  const resultEl = document.getElementById('salary-calculate-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div style="text-align:center;color:var(--gl)">Расчёт...</div>';
  
  const res = await SAPI.post('salary/calculate', { staff_id, period });
  
  if (res && !res.error) {
    const calc = res.calculations || [];
    const total = res.total || 0;
    
    resultEl.innerHTML = `
      <div style="margin-bottom:.75rem">
        <div style="font-size:.7rem;color:var(--gl);margin-bottom:.5rem">Расчёт за ${period.slice(0,7)}</div>
        ${calc.map(c => `
          <div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <span style="font-size:.7rem">${c.type === 'fixed' ? 'Оклад' : c.type === 'hourly' ? 'Почасовая' : c.type === 'percent_bar' ? '% от бара' : c.type === 'percent_deposit' ? '% от депозитов' : c.type}</span>
            <span style="font-weight:600">${c.amount.toLocaleString('ru-RU')} ₽</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding:.5rem 0;margin-top:.5rem;border-top:2px solid var(--cy)">
          <span style="font-weight:700">Итого:</span>
          <span style="font-weight:700;color:var(--cy)">${total.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>
    `;
  } else {
    resultEl.innerHTML = `<div style="color:#f44336">❌ ${res?.error || 'Ошибка расчёта'}</div>`;
  }
}

// Показать список зарплат (начислений)
async function showSalaryList() {
  const body = document.getElementById('salary-list-body');
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gl)">Загрузка...</div>';
  openModal('salary-list-modal');

  const period = document.getElementById('sc-period')?.value
    ? document.getElementById('sc-period').value + '-01'
    : new Date().toISOString().slice(0, 7) + '-01';

  const data = await SAPI.get('salary/accrual/get?period=' + period).catch(() => []);
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    body.innerHTML = '<p style="color:var(--gl);text-align:center;padding:2rem">Нет начислений за этот период</p>';
    return;
  }

  const statusLabel = { calculated: '🔵 Рассчитано', approved: '🟡 Согласовано', paid: '✅ Выплачено' };
  body.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.72rem">
      <thead>
        <tr style="color:var(--gl);border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:.4rem .5rem">Сотрудник</th>
          <th style="text-align:right;padding:.4rem .5rem">База</th>
          <th style="text-align:right;padding:.4rem .5rem">Смены</th>
          <th style="text-align:right;padding:.4rem .5rem">Бонус</th>
          <th style="text-align:right;padding:.4rem .5rem">Штраф</th>
          <th style="text-align:right;padding:.4rem .5rem;color:var(--cy)">Итого</th>
          <th style="text-align:center;padding:.4rem .5rem">Статус</th>
          <th style="padding:.4rem .5rem"></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
            <td style="padding:.4rem .5rem"><b>${r.staff_name||'—'}</b><br><span style="color:var(--gl)">${ROLE_LABELS[r.staff_role]||r.staff_role||''}</span></td>
            <td style="text-align:right;padding:.4rem .5rem">${moneyFmt(r.base_salary||0)}</td>
            <td style="text-align:right;padding:.4rem .5rem">${moneyFmt(r.shift_pay||0)}</td>
            <td style="text-align:right;padding:.4rem .5rem;color:#4caf50">+${moneyFmt(r.bonus||0)}</td>
            <td style="text-align:right;padding:.4rem .5rem;color:#f44336">-${moneyFmt(r.fine||0)}</td>
            <td style="text-align:right;padding:.4rem .5rem;font-weight:700;color:var(--cy)">${moneyFmt(r.total||0)}</td>
            <td style="text-align:center;padding:.4rem .5rem">${statusLabel[r.status]||r.status}</td>
            <td style="padding:.4rem .5rem">
              ${r.status !== 'paid' ? `<button class="btn-xs" onclick="paySalaryById(${r.id})">Выплатить</button>` : ''}
            </td>
          </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="border-top:1px solid var(--border);font-weight:700">
          <td style="padding:.5rem .5rem;color:var(--gl)">Итого ФОТ</td>
          <td colspan="4"></td>
          <td style="text-align:right;padding:.5rem .5rem;color:var(--cy)">${moneyFmt(rows.reduce((s,r)=>s+(r.total||0),0))}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>`;
}

async function paySalaryById(id) {
  if (!confirm('Отметить как выплачено?')) return;
  const res = await SAPI.post('salary/accrual/pay', { id });
  if (res?.ok) { toast('✅ Выплата отмечена'); loadSalaryAccrualsList(); showSalaryList(); }
  else toastErr(res?.error || 'Ошибка');
}

// ── ИНТЕГРАЦИИ (РЕНДЕР) ─────────────────────────────────────
PANEL_RENDERERS.integrations = async (el) => {
  el.innerHTML = `<div class="panel-title">⚙️ Настройки и интеграции</div>${skeletonList(2)}`;

  // Загружаем сохранённые данные
  const integrations = await SAPI.get('integrations/list').catch(() => []);
  const tg = Array.isArray(integrations) ? integrations.find(i => i.integration_type === 'telegram') : null;
  const tgToken    = tg?.bot_token || '';
  const tgBotName  = tg?.bot_name || '';
  const tgEnabled  = tg?.enabled == 1;
  const tgConnected = !!tgToken;
  const webhookUrl = `${location.origin}/backend/api.php?a=settings/register-webhook`;

  el.innerHTML = `
  <div class="panel-title">⚙️ Настройки и интеграции</div>

  <!-- ── TELEGRAM ─────────────────────────── -->
  <div class="card" style="margin-bottom:1.25rem">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:.75rem">
        <div style="font-size:2rem;line-height:1">✈️</div>
        <div>
          <div style="font-weight:700;font-size:.95rem">Telegram-бот</div>
          <div style="font-size:.65rem;color:var(--gl)">Уведомления сотрудникам, подтверждение смен, связь с гостями</div>
        </div>
      </div>
      <span id="tg-status-badge" class="chip ${tgConnected ? 'chip-green' : 'chip-gray'}">
        ${tgConnected ? '● Подключён' : '○ Не настроен'}
      </span>
    </div>

    ${tgConnected && tgBotName ? `
    <div style="background:rgba(0,230,200,.07);border:1px solid rgba(0,230,200,.2);border-radius:8px;padding:.6rem .9rem;margin-bottom:1rem;font-size:.75rem">
      🤖 Бот: <b style="color:var(--cy)">${tgBotName}</b> — активен
    </div>` : ''}

    <!-- ШАГ 1 -->
    <div style="margin-bottom:1.25rem">
      <div style="font-size:.65rem;color:var(--cy);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">
        Шаг 1 — Получите токен бота
      </div>
      <div style="font-size:.72rem;color:var(--gl);background:rgba(255,255,255,.04);border-radius:8px;padding:.75rem;line-height:1.7">
        1. Откройте Telegram и найдите <b style="color:var(--w)">@BotFather</b><br>
        2. Напишите ему <code style="background:rgba(255,255,255,.08);padding:.1rem .35rem;border-radius:4px">/newbot</code><br>
        3. Придумайте имя и username бота (например <code style="background:rgba(255,255,255,.08);padding:.1rem .35rem;border-radius:4px">ravezone_bot</code>)<br>
        4. Скопируйте токен — он выглядит как <code style="background:rgba(255,255,255,.08);padding:.1rem .35rem;border-radius:4px">123456789:ABC...</code>
      </div>
    </div>

    <!-- ШАГ 2 -->
    <div style="margin-bottom:1.25rem">
      <div style="font-size:.65rem;color:var(--cy);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">
        Шаг 2 — Вставьте токен
      </div>
      <div class="form-group" style="margin-bottom:.5rem">
        <input type="text" id="tg-token-input" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          value="${tgToken}" style="font-family:var(--fm);font-size:.75rem">
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn" onclick="saveTelegramToken()" style="flex:1;min-width:120px">💾 Сохранить токен</button>
        <button class="btn-out" onclick="testTelegramToken()" style="flex:1;min-width:120px">🔍 Проверить бота</button>
      </div>
      <div id="tg-test-result" style="margin-top:.5rem;font-size:.7rem;color:var(--gl)"></div>
    </div>

    <!-- ШАГ 3 -->
    <div style="margin-bottom:1.25rem">
      <div style="font-size:.65rem;color:var(--cy);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">
        Шаг 3 — Подключите сотрудников
      </div>
      <div style="font-size:.72rem;color:var(--gl);background:rgba(255,255,255,.04);border-radius:8px;padding:.75rem;line-height:1.7">
        Каждый сотрудник заходит в раздел <b style="color:var(--w)">Профиль → Telegram</b><br>
        и нажимает «Привязать Telegram» — получает личный код для связки аккаунта.<br>
        После этого бот будет отправлять им уведомления о задачах и сменах.
      </div>
    </div>

    <!-- ЧТО УМЕЕТ БОТ -->
    <div>
      <div style="font-size:.65rem;color:var(--gl);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">
        Что делает бот автоматически
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;font-size:.68rem">
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">📋 Новая задача назначена</div>
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">📅 Смена назначена (подтвердить/отказать)</div>
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">⏰ Задача просрочена</div>
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">✅ Новая заявка сотрудника</div>
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">🔔 Новая бронь на сайте</div>
        <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:.5rem .65rem">💬 Рассылки гостям</div>
      </div>
    </div>
  </div>

  <!-- ── РАССЫЛКИ ─────────────────────────── -->
  <div class="card" style="margin-bottom:1.25rem">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
      <div>
        <div style="font-weight:700;font-size:.9rem">💬 Рассылки</div>
        <div style="font-size:.65rem;color:var(--gl)">Отправить сообщение всем подписчикам бота</div>
      </div>
      <button class="btn-sm" onclick="showPanel('messages')">Управление →</button>
    </div>
    <div id="int-messages-preview" style="font-size:.72rem;color:var(--gl)">Загрузка...</div>
  </div>

  <!-- ── ПОДКЛЮЧЁННЫЕ СОТРУДНИКИ ─────────── -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
      <div>
        <div style="font-weight:700;font-size:.9rem">👥 Сотрудники в боте</div>
        <div style="font-size:.65rem;color:var(--gl)">Кто уже привязал Telegram</div>
      </div>
    </div>
    <div id="int-staff-tg-list" style="font-size:.72rem">${skeletonList(2)}</div>
  </div>`;

  // Загружаем сотрудников с telegram_id
  _loadIntegrationsStaffList();

  // Загружаем последние рассылки
  const msgs = await SAPI.get('messages/list').catch(() => []);
  const msgEl = document.getElementById('int-messages-preview');
  if (msgEl) {
    if (!msgs || !msgs.length) {
      msgEl.innerHTML = 'Рассылок ещё не было. <button class="btn-xs" onclick="openModal(\'message-create-modal\')">+ Создать рассылку</button>';
    } else {
      const last = msgs.slice(0,3);
      msgEl.innerHTML = last.map(m => `
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid rgba(255,255,255,.05)">
          <span>${m.body?.slice(0,50) || '—'}${m.body?.length > 50 ? '...' : ''}</span>
          <span class="chip ${m.status==='sent'?'chip-green':'chip-yellow'}" style="font-size:.6rem">${m.status==='sent'?'✓ Отправлено':'Черновик'}</span>
        </div>`).join('') + `<button class="btn-xs" style="margin-top:.5rem" onclick="openModal('message-create-modal')">+ Новая рассылка</button>`;
    }
  }
};

async function _loadIntegrationsStaffList() {
  const el = document.getElementById('int-staff-tg-list');
  if (!el) return;
  const data = await SAPI.get('staff/list').catch(() => []);
  const withTg = (data || []).filter(s => s.telegram_id || s.telegram_username);
  const withoutTg = (data || []).filter(s => s.active && !s.telegram_id && !s.telegram_username);
  if (!data || !data.length) { el.innerHTML = '<span style="color:var(--gl)">Нет данных</span>'; return; }
  el.innerHTML = `
    ${withTg.length ? `
    <div style="margin-bottom:.5rem;color:var(--cy);font-size:.65rem;font-weight:600">✅ Привязан (${withTg.length})</div>
    ${withTg.map(s=>`<div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.72rem">
      <span>${s.name}</span>
      <span style="color:var(--gl)">@${s.telegram_username||s.telegram_id||'—'}</span>
    </div>`).join('')}` : ''}
    ${withoutTg.length ? `
    <div style="margin:.75rem 0 .4rem;color:var(--gl);font-size:.65rem;font-weight:600">⚠️ Не привязан (${withoutTg.length}) — не получат уведомления</div>
    ${withoutTg.map(s=>`<div style="padding:.25rem 0;font-size:.7rem;color:var(--gl)">${s.name} (${s.role})</div>`).join('')}` : ''}`;
}

async function saveTelegramToken() {
  const token = document.getElementById('tg-token-input')?.value.trim();
  if (!token) { fieldError('tg-token-input', 'Вставьте токен бота'); return; }
  const res = await SAPI.post('integrations/settings/save', {
    integration_type: 'telegram',
    bot_token: token,
    enabled: 1,
  });
  if (res?.ok !== undefined || res?.id) {
    toastOk('✅ Токен сохранён! Теперь проверьте бота →');
    testTelegramToken();
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

async function testTelegramToken() {
  const token = document.getElementById('tg-token-input')?.value.trim();
  if (!token) { fieldError('tg-token-input', 'Сначала вставьте токен'); return; }
  const resultEl = document.getElementById('tg-test-result');
  if (resultEl) resultEl.innerHTML = '<span style="color:var(--gl)">Проверяем...</span>';
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await resp.json();
    if (data.ok) {
      const bot = data.result;
      if (resultEl) resultEl.innerHTML = `<span style="color:#4caf50">✅ Бот найден: <b>@${bot.username}</b> (${bot.first_name})</span>`;
      // Обновляем имя бота в базе
      const badgeEl = document.getElementById('tg-status-badge');
      if (badgeEl) { badgeEl.className = 'chip chip-green'; badgeEl.textContent = '● Подключён'; }
      SAPI.post('integrations/settings/save', {integration_type:'telegram', bot_token:token, bot_name:`@${bot.username}`, enabled:1});
    } else {
      if (resultEl) resultEl.innerHTML = `<span style="color:#ff5252">❌ Неверный токен: ${data.description}</span>`;
    }
  } catch(e) {
    if (resultEl) resultEl.innerHTML = '<span style="color:#ff5252">❌ Нет соединения с Telegram</span>';
  }
}

// ── РАССЫЛКИ ──────────────────────────────────────────────────
async function sendBroadcastMessage() {
  const text = (document.getElementById('mc-text')?.value || '').trim();
  const audience = document.getElementById('mc-audience')?.value || 'all_staff';
  if (!text) { fieldError('mc-text', 'Введите текст сообщения'); return; }
  try {
    const result = await SAPI.post('integrations/broadcast', { audience, text });
    toastOk(`📤 Отправлено: ${result.sent || 0} получателей`);
    closeModal('message-create-modal');
    document.getElementById('mc-text').value = '';
    document.getElementById('mc-char-count').textContent = '0';
  } catch(e) {
    toastErr('Ошибка отправки: ' + (e.message || 'неизвестная ошибка'));
  }
}

// Счётчик символов в рассылке
document.addEventListener('DOMContentLoaded', () => {
  const ta = document.getElementById('mc-text');
  if (ta) ta.addEventListener('input', () => {
    const el = document.getElementById('mc-char-count');
    if (el) el.textContent = ta.value.length;
  });
});

// ── ЛОЯЛЬНОСТЬ (РЕНДЕР ПАНЕЛИ) ────────────────────────────────
PANEL_RENDERERS.loyalty = async (el) => {
  el.innerHTML = `
    <div class="panel-title">🎖 Программа лояльности</div>
    <div style="display:flex;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap">
      <button class="btn-sm" onclick="openLoyaltyTier()">➕ Уровень</button>
      <button class="btn-sm" onclick="openLoyaltyRule()">➕ Правило начисления</button>
      <button class="btn-sm" onclick="openLoyaltyRedemption()">➕ Правило списания</button>
      <button class="btn-sm btn-out" onclick="openModal('loyalty-earn-modal')">🎁 Начислить баллы</button>
      <button class="btn-sm btn-out" onclick="openModal('loyalty-spend-modal')">💸 Списать баллы</button>
    </div>
    <div id="loyalty-stats-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem;margin-bottom:1.25rem"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <div class="card-title" style="margin-bottom:.75rem">Уровни</div>
        <div id="loyalty-tiers-list"></div>
      </div>
      <div>
        <div class="card-title" style="margin-bottom:.75rem">Правила начисления</div>
        <div id="loyalty-rules-list"></div>
        <div class="card-title" style="margin:.75rem 0">Правила списания</div>
        <div id="loyalty-redemption-list"></div>
      </div>
    </div>`;

  const [tiers, rules, redemptions] = await Promise.all([
    SAPI.get('loyalty/tiers').catch(() => []),
    SAPI.get('loyalty/rules').catch(() => []),
    SAPI.get('loyalty/redemption-rules').catch(() => []),
  ]);

  // Статистика
  const tierList = Array.isArray(tiers) ? tiers : [];
  document.getElementById('loyalty-stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-val" style="color:var(--cy);font-family:var(--fd);font-size:1.8rem">${tierList.length}</div><div class="stat-lbl">Уровней</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#4caf50;font-family:var(--fd);font-size:1.8rem">${Array.isArray(rules)?rules.length:0}</div><div class="stat-lbl">Правил начисл.</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#ff9800;font-family:var(--fd);font-size:1.8rem">${Array.isArray(redemptions)?redemptions.length:0}</div><div class="stat-lbl">Правил списания</div></div>`;

  // Уровни
  const tiersEl = document.getElementById('loyalty-tiers-list');
  if (!tierList.length) {
    tiersEl.innerHTML = '<div class="empty" style="padding:1rem"><p>Нет уровней</p></div>';
  } else {
    tiersEl.innerHTML = tierList.map(t => `
      <div class="task-card" style="margin-bottom:.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:1.2rem;margin-right:.4rem">${t.icon||'🏅'}</span>
            <b style="color:${t.color_code||'var(--cy)'}">${t.tier_name}</b>
            <span style="font-size:.65rem;color:var(--gl);margin-left:.5rem">от ${(t.min_spent||0).toLocaleString('ru-RU')} ₽</span>
          </div>
          <div style="display:flex;gap:.3rem">
            ${t.discount_percent>0?`<span class="rb" style="background:rgba(76,175,80,.15);color:#4caf50">-${t.discount_percent}%</span>`:''}
            ${t.free_entry?'<span class="rb" style="background:rgba(33,150,243,.15);color:#2196f3">🚪 Вход</span>':''}
            ${t.personal_manager?'<span class="rb" style="background:rgba(255,152,0,.15);color:#ff9800">👤 Менеджер</span>':''}
            <button class="btn-xs btn-out" onclick="openLoyaltyTier(${t.id})">✏️</button>
          </div>
        </div>
      </div>`).join('');
  }

  // Правила начисления
  const rulesEl = document.getElementById('loyalty-rules-list');
  const rulesList = Array.isArray(rules) ? rules : [];
  const ruleTypeLabel = {visit:'Посещение',spent:'Трата',birthday:'День рождения',weekday:'День недели',referral:'Реферал',review:'Отзыв',social:'Соцсети'};
  if (!rulesList.length) {
    rulesEl.innerHTML = '<div class="empty" style="padding:1rem"><p>Нет правил</p></div>';
  } else {
    rulesEl.innerHTML = rulesList.map(r => `
      <div class="task-card" style="margin-bottom:.4rem;font-size:.72rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>${r.rule_name}</b>
            <span style="color:var(--gl);margin-left:.4rem">${ruleTypeLabel[r.rule_type]||r.rule_type}</span>
          </div>
          <span style="color:var(--cy)">${r.points_percent>0 ? r.points_percent+'% → баллы' : '+'+r.points_amount+' бал.'}</span>
        </div>
      </div>`).join('');
  }

  // Правила списания
  const redemEl = document.getElementById('loyalty-redemption-list');
  const redemList = Array.isArray(redemptions) ? redemptions : [];
  if (!redemList.length) {
    redemEl.innerHTML = '<div class="empty" style="padding:1rem"><p>Нет правил</p></div>';
  } else {
    redemEl.innerHTML = redemList.map(r => `
      <div class="task-card" style="margin-bottom:.4rem;font-size:.72rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>${r.rule_name}</b>
            <span style="color:var(--gl);margin-left:.4rem">от ${r.min_points} бал.</span>
          </div>
          <span style="color:#ff9800">${r.points_to_rub} ₽/бал. до ${r.max_discount_percent}%</span>
        </div>
      </div>`).join('');
  }
};

// Открыть форму уровня (новый или редактировать)
async function openLoyaltyTier(id = null) {
  document.getElementById('lt-id').value = id || '';
  if (!id) {
    document.getElementById('lt-name').value = '';
    document.getElementById('lt-color').value = '#7c6af7';
    document.getElementById('lt-icon').value = '🏅';
    document.getElementById('lt-min-spent').value = 0;
    document.getElementById('lt-discount').value = 0;
    document.getElementById('lt-free-entry').checked = false;
    document.getElementById('lt-priority-booking').checked = false;
    document.getElementById('lt-personal-manager').checked = false;
    document.getElementById('lt-vip-access').checked = false;
    document.getElementById('lt-auto-upgrade').value = 1;
    document.getElementById('lt-auto-downgrade').value = 0;
  } else {
    const tiers = await SAPI.get('loyalty/tiers').catch(() => []);
    const t = (Array.isArray(tiers) ? tiers : []).find(x => x.id == id);
    if (t) {
      document.getElementById('lt-name').value = t.tier_name || '';
      document.getElementById('lt-color').value = t.color_code || '#7c6af7';
      document.getElementById('lt-icon').value = t.icon || '';
      document.getElementById('lt-min-spent').value = t.min_spent || 0;
      document.getElementById('lt-discount').value = t.discount_percent || 0;
      document.getElementById('lt-free-entry').checked = !!t.free_entry;
      document.getElementById('lt-priority-booking').checked = !!t.priority_booking;
      document.getElementById('lt-personal-manager').checked = !!t.personal_manager;
      document.getElementById('lt-vip-access').checked = !!t.vip_access;
      document.getElementById('lt-auto-upgrade').value = t.auto_upgrade ?? 1;
      document.getElementById('lt-auto-downgrade').value = t.auto_downgrade ?? 0;
    }
  }
  openModal('loyalty-tier-modal');
}

// Открыть форму правила начисления
function openLoyaltyRule(id = null) {
  document.getElementById('lr-id').value = id || '';
  document.getElementById('lr-name').value = '';
  document.getElementById('lr-type').value = 'spent';
  document.getElementById('lr-points').value = 0;
  document.getElementById('lr-percent').value = 1;
  toggleLoyaltyRuleFields();
  openModal('loyalty-rule-modal');
}

// Открыть форму правила списания
function openLoyaltyRedemption(id = null) {
  document.getElementById('lrr-id').value = id || '';
  document.getElementById('lrr-name').value = '';
  document.getElementById('lrr-min-points').value = 100;
  document.getElementById('lrr-max-points').value = 5000;
  document.getElementById('lrr-min-bill').value = 500;
  document.getElementById('lrr-max-discount').value = 50;
  document.getElementById('lrr-rate').value = 1;
  document.getElementById('lrr-pay-bar').checked = true;
  document.getElementById('lrr-pay-kitchen').checked = true;
  document.getElementById('lrr-pay-deposit').checked = false;
  document.getElementById('lrr-pay-tickets').checked = false;
  openModal('loyalty-redemption-modal');
}

// ── ЛОЯЛЬНОСТЬ (ФУНКЦИИ) ─────────────────────────────────────

// Переключение полей правила начисления
function toggleLoyaltyRuleFields() {
  const type = document.getElementById('lr-type').value;
  const percentGroup = document.getElementById('lr-percent-group');
  const pointsGroup = document.getElementById('lr-points-group');
  const weekdayGroup = document.getElementById('lr-weekday-group');
  
  percentGroup.style.display = type === 'spent' ? 'block' : 'none';
  pointsGroup.style.display = type !== 'spent' ? 'block' : 'none';
  weekdayGroup.style.display = type === 'weekday' ? 'block' : 'none';
}


// Сохранить уровень лояльности
async function saveLoyaltyTier() {
  const id = document.getElementById('lt-id').value;
  const data = {
    tier_name: document.getElementById('lt-name').value.trim(),
    tier_order: 0,
    color_code: document.getElementById('lt-color').value,
    icon: document.getElementById('lt-icon').value.trim(),
    min_spent: parseInt(document.getElementById('lt-min-spent').value) || 0,
    discount_percent: parseFloat(document.getElementById('lt-discount').value) || 0,
    free_entry: document.getElementById('lt-free-entry').checked ? 1 : 0,
    priority_booking: document.getElementById('lt-priority-booking').checked ? 1 : 0,
    personal_manager: document.getElementById('lt-personal-manager').checked ? 1 : 0,
    vip_access: document.getElementById('lt-vip-access').checked ? 1 : 0,
    auto_upgrade: parseInt(document.getElementById('lt-auto-upgrade').value),
    auto_downgrade: parseInt(document.getElementById('lt-auto-downgrade').value)
  };
  
  if (!data.tier_name) { toastErr('Введите название уровня'); return; }
  
  if (id) data.id = parseInt(id);
  
  const res = await SAPI.post('loyalty/tiers/save', data);
  
  if (res?.ok) {
    toast('✅ Уровень сохранён');
    closeModal('loyalty-tier-modal');
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

// Сохранить правило начисления
async function saveLoyaltyRule() {
  const id = document.getElementById('lr-id').value;
  const type = document.getElementById('lr-type').value;
  const data = {
    rule_name: document.getElementById('lr-name').value.trim(),
    rule_type: type,
    points_amount: type === 'spent' ? 0 : parseInt(document.getElementById('lr-points').value) || 0,
    points_percent: type === 'spent' ? parseFloat(document.getElementById('lr-percent').value) || 0 : 0,
    day_of_week: type === 'weekday' ? document.getElementById('lr-weekday').value : 'any'
  };
  
  if (!data.rule_name) { toastErr('Введите название правила'); return; }
  
  if (id) data.id = parseInt(id);
  
  const res = await SAPI.post('loyalty/rules/save', data);
  
  if (res?.ok) {
    toast('✅ Правило сохранено');
    closeModal('loyalty-rule-modal');
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

// Сохранить правило списания
async function saveLoyaltyRedemption() {
  const id = document.getElementById('lrr-id').value;
  const data = {
    rule_name: document.getElementById('lrr-name').value.trim(),
    min_points: parseInt(document.getElementById('lrr-min-points').value) || 0,
    max_points: parseInt(document.getElementById('lrr-max-points').value) || 0,
    min_bill_amount: parseInt(document.getElementById('lrr-min-bill').value) || 0,
    max_discount_percent: parseFloat(document.getElementById('lrr-max-discount').value) || 50,
    points_to_rub: parseFloat(document.getElementById('lrr-rate').value) || 1,
    can_pay_bar: document.getElementById('lrr-pay-bar').checked ? 1 : 0,
    can_pay_kitchen: document.getElementById('lrr-pay-kitchen').checked ? 1 : 0,
    can_pay_deposit: document.getElementById('lrr-pay-deposit').checked ? 1 : 0,
    can_pay_tickets: document.getElementById('lrr-pay-tickets').checked ? 1 : 0
  };
  
  if (!data.rule_name) { toastErr('Введите название правила'); return; }
  
  if (id) data.id = parseInt(id);
  
  const res = await SAPI.post('loyalty/redemption-rules/save', data);
  
  if (res?.ok) {
    toast('✅ Правило сохранено');
    closeModal('loyalty-redemption-modal');
  } else {
    toastErr(res?.error || 'Ошибка сохранения');
  }
}

// Начислить баллы
async function earnPoints() {
  const guest_id = parseInt(document.getElementById('le-guest').value);
  const points = parseInt(document.getElementById('le-points').value);
  const reason = document.getElementById('le-reason').value.trim();
  
  if (!guest_id || !points) { toastErr('Выберите гостя и введите баллы'); return; }
  
  const res = await SAPI.post('loyalty/earn', { guest_id, points_amount: points, reason });
  
  if (res?.ok) {
    toast(`✅ Начислено ${points} баллов`);
    closeModal('loyalty-earn-modal');
  } else {
    toastErr(res?.error || 'Ошибка начисления');
  }
}

// Списать баллы
async function spendPoints() {
  const guest_id = parseInt(document.getElementById('ls-guest').value);
  const points = parseInt(document.getElementById('ls-points').value);
  const reason = document.getElementById('ls-reason').value.trim();
  
  if (!guest_id || !points) { toastErr('Выберите гостя и введите баллы'); return; }
  
  const res = await SAPI.post('loyalty/spend', { guest_id, points_amount: points, reason });
  
  if (res?.ok) {
    toast(`✅ Списано ${points} баллов`);
    closeModal('loyalty-spend-modal');
  } else {
    toastErr(res?.error || 'Ошибка списания');
  }
}

// ── TELEGRAM БОТ (ФУНКЦИИ) ─────────────────────────────────

// Настроить webhook в Telegram
async function setupTelegramWebhook() {
  const token = document.getElementById('tg-token').value.trim();
  const webhook = document.getElementById('tg-webhook').value.trim();
  
  if (!token || !webhook) {
    toastErr('Введите токен и webhook URL');
    return;
  }
  
  // Отправляем запрос напрямую к Telegram API
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhook)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      toastOk('✅ Webhook настроен!');
    } else {
      toastErr('❌ ' + data.description);
    }
  } catch (e) {
    toastErr('❌ Ошибка подключения');
  }
}

// Проверка статуса бота
async function checkTelegramBot() {
  const token = document.getElementById('tg-token').value.trim();
  
  if (!token) {
    toastErr('Введите токен');
    return;
  }
  
  const url = `https://api.telegram.org/bot${token}/getMe`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      const bot = data.result;
      toastOk(`✅ @${bot.username} — бот найден`);
    } else {
      toastErr('❌ ' + data.description);
    }
  } catch (e) {
    toastErr('❌ Ошибка подключения');
  }
}


// ── SERVICE WORKER ────────────────────────────────────────────
// Временно отключён для отладки
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').catch(() => {});
//   });
// }

// ── INIT ──

// ── INIT ──
window.addEventListener('DOMContentLoaded', checkSession);
