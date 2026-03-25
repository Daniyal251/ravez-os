import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import ModuleOrgChart from './ModuleOrgChart'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function hasDirectionAccess(user, directionId) {
  if (!user) return false
  const fullAccessRoles = ['hq', 'owner', 'director', 'admin']
  const leadershipRoles = ['hq', 'owner', 'director', 'admin', 'art_director', 'dev_director', 'accountant']
  if (!leadershipRoles.includes(user.role)) return false
  if (fullAccessRoles.includes(user.role)) return true
  return Number(user.direction_id) === Number(directionId)
}

export default function ModulesManager({ user, modules, directions, staff, onSaveModule }) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    id: null,
    title: '',
    direction_id: '',
    owner_id: '',
    lead_id: '',
    photo: '',
    active: true,
  })

  const availableDirections = useMemo(
    () => directions.filter(direction => hasDirectionAccess(user, direction.id)),
    [directions, user]
  )

  const leadsInDirection = useMemo(() => {
    if (!form.direction_id) return []
    return staff.filter(person => Number(person.direction_id) === Number(form.direction_id))
  }, [staff, form.direction_id])

  const ownersInDirection = useMemo(() => {
    if (!form.direction_id) return []
    return staff.filter(person => (
      Number(person.direction_id) === Number(form.direction_id) &&
      ['rp', 'zgd', 'gd'].includes(person.org_level)
    ))
  }, [staff, form.direction_id])

  const groupedByOwner = useMemo(() => {
    const groups = {}
    modules.forEach(moduleItem => {
      const key = moduleItem.owner_id || 'no_owner'
      if (!groups[key]) groups[key] = []
      groups[key].push(moduleItem)
    })
    return groups
  }, [modules])

  const ownerManagers = useMemo(() => {
    const levelOrder = { gd: 1, zgd: 2, rp: 3 }
    return staff
      .filter(person => ['gd', 'zgd', 'rp'].includes(person.org_level))
      .sort((a, b) => {
        const levelDiff = (levelOrder[a.org_level] || 99) - (levelOrder[b.org_level] || 99)
        if (levelDiff !== 0) return levelDiff
        return (a.name || '').localeCompare(b.name || '', 'ru')
      })
  }, [staff])

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await toBase64(file)
    setForm(prev => ({ ...prev, photo: base64 }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await onSaveModule({
      ...form,
      direction_id: Number(form.direction_id),
      owner_id: form.owner_id ? Number(form.owner_id) : null,
      lead_id: form.lead_id ? Number(form.lead_id) : null,
    })
    setSaving(false)
    if (result?.ok) {
      setShowModal(false)
      setForm({ id: null, title: '', direction_id: '', owner_id: '', lead_id: '', photo: '', active: true })
      return
    }
    setError(result?.error || 'Не удалось сохранить модуль')
  }

  function openCreateModal() {
    setError('')
    setForm({ id: null, title: '', direction_id: '', owner_id: '', lead_id: '', photo: '', active: true })
    setShowModal(true)
  }

  function openEditModal(moduleItem) {
    setError('')
    setForm({
      id: moduleItem.id,
      title: moduleItem.title || '',
      direction_id: moduleItem.direction_id ? String(moduleItem.direction_id) : '',
      owner_id: moduleItem.owner_id ? String(moduleItem.owner_id) : '',
      lead_id: moduleItem.lead_id ? String(moduleItem.lead_id) : '',
      photo: moduleItem.photo || '',
      active: moduleItem.active !== false,
    })
    setShowModal(true)
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-surface-700">Управление модулями</h2>
          <p className="text-xs text-surface-400 mt-1">Здесь добавляются модули через интерфейс, без кода</p>
        </div>
        {availableDirections.length > 0 && (
          <button type="button" onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> Добавить модуль
          </button>
        )}
      </div>

      <div className="space-y-4">
        {ownerManagers.map(owner => {
          const ownerModules = modules.filter(moduleItem => Number(moduleItem.owner_id) === Number(owner.id))
          return (
            <section key={owner.id} className="rounded-xl border-2 border-surface-200 bg-surface-50 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-surface-800">Блок: {owner.name}</p>
                  <p className="text-xs text-surface-500">
                    {owner.direction || 'Общее управление'} · Модулей: {ownerModules.length}
                  </p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-surface-200 text-surface-500">
                  Отдельный блок
                </span>
              </div>

              {ownerModules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-300 bg-white px-3 py-3 text-sm text-surface-400">
                  Пока нет модулей в этом блоке
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-2.5">
                  {ownerModules.map(moduleItem => {
                    const lead = staff.find(person => person.id === moduleItem.lead_id)
                    return (
                      <div key={moduleItem.id} className="rounded-lg border border-surface-100 p-3 bg-white shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-surface-100 overflow-hidden flex items-center justify-center">
                            {moduleItem.photo ? (
                              <img src={moduleItem.photo} alt={moduleItem.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-surface-400">Фото</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-700">{moduleItem.title}</p>
                            <p className="text-xs text-surface-400">{moduleItem.direction_name || 'Направление не задано'}</p>
                            <p className="text-xs text-surface-500 mt-1">Руководитель модуля: {lead?.name || '—'}</p>
                            <button
                              type="button"
                              onClick={() => openEditModal(moduleItem)}
                              className="mt-2 text-xs text-brand-600 hover:text-brand-700"
                            >
                              Редактировать модуль
                            </button>
                          <ModuleOrgChart module={moduleItem} staff={staff} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}

        {groupedByOwner.no_owner?.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">Без закрепленного руководителя</p>
            <div className="grid md:grid-cols-2 gap-2.5">
              {groupedByOwner.no_owner.map(moduleItem => (
                <button
                  key={moduleItem.id}
                  type="button"
                  onClick={() => openEditModal(moduleItem)}
                  className="text-left rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-surface-700"
                >
                  {moduleItem.title}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <h3 className="text-base font-semibold">
                {form.id ? 'Редактировать модуль' : 'Новый модуль'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Название модуля</label>
                <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Например: Модуль промо" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Направление</label>
                <select value={form.direction_id} onChange={e => setForm(prev => ({ ...prev, direction_id: e.target.value, owner_id: '', lead_id: '' }))}>
                  <option value="">— Выберите направление —</option>
                  {availableDirections.map(direction => (
                    <option key={direction.id} value={direction.id}>{direction.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Под руководителем</label>
                <select value={form.owner_id} onChange={e => setForm(prev => ({ ...prev, owner_id: e.target.value }))}>
                  <option value="">— Выберите руководителя —</option>
                  {ownersInDirection.map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Руководитель модуля</label>
                <select value={form.lead_id} onChange={e => setForm(prev => ({ ...prev, lead_id: e.target.value }))}>
                  <option value="">— Выберите сотрудника —</option>
                  {leadsInDirection.map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Фото модуля</label>
                <input type="file" accept="image/*" onChange={handlePhoto} />
                {form.photo && <p className="text-xs text-surface-400 mt-1">Фото загружено</p>}
              </div>
              <label className="flex items-center gap-2 text-sm text-surface-600">
                <input
                  type="checkbox"
                  checked={form.active !== false}
                  onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                />
                Активный модуль
              </label>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
            </div>

            <div className="flex justify-end gap-2.5 p-5 border-t border-surface-100">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : form.id ? 'Сохранить изменения' : 'Создать модуль'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
