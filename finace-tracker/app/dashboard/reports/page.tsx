'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { formatNaira, formatNairaShort, BUDGET_CATEGORIES, TOTAL_MONTHLY_BUDGET } from '@/_lib/utils'
import { AlertCircle, Download, TrendingDown, TrendingUp } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface StatsData {
  totalThisMonth: number
  totalLastMonth: number
  percentChange: number
  categoryBreakdown: { name: string; value: number }[]
  monthlyTrend: { month: string; total: number }[]
}

const CHART_COLORS = [
  '#10b981','#0ea5e9','#f59e0b','#8b5cf6','#ec4899',
  '#f97316','#14b8a6','#ef4444','#a855f7','#3b82f6','#22c55e','#64748b','#e11d48',
]

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md px-4 py-3 shadow-lg text-sm bg-white border border-slate-200">
      <p className="font-semibold mb-1 text-slate-800">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatNaira(p.value)}</p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [stats, setStats]   = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  // Merge category breakdown with budget targets
  const budgetComparison = stats?.categoryBreakdown?.map((c) => {
    const template = BUDGET_CATEGORIES.find(b => b.name === c.name)
    const budget   = template?.budget ?? 0
    return {
      name:   c.name,
      spent:  c.value,
      budget,
      diff:   budget - c.value,
      color:  template?.color ?? '#6b7280',
    }
  }) ?? []

  const exportPDF = async () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('FinTrack – Monthly Expense Report', 14, 20)
      doc.setFontSize(11)
      doc.setTextColor('#6b7280')
      doc.text(`Generated: ${new Date().toLocaleDateString('en-NG')}`, 14, 28)

      if (stats) {
        doc.setTextColor('#0f172a')
        doc.setFontSize(12)
        doc.text(`Total This Month: ${formatNaira(stats.totalThisMonth)}`, 14, 42)
        doc.text(`Total Last Month: ${formatNaira(stats.totalLastMonth)}`, 14, 50)
        doc.text(`Change: ${stats.percentChange > 0 ? '+' : ''}${stats.percentChange}%`, 14, 58)
      }

      autoTable(doc, {
        startY: 68,
        head: [['Category', 'Spent (₦)', 'Budget (₦)', 'Variance (₦)']],
        body: budgetComparison.map(c => [
          c.name,
          formatNaira(c.spent),
          formatNaira(c.budget),
          (c.diff >= 0 ? '+' : '') + formatNaira(c.diff),
        ]),
        headStyles: { fillColor: [16, 185, 129] },
        alternateRowStyles: { fillColor: [240, 253, 249] },
      })

      doc.save('fintrack-report.pdf')
    } finally {
      setExporting(false)
    }
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      budgetComparison.map(c => ({
        Category: c.name,
        'Spent (₦)': c.spent,
        'Budget (₦)': c.budget,
        'Variance (₦)': c.diff,
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, 'fintrack-report.xlsx')
  }

  return (
    <DashboardLayout brandText="Reports">
      <div className="space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Financial Reports</h2>
            <p className="text-sm mt-0.5 text-slate-500">Analyse spending vs budget targets</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportExcel} disabled={exporting || !stats}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 disabled:opacity-50 border border-slate-300 text-slate-700 bg-white shadow-sm"
            >
              <Download size={16} /> Excel
            </button>
            <button onClick={exportPDF} disabled={exporting || !stats}
              className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? 'Exporting…' : 'PDF'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm" style={{ color: 'var(--muted)' }}>
            <AlertCircle size={32} className="opacity-30" />
            <p>No data available. Upload some expenses first.</p>
          </div>
        ) : (
          <>
            {/* ── Spending vs Budget grouped bar ── */}
            <div className="rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
              <h3 className="text-sm font-semibold mb-6 text-slate-800">
                Spent vs Budget by Category
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetComparison} margin={{ top: 4, right: 4, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-40} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNairaShort} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '60px', fontSize: '12px' }} />
                  <Bar dataKey="spent"  name="Spent"  fill="#000000" radius={[4,4,0,0]} />
                  <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Monthly trend ── */}
            <div className="rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
              <h3 className="text-sm font-semibold mb-6 text-slate-800">
                Monthly Spending Trend
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNairaShort} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="total" name="Spending" stroke="#000000" strokeWidth={2.5} dot={{ r: 5, fill: '#000000' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Budget variance table ── */}
            <div className="rounded-lg overflow-hidden bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Category Variance Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Category', 'Spent', 'Budget', 'Variance', 'Status'].map(h => (
                        <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgetComparison.map((c, i) => {
                      const over = c.diff < 0
                      return (
                        <tr key={c.name} className="transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                              <span className="font-medium text-slate-900">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{formatNaira(c.spent)}</td>
                          <td className="px-6 py-4 text-slate-500">{formatNaira(c.budget)}</td>
                          <td className="px-6 py-4 font-semibold" style={{ color: over ? 'var(--danger)' : 'var(--success)' }}>
                            {over ? '-' : '+'}{formatNaira(Math.abs(c.diff))}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border"
                              style={{
                                background: over ? 'var(--danger-light)' : 'var(--success)10',
                                color: over ? 'var(--danger)' : 'var(--success)',
                                borderColor: over ? 'var(--danger-light)' : 'var(--success)30',
                              }}>
                              {over ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {over ? 'Over budget' : 'Under budget'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-6 py-4 font-bold text-sm text-slate-900">Total</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatNaira(stats.totalThisMonth)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatNaira(TOTAL_MONTHLY_BUDGET)}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: TOTAL_MONTHLY_BUDGET - stats.totalThisMonth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {TOTAL_MONTHLY_BUDGET - stats.totalThisMonth >= 0 ? '+' : '-'}{formatNaira(Math.abs(TOTAL_MONTHLY_BUDGET - stats.totalThisMonth))}
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
