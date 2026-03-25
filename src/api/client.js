// ============================================
// RAVEZ OS — API Client
// Connects to PHP backend or local mock API
// ============================================

const BASE_URL = 'https://ravez-one.ru/backend/api.php'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
const MOCK_LOGIN = import.meta.env.VITE_MOCK_LOGIN || 'demo'
const MOCK_PASSWORD = import.meta.env.VITE_MOCK_PASSWORD || 'demo'
const MOCK_TOKEN = 'mock_staff_token'

const DIRECTION_NAMES = {
  1: 'Операционный блок',
  2: 'Творческий блок',
  3: 'Блок развития',
  4: 'Финансовый блок',
}

const EVENT_LIFECYCLE = ['draft', 'planning', 'confirmed', 'in_progress', 'completed']

const EVENT_CHECKLIST_TEMPLATE = {
  draft: [
    'Создать карточку события',
    'Назначить ответственных (РП/модули)',
    'Утвердить плановый бюджет',
  ],
  planning: [
    'Сформирован контент-план',
    'Согласованы DJ и световой пресет',
    'Открыты задачи по подготовке',
  ],
  confirmed: [
    'Подтверждены смены команды',
    'Проверена готовность площадки и бара',
    'Проверены брони и тарифы входа',
  ],
  in_progress: [
    'Включен live-контроль входа/кассы',
    'Зафиксированы инциденты (если были)',
    'Собраны данные выручки за событие',
  ],
  completed: [
    'Собран финансовый разбор (P&L)',
    'Проверена зарплатная ведомость',
    'Заполнены выводы по мероприятию',
  ],
}

