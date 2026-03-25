import { useEffect, useMemo, useState } from 'react'
import { Camera, UserCircle2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/constants'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { user, refreshMe } = useAuth()
  const [form, setForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    city: '',
    birthday: '',
    bio: '',
    photo: '',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('info')

  useEffect(() => {
    if (!user) return
    setForm({
      id: user.id,
      name: user.name || '',
      role: user.role || '',
      phone: user.phone || '',
      email: user.email || '',
      city: user.city || '',
      birthday: user.birthday || '',
      direction: user.direction || '',
      module_name: user.module_name || '',
      bio: user.bio || '',
      photo: user.photo || '',
    })
  }, [user])

  const initials = useMemo(
    () => (form.name || '?').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    [form.name]
  )

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await toBase64(file)
    setForm(prev => ({ ...prev, photo: base64 }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    const res = await api.post('staff/profile/save', form)
    setSaving(false)
    if (res?.ok) {
      setStatus('Профиль обновлен')
      setStatusType('ok')
      await refreshMe()
    } else {
      setStatus(res?.error || 'Не удалось сохранить профиль')
      setStatusType('error')
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title flex items-center gap-2">
        <UserCircle2 size={22} className="text-brand-400" />
        Мой профиль
      </h1>

      <form onSubmit={handleSave} className="card p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-surface-200 bg-surface-100 overflow-hidden flex items-center justify-center">
            {form.photo ? (
              <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-surface-500">{initials}</span>
            )}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer">
              <Camera size={14} />
              Изменить фото
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            <p className="text-xs text-surface-400 mt-1">Фото видно в команде и схеме</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Имя</label>
            <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Роль</label>
            <input value={ROLE_LABELS[form.role] || form.role} disabled />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Телефон</label>
            <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Город</label>
            <input value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Дата рождения</label>
            <input type="date" value={form.birthday} onChange={e => setForm(prev => ({ ...prev, birthday: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Направление</label>
            <input value={form.direction} onChange={e => setForm(prev => ({ ...prev, direction: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Модуль</label>
            <input value={form.module_name} onChange={e => setForm(prev => ({ ...prev, module_name: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1.5">О себе</label>
          <textarea
            rows={3}
            className="resize-none"
            value={form.bio}
            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Коротко о себе, зоне ответственности и опыте"
          />
        </div>

        {status && (
          <p className={`text-sm rounded-md px-3 py-2 border ${
            statusType === 'ok'
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : 'text-red-700 bg-red-50 border-red-100'
          }`}>
            {status}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}
