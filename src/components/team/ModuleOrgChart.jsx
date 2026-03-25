import { formatPosition } from '../../utils/constants'

function MemberCard({ person }) {
  return (
    <div className="rounded-md border border-surface-200 bg-white px-2.5 py-2 min-w-[200px]">
      <p className="text-xs font-semibold text-surface-600 truncate">{formatPosition(person)}</p>
      <p className="text-sm text-surface-700 truncate mt-0.5">{person.name}</p>
    </div>
  )
}

function LevelRow({ title, members }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-surface-500 mb-2">
        {title} ({members.length})
      </p>
      {members.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {members.map(person => <MemberCard key={person.id} person={person} />)}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-surface-300 bg-white px-3 py-2 text-xs text-surface-400">
          Не назначено
        </div>
      )}
    </div>
  )
}

export default function ModuleOrgChart({ module, staff }) {
  const moduleMembers = staff.filter(person => Number(person.module_id) === Number(module.id))
  if (moduleMembers.length === 0) {
    return (
      <div className="mt-2 rounded-md border border-dashed border-surface-300 bg-surface-50 px-3 py-2 text-xs text-surface-400">
        В этом модуле пока нет сотрудников
      </div>
    )
  }

  const heads = moduleMembers.filter(person => person.org_level === 'mrp' || person.org_level === 'gs')
  const leads = moduleMembers.filter(person => person.org_level === 'vs')
  const specialists = moduleMembers.filter(person => person.org_level === 's')
  const juniors = moduleMembers.filter(person => person.org_level === 'js')
  const mentors = moduleMembers.filter(person => person.org_level === 'st_spec')
  const others = moduleMembers.filter(
    person => !['mrp', 'gs', 'vs', 's', 'js', 'st_spec'].includes(person.org_level)
  )

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wide">
        Схема модуля
      </p>

      <LevelRow title="Руководитель модуля (ГС / МРП)" members={heads} />
      <div className="flex justify-center text-surface-300 text-sm">↓</div>
      <LevelRow title="Ведущие специалисты (ВС)" members={leads} />
      <div className="flex justify-center text-surface-300 text-sm">↓</div>
      <LevelRow title="Специалисты (С)" members={specialists} />
      <div className="flex justify-center text-surface-300 text-sm">↓</div>
      <LevelRow title="Младшие специалисты (МС)" members={juniors} />

      <div className="rounded-lg border border-brand-200 bg-brand-400/5 p-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-surface-500 mb-2">
          Наставники / старшие специалисты ({mentors.length})
        </p>
        {mentors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mentors.map(person => <MemberCard key={person.id} person={person} />)}
          </div>
        ) : (
          <div className="text-xs text-surface-400">Не назначено</div>
        )}
      </div>

      {others.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700 mb-2">
            Прочие роли
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map(person => <MemberCard key={person.id} person={person} />)}
          </div>
        </div>
      )}
    </div>
  )
}