const mockDb = {
  directions: [
    { id: 1, name: 'Операционный блок', owner_role: 'admin' },
    { id: 2, name: 'Творческий блок', owner_role: 'art_director' },
    { id: 3, name: 'Блок развития', owner_role: 'dev_director' },
    { id: 4, name: 'Финансовый блок', owner_role: 'accountant' },
  ],
  modules: [
    { id: 1, title: 'Бар', direction_id: 1, owner_id: 3, lead_id: 7, photo: '', active: true },
    { id: 2, title: 'Охрана', direction_id: 1, owner_id: 3, lead_id: 8, photo: '', active: true },
    { id: 3, title: 'Гардероб', direction_id: 1, owner_id: 3, lead_id: 9, photo: '', active: true },
    { id: 4, title: 'DJ + Свет/Звук', direction_id: 2, owner_id: 4, lead_id: 10, photo: '', active: true },
    { id: 5, title: 'SMM и Контент', direction_id: 2, owner_id: 4, lead_id: 11, photo: '', active: true },
    { id: 6, title: 'Промо и Амбассадоры', direction_id: 2, owner_id: 4, lead_id: 14, photo: '', active: true },
    { id: 7, title: 'Развитие и партнерства', direction_id: 3, owner_id: 5, lead_id: 16, photo: '', active: true },
  ],
  staff: [
    { id: 1, name: 'Основатель', role: 'owner', org_level: 'gd', direction_id: null, module_id: null, manager_id: null, login: MOCK_LOGIN, phone: '+7 900 111-11-11', email: 'owner@ravez.ru', city: 'Казань', birthday: '1988-06-10', bio: 'Генеральное управление клубом.', photo: '', active: true },
    { id: 2, name: 'Операционный директор', role: 'director', org_level: 'zgd', direction_id: 1, module_id: null, manager_id: 1, login: 'oper', phone: '+7 900 222-22-22', email: 'oper@ravez.ru', city: 'Казань', birthday: '1992-03-21', bio: 'Курирует операционные процессы клуба.', photo: '', active: true },
    { id: 3, name: 'Руководитель проекта (Управляющий)', role: 'admin', org_level: 'rp', direction_id: 1, module_id: null, manager_id: 2, login: 'admin', phone: '+7 900 333-33-33', email: 'admin@ravez.ru', city: 'Казань', birthday: '1995-01-11', bio: 'Руководитель операционного блока.', photo: '', active: true },
    { id: 4, name: 'Арт-директор', role: 'art_director', org_level: 'rp', direction_id: 2, module_id: null, manager_id: 2, login: 'art', phone: '+7 900 444-44-44', email: 'art@ravez.ru', city: 'Казань', birthday: '1994-08-08', bio: 'Руководитель творческого блока.', photo: '', active: true },
    { id: 5, name: 'Директор по развитию', role: 'dev_director', org_level: 'rp', direction_id: 3, module_id: null, manager_id: 2, login: 'dev', phone: '+7 900 555-55-55', email: 'dev@ravez.ru', city: 'Казань', birthday: '1996-05-14', bio: 'Руководитель блока развития.', photo: '', active: true },
    { id: 6, name: 'Бухгалтер', role: 'accountant', org_level: 'rp', direction_id: 4, module_id: null, manager_id: 1, login: 'acc', phone: '+7 900 666-66-66', email: 'accountant@ravez.ru', city: 'Казань', birthday: '1990-12-01', bio: 'Учет и отчетность по финансам.', photo: '', active: true },
    { id: 7, name: 'Главный специалист бара', role: 'bartender', org_level: 'mrp', direction_id: 1, module_id: 1, manager_id: 3, login: 'bar_lead', phone: '+7 900 777-70-01', email: 'bar.lead@ravez.ru', city: 'Казань', birthday: '1997-02-12', bio: 'Руководитель модуля бар.', photo: '', active: true },
    { id: 8, name: 'Главный специалист охраны', role: 'security', org_level: 'mrp', direction_id: 1, module_id: 2, manager_id: 3, login: 'sec_lead', phone: '+7 900 777-70-02', email: 'security.lead@ravez.ru', city: 'Казань', birthday: '1993-11-20', bio: 'Руководитель модуля охрана.', photo: '', active: true },
    { id: 9, name: 'Главный специалист гардероба', role: 'hostess', org_level: 'mrp', direction_id: 1, module_id: 3, manager_id: 3, login: 'wardrobe_lead', phone: '+7 900 777-70-03', email: 'wardrobe.lead@ravez.ru', city: 'Казань', birthday: '1999-04-15', bio: 'Руководитель модуля гардероб.', photo: '', active: true },
    { id: 10, name: 'Главный специалист DJ+Свет', role: 'dj', org_level: 'mrp', direction_id: 2, module_id: 4, manager_id: 4, login: 'dj_lead', phone: '+7 900 777-70-04', email: 'dj.lead@ravez.ru', city: 'Казань', birthday: '1996-07-27', bio: 'Руководитель шоу-модуля.', photo: '', active: true },
    { id: 11, name: 'Главный специалист SMM', role: 'smm', org_level: 'mrp', direction_id: 2, module_id: 5, manager_id: 4, login: 'smm_lead', phone: '+7 900 777-70-05', email: 'smm.lead@ravez.ru', city: 'Казань', birthday: '1998-09-14', bio: 'Руководитель контент-модуля.', photo: '', active: true },
    { id: 12, name: 'Дизайнер', role: 'designer', org_level: 'vs', direction_id: 2, module_id: 5, manager_id: 11, login: 'designer_1', phone: '+7 900 777-70-06', email: 'designer@ravez.ru', city: 'Казань', birthday: '2001-03-02', bio: 'Визуалы и креативы.', photo: '', active: true },
    { id: 13, name: 'Сторис-мейкер', role: 'stories_maker', org_level: 'vs', direction_id: 2, module_id: 5, manager_id: 11, login: 'stories_1', phone: '+7 900 777-70-07', email: 'stories@ravez.ru', city: 'Казань', birthday: '2001-10-09', bio: 'Контент в сторис и рилс.', photo: '', active: true },
    { id: 14, name: 'Главный специалист промо', role: 'promoter', org_level: 'mrp', direction_id: 2, module_id: 6, manager_id: 4, login: 'promo_lead', phone: '+7 900 777-70-08', email: 'promo.lead@ravez.ru', city: 'Казань', birthday: '1997-06-23', bio: 'Руководитель полевого модуля.', photo: '', active: true },
    { id: 15, name: 'Амбассадор', role: 'ambassador', org_level: 's', direction_id: 2, module_id: 6, manager_id: 14, login: 'amb_1', phone: '+7 900 777-70-09', email: 'ambassador@ravez.ru', city: 'Казань', birthday: '2002-04-08', bio: 'Полевой блок привлечения гостей.', photo: '', active: true },
    { id: 16, name: 'Главный специалист развития', role: 'dev_director', org_level: 'mrp', direction_id: 3, module_id: 7, manager_id: 5, login: 'growth_lead', phone: '+7 900 777-70-10', email: 'growth.lead@ravez.ru', city: 'Казань', birthday: '1995-07-18', bio: 'Ведет проекты развития и партнерства.', photo: '', active: true },
  ],
  tasks: [
    { id: 1, event_id: 1, title: 'Проверить бронь столов', status: 'in_progress', assigned_to: 3, deadline: '2026-03-27' },
    { id: 2, event_id: 1, title: 'Подготовить свет к сету DJ', status: 'todo', assigned_to: 10, deadline: '2026-03-27' },
  ],
  events: [
    {
      id: 1,
      title: 'Friday Night',
      event_type: 'standard',
      date: '2026-03-27',
      time_start: '22:00',
      time_end: '05:00',
      status: 'planning',
      expected_guests: 350,
      budget_plan: 280000,
      description: 'Основная пятничная вечеринка',
    },
  ],
  shifts: [
    { id: 1, event_id: 1, staff_id: 7, date: '2026-03-27', time_start: '20:00', time_end: '04:00' },
    { id: 2, event_id: 1, staff_id: 8, date: '2026-03-27', time_start: '20:00', time_end: '04:00' },
    { id: 3, event_id: 1, staff_id: 10, date: '2026-03-27', time_start: '21:00', time_end: '04:00' },
  ],
  finances: [
    { id: 1, event_id: 1, type: 'income', amount: 120000, category: 'bar', description: 'Выручка бара', date: '2026-03-27' },
    { id: 2, event_id: 1, type: 'income', amount: 45000, category: 'entrance', description: 'Входные билеты', date: '2026-03-27' },
    { id: 3, event_id: 1, type: 'expense', amount: 38000, category: 'bar_cost', description: 'Закупка бара', date: '2026-03-27' },
    { id: 4, type: 'expense', amount: 150000, category: 'rent', description: 'Аренда', date: '2026-03-01' },
  ],
  guests: [],
  salaries: [],
  payroll_rules: [
    { id: 1, staff_id: 3, model: 'fixed', fixed_amount: 70000, rate_per_shift: 0, percent_rate: 0, piece_rate: 0, bonus_fixed: 0 },
    { id: 2, staff_id: 4, model: 'fixed', fixed_amount: 80000, rate_per_shift: 0, percent_rate: 0, piece_rate: 0, bonus_fixed: 0 },
    { id: 3, staff_id: 12, model: 'piecework', fixed_amount: 0, rate_per_shift: 0, percent_rate: 0, piece_rate: 1500, bonus_fixed: 0 },
  ],
  payrolls: [],
  event_checklists: [],
  tiers: [{ id: 1, name: 'Base', discount: 0 }, { id: 2, name: 'VIP', discount: 10 }],
  integrations: [
    { id: 1, name: 'Telegram bot', status: 'active' },
    { id: 2, name: 'iiko', status: 'planned' },
  ],
}

