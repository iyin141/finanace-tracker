'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  Tag,
  Upload,
  BarChart2,
  LogOut,
  Wallet,
} from 'lucide-react'

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { id: 'expenses',    label: 'Expenses',     icon: Receipt,          href: '/dashboard/expenses' },
  { id: 'categories',  label: 'Categories',   icon: Tag,              href: '/dashboard/categories' },
  { id: 'upload',      label: 'Upload CSV',   icon: Upload,           href: '/dashboard/upload' },
  { id: 'reports',     label: 'Reports',      icon: BarChart2,        href: '/dashboard/reports' },
]

interface SidebarProps {
  onLogout?: () => void
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--card-border)' }}>
      
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black">
          <Wallet size={16} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-none tracking-tight">FinTrack</h2>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut size={18} className="text-slate-400" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
