import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users,
  Clock, Wallet, LogOut, UserCircle2,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Главная' },
  { to: '/team',     icon: Users,           label: 'Команда' },
  { to: '/tasks',    icon: CheckSquare,     label: 'Задачи' },
  { to: '/shifts',   icon: Clock,           label: 'Смены' },
  { to: '/finances', icon: Wallet,          label: 'Финансы' },
  { to: '/events',   icon: CalendarDays,    label: 'События' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-surface-200/60 h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-100">
        <div className="font-display text-2xl tracking-wider">
          RAVEZ <span className="text-brand-400">OS</span>
        </div>
        <p className="text-[11px] text-surface-400 tracking-widest uppercase mt-0.5">
          Staff portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-400/10 text-brand-500'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
              }`
            }
          >
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-surface-100">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors mb-2"
        >
          <div className="w-9 h-9 rounded-full bg-brand-400/15 text-brand-500 flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || <UserCircle2 size={14} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-700 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-surface-400">
              Мой профиль
            </p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-surface-400 hover:text-red-500 transition-colors w-full rounded-lg hover:bg-red-50"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
