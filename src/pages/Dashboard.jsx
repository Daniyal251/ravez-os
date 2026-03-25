import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/client'
import { formatMoney, formatDate, EVENT_STATUSES, TASK_STATUSES } from '../utils/constants'
import {
  CalendarDays, CheckSquare, TrendingUp, Users,
  ArrowRight, Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [statsRes, eventsRes, tasksRes] = await Promise.all([
      api.get('analytics/dashboard'),
      api.get('events/list'),
      api.get('tasks/list'),
    ])
    if (statsRes?.stats) setStats(statsRes.stats)
    if (eventsRes?.events) setEvents(eventsRes.events.slice(0, 3))
    if (tasksRes?.tasks) setTasks(tasksRes.tasks.filter(t => t.status !== 'done').slice(0, 5))
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Привет, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={CalendarDays}
          label="События"
          value={stats?.events_count ?? events.length}
          sub="на этой неделе"
          color="text-violet-500 bg-violet-50"
        />
        <StatCard
          icon={CheckSquare}
          label="Задачи"
          value={stats?.tasks_open ?? tasks.length}
          sub="открытых"
          color="text-blue-500 bg-blue-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Выручка"
          value={stats?.revenue ? formatMoney(stats.revenue) : '—'}
          sub="за месяц"
          color="text-emerald-500 bg-emerald-50"
        />
        <StatCard
          icon={Users}
          label="На смене"
          value={stats?.staff_on_shift ?? '—'}
          sub="сейчас"
          color="text-amber-500 bg-amber-50"
        />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Events */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-700">
              Ближайшие события
            </h2>
            <a href="/events" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              Все <ArrowRight size={12} />
            </a>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">
              Нет предстоящих событий
            </p>
          ) : (
            <div className="space-y-2.5">
              {events.map(ev => {
                const st = EVENT_STATUSES[ev.status] || EVENT_STATUSES.draft
                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-50/80 hover:bg-surface-100/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-700 truncate">
                        {ev.title}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDate(ev.date)} · {ev.time_start || '—'}
                      </p>
                    </div>
                    <span className={`badge ${st.color} shrink-0 ml-3`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-700">
              Мои задачи
            </h2>
            <a href="/tasks" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
              Все <ArrowRight size={12} />
            </a>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">
              Нет открытых задач 🎉
            </p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map(task => {
                const st = TASK_STATUSES[task.status] || TASK_STATUSES.new
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded shrink-0 border-2 ${
                      task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-surface-300'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${
                        task.status === 'done' ? 'line-through text-surface-400' : 'text-surface-700'
                      }`}>
                        {task.title}
                      </p>
                    </div>
                    {task.deadline && (
                      <span className="text-[11px] text-surface-400 shrink-0">
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-xs text-surface-400 mt-0.5">{sub}</p>
    </div>
  )
}
