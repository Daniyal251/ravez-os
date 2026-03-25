import { Link } from 'react-router-dom'
import { CalendarDays, Wallet } from 'lucide-react'

const MORE_ITEMS = [
  {
    to: '/events',
    title: 'События',
    desc: 'Календарь и управление событиями',
    icon: CalendarDays,
  },
  {
    to: '/finances',
    title: 'Финансы',
    desc: 'Доходы, расходы и отчеты',
    icon: Wallet,
  },
]

export default function More() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-surface-800">Еще</h1>
        <p className="text-sm text-surface-500 mt-1">
          Дополнительные разделы системы
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MORE_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="card p-4 hover:border-brand-400/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-400/10 text-brand-500 flex items-center justify-center">
                <item.icon size={18} />
              </div>
              <div>
                <p className="font-medium text-surface-700">{item.title}</p>
                <p className="text-sm text-surface-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
