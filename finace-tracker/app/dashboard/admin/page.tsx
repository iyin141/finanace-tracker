'use client'

import Link from 'next/link'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import Card from '@/_Components/Shared/Card'
import {
  Receipt, Tag, Upload, BarChart2, TrendingUp, Calendar, Users, ArrowRight,
} from 'lucide-react'

const links = [
  { label: 'Users',               desc: 'Manage household members and roles', icon: Users,      href: '/dashboard/admin/users' },
  { label: 'Expenses',            desc: 'View and edit logged expenses',      icon: Receipt,    href: '/dashboard/expenses' },
  { label: 'Categories',          desc: 'Budget categories and limits',       icon: Tag,        href: '/dashboard/categories' },
  { label: 'Upload CSV',          desc: 'Bulk import expenses',               icon: Upload,     href: '/dashboard/upload' },
  { label: 'Reports',             desc: 'PDF / Excel exports',                icon: BarChart2,  href: '/dashboard/reports' },
  { label: 'Price Comparison',    desc: 'Compare item prices over time',      icon: TrendingUp, href: '/dashboard/price-comparison' },
  { label: 'Monthly Comparison',  desc: 'Month-over-month spending',          icon: Calendar,   href: '/dashboard/monthly-comparison' },
]

export default function AdminPage() {
  return (
    <DashboardLayout brandText="Admin">
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Admin Panel</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Jump to any part of the app from here.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map(({ label, desc, icon: Icon, href }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-black text-white">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
                <p className="font-semibold text-sm mt-4" style={{ color: 'var(--foreground)' }}>{label}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
