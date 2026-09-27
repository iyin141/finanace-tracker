'use client'

import { useRouter } from 'next/navigation'
import TopNavbar from './TopNavbar'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  brandText?: string
}

export default function DashboardLayout({ children, brandText = 'Dashboard' }: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = () => {
    // In a real app, clear cookie/token
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />

      <div className="ml-64 flex min-h-screen flex-col">
        <div className="sticky top-0 z-20">
          <TopNavbar 
            pageHeader={brandText} 
            name="Household Admin" 
            role="Owner" 
            initials="HA" 
          />
        </div>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
