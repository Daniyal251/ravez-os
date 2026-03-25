import { useMemo, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { ORG_LEVELS, ROLE_LABELS } from '../../utils/constants'

const DEFAULT_PROFILE = {
  name: '',
  role: 'admin',
  phone: '',
  email: '',
  city: '',
  birthday: '',
  bio: '',
  photo: '',
  active: true,
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function TeamProfileModal({ staff, onSave, onClose }) {
  const initial = useMemo(() => ({ ...DEFAULT_PROFILE, ...staff }), [staff])
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const roleOptions = useMemo(
    () => Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
    []
  )
  const managerOptions = useMemo(
    () => (staff.teamList || []).filter(person => person.id !== staff.id),
    [staff.teamList, staff.id]
  )
  const directionOptions = staff.directions || []
  const moduleOptions = useMemo(() => {
    const allModules = staff.modules || []
    if (!form.direction_id) return allModules
    return allModules.filter(moduleItem => Number(moduleItem.direction_id) === Number(form.direction_id))
  }, [staff.modules, form.direction_id])

  const initials = (form.name || '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await toBase64(file)
    setForm(prev => ({ ...prev, photo: base64 }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Введите имя сотрудника')
      return
    }

    setSaving(true)
    setError('')
    const { teamList, ...payload } = form
    const result = await onSave(payload)
    setSaving(false)
    if (!result?.ok) {
      setError(result?.error || 'Не удалось сохранить профиль')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="text-base font-semibold">
            {form.id ? 'Профиль сотрудника' : 'Новый сотрудник'}
          </h3>
          <button type="button" onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center overflow-hidden border border-surface-200">
              {form.photo ? (
                <img src={form.photo} alt="Аватар" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-surface-500">{initials}</span>
              )}
            </div>
            <label className="btn-secondary cursor-pointer">
              <Camera size={14} />
              Загрузить фото
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Имя</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Роль</label>
              <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Телефон</label>
              <input
                value={form.phone || ''}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@ravez.ru"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Город</label>
              <input
                value={form.city || ''}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Казань"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Дата рождения</label>
              <input
                type="date"
                value={form.birthday || ''}
                onChange={e => setForm(prev => ({ ...prev, birthday: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Уровень в структуре</label>
              <select
                value={form.org_level || 's'}
                onChange={e => setForm(prev => ({ ...prev, org_level: e.target.value }))}
              >
                {ORG_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Руководитель</label>
              <select
                value={form.manager_id || ''}
                onChange={e => setForm(prev => ({ ...prev, manager_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">— Нет —</option>
                {managerOptions.map(person => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Направление</label>
              <select
                value={form.direction_id || ''}
                onChange={e => setForm(prev => ({ ...prev, direction_id: e.target.value ? Number(e.target.value) : null, module_id: null }))}
              >
                <option value="">— Выберите направление —</option>
                {directionOptions.map(direction => (
                  <option key={direction.id} value={direction.id}>{direction.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Модуль</label>
              <select
                value={form.module_id || ''}
                onChange={e => setForm(prev => ({ ...prev, module_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">— Выберите модуль —</option>
                {moduleOptions.map(moduleItem => (
                  <option key={moduleItem.id} value={moduleItem.id}>{moduleItem.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">О сотруднике</label>
            <textarea
              rows={3}
              className="resize-none"
              value={form.bio || ''}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Кратко: опыт, зона ответственности, важные заметки..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-surface-600">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
            />
            Активный сотрудник
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 p-5 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение...' : 'Сохранить профиль'}
          </button>
        </div>
      </form>
    </div>
  )
}
