import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileForm from '@/components/account/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div className="text-red-600">Chưa đăng nhập.</div>
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      zip: true,
      avatar: true,
    },
  })

  if (!user) {
    return <div className="text-red-600">Không tìm thấy user.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-gray-500 mb-6">Quản lý thông tin cá nhân.</p>
      <ProfileForm user={user} />
    </div>
  )
}