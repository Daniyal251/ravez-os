import { useState, useEffect } from 'react'
import api from '../api/client'
import { TASK_STATUSES, formatDate } from '../utils/constants'
import { Plus, Search, Filter, X, CheckSquare } from 'lucide-react'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    const res = await api.get('tasks/list')
    if (res?.tasks) setTasks(res.tasks)
    setLoading(false)
  }

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNew() {
    setEditTask({ title: '', description: '', status: 'new', deadline: '', assigned_to: '' })
    setShowModal(true)
  }

  function openEdit(task) {
    setEditTask({ ...task })
    setShowModal(true)
  }

  async function saveTask(data) {
    const res = await api.post('task/save', data)
    if (res?.ok) {
      setShowModal(false)
      setEditTask(null)
      loadTasks()
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <CheckSquare size={22} className="text-brand-400" />
          Задачи
        </h1>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>Все</FilterBtn>
          {Object.entries(TASK_STATUSES).map(([key, st]) => (
            <FilterBtn key={key} active={filter === key} onClick={() => setFilter(key)}>
              {st.label}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare size={40} className="mx-auto text-surface-300 mb-3" />
          <p className="text-surface-400">Задач не найдено</p>
        </div>
      ) : (
        <div className="card divide-y divide-surface-100">
          {filtered.map(task => {
            const st = TASK_STATUSES[task.status] || TASK_STATUSES.new
            return (
              <div
                key={task.id}
                onClick={() => openEdit(task)}
                className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-50/60 transition-colors cursor-pointer"
              >
                <div className={`w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center ${
                  task.status === 'done'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-surface-300'
                }`}>
                  {task.status === 'done' && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2.5 6L5 8.5L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    task.status === 'done' ? 'line-through text-surface-400' : 'text-surface-700'
                  }`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-surface-400 truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                </div>

                <span className={`badge ${st.color} shrink-0 hidden sm:inline-flex`}>
                  {st.label}
                </span>

                {task.deadline && (
                  <span className="text-xs text-surface-400 shrink-0">
                    {formatDate(task.deadline)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && editTask && (
        <TaskModal
          task={editTask}
          onSave={saveTask}
          onClose={() => { setShowModal(false); setEditTask(null) }}
        />
      )}
    </div>
  )
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-brand-400/10 text-brand-500'
          : 'bg-white border border-surface-200 text-surface-500 hover:bg-surface-50'
      }`}
    >
      {children}
    </button>
  )
}

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(task)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="text-base font-semibold">
            {form.id ? 'Редактировать задачу' : 'Новая задача'}
          </h3>
          <button type="button" onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Название</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Описание</label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Подробности..."
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Статус</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.entries(TASK_STATUSES).map(([key, st]) => (
                  <option key={key} value={key}>{st.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Дедлайн</label>
              <input
                type="date"
                value={form.deadline || ''}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 p-5 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}
