import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users, Phone, Mail } from 'lucide-react'
import api from '../api/client'
import { ORG_LEVEL_LABELS, ROLE_COLORS, ROLE_LABELS, formatPosition } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import TeamProfileModal from '../components/team/TeamProfileModal'
import TeamStructure from '../components/team/TeamStructure'
import ModulesManager from '../components/team/ModulesManager'

const EMPTY_STAFF = {
  name: '',
  role: 'admin',
  phone: '',
  email: '',
  city: '',
  birthday: '',
  bio: '',
  photo: '',
  active: true,
  org_level: 's',
  manager_id: null,
  direction: '',
  module_name: '',
}

const TEAM_SECTIONS = [
  { key: 'structure', label: 'Оргсхема' },
  { key: 'staff', label: 'Сотрудники' },
  { key: 'modules', label: 'Управление модулями' },
]

export default function Team() {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [modules, setModules] = useState([])
  const [directions, setDirections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [activeSection, setActiveSection] = useState('structure')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    const [staffRes, modulesRes, directionsRes] = await Promise.all([
      api.get('staff/list'),
      api.get('org/modules/list'),
      api.get('org/directions/list'),
    ])
    if (staffRes?.staff) {
      setStaff(staffRes.staff)
    } else {
      setStaff([])
      setError(staffRes?.error || 'Не удалось загрузить сотрудников')
    }
    setModules(modulesRes?.modules || [])
    setDirections(directionsRes?.directions || [])
    setLoading(false)
  }

  const roles = useMemo(
    () => [...new Set(staff.map(person => person.role).filter(Boolean))],
    [staff]
  )

  const filtered = useMemo(
    () => staff.filter(person => {
      if (roleFilter && person.role !== roleFilter) return false
      if (activeFilter === 'active' && person.active === false) return false
      if (activeFilter === 'inactive' && person.active !== false) return false
      if (search && !person.name?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
    [staff, roleFilter, activeFilter, search]
  )

  async function saveStaffProfile(profileData) {
    const res = await api.post('staff/save', profileData)
    if (res?.ok) {
      await loadData()
      setShowModal(false)
      setSelectedStaff(null)
      return { ok: true }
    }
    return { ok: false, error: res?.error || 'Не удалось сохранить профиль' }
  }

  function openNewProfile() {
    setSelectedStaff({ ...EMPTY_STAFF, teamList: staff, directions, modules })
    setShowModal(true)
  }

  function openExistingProfile(person) {
    setSelectedStaff({ ...person, teamList: staff, directions, modules })
    setShowModal(true)
  }

  async function saveModule(moduleData) {
    const res = await api.post('org/module/save', moduleData)
    if (res?.ok) {
      await loadData()
      return { ok: true }
    }
    return { ok: false, error: res?.error || 'Не удалось сохранить модуль' }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Users size={22} className="text-brand-400" />
          Команда
          <span className="text-sm font-normal text-surface-400 ml-1">({staff.length})</span>
        </h1>
        <div className="flex gap-2">
          {activeSection === 'staff' && (
            <button onClick={openNewProfile} className="btn-primary">
              <Plus size={16} /> Добавить сотрудника
            </button>
          )}
        </div>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEAM_SECTIONS.map(section => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === section.key
                  ? 'bg-brand-400/10 text-brand-600 border border-brand-300'
                  : 'bg-white text-surface-500 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
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
          {activeSection === 'structure' && (
            <TeamStructure staff={staff} modules={modules} onOpenProfile={openExistingProfile} />
          )}

          {activeSection === 'modules' && (
            <ModulesManager
              user={user}
              modules={modules}
              directions={directions}
              staff={staff}
              onSaveModule={saveModule}
            />
          )}

          {activeSection === 'staff' && (
            <>
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1 lg:max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="lg:w-52">
                  <option value="">Все роли</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                  ))}
                </select>
                <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className="lg:w-48">
                  <option value="all">Все статусы</option>
                  <option value="active">Только активные</option>
                  <option value="inactive">Только неактивные</option>
                </select>
              </div>

              <div className="card overflow-hidden hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Сотрудник</th>
                      <th className="px-5 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Роль</th>
                      <th className="px-5 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Уровень</th>
                      <th className="px-5 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Контакты</th>
                      <th className="px-5 py-3 text-xs font-medium text-surface-400 uppercase tracking-wider">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100/60">
                    {filtered.map(person => (
                      <tr
                        key={person.id}
                        onClick={() => openExistingProfile(person)}
                        className="hover:bg-surface-50/60 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar person={person} />
                            <span className="font-medium text-surface-700">{person.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${ROLE_COLORS[person.role] || 'badge-neutral'}`}>
                            {formatPosition(person)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-surface-500 text-xs">
                          {ORG_LEVEL_LABELS[person.org_level] || 'Не задан'}
                        </td>
                        <td className="px-5 py-3.5 text-surface-500">
                          <div className="space-y-1">
                            <p>{person.phone || '—'}</p>
                            <p className="text-xs text-surface-400">{person.email || '—'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${person.active !== false ? 'bg-emerald-500' : 'bg-surface-300'}`} />
                            {person.active !== false ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden space-y-2">
                {filtered.map(person => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => openExistingProfile(person)}
                    className="card p-4 w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar person={person} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-surface-700 truncate">{person.name}</p>
                        <p className="text-xs text-surface-400">{formatPosition(person)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                      {person.phone && (
                        <span className="inline-flex items-center gap-1"><Phone size={12} /> {person.phone}</span>
                      )}
                      {person.email && (
                        <span className="inline-flex items-center gap-1"><Mail size={12} /> {person.email}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showModal && selectedStaff && (
        <TeamProfileModal
          staff={selectedStaff}
          onSave={saveStaffProfile}
          onClose={() => { setShowModal(false); setSelectedStaff(null) }}
        />
      )}
    </div>
  )
}

function Avatar({ person }) {
  const colors = ROLE_COLORS[person.role] || 'bg-surface-100 text-surface-500'
  const initials = (person.name || '?')
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${colors}`}>
      {person.photo ? (
        <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
