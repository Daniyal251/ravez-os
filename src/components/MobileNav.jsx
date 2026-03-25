import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Users, Clock, MoreHorizontal,
} from 'lucide-react'

const MOBILE_NAV = [
  { to: '/',       icon: LayoutDashboard, label: 'Главная' },
  { to: '/team',   icon: Users,           label: 'Команда' },
  { to: '/tasks',  icon: CheckSquare,     label: 'Задачи' },
  { to: '/shifts', icon: Clock,           label: 'Смены' },
  { to: '/more',   icon: MoreHorizontal,  label: 'Ещё' },
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200/60 z-50">
      <div className="flex">
        {MOBILE_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-surface-400'
              }`
            }
          >
            <item.icon size={20} strokeWidth={1.6} />
            {item.label}
          </NavLink>
        ))}
      </div>
      {/* Safe area for iPhones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
