import prisma from '@/lib/prisma'
import EditCategoryForm from './EditCategoryForm'
import { notFound } from 'next/navigation'

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cat = await prisma.category.findUnique({ where: { id } })
  if (!cat) notFound()
  return <EditCategoryForm category={cat} />
}
