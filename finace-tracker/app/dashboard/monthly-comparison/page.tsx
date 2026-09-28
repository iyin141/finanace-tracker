'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatNaira } from '@/_lib/utils'

interface MonthlyData {
  month: string
  total: number
  count: number
  categories: Array<{ category: string; total: number }>
  previousMonth: string | null
  previousTotal: number
  amountChange: number
  percentChange: number
}

export default function MonthlyComparisonPage() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/analytics/monthly-comparison')
        const dData = await res.json()
        setData(dData.data || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <DashboardLayout brandText="Monthly Comparison">
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Monthly Spending Comparison
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Compare spending across months with category breakdowns
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-40 w-full rounded" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm"
            style={{ color: 'var(--muted)' }}>
            <Calendar size={32} className="opacity-30" />
            <p>No monthly data available. Log expenses to see comparisons.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((month, index) => (
              <div key={index} className="rounded-lg p-6 bg-white shadow-sm"
                style={{ border: '1px solid var(--card-border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{month.month}</h3>
                    <p className="text-sm text-slate-500">
                      {month.count} transaction{month.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Spent</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNaira(month.total)}</p>
                  </div>
                </div>

                {/* Month-over-month comparison */}
                {month.previousMonth && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-md"
                    style={{
                      background: month.amountChange <= 0 ? '#d1fae5' : '#fee2e2',
                      color: month.amountChange <= 0 ? '#047857' : '#dc2626',
                    }}>
                    {month.amountChange <= 0 ? (
                      <TrendingDown size={16} />
                    ) : (
                      <TrendingUp size={16} />
                    )}
                    <span className="text-sm font-medium">
                      {month.amountChange <= 0 ? 'Decreased' : 'Increased'} by {formatNaira(Math.abs(month.amountChange))}
                      ({Math.abs(month.percentChange).toFixed(1)}%) vs {month.previousMonth}
                    </span>
                  </div>
                )}

                {/* Category breakdown */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Category Breakdown</p>
                  <div className="space-y-2">
                    {month.categories.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-600">{cat.category}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatNaira(cat.total)}</span>
                      </div>
                    ))}
                    {month.categories.length > 5 && (
                      <p className="text-xs text-slate-500 mt-2">
                        +{month.categories.length - 5} more categories
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
