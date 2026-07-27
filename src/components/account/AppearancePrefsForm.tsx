'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Sun, Moon, Monitor, Globe, Save, Loader2 } from 'lucide-react'
import { updateAppearancePrefsAction } from '@/app/actions/account-preferences'
import type { UiTheme } from '@prisma/client'

interface Props {
  theme: UiTheme
  locale: string | null
}

const LOCALES = [
  { value: 'vi-VN', label: 'Tiếng Việt (vi-VN)' },
  { value: 'en-US', label: 'English (en-US)' },
]

export default function AppearancePrefsForm({ theme, locale }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    const newTheme = (formData.get('theme') as UiTheme) ?? 'SYSTEM'
    const newLocale = (formData.get('locale') as string | null) ?? ''
    startTransition(async () => {
      const result = await updateAppearancePrefsAction({
        theme: newTheme,
        locale: newLocale || null,
      })
      showCommandResult(result, 'Đã lưu giao diện.')
      if (result.ok) {
        // Reload để áp dụng dark class ngay từ server render (cookie theme vừa set).
        router.refresh()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Theme */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-1">Theme</h3>
        <p className="text-sm text-gray-500 mb-4">Chọn chế độ sáng/tối.</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'LIGHT', label: 'Sáng', icon: Sun, preview: 'bg-white text-gray-900 border-gray-200' },
            { value: 'DARK', label: 'Tối', icon: Moon, preview: 'bg-slate-900 text-white border-slate-700' },
            { value: 'SYSTEM', label: 'Hệ thống', icon: Monitor, preview: 'bg-gradient-to-br from-white to-slate-900 text-gray-900' },
          ].map((opt) => {
            const Icon = opt.icon
            const active = theme === opt.value
            return (
              <label
                key={opt.value}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  defaultChecked={active}
                  className="sr-only"
                />
                <div
                  className={`w-full h-16 rounded-lg border ${opt.preview} flex items-center justify-center`}
                >
                  <Icon size={20} />
                </div>
                <span className="font-medium text-sm text-gray-900">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Locale */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Globe size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Ngôn ngữ</h3>
            <p className="text-sm text-gray-500">
              Locale dùng để format ngày tháng, số, tiền tệ.
            </p>
          </div>
        </div>
        <select
          name="locale"
          defaultValue={locale ?? ''}
          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
        >
          <option value="">— Mặc định (vi-VN) —</option>
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu giao diện
        </button>
      </div>
    </form>
  )
}