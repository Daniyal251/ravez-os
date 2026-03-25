import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { EVENT_LIFECYCLE, EVENT_STATUSES, EVENT_TYPES, formatMoney } from '../../utils/constants'

const TABS = [
  { key: 'regulation', label: 'Регламент' },
  { key: 'overview', label: 'Обзор' },
  { key: 'operations', label: 'Операции' },
  { key: 'finance', label: 'Финансы' },
]

export default function EventDetailsModal({
  event,
  tasks,
  shifts,
  finances,
  payrolls,
  checklistItems,
  staff,
  onEdit,
  onToggleChecklist,
  onUpdateChecklist,
  onCreateTaskFromChecklist,
  onSetStatus,
  onClose,
}) {
  const [tab, setTab] = useState('regulation')
  const [stageError, setStageError] = useState('')

  const eventTasks = useMemo(
    () => tasks.filter(item => Number(item.event_id) === Number(event.id)),
    [tasks, event.id]
  )
  const eventShifts = useMemo(
    () => shifts.filter(item => Number(item.event_id) === Number(event.id)),
    [shifts, event.id]
  )
  const eventFinances = useMemo(
    () => finances.filter(item => Number(item.event_id) === Number(event.id)),
    [finances, event.id]
  )
  const eventPayrolls = useMemo(
    () => payrolls.filter(item => Number(item.event_id) === Number(event.id)),
    [payrolls, event.id]
  )
  const eventChecklist = useMemo(
    () => checklistItems.filter(item => Number(item.event_id) === Number(event.id)),
    [checklistItems, event.id]
  )

  const revenue = eventFinances
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const expense = eventFinances
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const salaryCost = eventPayrolls.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const pnl = revenue - expense - salaryCost

  const status = EVENT_STATUSES[event.status] || EVENT_STATUSES.draft
  const eventType = EVENT_TYPES[event.event_type]?.label || 'Стандартное'
  const currentStageIdx = EVENT_LIFECYCLE.indexOf(event.status)
  const nextStage = currentStageIdx >= 0 && currentStageIdx < EVENT_LIFECYCLE.length - 1
    ? EVENT_LIFECYCLE[currentStageIdx + 1]
    : null

  const stageProgress = useMemo(
    () => Object.fromEntries(EVENT_LIFECYCLE.map(stage => {
      const items = eventChecklist.filter(item => item.stage === stage)
      const done = items.filter(item => item.done).length
      return [stage, { done, total: items.length, complete: items.length > 0 && done === items.length }]
    })),
    [eventChecklist]
  )

  async function toggleChecklist(item, done) {
    const result = await onToggleChecklist(item, done)
    if (!result?.ok) setStageError(result?.error || 'Не удалось обновить чек-лист')
    else setStageError('')
  }

  async function updateChecklistMeta(item, field, value) {
    const payload = {
      assignee_id: item.assignee_id || null,
      deadline: item.deadline || '',
      note: item.note || '',
      [field]: value,
    }
    const result = await onUpdateChecklist(item, payload)
    if (!result?.ok) setStageError(result?.error || 'Не удалось обновить параметры пункта')
    else setStageError('')
  }

  async function moveToNextStage() {
    if (!nextStage) return
    const result = await onSetStatus(nextStage)
    if (!result?.ok) setStageError(result?.error || 'Не удалось перевести событие')
    else setStageError('')
  }

  async function createTask(item) {
    const result = await onCreateTaskFromChecklist(item)
    if (!result?.ok) setStageError(result?.error || 'Не удалось создать задачу')
    else setStageError('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-5xl max-h-[92vh] overflow-auto">
        <div className="flex items-start justify-between p-5 border-b border-surface-100">
          <div>
            <h3 className="text-base font-semibold text-surface-700">{event.title}</h3>
            <p className="text-xs text-surface-500 mt-1">
              {event.date} · {event.time_start || '—'}-{event.time_end || '—'} · {eventType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${status.color}`}>{status.label}</span>
            <button onClick={onEdit} className="btn-secondary">Редактировать</button>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TABS.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === item.key
                    ? 'bg-brand-400/10 text-brand-600 border border-brand-300'
                    : 'bg-white text-surface-500 border border-surface-200 hover:bg-surface-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'regulation' && (
            <div className="space-y-3">
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-surface-700">
                    Этап: {status.label}
                  </p>
                  {nextStage && (
                    <button onClick={moveToNextStage} className="btn-primary">
                      Перевести на: {EVENT_STATUSES[nextStage]?.label || nextStage}
                    </button>
                  )}
                </div>
                {stageError && (
                  <p className="text-sm text-red-600 mt-2">{stageError}</p>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-3">
                {EVENT_LIFECYCLE.map((stage, idx) => {
                  const info = stageProgress[stage] || { done: 0, total: 0, complete: false }
                  const items = eventChecklist.filter(item => item.stage === stage)
                  const isCurrent = idx === currentStageIdx
                  return (
                    <div key={stage} className={`rounded-lg border p-3 ${isCurrent ? 'border-brand-300 bg-brand-400/5' : 'border-surface-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-surface-700">
                          {EVENT_STATUSES[stage]?.label || stage}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${info.complete ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-100 text-surface-500'}`}>
                          {info.done}/{info.total}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-xs text-surface-400">Пункты не заданы</p>
                      ) : (
                        <div className="space-y-1.5">
                          {items.map(item => (
                            <div key={item.id} className="rounded-md border border-surface-200 bg-white p-2 space-y-2">
                              <label className="flex items-start gap-2 text-sm text-surface-600">
                                <input
                                  type="checkbox"
                                  checked={item.done === true}
                                  onChange={e => toggleChecklist(item, e.target.checked)}
                                />
                                <span>{item.label}</span>
                              </label>
                              <div className="grid sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] text-surface-500 mb-1">Ответственный</label>
                                  <select
                                    value={item.assignee_id || ''}
                                    onChange={e => updateChecklistMeta(item, 'assignee_id', e.target.value || null)}
                                  >
                                    <option value="">— Не назначен —</option>
                                    {staff.map(person => (
                                      <option key={person.id} value={person.id}>{person.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-surface-500 mb-1">Дедлайн</label>
                                  <input
                                    type="date"
                                    value={item.deadline || ''}
                                    onChange={e => updateChecklistMeta(item, 'deadline', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                {item.task_id ? (
                                  <span className="text-[11px] text-emerald-600">
                                    Задача создана: #{item.task_id}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-surface-400">Задача не создана</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => createTask(item)}
                                  className="btn-secondary px-2 py-1 text-[11px]"
                                  disabled={Boolean(item.task_id)}
                                >
                                  Создать задачу
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'overview' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric title="Задач" value={eventTasks.length} />
              <Metric title="Смен" value={eventShifts.length} />
              <Metric title="План бюджета" value={formatMoney(event.budget_plan || 0)} />
              <Metric title="План гостей" value={event.expected_guests || 0} />
            </div>
          )}

          {tab === 'operations' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Задачи мероприятия</h4>
                {eventTasks.length === 0 ? (
                  <p className="text-sm text-surface-400">Задач пока нет</p>
                ) : (
                  <div className="space-y-2">
                    {eventTasks.map(item => {
                      const assignee = staff.find(person => Number(person.id) === Number(item.assigned_to))
                      return (
                        <div key={item.id} className="rounded-lg border border-surface-200 p-2.5">
                          <p className="text-sm text-surface-700">{item.title}</p>
                          <p className="text-xs text-surface-400 mt-1">
                            {assignee?.name || 'Не назначено'} · {item.deadline || 'без дедлайна'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="card p-4">
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Смены мероприятия</h4>
                {eventShifts.length === 0 ? (
                  <p className="text-sm text-surface-400">Смен пока нет</p>
                ) : (
                  <div className="space-y-2">
                    {eventShifts.map(item => {
                      const person = staff.find(s => Number(s.id) === Number(item.staff_id))
                      return (
                        <div key={item.id} className="rounded-lg border border-surface-200 p-2.5">
                          <p className="text-sm text-surface-700">{person?.name || 'Сотрудник'}</p>
                          <p className="text-xs text-surface-400 mt-1">{item.time_start || '—'} — {item.time_end || '—'}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'finance' && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric title="Доходы" value={formatMoney(revenue)} tone="emerald" />
                <Metric title="Расходы" value={formatMoney(expense)} tone="red" />
                <Metric title="Зарплаты" value={formatMoney(salaryCost)} tone="amber" />
                <Metric title="P&L события" value={formatMoney(pnl)} tone={pnl >= 0 ? 'emerald' : 'red'} />
              </div>

              <div className="card p-4">
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Финансовые операции</h4>
                {eventFinances.length === 0 ? (
                  <p className="text-sm text-surface-400">Операции по событию не привязаны</p>
                ) : (
                  <div className="space-y-2">
                    {eventFinances.map(item => (
                      <div key={item.id} className="rounded-lg border border-surface-200 p-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-surface-700">{item.description || item.category || 'Операция'}</p>
                          <p className="text-xs text-surface-400 mt-1">{item.category || '—'}</p>
                        </div>
                        <p className={`text-sm font-semibold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {item.type === 'income' ? '+' : '−'}{formatMoney(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ title, value, tone = 'violet' }) {
  const tones = {
    emerald: 'text-emerald-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
  }
  return (
    <div className="stat-card">
      <p className="stat-label">{title}</p>
      <p className={`stat-value ${tones[tone] || tones.violet}`}>{value}</p>
    </div>
  )
}
