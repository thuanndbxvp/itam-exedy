# MICRO-STEP EXECUTION WORKFLOW (MSEW): HỆ THỐNG AUTH & BẢN QUYỀN

Yêu cầu Tầng 2 (Coder) thực hiện chính xác các bước dưới đây, không tự ý sửa logic kiến trúc.

## BƯỚC 1: Cấu hình Môi trường (Environment Variables)
Bổ sung vào file `.env` (tạo một chuỗi ngẫu nhiên cho secret):
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="IT-Management-Super-Secret-Key-2026"
```

## BƯỚC 2: Cấu hình NextAuth
Tạo file `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Tài khoản Nội bộ",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@congty.com" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // MVP: Bỏ qua kiểm tra mật khẩu, chỉ check xem email có trong DB không
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};
```

Tạo API route `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

Tạo Middleware `src/middleware.ts` ở ngoài cùng thư mục `src`:
```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/assets/:path*", "/licenses/:path*", "/"]
}
```

## BƯỚC 3: Trang Đăng nhập (Login)
Tạo file `src/app/login/page.tsx`:
```tsx
'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn("credentials", { email, password: "any", callbackUrl: "/assets" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập Quản lý IT</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email công ty</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2" 
              placeholder="admin@congty.com"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  )
}
```

## BƯỚC 4: Module Bản quyền (Licenses) - Server Action
Tạo `src/app/actions/license.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createLicense(data: { name: string, productKey?: string, seatsTotal: number }) {
  const license = await prisma.license.create({ data })
  
  await prisma.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemId: license.id,
      itemType: 'LICENSE',
      userId: 'system',
      notes: 'Tạo mới bản quyền',
    }
  })

  revalidatePath('/licenses')
  return license
}
```

## BƯỚC 5: UI Quản lý Bản quyền
Tạo `src/app/licenses/page.tsx`:
```tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bản quyền phần mềm</h1>
        <Link href="/licenses/new" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          + Thêm bản quyền
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Tên phần mềm</th>
              <th className="px-6 py-3">Product Key</th>
              <th className="px-6 py-3">Tổng số key (Seats)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {licenses.map(lic => (
              <tr key={lic.id}>
                <td className="px-6 py-4 font-medium">{lic.name}</td>
                <td className="px-6 py-4 font-mono text-xs">{lic.productKey || '-'}</td>
                <td className="px-6 py-4">{lic.seatsTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

Tạo `src/app/licenses/new/page.tsx`:
```tsx
import { createLicense } from '@/app/actions/license'
import { redirect } from 'next/navigation'

export default function NewLicensePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    await createLicense({
      name: formData.get('name') as string,
      productKey: formData.get('productKey') as string,
      seatsTotal: parseInt(formData.get('seatsTotal') as string),
    })
    redirect('/licenses')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Thêm mới Bản quyền</h1>
      <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <input type="text" name="name" required placeholder="Tên phần mềm (VD: Office 365)" className="w-full border p-2 rounded" />
        <input type="text" name="productKey" placeholder="Product Key (Tuỳ chọn)" className="w-full border p-2 rounded" />
        <input type="number" name="seatsTotal" required placeholder="Tổng số lượng Key mua" className="w-full border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Lưu Bản quyền</button>
      </form>
    </div>
  )
}
```
