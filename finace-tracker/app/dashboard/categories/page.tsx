'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react'
import { formatNaira, BUDGET_CATEGORIES } from '@/_lib/utils'
import { useForm } from 'react-hook-form'

interface Category {
  id: string; name: string; color: string; budgetAmount: number
  expenses?: { amount: number }[]
}

interface FormValues {
  name: string; color: string; budgetAmount: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>()

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const seedCategories = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/categories', { method: 'PUT' })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', 'Default categories seeded successfully.')
      load()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setSeeding(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', color: '#10b981', budgetAmount: 0 })
    setShowForm(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setValue('name', c.name)
    setValue('color', c.color)
    setValue('budgetAmount', c.budgetAmount)
    setShowForm(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const url  = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', editing ? 'Category updated.' : 'Category created.')
      setShowForm(false)
      load()
    } catch (err: any) {
      showToast('error', err.message)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', 'Category deleted.')
      load()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <DashboardLayout brandText="Categories">
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
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Expense Categories</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {categories.length} categories configured
            </p>
          </div>
          <div className="flex items-center gap-3">
            {categories.length === 0 && (
              <button
                onClick={seedCategories}
                disabled={seeding}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-60 shadow-sm"
              >
                <Sparkles size={16} />
                {seeding ? 'Seeding…' : 'Seed Defaults'}
              </button>
            )}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus size={17} /> Add Category
            </button>
          </div>
        </div>

        {/* Default budgets hint */}
        {categories.length === 0 && !loading && (
          <div className="rounded-md p-5 text-sm bg-slate-50 border border-slate-200 text-slate-700">
            <p className="font-semibold mb-1">No categories yet!</p>
            <p>Click <strong>Seed Defaults</strong> to populate the 13 household categories from your budget template.</p>
          </div>
        )}

        {/* Grid of category cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const defaultBudget = BUDGET_CATEGORIES.find(b => b.name === cat.name)?.budget
              return (
                <div key={cat.id}
                  className="rounded-lg p-5 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                  style={{ border: `1px solid var(--card-border)`, borderLeft: `4px solid ${cat.color}` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: cat.color }}>
                        {cat.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{cat.name}</p>
                        <p className="text-xs mt-0.5 text-slate-500">
                          Budget: {formatNaira(cat.budgetAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-black transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {defaultBudget && defaultBudget !== Number(cat.budgetAmount) && (
                    <p className="text-xs mt-4 pt-3 border-t border-slate-100 text-slate-400">
                      Template default: {formatNaira(defaultBudget)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up"
            style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {editing ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted-bg"
                style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
              <Field label="Category Name" error={errors.name?.message}>
                <input type="text" placeholder="e.g. Groceries"
                  {...register('name', { required: 'Name is required' })}
                  className="field-input" />
              </Field>
              <Field label="Monthly Budget (₦)" error={errors.budgetAmount?.message}>
                <input type="number" step="1000" placeholder="0"
                  {...register('budgetAmount', { required: 'Budget is required', min: { value: 0, message: 'Must be ≥ 0' } })}
                  className="field-input" />
              </Field>
              <Field label="Color">
                <div className="flex items-center gap-3">
                  <input type="color" {...register('color')} className="h-10 w-16 rounded-lg cursor-pointer border-0 p-1"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Pick a chart color for this category</span>
                </div>
              </Field>
              <button type="submit" disabled={isSubmitting}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors disabled:opacity-60 shadow-sm"
              >
                {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
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
