'use client'

import { Bell, Search } from 'lucide-react'

interface TopNavbarProps {
  pageHeader?: string
  name?: string
  role?: string
  initials?: string
}

export default function TopNavbar({
  pageHeader = 'Dashboard',
  name = 'Household Admin',
  role = 'Owner',
  initials = 'HA',
}: TopNavbarProps) {
  return (
    <header
      className="flex h-16 items-center justify-between px-8 border-b bg-white"
      style={{ borderColor: 'var(--card-border)' }}
    >
      {/* Left: page title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {pageHeader}
        </h1>
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-md px-3 h-9 bg-slate-50 border border-slate-200 text-sm text-slate-500 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
          <Search size={14} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search…" 
            className="bg-transparent border-none outline-none w-32 focus:w-48 transition-all"
          />
        </div>

        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold leading-none text-slate-900">
              {name}
            </p>
            <p className="text-xs mt-1 text-slate-500">
              {role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
