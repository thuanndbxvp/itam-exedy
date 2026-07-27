/**
 * /reports/costs — Sprint C.1.
 *
 * Server Component shell: permission gate + render ItCostsClient.
 */
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/permissions/guard'
import ItCostsClient from './ItCostsClient'

export default async function ItCostsReportPage() {
  try {
    await requirePermission('reports.view')
  } catch {
    redirect('/')
  }

  return <ItCostsClient />
}
