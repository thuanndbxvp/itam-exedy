import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        // Epic D: luôn verify bcrypt nếu user có password. Phase 2 (LDAP/SSO)
        // sẽ phân nhánh ở đây.
        if (!user.password) {
          // User chưa set password (vd: tài khoản hệ thống system@internal.local)
          // → reject nếu Phase 1.
          return null;
        }

        if (!credentials.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        // Trả về session object — NextAuth sẽ đẩy vào JWT callback bên dưới
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName ?? null,
          email: user.email ?? null,
          role: user.role, // Role enum (ADMIN | EMPLOYEE)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user ở đây là object return từ authorize() phía trên.
        // Module augmentation ở src/types/next-auth.d.ts đã thêm firstName/lastName/role
        // vào interface User, nhưng TS vẫn coi là optional — dùng ?? để thỏa mãn required fields.
        token.id = user.id;
        token.firstName = (user as { firstName?: string }).firstName ?? "";
        token.lastName = (user as { lastName?: string | null }).lastName ?? null;
        token.role = (user as { role?: "ADMIN" | "EMPLOYEE" }).role ?? "EMPLOYEE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = (token.lastName as string | null) ?? null;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};
