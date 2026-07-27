import "next-auth";

/**
 * Module augmentation — mở rộng NextAuth Session/User/JWT interfaces
 * để chứa các field mới từ schema (firstName, lastName, role là enum Role).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
      role: "ADMIN" | "EMPLOYEE";
    };
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    role: "ADMIN" | "EMPLOYEE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string | null;
    role: "ADMIN" | "EMPLOYEE";
  }
}
