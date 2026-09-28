'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { Plus, Trash2, AlertCircle, CheckCircle2, X, UserPlus } from 'lucide-react'
import { formatDate } from '@/_lib/utils'
import { useForm } from 'react-hook-form'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  createdAt: string
}

interface FormValues {
  name: string
  email: string
  password: string
  role: 'admin' | 'member'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { role: 'member' },
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', 'User created.')
      setShowForm(false)
      reset({ name: '', email: '', password: '', role: 'member' })
      load()
    } catch (err: any) {
      showToast('error', err.message)
    }
  }

  const changeRole = async (id: string, role: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      showToast('success', 'Role updated.')
      load()
    } catch (err: any) {
      showToast('error', err.message)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message)
      showToast('success', body.message ?? 'User removed.')
      load()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <DashboardLayout brandText="Admin · Users">
      <div className="space-y-6 animate-fade-in-up">
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Household Members</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{users.length} users</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={17} /> Invite User
          </button>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50" style={{ borderColor: 'var(--card-border)' }}>
                <th className="px-5 py-3 font-semibold text-slate-500">Name</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Email</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Role</th>
                <th className="px-5 py-3 font-semibold text-slate-500">Joined</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No users yet.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b last:border-0" style={{ borderColor: 'var(--card-border)' }}>
                  <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as 'admin' | 'member')}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium bg-white"
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <UserPlus size={18} /> Invite User
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted-bg" style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
              <Field label="Name" error={errors.name?.message}>
                <input type="text" {...register('name', { required: 'Name is required' })} className="field-input" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" {...register('email', { required: 'Email is required' })} className="field-input" />
              </Field>
              <Field label="Password" error={errors.password?.message}>
                <input type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })} className="field-input" />
              </Field>
              <Field label="Role">
                <select {...register('role')} className="field-input">
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </Field>
              <button type="submit" disabled={isSubmitting}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors disabled:opacity-60 shadow-sm">
                {isSubmitting ? 'Creating…' : 'Create User'}
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
