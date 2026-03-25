import { ChevronLeft, ChevronRight } from 'lucide-react'

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateKey(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

export default function EventsCalendar({
  monthDate,
  selectedDate,
  events,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}) {
  const year = monthDate.getFullYear()
  const monthIndex = monthDate.getMonth()
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const eventsByDay = events.reduce((acc, eventItem) => {
    if (!eventItem.date) return acc
    if (!acc[eventItem.date]) acc[eventItem.date] = []
    acc[eventItem.date].push(eventItem)
    return acc
  }, {})

  const today = new Date()
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const monthLabel = monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onPrevMonth} className="btn-secondary px-2.5 py-1.5">
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-semibold text-surface-700 capitalize">{monthLabel}</h2>
        <button type="button" onClick={onNextMonth} className="btn-secondary px-2.5 py-1.5">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-surface-400 mb-2">
        {weekdays.map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, idx) => (
          <div key={`blank-${idx}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1
          const dateKey = toDateKey(year, monthIndex, day)
          const dayEvents = eventsByDay[dateKey] || []
          const count = dayEvents.length
          const firstTitle = dayEvents[0]?.title || ''
          const isActive = selectedDate === dateKey
          const isToday = todayKey === dateKey

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-14 rounded-lg border px-1 py-1.5 transition-colors ${
                isActive
                  ? 'border-brand-400 bg-brand-400/10 text-brand-600'
                  : isToday
                    ? 'border-brand-300 bg-white text-surface-700'
                    : 'border-surface-100 bg-white text-surface-600 hover:bg-surface-50'
              }`}
            >
              <div className="text-xs font-medium">{day}</div>
              {count > 0 && (
                <div className="mt-1 space-y-0.5">
                  <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-400/10 text-brand-600 inline-block max-w-full truncate">
                    {firstTitle || 'Событие'}
                  </div>
                  {count > 1 && (
                    <div className="text-[10px] text-brand-600">+{count - 1}</div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
