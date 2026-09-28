'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, X, Search, Filter } from 'lucide-react'
import { formatNaira, formatDate } from '@/_lib/utils'
import { useForm } from 'react-hook-form'

interface Category { id: string; name: string; color: string; budgetAmount: number }
interface Expense {
  id: string; date: string; amount: number; item: string
  category: Category; categoryId: string
  comments?: string
  loggedByUser?: { id: string; name: string }
}

interface FormValues {
  date: string; amount: number; item: string; categoryId: string; comments?: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>()

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, cRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/categories'),
      ])
      const eData = await eRes.json()
      const cData = await cRes.json()
      setExpenses(eData.data ?? [])
      setCategories(cData.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    reset({ date: new Date().toISOString().split('T')[0], amount: undefined, item: '', categoryId: '' })
    setShowForm(true)
  }

  const openEdit = (e: Expense) => {
    setEditing(e)
    setValue('date', e.date)
    setValue('amount', e.amount)
    setValue('item', e.item)
    setValue('categoryId', e.categoryId)
    setValue('comments', e.comments || '')
    setShowForm(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const url = editing ? `/api/expenses/${editing.id}` : '/api/expenses'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', editing ? 'Expense updated.' : 'Expense logged.')
      setShowForm(false)
      load()
    } catch (err: any) {
      showToast('error', err.message ?? 'Something went wrong.')
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', 'Expense deleted.')
      load()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = expenses.filter((e) => {
    const matchSearch = search
      ? e.item.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.name.toLowerCase().includes(search.toLowerCase())
      : true
    const matchCat = filterCat ? e.categoryId === filterCat : true
    return matchSearch && matchCat
  })

  return (
    <DashboardLayout brandText="Expenses">
      <div className="space-y-6 animate-fade-in-up">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 shadow-xl text-sm font-medium animate-fade-in-up"
            style={{
              background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: toast.type === 'success' ? '#047857' : '#dc2626',
              border: `1px solid ${toast.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Expenses Log</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {expenses.length} total records
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={17} /> Log Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search item or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-slate-500">
              <AlertCircle size={32} className="opacity-30" />
              <p>No expenses found. Try adjusting the filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Item', 'Category', 'Amount', 'Comments', 'Logged By', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => (
                    <tr key={e.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{e.item}</td>
                      <td className="px-6 py-4">
                        {e.category && (
                          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border"
                            style={{ background: `${e.category.color}10`, borderColor: `${e.category.color}30`, color: e.category.color }}>
                            {e.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatNaira(e.amount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {e.comments || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {e.loggedByUser?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(e)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-black transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(e.id)}
                            disabled={deleting === e.id}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-in Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md flex flex-col h-screen animate-slide-in-left"
            style={{ background: 'var(--card-bg)', borderLeft: '1px solid var(--card-border)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {editing ? 'Edit Expense' : 'Log New Expense'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted-bg" style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <Field label="Date" error={errors.date?.message}>
                <input type="date" {...register('date', { required: 'Date is required' })} className="field-input" />
              </Field>
              <Field label="Item Description" error={errors.item?.message}>
                <input type="text" placeholder="e.g. Chicken breast from market"
                  {...register('item', { required: 'Item is required' })} className="field-input" />
              </Field>
              <Field label="Category" error={errors.categoryId?.message}>
                <select {...register('categoryId', { required: 'Category is required' })} className="field-input">
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Amount (₦)" error={errors.amount?.message}>
                <input type="number" step="0.01" placeholder="0.00"
                  {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Must be > 0' } })}
                  className="field-input" />
              </Field>
              <Field label="Comments (optional)">
                <textarea
                  {...register('comments')}
                  placeholder="Add any notes about this expense..."
                  rows={3}
                  className="field-input resize-none"
                />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Log Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .field-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }
        .field-input:focus {
          border-color: #000000;
          box-shadow: 0 0 0 1px #000000;
        }
        .field-input.resize-none {
          resize: none;
        }
      `}</style>
    </DashboardLayout>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
