/**
 * LoginHistoryCard — Server Component render top-20 LOGIN actions của user hiện tại.
 *
 * B13: Source data từ ActionLog (Sprint B13 đã thêm ActionType.LOGIN).
 */
import { LogIn, Globe, Clock } from 'lucide-react'

interface Row {
  createdAt: Date
  ipAddress: string | null
  userAgent: string | null
}

function formatVi(d: Date): string {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Thiết bị không xác định'
  // Quick parser (đủ dùng cho dashboard, không cần thư viện UA nặng).
  if (/Chrome\/(\d+)/.test(ua) && !/Edg/.test(ua)) return 'Chrome'
  if (/Edg\/(\d+)/.test(ua)) return 'Edge'
  if (/Firefox\/(\d+)/.test(ua)) return 'Firefox'
  if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)) return 'Safari'
  return 'Browser khác'
}

export default function LoginHistoryCard({ history }: { history: Row[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Lịch sử đăng nhập</h3>
        <p className="text-sm text-gray-500 mt-1">
          20 lần đăng nhập gần nhất của tài khoản.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          Chưa có dữ liệu. Lần đăng nhập tiếp theo sẽ xuất hiện ở đây.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {history.map((row, idx) => (
            <li key={`${row.createdAt.toString()}-${idx}`} className="p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                <LogIn size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {formatVi(row.createdAt)}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <Globe size={12} />
                  IP: {row.ipAddress ?? '—'}
                  <span className="text-gray-300">·</span>
                  <Clock size={12} />
                  {parseBrowser(row.userAgent)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}