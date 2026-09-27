'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, ShoppingBag, AlertCircle, Calendar,
} from 'lucide-react'
import { formatNaira, formatNairaShort, formatDate, TOTAL_MONTHLY_BUDGET } from '@/_lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatsData {
  totalThisMonth: number
  totalLastMonth: number
  percentChange: number
  countThisMonth: number
  categoryBreakdown: { name: string; value: number }[]
  monthlyTrend: { month: string; total: number }[]
  recentExpenses: {
    id: string
    date: string
    amount: number
    item: string
    category: { name: string; color: string }
  }[]
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, change, accent, isLoading,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  change?: number
  accent: string
  isLoading?: boolean
}) {
  const positive = (change ?? 0) <= 0 // spending down = positive for finance
  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
      style={{ border: '1px solid var(--card-border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          {isLoading
            ? <div className="skeleton h-8 w-36 mt-2 rounded" />
            : <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
          }
          {sub && <p className="text-xs mt-1 text-slate-500">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-slate-50 border border-slate-100">
          <Icon size={18} className="text-slate-600" />
        </div>
      </div>
      {change !== undefined && !isLoading && (
        <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
          {positive
            ? <ArrowDownRight size={14} className="text-emerald-600" />
            : <ArrowUpRight size={14} className="text-rose-600" />
          }
          <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
            {Math.abs(change)}% {positive ? 'less' : 'more'} vs last month
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatNaira(p.value)}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{formatNaira(payload[0].value)}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setError('Failed to load stats. Check your database connection.'))
      .finally(() => setLoading(false))
  }, [])

  const CHART_COLORS = [
    '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899',
    '#f97316', '#14b8a6', '#ef4444', '#a855f7', '#3b82f6',
    '#22c55e', '#64748b', '#e11d48',
  ]

  const budgetUsed = stats && stats.totalThisMonth ? (stats.totalThisMonth / TOTAL_MONTHLY_BUDGET) * 100 : 0
  const budgetPct  = isNaN(budgetUsed) ? 0 : Math.min(100, Math.round(budgetUsed))
  const budgetColor = budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#10b981'

  return (
    <DashboardLayout brandText="Dashboard">
      <div className="space-y-8 animate-fade-in-up">

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-medium"
            style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* ── Greeting ── */}
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Good {getGreeting()}, Admin 👋
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Here's your household finance summary for {currentMonthLabel()}.
          </p>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <MetricCard
            label="Spent This Month"
            value={stats ? formatNaira(Number(stats.totalThisMonth) || 0) : '—'}
            sub={`Budget: ${formatNaira(TOTAL_MONTHLY_BUDGET)}`}
            icon={Wallet}
            change={stats?.percentChange}
            accent="#10b981"
            isLoading={loading}
          />
          <MetricCard
            label="Last Month Spend"
            value={stats ? formatNaira(Number(stats.totalLastMonth) || 0) : '—'}
            icon={Calendar}
            accent="#0ea5e9"
            isLoading={loading}
          />
          <MetricCard
            label="Transactions"
            value={stats ? `${stats.countThisMonth ?? 0}` : '—'}
            sub="This month"
            icon={ShoppingBag}
            accent="#f59e0b"
            isLoading={loading}
          />
          <MetricCard
            label="Budget Remaining"
            value={stats
              ? formatNaira(Math.max(0, TOTAL_MONTHLY_BUDGET - (Number(stats.totalThisMonth) || 0)))
              : '—'}
            sub={stats ? `${budgetPct}% used` : ''}
            icon={TrendingUp}
            accent={budgetColor}
            isLoading={loading}
          />
        </div>

        {/* ── Budget Progress Bar ── */}
        {!loading && stats && (
          <div className="rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Monthly Budget Progress</p>
              <p className="text-sm font-bold" style={{ color: budgetColor }}>{budgetPct}%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${budgetPct}%`, background: budgetColor }}
              />
            </div>
            <div className="flex justify-between text-xs mt-3 font-medium text-slate-500">
              <span>{formatNaira(Number(stats.totalThisMonth) || 0)} spent</span>
              <span>{formatNaira(TOTAL_MONTHLY_BUDGET)} budget</span>
            </div>
          </div>
        )}

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Monthly Trend */}
          <div className="xl:col-span-2 rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
            <h3 className="text-sm font-semibold mb-6 text-slate-800">
              6-Month Spending Trend
            </h3>
            {loading ? (
              <div className="skeleton h-56 w-full rounded-xl" />
            ) : stats?.monthlyTrend?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatNairaShort} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total" name="Spending" stroke="#10b981" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 4, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data yet. Upload expenses to see your trend." />
            )}
          </div>

          {/* Pie Chart */}
          <div className="rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
            <h3 className="text-sm font-semibold mb-6 text-slate-800">
              Spending by Category
            </h3>
            {loading ? (
              <div className="skeleton h-56 w-full rounded-xl" />
            ) : stats?.categoryBreakdown?.length ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {stats.categoryBreakdown.slice(0, 8).map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ color: 'var(--foreground)' }} className="truncate max-w-[120px]">{c.name}</span>
                      </div>
                      <span className="font-medium" style={{ color: 'var(--muted)' }}>
                        {formatNairaShort(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No category data yet." />
            )}
          </div>
        </div>

        {/* ── Bar Chart: Category Spend vs Budget ── */}
        {!loading && stats?.categoryBreakdown?.length ? (
          <div className="rounded-lg p-6 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
            <h3 className="text-sm font-semibold mb-6 text-slate-800">
              Category Spend (This Month)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.categoryBreakdown.slice(0, 10)} margin={{ top: 4, right: 4, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                <YAxis tickFormatter={formatNairaShort} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Spent" radius={[6, 6, 0, 0]}>
                  {stats.categoryBreakdown.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* ── Recent Expenses Table ── */}
        <div className="rounded-lg overflow-hidden bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Recent Expenses</h3>
            <a href="/dashboard/expenses" className="text-xs font-semibold text-black hover:underline">
              View all
            </a>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded" />
              ))}
            </div>
          ) : stats?.recentExpenses?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Item', 'Category', 'Amount'].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentExpenses.map((e) => (
                    <tr key={e.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {e.item}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border"
                          style={{ background: `${e.category?.color ?? '#10b981'}10`, borderColor: `${e.category?.color ?? '#10b981'}30`, color: e.category?.color ?? '#10b981' }}>
                          {e.category?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatNaira(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16">
              <EmptyState message="No expenses yet. Log your first expense or upload a CSV." />
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function currentMonthLabel() {
  return new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-sm" style={{ color: 'var(--muted)' }}>
      <AlertCircle size={28} className="opacity-40" />
      <p className="text-center max-w-xs">{message}</p>
    </div>
  )
}
