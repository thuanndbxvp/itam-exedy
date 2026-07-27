'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Mail, VolumeX, Save, Loader2 } from 'lucide-react'
import { updateNotificationPrefsAction } from '@/app/actions/account-preferences'
import type { EmailDigestFrequency } from '@prisma/client'

interface Props {
  emailDigestFrequency: EmailDigestFrequency
  muteUntil: string | null // ISO string
}

export default function NotificationPrefsForm({ emailDigestFrequency, muteUntil }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()

  // Convert ISO → datetime-local format (yyyy-MM-ddTHH:mm)
  const initialMuteLocal =
    muteUntil && muteUntil !== ''
      ? new Date(muteUntil).toISOString().slice(0, 16)
      : ''

  function handleSubmit(formData: FormData) {
    const freq = (formData.get('emailDigestFrequency') as EmailDigestFrequency) ?? 'DAILY'
    const muteUntilRaw = (formData.get('muteUntil') as string | null) ?? ''
    startTransition(async () => {
      const result = await updateNotificationPrefsAction({
        emailDigestFrequency: freq,
        muteUntil: muteUntilRaw || null,
      })
      showCommandResult(result, 'Đã lưu cài đặt thông báo.')
      if (result.ok) router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Email Digest */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Digest</h3>
            <p className="text-sm text-gray-500">
              Tần suất gửi email tổng hợp thông báo.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { value: 'NEVER', label: 'Không bao giờ', desc: 'Tắt email digest hoàn toàn' },
            { value: 'DAILY', label: 'Mỗi ngày', desc: 'Gửi email tổng hợp 1 lần/ngày' },
            { value: 'WEEKLY', label: 'Mỗi tuần', desc: 'Gửi email tổng hợp 1 lần/tuần' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${
                emailDigestFrequency === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="emailDigestFrequency"
                value={opt.value}
                defaultChecked={emailDigestFrequency === opt.value}
                className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Mute */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <VolumeX size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tạm tắt thông báo</h3>
            <p className="text-sm text-gray-500">
              Mute toàn bộ thông báo đến thời điểm chỉ định (vd: đi nghỉ phép).
            </p>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tắt đến (tùy chọn)
        </label>
        <input
          type="datetime-local"
          name="muteUntil"
          defaultValue={initialMuteLocal}
          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
        />
        <p className="text-xs text-gray-500 mt-2">
          Để trống nếu muốn bật lại ngay. Phải ở tương lai.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu cài đặt
        </button>
      </div>
    </form>
  )
}