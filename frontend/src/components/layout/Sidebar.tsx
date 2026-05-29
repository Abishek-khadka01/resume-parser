import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Kanban, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/ats', icon: Kanban, label: 'ATS Board' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
]

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r bg-card px-3 py-4">
      <div className="mb-6 px-2">
        <h1 className="text-lg font-semibold tracking-tight">ResumeMatch</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
