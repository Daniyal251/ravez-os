import { useEffect, useMemo, useState } from 'react'
import { ORG_LEVEL_LABELS, formatPosition } from '../../utils/constants'
import ModuleOrgChart from './ModuleOrgChart'

function PersonNode({ person, onOpenProfile }) {
  if (!person) {
    return (
      <div className="rounded-md border border-dashed border-surface-300 bg-surface-50 px-2.5 py-2 text-[11px] text-surface-400">
        Не назначен
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpenProfile?.(person)}
      className="text-left rounded-lg border border-surface-200 bg-white px-2.5 py-2 hover:border-brand-300 hover:bg-brand-400/5 transition-colors w-full"
    >
      <p className="text-[11px] font-semibold text-surface-600 truncate">{formatPosition(person)}</p>
      <p className="text-xs text-surface-700 truncate mt-0.5">{person.name}</p>
    </button>
  )
}

function ModuleNode({ moduleItem, members, active, onPick }) {
  const leads = members.filter(person => person.org_level === 'vs').length
  const specs = members.filter(person => person.org_level === 's').length
  const juniors = members.filter(person => person.org_level === 'js').length
  const headCount = members.filter(person => person.org_level === 'mrp' || person.org_level === 'gs').length

  return (
    <button
      type="button"
      onClick={() => onPick(moduleItem.id)}
      className={`text-left rounded-lg border p-2.5 w-full transition-colors ${
        active ? 'border-brand-400 bg-brand-400/10' : 'border-surface-200 bg-white hover:border-brand-300 hover:bg-brand-400/5'
      }`}
    >
      <p className="text-xs font-semibold text-surface-700 truncate">{moduleItem.title}</p>
      <p className="text-[11px] text-surface-400 mt-0.5 truncate">{moduleItem.direction_name || 'Направление не задано'}</p>
      <p className="text-[10px] text-surface-500 mt-1 leading-tight">
        ГС/МРП {headCount} · ВС {leads} · С {specs} · МС {juniors}
      </p>
    </button>
  )
}

function ModulePlaceholder({ title }) {
  return (
    <div className="rounded-md border border-dashed border-surface-300 bg-surface-50 px-2.5 py-2">
      <p className="text-[11px] text-surface-600">{title}</p>
      <p className="text-[10px] text-surface-400 mt-0.5">Модуль пока не создан</p>
    </div>
  )
}

