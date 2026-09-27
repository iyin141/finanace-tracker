'use client'

import { useState, useCallback } from 'react'
import DashboardLayout from '@/_Components/Shared/DashboardLayout'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, ArrowRight, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ParsedRow {
  date: string; amount: number; category: string; item: string
}

interface ImportResult {
  imported: number; errors: string[]
}

type Step = 'upload' | 'preview' | 'result'

export default function UploadPage() {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows]     = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const parseFile = useCallback((file: File) => {
    setParseError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const raw: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        // Find header row (look for 'date', 'amount', 'category', 'item')
        let headerRowIdx = -1
        let colMap: Record<string, number> = {}
        for (let i = 0; i < Math.min(10, raw.length); i++) {
          const cells = raw[i].map((c: any) => String(c ?? '').toLowerCase().trim())
          if (
            cells.some((c: string) => c === 'date') &&
            cells.some((c: string) => c === 'amount') &&
            cells.some((c: string) => c === 'category' || c === 'cat') &&
            cells.some((c: string) => c === 'item' || c === 'description')
          ) {
            headerRowIdx = i
            colMap = {
              date:     cells.findIndex((c: string) => c === 'date'),
              amount:   cells.findIndex((c: string) => c === 'amount'),
              category: cells.findIndex((c: string) => c === 'category' || c === 'cat'),
              item:     cells.findIndex((c: string) => c === 'item' || c === 'description'),
            }
            break
          }
        }

        if (headerRowIdx === -1) {
          // Try treating first row as header
          const headers = raw[0]?.map((c: any) => String(c ?? '').toLowerCase().trim()) ?? []
          colMap = {
            date:     headers.findIndex((h: string) => h.includes('date')),
            amount:   headers.findIndex((h: string) => h.includes('amount') || h.includes('cost')),
            category: headers.findIndex((h: string) => h.includes('cat') || h.includes('type')),
            item:     headers.findIndex((h: string) => h.includes('item') || h.includes('desc') || h.includes('name')),
          }
          headerRowIdx = 0
        }

        const parsed: ParsedRow[] = []
        for (let i = headerRowIdx + 1; i < raw.length; i++) {
          const row = raw[i]
          if (!row || row.every((c: any) => !c)) continue

          const dateRaw = row[colMap.date]
          let dateStr = ''
          if (dateRaw instanceof Date) {
            dateStr = dateRaw.toISOString().split('T')[0]
          } else if (typeof dateRaw === 'number') {
            // Excel serial date
            const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000))
            dateStr = d.toISOString().split('T')[0]
          } else {
            dateStr = String(dateRaw ?? '').trim()
          }

          const amount = parseFloat(String(row[colMap.amount] ?? '').replace(/,/g, ''))
          if (!dateStr || isNaN(amount)) continue

          parsed.push({
            date:     dateStr,
            amount,
            category: String(row[colMap.category] ?? 'Miscellaneous').trim(),
            item:     String(row[colMap.item] ?? '').trim() || 'No description',
          })
        }

        if (parsed.length === 0) {
          setParseError('No valid rows found. Ensure your file has columns: Date, Amount, Category, Item.')
          return
        }

        setRows(parsed)
        setFileName(file.name)
        setStep('preview')
      } catch (err: any) {
        setParseError(`Failed to parse file: ${err.message}`)
      }
    }
    reader.readAsBinaryString(file)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      })
      const data = await res.json()
      setResult(data)
      setStep('result')
    } catch {
      setResult({ imported: 0, errors: ['Network error. Please try again.'] })
      setStep('result')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setStep('upload'); setRows([]); setFileName(''); setResult(null); setParseError(null)
  }

  return (
    <DashboardLayout brandText="Upload CSV">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">

        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Import Expenses from CSV/Excel</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Upload a spreadsheet to bulk-import expenses. Accepted format: Date, Amount, Category, Item.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {(['upload', 'preview', 'result'] as Step[]).map((s, i) => {
            const stepIdx = ['upload', 'preview', 'result'].indexOf(step)
            const isDone  = i < stepIdx
            const isActive = s === step
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold`}
                  style={{
                    background: isDone ? '#000000' : isActive ? '#000000' : 'var(--muted-bg)',
                    color: isDone || isActive ? 'white' : 'var(--muted)',
                  }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium capitalize" style={{ color: isActive ? '#000000' : 'var(--muted)' }}>
                  {s}
                </span>
                {i < 2 && <ArrowRight size={14} style={{ color: 'var(--muted)' }} />}
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-5">
            {/* Format hint */}
            <div className="flex items-start gap-3 rounded-md p-4 text-sm bg-slate-50 border border-slate-200 text-slate-700">
              <Info size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Expected Format</p>
                <p className="mt-0.5 opacity-80">
                  Columns (case-insensitive): <strong>Date</strong> | <strong>Amount</strong> | <strong>Category</strong> | <strong>Item</strong>
                </p>
                <p className="mt-0.5 opacity-70 text-xs">Accepts: .csv, .xlsx, .xls — Max 1,000 rows per upload</p>
              </div>
            </div>

            {/* Drop zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center gap-4 rounded-lg p-16 cursor-pointer transition-all duration-200"
              style={{
                border: `2px dashed ${dragOver ? '#000000' : 'var(--card-border)'}`,
                background: dragOver ? 'var(--muted-bg)' : 'var(--card-bg)',
              }}
            >
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-slate-100">
                <FileSpreadsheet size={32} className="text-slate-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">
                  Drop your file here or <span className="text-black underline">browse</span>
                </p>
                <p className="text-sm mt-1 text-slate-500">CSV, XLSX, XLS supported</p>
              </div>
              <input id="file-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            </label>

            {parseError && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fca5a5' }}>
                <AlertCircle size={16} />
                {parseError}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <FileSpreadsheet size={18} className="text-black" />
                <span className="font-medium text-slate-900">{fileName}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                  {rows.length} rows
                </span>
              </div>
              <button onClick={reset} className="text-xs flex items-center gap-1 text-slate-500 hover:text-black">
                <X size={13} /> Change file
              </button>
            </div>

            <div className="rounded-lg overflow-hidden bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['#', 'Date', 'Item', 'Category', 'Amount'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-xs text-slate-500">{i + 1}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{r.date}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{r.item}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {r.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          ₦{r.amount.toLocaleString('en-NG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 rounded-md py-2.5 text-sm font-semibold transition-all bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleImport} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors disabled:opacity-60 shadow-sm">
                <Upload size={16} />
                {uploading ? 'Importing…' : `Import ${rows.length} Expenses`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === 'result' && result && (
          <div className="space-y-5">
            <div className="rounded-lg p-8 text-center"
              style={{ background: result.imported > 0 ? '#f8fafc' : '#fee2e2', border: `1px solid ${result.imported > 0 ? '#cbd5e1' : '#fca5a5'}` }}>
              {result.imported > 0
                ? <CheckCircle2 size={40} className="mx-auto mb-3 text-black" />
                : <AlertCircle size={40} className="mx-auto mb-3 text-red-500" />
              }
              <p className="text-2xl font-bold" style={{ color: result.imported > 0 ? '#000000' : '#ef4444' }}>
                {result.imported} expense{result.imported !== 1 ? 's' : ''} imported
              </p>
              {result.errors.length > 0 && (
                <p className="text-sm mt-1 text-red-500">
                  {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg p-5 space-y-2 bg-white shadow-sm" style={{ border: '1px solid var(--card-border)' }}>
                <p className="text-sm font-semibold text-red-500">Skipped rows:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-500">• {e}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 rounded-md py-2.5 text-sm font-semibold transition-all bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">
                Upload Another
              </button>
              <a href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white bg-black hover:bg-slate-800 transition-colors shadow-sm">
                Go to Dashboard <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
