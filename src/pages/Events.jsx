import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarDays, Clock, Eye } from 'lucide-react'
import api from '../api/client'
import { EVENT_STATUSES, EVENT_TYPES } from '../utils/constants'
import EventsCalendar from '../components/events/EventsCalendar'
import EventModal from '../components/events/EventModal'
import EventDetailsModal from '../components/events/EventDetailsModal'

function toDateKey(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [shifts, setShifts] = useState([])
  const [finances, setFinances] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailsEvent, setDetailsEvent] = useState(null)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    setError('')
    const [eventsRes, tasksRes, shiftsRes, financesRes, payrollsRes, checklistRes, staffRes] = await Promise.all([
      api.get('events/list'),
      api.get('tasks/list'),
      api.get('shifts/list'),
      api.get('finances/list'),
      api.get('payroll/list'),
      api.get('event/checklist/list'),
      api.get('staff/list'),
    ])
    if (eventsRes?.events) {
      setEvents(eventsRes.events)
    } else {
      setEvents([])
      setError(eventsRes?.error || 'Не удалось загрузить события')
    }
    setTasks(tasksRes?.tasks || [])
    setShifts(shiftsRes?.shifts || [])
    setFinances(financesRes?.finances || [])
    setPayrolls(payrollsRes?.payrolls || payrollsRes?.salaries || [])
    setChecklistItems(checklistRes?.items || [])
    setStaff(staffRes?.staff || [])
    setLoading(false)
  }

  const filtered = useMemo(
    () => events.filter(eventItem => filter === 'all' || eventItem.status === filter),
    [events, filter]
  )

  const selectedDayEvents = useMemo(
    () => filtered.filter(eventItem => eventItem.date === selectedDate),
    [filtered, selectedDate]
  )

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '—'
    const date = new Date(`${selectedDate}T00:00:00`)
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }, [selectedDate])

  function openNew(date = selectedDate) {
    setEditEvent({
      title: '',
      date,
      time_start: '',
      time_end: '',
      status: 'draft',
      event_type: 'standard',
      expected_guests: 0,
      budget_plan: 0,
      description: '',
    })
    setShowModal(true)
  }

  async function saveEvent(data) {
    const res = await api.post('event/save', data)
    if (res?.ok) {
      setShowModal(false)
      setEditEvent(null)
      await loadEvents()
      return { ok: true }
    }
    return { ok: false, error: res?.error || 'Не удалось сохранить событие' }
  }

  function goPrevMonth() {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goNextMonth() {
    setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function openDetails(eventItem) {
    setDetailsEvent(eventItem)
    setShowDetails(true)
  }

  async function toggleChecklistItem(item, done) {
    const res = await api.post('event/checklist/toggle', { id: item.id, done })
    if (!res?.ok) return { ok: false, error: res?.error || 'Не удалось обновить пункт' }
    await loadEvents()
    setDetailsEvent(prev => (prev ? { ...prev } : prev))
    return { ok: true }
  }

  async function updateChecklistItem(item, data) {
    const res = await api.post('event/checklist/update', {
      id: item.id,
      assignee_id: data.assignee_id,
      deadline: data.deadline,
      note: data.note,
    })
    if (!res?.ok) return { ok: false, error: res?.error || 'Не удалось обновить данные пункта' }
    await loadEvents()
    setDetailsEvent(prev => (prev ? { ...prev } : prev))
    return { ok: true }
  }

  async function createTaskFromChecklist(item) {
    const res = await api.post('event/checklist/create-task', { checklist_id: item.id })
    if (!res?.ok) return { ok: false, error: res?.error || 'Не удалось создать задачу' }
    await loadEvents()
    setDetailsEvent(prev => (prev ? { ...prev } : prev))
    return { ok: true, task: res.task }
  }

  async function setEventStatus(status) {
    if (!detailsEvent?.id) return { ok: false, error: 'Событие не выбрано' }
    const res = await api.post('event/status/set', { event_id: detailsEvent.id, status })
    if (!res?.ok) return { ok: false, error: res?.error || 'Не удалось обновить этап' }
    await loadEvents()
    setDetailsEvent(prev => (prev ? { ...prev, status } : prev))
    return { ok: true }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <CalendarDays size={22} className="text-brand-400" />
          События
        </h1>
        <button onClick={() => openNew()} className="btn-primary">
          <Plus size={16} /> Новое событие
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>Все</FilterPill>
        {Object.entries(EVENT_STATUSES).map(([key, statusItem]) => (
          <FilterPill key={key} active={filter === key} onClick={() => setFilter(key)}>
            {statusItem.label}
          </FilterPill>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <EventsCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            events={filtered}
            onSelectDate={setSelectedDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
          />

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-surface-700 capitalize">{selectedDateLabel}</h2>
                <p className="text-xs text-surface-400 mt-0.5">Событий: {selectedDayEvents.length}</p>
              </div>
              <button onClick={() => openNew(selectedDate)} className="btn-secondary">
                <Plus size={14} /> Добавить на этот день
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays size={36} className="mx-auto text-surface-300 mb-3" />
                <p className="text-surface-400 text-sm">На выбранную дату событий нет</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayEvents.map(eventItem => {
                  const statusItem = EVENT_STATUSES[eventItem.status] || EVENT_STATUSES.draft
                  return (
                    <div key={eventItem.id} className="w-full rounded-lg border border-surface-100 bg-white px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-surface-700 truncate">{eventItem.title}</p>
                          <p className="text-xs text-surface-400 mt-1 flex items-center gap-1.5">
                            <Clock size={12} />
                            {eventItem.time_start || '—'} — {eventItem.time_end || '—'}
                          </p>
                          <p className="text-[11px] text-surface-400 mt-1">
                            {EVENT_TYPES[eventItem.event_type]?.label || 'Стандартное'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${statusItem.color}`}>{statusItem.label}</span>
                          <button
                            type="button"
                            onClick={() => openDetails(eventItem)}
                            className="btn-secondary px-2 py-1 text-xs"
                          >
                            <Eye size={12} /> Углубиться
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditEvent({ ...eventItem }); setShowModal(true) }}
                            className="btn-secondary px-2 py-1 text-xs"
                          >
                            Ред.
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showModal && editEvent && (
        <EventModal
          event={editEvent}
          onSave={saveEvent}
          onClose={() => { setShowModal(false); setEditEvent(null) }}
        />
      )}

      {showDetails && detailsEvent && (
        <EventDetailsModal
          event={detailsEvent}
          tasks={tasks}
          shifts={shifts}
          finances={finances}
          payrolls={payrolls}
          checklistItems={checklistItems}
          staff={staff}
          onEdit={() => {
            setShowDetails(false)
            setEditEvent({ ...detailsEvent })
            setShowModal(true)
          }}
          onToggleChecklist={toggleChecklistItem}
          onUpdateChecklist={updateChecklistItem}
          onCreateTaskFromChecklist={createTaskFromChecklist}
          onSetStatus={setEventStatus}
          onClose={() => { setShowDetails(false); setDetailsEvent(null) }}
        />
      )}
    </div>
  )
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-brand-400/10 text-brand-500' : 'bg-white border border-surface-200 text-surface-500 hover:bg-surface-50'
      }`}
    >
      {children}
    </button>
  )
}