export default function TeamStructure({ staff, modules, onOpenProfile }) {
  const gd = staff.find(person => person.org_level === 'gd')
  const deputy = staff.find(person => person.org_level === 'zgd' && person.role === 'director')
    || staff.find(person => person.org_level === 'zgd')
    || null

  const rpManager = staff.find(person => person.role === 'admin' && !person.module_id) || null
  const rpArt = staff.find(person => person.role === 'art_director' && !person.module_id) || null
  const rpDev = staff.find(person => person.role === 'dev_director' && !person.module_id) || null

  const firstModuleId = modules[0]?.id || null
  const [selectedModuleId, setSelectedModuleId] = useState(firstModuleId)
  const [showModuleModal, setShowModuleModal] = useState(false)

  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) setSelectedModuleId(modules[0].id)
    if (selectedModuleId && !modules.find(moduleItem => moduleItem.id === selectedModuleId)) {
      setSelectedModuleId(modules[0]?.id || null)
    }
  }, [modules, selectedModuleId])

  const selectedModule = modules.find(moduleItem => moduleItem.id === selectedModuleId) || null
  const selectedModuleMembers = selectedModule
    ? staff.filter(person => Number(person.module_id) === Number(selectedModule.id))
    : []

  function openModuleModal(moduleId) {
    setSelectedModuleId(moduleId)
    setShowModuleModal(true)
  }

  const bitrixBlocks = useMemo(() => {
    const usedIds = new Set()
    const normalize = value => (value || '').toLowerCase()

    const pickModule = (rpPerson, regexList) => {
      const ownedMatch = modules.find(moduleItem => (
        !usedIds.has(moduleItem.id)
        && rpPerson
        && Number(moduleItem.owner_id) === Number(rpPerson.id)
        && regexList.some(rx => rx.test(normalize(moduleItem.title)))
      ))
      if (ownedMatch) {
        usedIds.add(ownedMatch.id)
        return ownedMatch
      }

      const titleMatch = modules.find(moduleItem => (
        !usedIds.has(moduleItem.id)
        && regexList.some(rx => rx.test(normalize(moduleItem.title)))
      ))
      if (titleMatch) {
        usedIds.add(titleMatch.id)
        return titleMatch
      }
      return null
    }

    return [
      {
        key: 'manager',
        title: 'РП — Управляющий',
        rp: rpManager,
        slots: [
          { label: 'Охрана', module: pickModule(rpManager, [/охран/]) },
          { label: 'Бар', module: pickModule(rpManager, [/бар/]) },
          { label: 'Клининг', module: pickModule(rpManager, [/клин|clean|убор/]) },
          { label: 'Хостес', module: pickModule(rpManager, [/хост|host/]) },
          { label: 'Гардероб', module: pickModule(rpManager, [/гардер/]) },
        ],
      },
      {
        key: 'art',
        title: 'РП — Арт-директор',
        rp: rpArt,
        slots: [
          { label: 'Диджей', module: pickModule(rpArt, [/dj|дидж/]) },
          { label: 'Тех часть (свет/звук)', module: pickModule(rpArt, [/свет|звук|тех/]) },
          { label: 'СММ', module: pickModule(rpArt, [/smm|контент/]) },
          { label: 'ПРОМО менеджер (амбассадоры, промоутеры)', module: pickModule(rpArt, [/промо|амбасс/]) },
        ],
      },
      {
        key: 'dev',
        title: 'РП — Директор по развитию',
        rp: rpDev,
        slots: [],
      },
    ]
  }, [modules, rpManager, rpArt, rpDev])

  return (
    <div className="card p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-surface-700">Оргсхема сотрудников</h2>
        <p className="text-xs text-surface-400 mt-1">
          Как в Bitrix: сверху ГД, под ним один зам, ниже РП и их модули
        </p>
      </div>

      <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 sm:p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-lg border border-brand-200 bg-brand-400/5 p-2.5 w-full max-w-md">
            <p className="text-[11px] uppercase tracking-wide text-surface-500 mb-1">{ORG_LEVEL_LABELS.gd}</p>
            <PersonNode person={gd} onOpenProfile={onOpenProfile} />
          </div>

          <div className="w-px h-5 bg-surface-300" />

          <div className="rounded-lg border border-surface-200 bg-white p-2.5 w-full max-w-md">
            <p className="text-[11px] uppercase tracking-wide text-surface-500 mb-1">ЗГД — Операционный директор</p>
            <PersonNode person={deputy} onOpenProfile={onOpenProfile} />
          </div>
        </div>

        <div className="mt-4 h-px bg-surface-200" />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {bitrixBlocks.map(block => (
            <div key={block.key} className="rounded-xl border border-surface-200 bg-white p-2.5 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-surface-500">{block.title}</p>

              <PersonNode person={block.rp} onOpenProfile={onOpenProfile} />

              {block.slots.length > 0 ? (
                <div className="pt-2 pl-2 border-l-2 border-brand-200 space-y-2">
                  {block.slots.map(slot => (
                    slot.module ? (
                      <ModuleNode
                        key={`${block.key}-${slot.label}-${slot.module.id}`}
                        moduleItem={slot.module}
                        members={staff.filter(person => Number(person.module_id) === Number(slot.module.id))}
                        active={Number(selectedModuleId) === Number(slot.module.id)}
                        onPick={openModuleModal}
                      />
                    ) : (
                      <ModulePlaceholder key={`${block.key}-${slot.label}`} title={slot.label} />
                    )
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-surface-300 bg-surface-50 px-2.5 py-2 text-[11px] text-surface-400">
                  Пока без модулей
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModuleModal && selectedModule && (
        <div className="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-[1px] p-3 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-auto rounded-2xl border border-surface-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-surface-700">
                  Схема модуля: {selectedModule.title}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Внутренняя структура модуля: кто под кем
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="rounded-md border border-surface-200 px-3 py-1.5 text-xs text-surface-600 hover:bg-surface-50"
              >
                Закрыть
              </button>
            </div>
            <ModuleOrgChart module={selectedModule} staff={selectedModuleMembers} />
          </div>
        </div>
      )}
    </div>
  )
}
