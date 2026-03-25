import { useState, useEffect } from 'react'
import api from '../api/client'
import { ROLE_LABELS } from '../utils/constants'
import { Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Shifts() {
  const [shifts, setShifts] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [shRes, stRes] = await Promise.all([
      api.get('shifts/list'),
      api.get('staff/list'),
    ])
    if (shRes?.shifts) setShifts(shRes.shifts)
    if (stRes?.staff) setStaff(stRes.staff)
    setLoading(false)
  }

  // Get week dates
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  function shiftsForDay(date) {
    const dateStr = date.toISOString().split('T')[0]
    return shifts.filter(s => s.date === dateStr)
  }

  function staffName(id) {
    const s = staff.find(s => String(s.id) === String(id))
    return s?.name || `#${id}`
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Clock size={22} className="text-brand-400" />
          Смены
        </h1>
        <button className="btn-primary">
          <Plus size={16} /> Добавить смену
        </button>
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost p-2">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-surface-600 min-w-[200px] text-center">
          {weekDays[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          {' — '}
          {weekDays[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost p-2">
          <ChevronRight size={18} />
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-brand-500 hover:text-brand-600">
            Сегодня
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            const dayShifts = shiftsForDay(day)
            const isWeekend = i >= 5

            return (
              <div key={i} className="min-h-[120px]">
                <div className={`text-center mb-2 py-1.5 rounded-lg text-xs font-medium ${
                  isToday ? 'bg-brand-400 text-white' : isWeekend ? 'text-surface-500 bg-surface-100' : 'text-surface-500'
                }`}>
                  <div>{dayNames[i]}</div>
                  <div className="text-sm font-bold">{day.getDate()}</div>
                </div>

                <div className="space-y-1">
                  {dayShifts.map(sh => (
                    <div key={sh.id} className="card px-2 py-1.5 text-[11px] cursor-pointer hover:shadow-sm transition-shadow">
                      <p className="font-medium text-surface-700 truncate">{staffName(sh.staff_id)}</p>
                      <p className="text-surface-400">{sh.time_start} — {sh.time_end}</p>
                    </div>
                  ))}
                  {dayShifts.length === 0 && (
                    <div className="text-center text-[11px] text-surface-300 py-4">—</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
