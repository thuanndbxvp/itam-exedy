'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import type { CommandResult } from '@/lib/errors'
import { Loader2, Shield, Globe, Palette, Mail, Building2 } from 'lucide-react'

type IconKey = 'shield' | 'globe' | 'palette' | 'mail' | 'building'

const ICON_MAP: Record<IconKey, React.ElementType> = {
  shield: Shield,
  globe: Globe,
  palette: Palette,
  mail: Mail,
  building: Building2,
}

interface Field {
  name: string
  label: string
  icon?: IconKey
  type: 'text' | 'select' | 'number' | 'checkbox' | 'color' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  description?: string
  placeholder?: string
}

interface SettingsFormProps {
  initialData: Record<string, unknown> | null
  fields: Field[]
  title: string
  onSubmit: (data: Record<string, unknown>) => Promise<CommandResult<unknown>>
}

export default function SettingsForm({
  initialData,
  fields,
  title,
  onSubmit,
}: SettingsFormProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, unknown>>(initialData ?? {})

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await onSubmit(values)
      showCommandResult(result)
      if (result.ok) {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          {fields.map((field) => {
            const Icon = field.icon ? ICON_MAP[field.icon] : null
            const currentValue = values[field.name]
            return (
              <div key={field.name}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  {Icon && <Icon size={16} className="text-gray-400" />}
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={String(currentValue ?? '')}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(currentValue)}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                ) : field.type === 'color' ? (
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={String(currentValue ?? '#2563eb')}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={String(currentValue ?? '#2563eb')}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 font-mono text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={String(currentValue ?? '')}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={String(currentValue ?? '')}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
                    placeholder={field.placeholder}
                  />
                )}

                {field.description && (
                  <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </button>
      </div>
    </form>
  )
}
