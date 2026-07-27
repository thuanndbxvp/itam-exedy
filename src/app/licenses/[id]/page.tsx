import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Key, Users, Calendar, Hash, Edit2, XCircle } from 'lucide-react'
import RoleGate from '@/components/RoleGate'
import CheckoutSeatButton from '@/components/licenses/CheckoutSeatButton'
import ExpireSeatButton from '@/components/licenses/ExpireSeatButton'

interface LicenseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LicenseDetailPage({ params }: LicenseDetailPageProps) {
  const { id } = await params

  // Load license + seats + users song song.
  const [license, users] = await Promise.all([
    prisma.license.findUnique({
      where: { id },
      include: {
        seats: {
          include: {
            assignedUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        category: true,
        manufacturer: true,
      },
    }),
    prisma.user.findMany({
      where: { activated: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  if (!license) {
    notFound()
  }

  // Tính thống kê seats.
  const totalSeats = license.seats.length
  const assignedSeats = license.seats.filter(
    (s) => !!s.assignedUserId || !!s.assignedAssetId
  ).length
  const expiredSeats = license.seats.filter((s) => s.unreassignableSeat).length
  const availableSeats = totalSeats - assignedSeats - expiredSeats

  const isExpired =
    license.expirationDate && license.expirationDate < new Date()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/licenses"
          className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-sm transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {license.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {license.category?.name}
                {license.manufacturer ? ` • ${license.manufacturer.name}` : ''}
              </p>
            </div>
          </div>
        </div>
        <RoleGate allowedRoles={['ADMIN']}>
          <Link
            href={`/licenses/${license.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
          >
            <Edit2 size={16} />
            Sửa
          </Link>
        </RoleGate>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin License</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Product Key</p>
            <p className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              {license.productKey || (
                <span className="text-gray-400">Không áp dụng</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-gray-500 mb-1">Ngày hết hạn</p>
            <p className="text-gray-900 flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <span>
                {license.expirationDate
                  ? new Date(license.expirationDate).toLocaleDateString('vi-VN')
                  : 'Không giới hạn'}
              </span>
              {isExpired && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700">
                  ĐÃ HẾT HẠN
                </span>
              )}
              {!isExpired && license.expirationDate && license.reassignable && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-700">
                  REASSIGNABLE
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-gray-500 mb-1">Số ghế (Seats)</p>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                {totalSeats} tổng
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs">
                {availableSeats} trống
              </span>
              <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs">
                {assignedSeats} đã cấp
              </span>
              {expiredSeats > 0 && (
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                  {expiredSeats} expired
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-gray-500 mb-1">Ngày tạo</p>
            <p className="text-gray-900">
              {new Date(license.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* Seats Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Danh sách Seats ({totalSeats})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">Seat ID</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  Người được cấp
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Ghi chú</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {license.seats.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    License này chưa có seat nào.
                  </td>
                </tr>
              ) : (
                license.seats.map((seat) => {
                  const state: 'AVAILABLE' | 'ASSIGNED' | 'EXPIRED' =
                    seat.unreassignableSeat
                      ? 'EXPIRED'
                      : seat.assignedUserId || seat.assignedAssetId
                      ? 'ASSIGNED'
                      : 'AVAILABLE'

                  const stateColor =
                    state === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : state === 'ASSIGNED'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'

                  const stateLabel =
                    state === 'AVAILABLE'
                      ? 'Trống'
                      : state === 'ASSIGNED'
                      ? 'Đã cấp'
                      : 'Expired'

                  return (
                    <tr
                      key={seat.id}
                      className="hover:bg-slate-50/50 transition group"
                    >
                      {/* Seat ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Hash
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <span className="font-mono text-xs text-gray-600">
                            {seat.id.slice(-8)}
                          </span>
                        </div>
                      </td>

                      {/* State */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${stateColor}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {stateLabel}
                        </span>
                      </td>

                      {/* Assigned User */}
                      <td className="px-6 py-4 text-gray-600">
                        {seat.assignedUser ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                              {seat.assignedUser.firstName
                                ?.charAt(0)
                                .toUpperCase() ?? '?'}
                            </div>
                            <span>
                              {seat.assignedUser.firstName}
                              {seat.assignedUser.lastName
                                ? ' ' + seat.assignedUser.lastName
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">---</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {seat.notes || (
                          <span className="text-gray-400 italic">---</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <RoleGate allowedRoles={['ADMIN']}>
                            <CheckoutSeatButton
                              seatId={seat.id}
                              seatLabel={`#${seat.id.slice(-6)}`}
                              users={users}
                              state={state}
                            />
                          </RoleGate>
                          <RoleGate allowedRoles={['ADMIN']}>
                            <ExpireSeatButton seatId={seat.id} state={state} />
                          </RoleGate>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}