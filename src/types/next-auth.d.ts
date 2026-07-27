import "next-auth";

/**
 * Module augmentation — mở rộng NextAuth Session/User/JWT interfaces
 * để chứa các field mới từ schema (firstName, lastName, role là enum Role).
 *
 * Epic F: Role enum mở rộng thành 4 giá trị:
 *   - EMPLOYEE    : nhân viên thường (default)
 *   - IT_STAFF    : nhân viên IT, xử lý ticket
 *   - IT_MANAGER  : quản lý IT, CRUD rules + reports
 *   - ADMIN       : super admin
 */
type UserRole = "EMPLOYEE" | "IT_STAFF" | "IT_MANAGER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string | null;
    role: UserRole;
  }
}
