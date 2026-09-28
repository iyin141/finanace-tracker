'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TopNavbar from './TopNavbar'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/_Stores/useAuthStore'

interface DashboardLayoutProps {
  children: React.ReactNode
  brandText?: string
}

export default function DashboardLayout({ children, brandText = 'Dashboard' }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, clearUser } = useAuthStore()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearUser()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!user) {
    return null // or show loading spinner
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />

      <div className="ml-64 flex min-h-screen flex-col">
        <div className="sticky top-0 z-20">
          <TopNavbar
            pageHeader={brandText}
            name={user.name}
            role={user.role}
            initials={initials}
            email={user.email}
          />
        </div>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
