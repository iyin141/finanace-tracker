'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { TrendingUp, TrendingDown, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatNaira, formatDate } from '@/_lib/utils'

interface ComparisonData {
  item: string
  records: Array<{
    id: string
    date: string
    amount: number
    category: string
    loggedBy: string
    comments: string
  }>
  statistics: {
    average: number
    min: number
    max: number
    range: number
    variance: string
  }
}

export default function PriceComparisonPage() {
  const [data, setData] = useState<ComparisonData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, dRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/analytics/price-comparison'),
        ])
        const cData = await cRes.json()
        const dData = await dRes.json()
        setCategories(cData.data || [])
        setData(dData.data || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredData = selectedCategory
    ? data.filter((item) =>
        item.records.some((r) => r.category === selectedCategory)
      )
    : data

  return (
    <DashboardLayout brandText="Price Comparison">
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              Price Comparison
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              Compare grocery prices across dates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted)' }} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-32 w-full rounded" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm"
            style={{ color: 'var(--muted)' }}>
            <Calendar size={32} className="opacity-30" />
            <p>No price data available. Log expenses to see comparisons.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item, index) => (
              <div key={index} className="rounded-lg p-6 bg-white shadow-sm"
                style={{ border: '1px solid var(--card-border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.item}</h3>
                    <p className="text-sm text-slate-500">
                      {item.records.length} purchase{item.records.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Average Price</p>
                    <p className="text-xl font-bold text-slate-900">{formatNaira(item.statistics.average)}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-md p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Min</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNaira(item.statistics.min)}</p>
                  </div>
                  <div className="rounded-md p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Max</p>
                    <p className="text-sm font-semibold text-slate-900">{formatNaira(item.statistics.max)}</p>
                  </div>
                  <div className="rounded-md p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Variance</p>
                    <p className="text-sm font-semibold text-slate-900">{item.statistics.variance}%</p>
                  </div>
                </div>

                {/* Records */}
                <div className="space-y-2">
                  {item.records.map((record, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatDate(record.date)}</p>
                          <p className="text-xs text-slate-500">
                            {record.loggedBy ? `Logged by ${record.loggedBy}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatNaira(record.amount)}</p>
                        {record.comments && (
                          <p className="text-xs text-slate-500 max-w-xs truncate">{record.comments}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
