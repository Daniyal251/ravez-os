import { useEffect, useMemo, useState } from 'react'
import { Plus, CalendarDays, Clock } from 'lucide-react'
import api from '../api/client'
import { EVENT_STATUSES } from '../utils/constants'
import EventsCalendar from '../components/events/EventsCalendar'
import EventModal from '../components/events/EventModal'

function toDateKey(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Events() {
  const [events, setEvents] = useState([])
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

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    setError('')
    const res = await api.get('events/list')
    if (res?.events) {
      setEvents(res.events)
    } else {
      setEvents([])
      setError(res?.error || 'Не удалось загрузить события')
    }
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
    setEditEvent({ title: '', date, time_start: '', time_end: '', status: 'draft', description: '' })
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
                    <button
                      key={eventItem.id}
                      type="button"
                      onClick={() => { setEditEvent({ ...eventItem }); setShowModal(true) }}
                      className="w-full text-left rounded-lg border border-surface-100 bg-white hover:bg-surface-50 px-3.5 py-3 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-surface-700 truncate">{eventItem.title}</p>
                          <p className="text-xs text-surface-400 mt-1 flex items-center gap-1.5">
                            <Clock size={12} />
                            {eventItem.time_start || '—'} — {eventItem.time_end || '—'}
                          </p>
                        </div>
                        <span className={`badge ${statusItem.color}`}>{statusItem.label}</span>
                      </div>
                    </button>
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