function getToken() {
  return localStorage.getItem('staff_token')
}

function setToken(token) {
  localStorage.setItem('staff_token', token)
}

function clearToken() {
  localStorage.removeItem('staff_token')
}

function getMockUserByToken() {
  const token = getToken()
  if (token !== MOCK_TOKEN) return null
  return mockDb.staff[0] || null
}

function getNextId(items) {
  if (!Array.isArray(items) || items.length === 0) return 1
  return Math.max(...items.map(item => Number(item.id) || 0)) + 1
}

function enrichStaff(person) {
  return {
    ...person,
    direction: DIRECTION_NAMES[person.direction_id] || person.direction || '',
    module_name: mockDb.modules.find(moduleItem => moduleItem.id === person.module_id)?.title || person.module_name || '',
  }
}

function canManageDirection(current, directionId) {
  if (!current) return false
  const fullAccessRoles = ['hq', 'owner', 'director', 'admin']
  const leadershipRoles = ['hq', 'owner', 'director', 'admin', 'art_director', 'dev_director', 'accountant']
  if (!leadershipRoles.includes(current.role)) return false
  if (fullAccessRoles.includes(current.role)) return true
  return Number(current.direction_id) === Number(directionId)
}

function ensureEventChecklist(eventId) {
  EVENT_LIFECYCLE.forEach(stage => {
    const stageItems = EVENT_CHECKLIST_TEMPLATE[stage] || []
    stageItems.forEach((label, idx) => {
      const key = `${stage}-${idx}`
      const existing = mockDb.event_checklists.find(item => (
        Number(item.event_id) === Number(eventId)
        && item.stage === stage
        && item.item_key === key
      ))
      if (!existing) {
        mockDb.event_checklists.push({
          id: getNextId(mockDb.event_checklists),
          event_id: Number(eventId),
          stage,
          item_key: key,
          label,
          done: false,
          assignee_id: null,
          deadline: '',
          note: '',
          task_id: null,
        })
      }
    })
  })
}

