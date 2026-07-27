/**
 * /settings/helpdesk-teams — A7
 *
 * Quản lý Helpdesk Teams (CRUD + members).
 * Permission: helpdesk.manage_teams (IT_MANAGER only).
 */
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import HelpdeskTeamsClient from '@/components/helpdesk/HelpdeskTeamsClient'

export default async function HelpdeskTeamsPage() {
  let canWrite = false
  try {
    await requirePermission('helpdesk.manage_teams')
    canWrite = true
  } catch {
    redirect('/')
  }

  // Lấy cả inactive teams (cho admin xem lịch sử)
  const [teams, users] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { members: true, tickets: true } },
        lead: { select: { id: true, firstName: true, lastName: true, role: true } },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: [{ isLead: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, activated: true },
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
  ])

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Users size={22} className="text-blue-600" />
          Helpdesk Teams
        </h1>
        <p className="text-gray-500">Quản lý team IT xử lý ticket: tạo, sửa, gán thành viên.</p>
      </div>
      <HelpdeskTeamsClient
        initialTeams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          category: t.category,
          leadId: t.leadId,
          isActive: t.isActive,
          memberIds: t.members.map((m) => m.userId),
          memberCount: t._count.members,
          ticketCount: t._count.tickets,
          lead: t.lead,
        }))}
        users={users}
        canEdit={canWrite}
      />
    </div>
  )
}