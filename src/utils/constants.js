export const ROLE_LABELS = {
  hq:                'Владелец сети',
  owner:             'Основатель',
  director:          'Операционный директор',
  dev_director:      'Директор по развитию',
  admin:             'Управляющий',
  art_director:      'Арт-директор',
  smm:               'SMM',
  designer:          'Дизайнер',
  stories_maker:     'Сторис-мейкер',
  light_tech:        'Светотехник',
  ambassador_manager:'Менеджер амбассадоров',
  ambassador:        'Амбассадор',
  promoter:          'Промоутер',
  hostess:           'Хостес',
  security:          'Охранник',
  bartender:         'Бармен',
  accountant:        'Бухгалтер',
  dj:                'DJ',
}

export const ROLE_COLORS = {
  owner:    'bg-amber-50 text-amber-700',
  director: 'bg-brand-400/10 text-brand-600',
  admin:    'bg-violet-50 text-violet-700',
  smm:      'bg-pink-50 text-pink-700',
  designer: 'bg-pink-50 text-pink-700',
  hostess:  'bg-orange-50 text-orange-700',
  security: 'bg-slate-100 text-slate-600',
  bartender:'bg-slate-100 text-slate-600',
  promoter: 'bg-orange-50 text-orange-700',
  dj:       'bg-purple-50 text-purple-700',
}

export const TASK_STATUSES = {
  new:         { label: 'Новая',      color: 'badge-info' },
  in_progress: { label: 'В работе',   color: 'badge-warning' },
  done:        { label: 'Готово',     color: 'badge-success' },
  cancelled:   { label: 'Отменена',   color: 'badge-neutral' },
}

export const EVENT_STATUSES = {
  draft:     { label: 'Черновик',    color: 'badge-neutral' },
  planning:  { label: 'Планируется', color: 'badge-warning' },
  confirmed: { label: 'Подтверждено',color: 'badge-success' },
  in_progress:{ label: 'Live',       color: 'badge-info' },
  cancelled: { label: 'Отменено',    color: 'badge-danger' },
  completed: { label: 'Завершено',   color: 'badge-info' },
}

export const EVENT_TYPES = {
  standard: { label: 'Стандартное' },
  private: { label: 'Закрытое' },
  special: { label: 'Спецпроект' },
}

export const EVENT_LIFECYCLE = ['draft', 'planning', 'confirmed', 'in_progress', 'completed']

export const SALARY_MODELS = [
  { value: 'fixed', label: 'Фикс за период' },
  { value: 'per_shift', label: 'За смену' },
  { value: 'percent_revenue', label: 'Процент от выручки' },
  { value: 'piecework', label: 'Сдельно (за единицу)' },
  { value: 'mixed', label: 'Смешанная модель' },
]

export const SALARY_MODEL_LABELS = Object.fromEntries(
  SALARY_MODELS.map(item => [item.value, item.label])
)

export const PAYROLL_STATUSES = {
  draft: { label: 'Черновик', color: 'badge-neutral' },
  ready: { label: 'К выплате', color: 'badge-warning' },
  paid: { label: 'Выплачено', color: 'badge-success' },
}

export const ORG_LEVELS = [
  { value: 'gd', label: 'ГД — Генеральный директор' },
  { value: 'zgd', label: 'ЗГД — Заместитель ГД' },
  { value: 'rp', label: 'РП — Руководитель проекта' },
  { value: 'mrp', label: 'МРП / ГС — Руководитель модуля' },
  { value: 'vs', label: 'ВС — Ведущий специалист' },
  { value: 's', label: 'С — Специалист' },
  { value: 'js', label: 'МС — Младший специалист' },
  { value: 'st_spec', label: 'Ст. спец — Наставник' },
]

export const ORG_LEVEL_LABELS = {
  ...Object.fromEntries(ORG_LEVELS.map(item => [item.value, item.label])),
  gs: 'МРП / ГС — Руководитель модуля',
}

export function formatPosition(person) {
  if (!person) return '—'
  const level = ORG_LEVEL_LABELS[person.org_level] || person.org_level || 'Должность'
  const role = ROLE_LABELS[person.role] || person.role || 'Роль'
  return `${level} (${role})`
}

export function formatMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU').format(Math.round(n))
}

export function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