function canMoveEventToStatus(eventId, nextStatus) {
  const current = mockDb.events.find(item => Number(item.id) === Number(eventId))
  if (!current) return { ok: false, error: 'Событие не найдено' }
  if (nextStatus === 'cancelled') return { ok: true }
  const currentIdx = EVENT_LIFECYCLE.indexOf(current.status)
  const nextIdx = EVENT_LIFECYCLE.indexOf(nextStatus)
  if (nextIdx === -1) return { ok: false, error: 'Недопустимый этап' }
  if (currentIdx === -1) return { ok: false, error: 'Текущий этап не поддерживается' }
  if (nextIdx > currentIdx + 1) return { ok: false, error: 'Можно перейти только на следующий этап' }
  if (nextIdx <= currentIdx) return { ok: true }

  ensureEventChecklist(eventId)
  const required = mockDb.event_checklists.filter(item => (
    Number(item.event_id) === Number(eventId) && item.stage === current.status
  ))
  const notDone = required.filter(item => !item.done)
  if (notDone.length > 0) {
    return { ok: false, error: 'Закройте все пункты текущего этапа перед переходом' }
  }
  const missingResponsible = required.filter(item => !item.assignee_id)
  if (missingResponsible.length > 0) {
    return { ok: false, error: 'Назначьте ответственных по всем пунктам текущего этапа' }
  }
  const missingDeadline = required.filter(item => !item.deadline)
  if (missingDeadline.length > 0) {
    return { ok: false, error: 'Укажите дедлайны по всем пунктам текущего этапа' }
  }
  return { ok: true }
}

