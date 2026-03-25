import { useState } from 'react'
import { X } from 'lucide-react'
import { EVENT_STATUSES, EVENT_TYPES } from '../../utils/constants'

export default function EventModal({ event, onSave, onClose }) {
  const [form, setForm] = useState(event)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title?.trim()) {
      setError('Введите название события')
      return
    }

    setSaving(true)
    setError('')
    const result = await onSave(form)
    setSaving(false)
    if (!result?.ok) {
      setError(result?.error || 'Не удалось сохранить событие')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="text-base font-semibold">{form.id ? 'Редактировать' : 'Новое событие'}</h3>
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
              placeholder="Friday Night Party"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Дата</label>
              <input
                type="date"
                value={form.date || ''}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Начало</label>
              <input
                type="time"
                value={form.time_start || ''}
                onChange={e => setForm({ ...form, time_start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Конец</label>
              <input
                type="time"
                value={form.time_end || ''}
                onChange={e => setForm({ ...form, time_end: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Статус</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(EVENT_STATUSES).map(([key, statusItem]) => (
                <option key={key} value={key}>{statusItem.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Тип</label>
              <select value={form.event_type || 'standard'} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {Object.entries(EVENT_TYPES).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">План гостей</label>
              <input
                type="number"
                value={form.expected_guests || ''}
                onChange={e => setForm({ ...form, expected_guests: Number(e.target.value || 0) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">План бюджета (₽)</label>
              <input
                type="number"
                value={form.budget_plan || ''}
                onChange={e => setForm({ ...form, budget_plan: Number(e.target.value || 0) })}
                placeholder="0"
              />
            </div>
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

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
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