async function mockRequest(action, options = {}) {
  const { method = 'GET', body = null } = options
  const payload = body || {}
  const current = getMockUserByToken()

  if (action === 'staff/login' && method === 'POST') {
    const login = (payload.login || '').trim()
    const password = (payload.password || '').trim()
    if (!login || !password) return { error: 'Введите логин и пароль' }
    if (login !== MOCK_LOGIN || password !== MOCK_PASSWORD) {
      return { error: `Тестовый вход: ${MOCK_LOGIN}/${MOCK_PASSWORD}` }
    }
    return { ok: true, token: MOCK_TOKEN, staff: enrichStaff(mockDb.staff[0]) }
  }

  if (action === 'staff/me' && method === 'GET') {
    if (!current) return { error: 'Требуется авторизация' }
    return { ok: true, staff: enrichStaff(current) }
  }

  if (action === 'staff/profile/save' && method === 'POST') {
    if (!current) return { error: 'Требуется авторизация' }
    if (!payload.name?.trim()) return { error: 'Имя обязательно' }
    mockDb.staff = mockDb.staff.map(person => (
      person.id === current.id
        ? { ...person, ...payload, id: current.id, name: payload.name.trim() }
        : person
    ))
    return { ok: true }
  }

  if (action === 'staff/list' && method === 'GET') return { ok: true, staff: mockDb.staff.map(enrichStaff) }
  if (action === 'org/directions/list' && method === 'GET') return { ok: true, directions: mockDb.directions }
  if (action === 'org/modules/list' && method === 'GET') {
    return {
      ok: true,
      modules: mockDb.modules.map(moduleItem => ({
        ...moduleItem,
        direction_name: DIRECTION_NAMES[moduleItem.direction_id] || '',
        owner_name: mockDb.staff.find(person => person.id === moduleItem.owner_id)?.name || '',
      })),
    }
  }

  if (action === 'org/module/save' && method === 'POST') {
    if (!payload.title?.trim()) return { error: 'Название модуля обязательно' }
    if (!payload.direction_id) return { error: 'Выберите направление' }
    if (!canManageDirection(current, payload.direction_id)) return { error: 'Нет доступа к этому направлению' }

    const item = {
      ...payload,
      id: payload.id || getNextId(mockDb.modules),
      title: payload.title.trim(),
      direction_id: Number(payload.direction_id),
      owner_id: payload.owner_id ? Number(payload.owner_id) : null,
      lead_id: payload.lead_id ? Number(payload.lead_id) : null,
      active: payload.active !== false,
      photo: payload.photo || '',
    }
    if (payload.id) {
      mockDb.modules = mockDb.modules.map(moduleItem => (moduleItem.id === payload.id ? item : moduleItem))
    } else {
      mockDb.modules.push(item)
    }
    return { ok: true, module: item }
  }

  if (action === 'staff/save' && method === 'POST') {
    if (!payload.name?.trim()) return { error: 'Имя сотрудника обязательно' }
    if (payload.direction_id && !canManageDirection(current, payload.direction_id)) {
      return { error: 'Вы можете редактировать только свое направление' }
    }
    const item = {
      ...payload,
      name: payload.name.trim(),
      direction_id: payload.direction_id ? Number(payload.direction_id) : null,
      module_id: payload.module_id ? Number(payload.module_id) : null,
      manager_id: payload.manager_id ? Number(payload.manager_id) : null,
      id: payload.id || getNextId(mockDb.staff),
    }
    if (payload.id) {
      mockDb.staff = mockDb.staff.map(person => (person.id === payload.id ? item : person))
    } else {
      mockDb.staff.push(item)
    }
    return { ok: true, staff: enrichStaff(item) }
  }

  if (action === 'tasks/list' && method === 'GET') return { ok: true, tasks: mockDb.tasks }
  if (action === 'events/list' && method === 'GET') {
    mockDb.events.forEach(eventItem => ensureEventChecklist(eventItem.id))
    return { ok: true, events: mockDb.events }
  }
  if (action === 'event/checklist/list' && method === 'GET') {
    mockDb.events.forEach(eventItem => ensureEventChecklist(eventItem.id))
    return { ok: true, items: mockDb.event_checklists }
  }
  if (action === 'shifts/list' && method === 'GET') return { ok: true, shifts: mockDb.shifts }
  if (action === 'finances/list' && method === 'GET') return { ok: true, finances: mockDb.finances }
  if (action === 'guests/list' && method === 'GET') return { ok: true, guests: mockDb.guests }
  if (action === 'salary/list' && method === 'GET') return { ok: true, salaries: mockDb.salaries }
  if (action === 'payroll/list' && method === 'GET') return { ok: true, payrolls: mockDb.payrolls }
  if (action === 'payroll/rules/list' && method === 'GET') return { ok: true, rules: mockDb.payroll_rules }
  if (action === 'loyalty/tiers' && method === 'GET') return { ok: true, tiers: mockDb.tiers }
  if (action === 'integrations/list' && method === 'GET') return { ok: true, integrations: mockDb.integrations }
  if (action === 'analytics/dashboard' && method === 'GET') {
    return {
      ok: true,
      stats: {
        today_revenue: 120000,
        guests_today: 380,
        open_tasks: mockDb.tasks.filter(taskItem => taskItem.status !== 'done').length,
        events_week: mockDb.events.length,
      },
    }
  }

  if (action === 'task/save' && method === 'POST') {
    const item = { ...payload, id: payload.id || getNextId(mockDb.tasks) }
    if (payload.id) {
      mockDb.tasks = mockDb.tasks.map(taskItem => (taskItem.id === payload.id ? item : taskItem))
    } else {
      mockDb.tasks.push(item)
    }
    return { ok: true, task: item }
  }

  if (action === 'event/save' && method === 'POST') {
    const item = { ...payload, id: payload.id || getNextId(mockDb.events) }
    if (payload.id) {
      mockDb.events = mockDb.events.map(eventItem => (eventItem.id === payload.id ? item : eventItem))
    } else {
      mockDb.events.push(item)
    }
    ensureEventChecklist(item.id)
    return { ok: true, event: item }
  }

  if (action === 'event/checklist/toggle' && method === 'POST') {
    if (!payload.id) return { error: 'Не указан пункт чек-листа' }
    mockDb.event_checklists = mockDb.event_checklists.map(item => (
      Number(item.id) === Number(payload.id) ? { ...item, done: payload.done === true } : item
    ))
    return { ok: true }
  }

  if (action === 'event/checklist/update' && method === 'POST') {
    if (!payload.id) return { error: 'Не указан пункт чек-листа' }
    mockDb.event_checklists = mockDb.event_checklists.map(item => (
      Number(item.id) === Number(payload.id)
        ? {
          ...item,
          assignee_id: payload.assignee_id ? Number(payload.assignee_id) : null,
          deadline: payload.deadline || '',
          note: payload.note || '',
          task_id: payload.task_id ? Number(payload.task_id) : (item.task_id || null),
        }
        : item
    ))
    return { ok: true }
  }

  if (action === 'event/checklist/create-task' && method === 'POST') {
    if (!payload.checklist_id) return { error: 'Не указан пункт чек-листа' }
    const checklist = mockDb.event_checklists.find(item => Number(item.id) === Number(payload.checklist_id))
    if (!checklist) return { error: 'Пункт чек-листа не найден' }
    if (checklist.task_id) {
      return { ok: true, task: mockDb.tasks.find(task => Number(task.id) === Number(checklist.task_id)) || null }
    }
    const taskItem = {
      id: getNextId(mockDb.tasks),
      event_id: Number(checklist.event_id),
      title: checklist.label,
      description: checklist.note || '',
      status: 'new',
      assigned_to: checklist.assignee_id ? Number(checklist.assignee_id) : null,
      deadline: checklist.deadline || '',
    }
    mockDb.tasks.push(taskItem)
    mockDb.event_checklists = mockDb.event_checklists.map(item => (
      Number(item.id) === Number(payload.checklist_id)
        ? { ...item, task_id: taskItem.id }
        : item
    ))
    return { ok: true, task: taskItem }
  }

  if (action === 'event/status/set' && method === 'POST') {
    if (!payload.event_id || !payload.status) return { error: 'Нужны event_id и status' }
    const check = canMoveEventToStatus(payload.event_id, payload.status)
    if (!check.ok) return { error: check.error }
    mockDb.events = mockDb.events.map(item => (
      Number(item.id) === Number(payload.event_id)
        ? { ...item, status: payload.status }
        : item
    ))
    return { ok: true }
  }

  if (action === 'shift/save' && method === 'POST') {
    const item = {
      ...payload,
      event_id: payload.event_id ? Number(payload.event_id) : null,
      id: payload.id || getNextId(mockDb.shifts),
    }
    if (payload.id) {
      mockDb.shifts = mockDb.shifts.map(shiftItem => (shiftItem.id === payload.id ? item : shiftItem))
    } else {
      mockDb.shifts.push(item)
    }
    return { ok: true, shift: item }
  }

  if (action === 'finance/save' && method === 'POST') {
    const item = {
      ...payload,
      event_id: payload.event_id ? Number(payload.event_id) : null,
      id: payload.id || getNextId(mockDb.finances),
    }
    if (payload.id) {
      mockDb.finances = mockDb.finances.map(record => (record.id === payload.id ? item : record))
    } else {
      mockDb.finances.push(item)
    }
    return { ok: true, finance: item }
  }

  if (action === 'payroll/rule/save' && method === 'POST') {
    if (!payload.staff_id) return { error: 'Не выбран сотрудник' }
    if (!payload.model) return { error: 'Не выбрана модель зарплаты' }
    const existing = mockDb.payroll_rules.find(item => Number(item.staff_id) === Number(payload.staff_id))
    const item = {
      ...(existing || {}),
      ...payload,
      id: existing?.id || getNextId(mockDb.payroll_rules),
      staff_id: Number(payload.staff_id),
      fixed_amount: Number(payload.fixed_amount || 0),
      rate_per_shift: Number(payload.rate_per_shift || 0),
      percent_rate: Number(payload.percent_rate || 0),
      piece_rate: Number(payload.piece_rate || 0),
      bonus_fixed: Number(payload.bonus_fixed || 0),
    }
    if (existing) {
      mockDb.payroll_rules = mockDb.payroll_rules.map(rule => (rule.id === existing.id ? item : rule))
    } else {
      mockDb.payroll_rules.push(item)
    }
    return { ok: true, rule: item }
  }

  if (action === 'payroll/calc' && method === 'POST') {
    const dateFrom = payload.date_from || new Date().toISOString().split('T')[0]
    const dateTo = payload.date_to || dateFrom
    const monthIncome = mockDb.finances
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const nextIdStart = getNextId(mockDb.payrolls)
    const generated = mockDb.payroll_rules.map((rule, idx) => {
      const staffMember = mockDb.staff.find(person => Number(person.id) === Number(rule.staff_id))
      const staffShifts = mockDb.shifts.filter(shift => Number(shift.staff_id) === Number(rule.staff_id))
      const shiftCount = staffShifts.length || 1
      const eventId = staffShifts[0]?.event_id || null
      const pieceUnits = staffMember?.role === 'designer' ? 20 : 0
      let amount = 0

      if (rule.model === 'fixed') {
        amount = Number(rule.fixed_amount || 0) + Number(rule.bonus_fixed || 0)
      } else if (rule.model === 'per_shift') {
        amount = (Number(rule.rate_per_shift || 0) * shiftCount) + Number(rule.bonus_fixed || 0)
      } else if (rule.model === 'percent_revenue') {
        amount = (monthIncome * Number(rule.percent_rate || 0) / 100) + Number(rule.bonus_fixed || 0)
      } else if (rule.model === 'piecework') {
        amount = (pieceUnits * Number(rule.piece_rate || 0)) + Number(rule.bonus_fixed || 0)
      } else {
        amount = Number(rule.fixed_amount || 0)
          + (Number(rule.rate_per_shift || 0) * shiftCount)
          + (monthIncome * Number(rule.percent_rate || 0) / 100)
          + (pieceUnits * Number(rule.piece_rate || 0))
          + Number(rule.bonus_fixed || 0)
      }

      return {
        id: nextIdStart + idx,
        staff_id: Number(rule.staff_id),
        model: rule.model,
        amount: Math.round(amount),
        status: 'ready',
        date_from: dateFrom,
        date_to: dateTo,
        event_id: eventId,
      }
    })

    mockDb.payrolls = generated
    return { ok: true, payrolls: generated }
  }

  if (action === 'payroll/mark-paid' && method === 'POST') {
    if (!payload.id) return { error: 'Не указан id начисления' }
    mockDb.payrolls = mockDb.payrolls.map(item => (
      Number(item.id) === Number(payload.id)
        ? { ...item, status: 'paid', paid_at: new Date().toISOString() }
        : item
    ))
    return { ok: true }
  }

  if (action === 'iiko/sales' && method === 'POST') {
    return {
      ok: true,
      data: {
        total_revenue: 1850000,
        bar_revenue: 1320000,
        entrance_revenue: 530000,
        source: 'mock_iiko',
      },
    }
  }

  if (action === 'iiko/bar-sales' && method === 'POST') {
    return { ok: true, items: [] }
  }

  if (action === 'iiko/entrance-sales' && method === 'POST') {
    return { ok: true, data: { amount: 530000, source: 'mock_iiko' } }
  }

  return { error: `Mock endpoint not implemented: ${action}` }
}

async function request(action, options = {}) {
  if (USE_MOCK_API) {
    return mockRequest(action, options)
  }

  const { method = 'GET', body = null } = options
  const token = getToken()
  const url = `${BASE_URL}?a=${action}`

  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['X-Staff-Token'] = token
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
      return null
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error(`API error [${action}]:`, err)
    return { error: 'Ошибка подключения к серверу' }
  }
}

const api = {
  get: action => request(action, { method: 'GET' }),
  post: (action, body) => request(action, { method: 'POST', body }),
  setToken,
  getToken,
  clearToken,
}

export default api
