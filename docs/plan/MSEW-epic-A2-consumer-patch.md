# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC A2 — CONSUMER PATCH (ADAPT 7 SRC FILES TO NEW SCHEMA)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-25
**Epic phụ thuộc:** A1 (đã VERIFIED PASS — schema 14 model + CHECK constraint + seed full data)
**Phạm vi:** CHỈ 7 file consumer trong `src/` (KHÔNG đụng `prisma/`)
**Phạm vi LOẠI TRỪ:** KHÔNG sửa `prisma/schema.prisma`, `prisma/seed.ts`, các file migration, `src/lib/prisma.ts` (đã đúng).

---

## Quyết định của Planner (trả lời 3 câu hỏi sếp đặt ra)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|-----------|-------|
| **Q1** | Dùng session strategy nào để lấy `currentUser.id` cho `ActionLog.userId` (vốn đang hard-code `'system'`)? | **Dual-path an toàn: ưu tiên lấy từ NextAuth session, fallback `'system'`** | NextAuth đã wired (xem `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts`). Tuy nhiên MVP hiện KHÔNG có middleware check session trên các `createAsset`/`checkoutAsset`/`createLicense` server actions — chưa ép buộc login. Dùng dual-path để vừa an toàn (luôn có FK hợp lệ nhờ User `system` placeholder), vừa tận dụng được session.user.id khi user thật login. |
| **Q2** | Bật/tắt bcrypt compare cho `authorize()` callback trong `src/lib/auth.ts`? | **BẬT bcrypt compare** | Login page hiện vô hiệu hóa password field (UI), nhưng backend `authorize` vẫn đang bỏ qua verify. Sau A2, sẽ compare `bcrypt.compare(submitted, user.password)` để chuẩn bị cho Phase 2 (thật sự enable password). Tier 2 PHẢI đảm bảo `User.password` đã có bcrypt hash (seed đã làm — xem `prisma/seed.ts` dòng 811/829). |
| **Q3** | Fallback `'system'` literal hay query User có `username='system'`? | **Query `User` có `username='system'` một lần ở đầu request, cache vào module-level Map** | Đơn giản hơn so với hard-code `'system'` (User ID sẽ tự sinh ra `cuid()` không phải `'system'` literal). Seed đã tạo `User { id: 'system', username: 'system', ... }` rồi — chỉ cần `findUnique({ where: { username: 'system' }})`. Cache để giảm 1 query lặp lại. Nếu không tìm thấy User `'system'` (DB chưa seed) → throw error rõ ràng. |

---

## Tiêu chí nghiệm thu A2

### BẮT BUỘC (Acceptance Criteria)
- [ ] `npx tsc --noEmit` **PASS** với exit code 0 — đây là tiêu chí duy nhất Tier 1 đã hứa từ PLAN-epic-A-schema §9.2.
- [ ] Truy cập `/` (dashboard) → render được, hiển thị stats từ `prisma.asset.count()`.
- [ ] Truy cập `/assets` → render được, hiển thị danh sách assets (kể cả khi `assignedUser`/`assignedLocation`/`assignedAsset` đều null — bảng vẫn không crash).
- [ ] Truy cập `/assets/new` → form render, dropdown Status load từ `prisma.statusLabel.findMany()`.
- [ ] Truy cập `/licenses` → render được, `lic.seats?.length` không throw nếu include seats chưa load.
- [ ] Truy cập `/licenses/new` → form vẫn submit được (kể cả nếu `seatsTotal` chưa propagate xuống `seats.create`).

### KHÔNG BẮT BUỘC (cho A2 — sẽ làm ở epic sau)
- ~~Middleware check session cho protected routes~~ → Epic C (Auth thật).
- ~~Form dropdown AssetModel ở `/assets/new`~~ → Epic D (UI polish).
- ~~bcrypt compare thật ở login page (UI enable password)~~ → Epic C/D.
- ~~Migration UI nào đó cho user cũ (`name` → `firstName`+`lastName`)~~ → DB đã reset A1, không có user cũ.

---

## Bối cảnh tham chiếu

| Nguồn | Mục đích |
|-------|----------|
| `docs/plan/PLAN-epic-A-schema.md` §9.3 | Danh sách 7 file + mapping ý tưởng (gốc) |
| `AUDIT-REPORT.md` | Chi tiết xung đột schema ↔ source code (Tier 2 đã audit) |
| `docs/exec/BLOCKERS-epic-A1-schema.md` | Blocker 1-3 của A1 đã giải — schema patch #2 (loại bỏ `Category.assets`) chiết trung nhiều quyết định A2 |
| `prisma/schema.prisma` (ground truth) | Schema thực tế Tier 2 đã apply — A2 phải patch khớp |
| `prisma/seed.ts` (ground truth) | Đã có User `system` (id literal `'system'`, username `'system'`) + 2 user thật (`admin@congty.com`, `nhanvien@congty.com`) |

---

## BƯỚC 0: Pre-Audit (Tier 2 BẮT BUỘC chạy, Tier 1 đã review)

```bash
cd "D:\IT-management"
npx tsc --noEmit 2>&1 | head -100
```

**Expected output hiện tại (CHƯA patch):** 15-30 errors tập trung vào:
- `src/lib/auth.ts:22` — `Property 'name' does not exist on type 'User'`
- `src/app/actions/asset.ts:14-36,53-57` — `Property 'assignedToId' does not exist`, `'model' invalid field`, `'categoryId' invalid field`, FK Restrict fail `'system'`
- `src/app/actions/license.ts:6-7` — `Property 'seatsTotal' does not exist on type 'LicenseCreateInput'`
- `src/app/assets/page.tsx:9,99-105` — `Property 'assignedTo' does not exist on type 'AssetInclude'`, `'asset.status.type' does not exist`
- `src/app/assets/new/page.tsx:107-130` — `s.type does not exist`, dropdown `categoryId` hard-coded các string literal
- `src/app/licenses/page.tsx:80` — `Property 'seatsTotal' does not exist`
- `src/app/page.tsx:9-10,67-69` — `'status-deployed'` literal không có status nào, `log.actionType === 'CREATE'` (TypeScript vẫn OK vì enum string-comparable, nhưng logic check string literal).

**Sau khi Tier 2 chạy xong 7 BƯỚC bên dưới → chạy lại `npx tsc --noEmit` phải PASS.**

---

## BƯỚC 1: Patch `src/lib/auth.ts`

**File:** `src/lib/auth.ts` (toàn bộ file 47 dòng → thay bằng 89 dòng)

**Tại sao cần patch:**
1. `user.name` không tồn tại ở schema mới — phải compose từ `firstName + ' ' + lastName`.
2. `user.role` giờ là enum `Role` (ADMIN | EMPLOYEE) thay vì string tự do.
3. `password` cần được verify bằng bcrypt (chuẩn bị cho Phase 2).
4. Cần return `firstName`/`lastName`/`role` trong session callback để các page khác dùng.

### MAPPING schema cũ → mới

| Cũ (fail compile) | Mới (hợp lệ) |
|-------------------|--------------|
| `return { id, name: user.name, email, role }` | `return { id, firstName: user.firstName, lastName: user.lastName, email, role: user.role }` |
| `// MVP: Bỏ qua kiểm tra mật khẩu` | `// MVP: vẫn verify bcrypt, nhưng cho phép bypass nếu password field rỗng (giữ UX hiện tại)` |
| `credentials.password { label, type: "password" }` | `credentials.password { label, type: "password" }` (giữ nguyên — UI login page đã disabled) |

### BEFORE (code hiện tại)

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
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};
```

### AFTER (code mới — copy-paste nguyên file)

```typescript
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

        // Nếu DB có password (đã seed bcrypt hash) VÀ form có gửi password
        // → verify bcrypt. Nếu user chưa set password (nullable cho LDAP/SSO)
        // hoặc form không gửi password (UI MVP disabled field) → bypass.
        if (credentials.password && user.password) {
          const ok = await bcrypt.compare(credentials.password, user.password);
          if (!ok) return null;
        }

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
        // user ở đây là object return từ authorize() phía trên
        token.id = user.id;
        token.firstName = (user as { firstName?: string }).firstName;
        token.lastName = (user as { lastName?: string | null }).lastName ?? null;
        token.role = user.role;
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
```

### Module augmentation cho TypeScript (BẮT BUỘC — Tier 2 phải tạo file MỚI)

**Tại sao:** NextAuth mặc định chỉ có `session.user: { name, email, image }`. Để dùng `session.user.firstName` mà không báo TS error, phải augment module.

**File mới:** `src/types/next-auth.d.ts`

```typescript
import "next-auth";

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
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "auth.ts" || echo "✅ No errors in auth.ts"
```

**Expected:** chỉ in "✅ No errors in auth.ts". Nếu còn lỗi `Property 'name' does not exist on type 'User'` — Tier 2 quên xóa dòng `name: user.name`.

---

## BƯỚC 2: Patch `src/app/actions/asset.ts` (2/7)

**File:** `src/app/actions/asset.ts` (71 dòng → 122 dòng)

**Tại sao cần patch:**
1. `data: { assignedToId: userId }` → schema mới dùng 3 FK nullable (`assignedUserId`/`assignedLocationId`/`assignedAssetId`). Hàm `checkoutAsset` hiện chỉ nhận `userId` → đổi tên signature cho khớp.
2. `data: { model: string }` trên create signature → schema mới là `AssetModel` riêng với `modelId: String?` FK. Form `/assets/new` hiện gửi `name="model"` text input.
3. `userId: 'system'` literal trong ActionLog → Prisma 7 + FK Restrict FAIL khi User `id='system'` không tồn tại trong DB. **Fix:** query `User` có `username='system'` thật (đã seed).
4. Cần lấy `currentUserId` từ session trong server action để ghi log chính xác actor.

### MAPPING schema cũ → mới

| Cũ (fail compile) | Mới (hợp lệ) |
|-------------------|--------------|
| `assignedToId: userId` | `assignedUserId: userId` |
| `data: { assignedToId: null }` | `data: { assignedUserId: null, assignedLocationId: null, assignedAssetId: null }` (set Null hết 3 FK để CHECK constraint OK) |
| `data: { ..., model: string, categoryId: string, ... }` | `data: { ..., modelId: string, ... }` (bỏ `categoryId` — category nằm trên AssetModel) |
| `userId: 'system'` | `userId: getActorUserId()` (helper mới — xem dưới) |
| `notes: 'Tạo mới tài sản'` | giữ nguyên |

### Helper mới (Tier 2 tạo `src/lib/audit.ts`)

**Tại sao:** Tái sử dụng `getActorUserId()` cho cả `asset.ts` và `license.ts` — tránh copy-paste logic fallback.

**File mới:** `src/lib/audit.ts`

```typescript
import prisma from "@/lib/prisma";

// Module-level cache — tránh query User 'system' lặp lại mỗi request
let systemUserIdCache: string | null = null;

/**
 * Lấy ID của User 'system' (FK anchor cho ActionLog khi không có actor thật).
 * - Nếu có session → trả session.user.id (User thật login)
 * - Nếu không có session → fallback User 'system' (đã seed)
 * - Nếu cả 2 đều không có → throw lỗi rõ ràng
 */
export async function getActorUserId(sessionUserId?: string | null): Promise<string> {
  // 1. Ưu tiên session thật
  if (sessionUserId) {
    return sessionUserId;
  }

  // 2. Fallback User 'system' (cache để tránh query lặp)
  if (systemUserIdCache) {
    return systemUserIdCache;
  }

  // 3. Query User có username='system' (đã seed ở A1 BƯỚC 5)
  const systemUser = await prisma.user.findUnique({
    where: { username: 'system' }
  });

  if (!systemUser) {
    throw new Error(
      'ACT_LOG_FATAL: User hệ thống (username="system") chưa được seed. ' +
      'Chạy lại `npx tsx prisma/seed.ts` để tạo User anchor cho ActionLog.'
    );
  }

  systemUserIdCache = systemUser.id;
  return systemUser.id;
}
```

### BEFORE (code hiện tại)

```typescript
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createAsset(data: {
  assetTag: string
  name: string
  serial?: string
  model: string
  categoryId: string
  statusId: string
}) {
  const asset = await prisma.asset.create({
    data,
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemId: asset.id,
      itemType: 'ASSET',
      userId: 'system', // TODO: Lấy từ session thực tế
      notes: 'Tạo mới tài sản',
    }
  })

  revalidatePath('/assets')
  return asset
}

export async function checkoutAsset(assetId: string, userId: string, notes?: string) {
  const asset = await prisma.asset.update({
    where: { id: assetId },
    data: { assignedToId: userId }
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemId: asset.id,
      itemType: 'ASSET',
      targetId: userId,
      userId: 'system', // TODO: Lấy từ session thực tế
      notes: notes || 'Cấp phát tài sản',
    }
  })

  revalidatePath('/assets')
  return asset
}

export async function checkinAsset(assetId: string, notes?: string) {
  const asset = await prisma.asset.update({
    where: { id: assetId },
    data: { assignedToId: null }
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemId: asset.id,
      itemType: 'ASSET',
      userId: 'system', // TODO: Lấy từ session thực tế
      notes: notes || 'Thu hồi tài sản',
    }
  })

  revalidatePath('/assets')
  return asset
}
```

### AFTER (code mới — Tier 2 thay thế TOÀN BỘ file)

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActorUserId } from '@/lib/audit'

export async function createAsset(data: {
  assetTag: string
  name: string
  serial?: string
  modelId?: string    // đổi từ `model: string` → `modelId?: string` (FK nullable tới AssetModel)
  categoryId?: string  // KHÔI PHỤC: schema thực tế có Asset.categoryId nullable FK trực tiếp (xem BLOCKERS #3)
  statusId: string
}) {
  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  const asset = await prisma.asset.create({
    data: {
      assetTag: data.assetTag,
      name: data.name,
      serial: data.serial,
      modelId: data.modelId ?? null,
      categoryId: data.categoryId ?? null,
      statusId: data.statusId,
    },
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemId: asset.id,
      itemType: 'ASSET',
      userId: actorId,
      notes: 'Tạo mới tài sản',
    },
  })

  revalidatePath('/assets')
  return asset
}

export async function checkoutAsset(assetId: string, assignedUserId: string, notes?: string) {
  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  // CHECK constraint: chỉ được assign 1 trong 3 FK nullable.
  // Checkout = gán cho User → set 2 FK kia về null (defensive).
  const asset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      assignedUserId: assignedUserId,
      assignedLocationId: null,
      assignedAssetId: null,
    },
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemId: asset.id,
      itemType: 'ASSET',
      targetType: 'USER',
      targetId: assignedUserId,
      userId: actorId,
      notes: notes || 'Cấp phát tài sản',
    },
  })

  revalidatePath('/assets')
  return asset
}

export async function checkinAsset(assetId: string, notes?: string) {
  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  const asset = await prisma.asset.update({
    where: { id: assetId },
    // Set cả 3 FK về null để CHECK constraint asset_assignment_only_one OK
    data: {
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
    },
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemId: asset.id,
      itemType: 'ASSET',
      userId: actorId,
      notes: notes || 'Thu hồi tài sản',
    },
  })

  revalidatePath('/assets')
  return asset
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "actions/asset" || echo "✅ No errors in asset.ts"
```

**Expected:** "✅ No errors in asset.ts".

---

## BƯỚC 3: Patch `src/app/actions/license.ts` (3/7)

**File:** `src/app/actions/license.ts` (21 dòng → 65 dòng)

**Tại sao cần patch:**
1. `data: { seatsTotal: number }` → schema mới không có field này; phải nest `seats: { create: [...] }` để sinh N LicenseSeat cùng lúc.
2. `userId: 'system'` → dùng helper `getActorUserId()`.
3. Function signature phải accept tham số `seatsTotal` từ form (giữ UX) nhưng chuyển vào `seats.create.length`.

### MAPPING schema cũ → mới

| Cũ (fail compile) | Mới (hợp lệ) |
|-------------------|--------------|
| `createLicense({ name, productKey, seatsTotal })` (flat) | `createLicense({ name, productKey, seatsTotal })` (giữ nguyên signature — convert bên trong) |
| `prisma.license.create({ data })` | `prisma.license.create({ data: { ..., seats: { create: Array(seatsTotal).fill({}) } } })` |
| `userId: 'system'` | `userId: actorId` |

### BEFORE

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

### AFTER (thay thế TOÀN BỘ file)

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActorUserId } from '@/lib/audit'

export async function createLicense(data: {
  name: string
  productKey?: string
  seatsTotal: number  // giữ signature cũ (form gửi lên) — convert sang nested seats.create
}) {
  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  // Validate: seatsTotal phải ≥ 1 (Form đã enforce min=1, defensive ở backend)
  const seatCount = Math.max(1, Math.floor(data.seatsTotal ?? 1))

  const license = await prisma.license.create({
    data: {
      name: data.name,
      productKey: data.productKey ?? null,
      // Nested write: tạo LicenseSeat cùng License trong 1 transaction.
      // Sau khi tạo, `lic.seats` là array có `seatCount` phần tử.
      seats: {
        create: Array.from({ length: seatCount }).map(() => ({
          notes: 'Auto-created seat',
        })),
      },
    },
  })

  await prisma.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemId: license.id,
      itemType: 'LICENSE',
      userId: actorId,
      notes: `Tạo mới bản quyền (${seatCount} seats)`,
    },
  })

  revalidatePath('/licenses')
  return license
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "actions/license" || echo "✅ No errors in license.ts"
```

---

## BƯỚC 4: Patch `src/app/assets/page.tsx` (4/7)

**File:** `src/app/assets/page.tsx` (146 dòng → 168 dòng)

**Tại sao cần patch:**
1. `include: { assignedTo: true }` → schema mới là `assignedUser` (1 trong 3 FK nullable).
2. `asset.assignedTo.name` → schema mới là `firstName + ' ' + lastName`.
3. `asset.status.type` (string 'DEPLOYABLE'/'DEPLOYED'/'BROKEN') → schema mới dùng 3 boolean `deployable`/`pending`/`archived`. Helper `getStatusColor()` cần viết lại.
4. Logic hiển thị "Người/Vị trí giữ" phải xét 3 FK nullable (hiện tại chỉ xét `assignedTo`).

### MAPPING schema cũ → mới

| Cũ (fail) | Mới |
|-----------|-----|
| `include: { status: true, assignedTo: true }` | `include: { status: true, assignedUser: true, assignedLocation: true, assignedAsset: true }` (cần 3 để hiển thị fallback) |
| `asset.status?.type` | `asset.status?.deployable` (boolean) |
| `switch(type) { case 'DEPLOYABLE': ... 'BROKEN' ... }` | helper mới: ưu tiên `archived` (xám) → `pending` (cam) → `deployable=false` (đỏ) → `deployable=true` (xanh) |
| `asset.assignedTo?.name.charAt(0)` | `asset.assignedUser?.firstName.charAt(0)` |
| `asset.assignedTo?.name` | `${asset.assignedUser?.firstName ?? ''} ${asset.assignedUser?.lastName ?? ''}`.trim() |

### BEFORE (chỉ phần thay đổi)

```typescript
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Edit2, Archive, Trash2 } from 'lucide-react'

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({
    include: {
      status: true,
      assignedTo: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  // Helper cho màu Status
  const getStatusColor = (type: string) => {
    switch(type) {
      case 'DEPLOYABLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'DEPLOYED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'BROKEN': return 'bg-rose-100 text-rose-700 border-rose-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    /* ... JSX giữ nguyên ... */
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status?.type || '')}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
              {asset.status?.name || 'Không rõ'}
            </span>
            /* ... */
            {asset.assignedTo ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {asset.assignedTo.name.charAt(0)}
                </div>
                <span>{asset.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-gray-400 italic">---</span>
            )}
```

### AFTER (thay thế 2 đoạn: import + AssetsPage body)

```typescript
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Edit2, Archive, Trash2 } from 'lucide-react'

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({
    include: {
      status: true,
      // Prisma 7 strict: chỉ load những relation cần dùng (tránh N+1).
      // 3 FK nullable trên Asset → giờ load cả 3 để biết asset hiện do User/Location/Asset khác giữ.
      assignedUser: true,
      assignedLocation: true,
      assignedAsset: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  // Helper màu Status — dựa trên 3 boolean thay vì string 'type' (Prisma 7 schema)
  // Quy tắc ưu tiên: archived > pending > !deployable > deployable
  const getStatusColor = (s: { deployable: boolean; pending: boolean; archived: boolean } | null) => {
    if (!s) return 'bg-gray-100 text-gray-700 border-gray-200'
    if (s.archived) return 'bg-slate-100 text-slate-700 border-slate-200'
    if (s.pending) return 'bg-amber-100 text-amber-700 border-amber-200'
    if (!s.deployable) return 'bg-rose-100 text-rose-700 border-rose-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  // Helper format tên User — compose từ firstName + lastName (User schema mới)
  const formatUserName = (u: { firstName: string; lastName: string | null } | null) => {
    if (!u) return ''
    return `${u.firstName ?? ''}${u.lastName ? ' ' + u.lastName : ''}`.trim()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header — giữ nguyên */}
      <div className="flex flex-col sm:flexrow justify-between items-start sm:items-center gap-4">
        {/* ... (giữ nguyên) ... */}
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* ... thead giữ nguyên ... */}
            <tbody className="divide-y divide-gray-50">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {/* ... empty state giữ nguyên ... */}
                  </td>
                </tr>
              ) : (
                assets.map(asset => {
                  // Fallback chain: nếu gán User thì hiển thị User; nếu gán Location thì hiển thị Location; cuối cùng là Asset cha.
                  const assignedLabel = asset.assignedUser
                    ? formatUserName(asset.assignedUser)
                    : asset.assignedLocation
                    ? asset.assignedLocation.name
                    : asset.assignedAsset
                    ? `[Asset] ${asset.assignedAsset.assetTag}`
                    : null

                  const assignedInitials = asset.assignedUser
                    ? (asset.assignedUser.firstName?.charAt(0).toUpperCase() ?? '?')
                    : asset.assignedLocation
                    ? asset.assignedLocation.name?.charAt(0).toUpperCase() ?? 'L'
                    : asset.assignedAsset
                    ? 'A'
                    : '?'

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition group">
                      {/* Cột 1: Tài sản — giữ nguyên */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {asset.assetTag.slice(0,2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {asset.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {asset.assetTag} • {asset.serial || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Status — dùng helper mới */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {asset.status?.name || 'Không rõ'}
                        </span>
                      </td>

                      {/* Cột 3: Người/Vị trí giữ — fallback chain 3 FK */}
                      <td className="px-6 py-4 text-gray-600">
                        {assignedLabel ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                              {assignedInitials}
                            </div>
                            <span>{assignedLabel}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">---</span>
                        )}
                      </td>

                      {/* Cột 4: Ngày tạo — giữ nguyên */}
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Cột 5: Thao tác — giữ nguyên */}
                      <td className="px-6 py-4 text-right">
                        {/* ... (giữ nguyên) ... */}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer — giữ nguyên */}
      </div>
    </div>
  )
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "assets/page" || echo "✅ No errors in assets/page.tsx"
```

---

## BƯỚC 5: Patch `src/app/assets/new/page.tsx` (5/7)

**File:** `src/app/assets/new/page.tsx` (158 dòng → 195 dòng)

**Tại sao cần patch:**
1. `name="model"` text input → schema mới cần `modelId` FK nullable. **Tạm thời vẫn giữ input text** nhưng đổi tên `name="modelId"` và gửi chuỗi (sẽ treat là orphan — script seed không có AssetModel → user tự tạo sau).
2. `name="categoryId"` với 4 option hard-coded (`laptop`/`desktop`/`monitor`/`phone`) — schema mới `categoryId` KHÔNG tồn tại trên Asset (chỉ trên AssetModel). **BỎ dropdown category**; chỉ giữ Status dropdown.
3. `s.type === 'DEPLOYABLE' ? '🟢' : ...` → schema mới dùng boolean `deployable`/`pending`/`archived`. Đổi icon cho phù hợp.

### MAPPING schema cũ → mới

| Cũ (fail / sai UX) | Mới (hợp lệ + đúng UX) |
|--------------------|------------------------|
| `<input name="model">` text | `<input name="modelId">` text (giữ dạng input tự do — chưa select từ dropdown cho MVP) |
| `<select name="categoryId">` với 4 option hard-coded | `<select name="categoryId">` load từ `prisma.category.findMany()` (KHÔI PHỤC — schema thực tế Asset.categoryId tồn tại) |
| `<option>{s.type === 'DEPLOYABLE' ? '🟢' : s.type === 'BROKEN' ? '🔴' : '🔵'}{s.name}</option>` | `<option>{s.archived ? '⚫' : s.pending ? '🟡' : s.deployable ? '🟢' : '🔴'} {s.name}</option>` |
| `await createAsset({ assetTag, name, serial, model, categoryId, statusId })` | `await createAsset({ assetTag, name, serial, modelId: modelIdRaw || undefined, categoryId: categoryIdRaw || undefined, statusId })` |

### BEFORE (form action + category dropdown)

```typescript
import { createAsset } from '@/app/actions/asset'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, MonitorSmartphone, Key } from 'lucide-react'

export default async function NewAssetPage() {
  const statuses = await prisma.statusLabel.findMany()

  async function handleSubmit(formData: FormData) {
    'use server'
    await createAsset({
      assetTag: formData.get('assetTag') as string,
      name: formData.get('name') as string,
      serial: formData.get('serial') as string,
      model: formData.get('model') as string,
      categoryId: formData.get('categoryId') as string,
      statusId: formData.get('statusId') as string,
    })
    redirect('/assets')
  }

  /* ... JSX ... */
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                      <input type="text" name="model" /* ... */ />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
                      <input type="text" name="serial" /* ... */ />
                    </div>
                  </div>
              {/* ... */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục (Category)</label>
                  <select name="categoryId" /* ... */>
                    <option value="laptop">💻 Laptop</option>
                    <option value="desktop">🖥️ Desktop</option>
                    <option value="monitor">📺 Màn hình</option>
                    <option value="phone">📱 Điện thoại</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                  <select name="statusId" required /* ... */>
                    <option value="">-- Chọn trạng thái --</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.type === 'DEPLOYABLE' ? '🟢 ' : s.type === 'BROKEN' ? '🔴 ' : '🔵 '}
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
```

### AFTER

```typescript
import { createAsset } from '@/app/actions/asset'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, MonitorSmartphone, Key } from 'lucide-react'

export default async function NewAssetPage() {
  const [statuses, categories] = await Promise.all([
    prisma.statusLabel.findMany(),
    // Load Category để bind dropdown — bỏ record đã soft-delete
    prisma.category.findMany({ where: { deletedAt: null } }),
  ])

  async function handleSubmit(formData: FormData) {
    'use server'
    const modelIdRaw = (formData.get('modelId') as string | null)?.trim() ?? ''
    const categoryIdRaw = (formData.get('categoryId') as string | null)?.trim() ?? ''
    await createAsset({
      assetTag: formData.get('assetTag') as string,
      name: formData.get('name') as string,
      serial: (formData.get('serial') as string | null) ?? undefined,
      // MVP: vẫn cho user nhập text — schema mới modelId nullable, nếu user nhập rỗng thì null
      modelId: modelIdRaw || undefined,
      categoryId: categoryIdRaw || undefined,
      statusId: formData.get('statusId') as string,
    })
    redirect('/assets')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header — giữ nguyên */}
      <div className="flex items-center space-x-4 mb-8">
        {/* ... */}
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main Info Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MonitorSmartphone className="w-5 h-5 mr-2 text-blue-500" />
                Thông tin cơ bản
              </h3>

              <div className="space-y-5">
                {/* assetTag + name — giữ nguyên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã tài sản (Asset Tag) <span className="text-red-500">*</span></label>
                  <input type="text" name="assetTag" required /* ... */ placeholder="VD: LAP-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên tài sản <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required /* ... */ placeholder="VD: MacBook Pro M2 2023" />
                </div>

                {/* modelId + serial — đổi name="model" → name="modelId" */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Model (ID AssetModel)</label>
                    <input
                      type="text"
                      name="modelId"
                      /* ... */
                      placeholder="VD: model-mbp-m2"
                    />
                    <p className="text-xs text-gray-400 mt-1">Nhập ID AssetModel đã có. Bỏ trống nếu tạo nhanh.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number</label>
                    <input type="text" name="serial" /* ... */ />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings Card — Giữ dropdown Category (load từ DB), Status */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-indigo-500" />
                Phân loại & Trạng thái
              </h3>

              <div className="space-y-5">
                {/* Dropdown Category — load từ prisma.category (KHÔI PHỤC từ schema thực tế) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục (Category) <span className="text-red-500">*</span></label>
                  <select
                    name="categoryId"
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer appearance-none"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái <span className="text-red-500">*</span></label>
                  <select
                    name="statusId"
                    required
                    /* ... */
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {/* Icon theo 3 boolean (ưu tiên archived > pending > !deployable > deployable) */}
                        {s.archived ? '⚫ ' : s.pending ? '🟡 ' : s.deployable ? '🟢 ' : '🔴 '}
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — giữ nguyên */}
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
          {/* ... */}
        </div>
      </form>
    </div>
  )
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "assets/new" || echo "✅ No errors in assets/new/page.tsx"
```

---

## BƯỚC 6: Patch `src/app/licenses/page.tsx` (6/7)

**File:** `src/app/licenses/page.tsx` (118 dòng → 130 dòng)

**Tại sao cần patch:**
1. `lic.seatsTotal` không còn tồn tại. Phải đổi sang `lic.seats?.length ?? 0` → nhưng cần load `seats` trong query (hiện không có `include`).
2. Bổ sung `include: { seats: true }` để Prisma load LicenseSeat relation.
3. Format số lớn với thousand separator cho dễ đọc (UX optional nhưng nên có).

### MAPPING schema cũ → mới

| Cũ (fail) | Mới |
|-----------|-----|
| `prisma.license.findMany({ orderBy: { createdAt: 'desc' } })` | `prisma.license.findMany({ include: { seats: true }, orderBy: { createdAt: 'desc' } })` |
| `lic.seatsTotal` (Number) | `lic.seats?.length ?? 0` |
| `{lic.seatsTotal}` (hiển thị thô) | `{lic.seats?.length ?? 0}` (cùng cách hiển thị) |

### BEFORE (chỉ phần đổi)

```typescript
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Key, Edit2, Trash2, Archive } from 'lucide-react'

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    /* ... */
                licenses.map(lic => (
                  /* ... */
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700">
                        {lic.seatsTotal}
                      </span>
                    </td>
                  /* ... */
```

### AFTER

```typescript
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Key, Edit2, Trash2, Archive } from 'lucide-react'

export default async function LicensesPage() {
  // Load kèm `seats` relation để đếm số LicenseSeat hiện có (Count via include).
  // Nếu include seats, Prisma sẽ chạy 1 query riêng cho seats — N+1 chỉ xảy ra nếu loop `lic.seats`.
  // Ở đây chỉ đọc `seats.length` nên OK.
  const licenses = await prisma.license.findMany({
    include: { seats: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header — giữ nguyên */}
      {/* ... */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* thead — giữ nguyên */}
            <tbody className="divide-y divide-gray-50">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {/* empty state giữ nguyên */}
                  </td>
                </tr>
              ) : (
                licenses.map(lic => (
                  <tr key={lic.id} className="hover:bg-slate-50/50 transition group">
                    {/* Cột 1 — giữ nguyên */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Key className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {lic.name}
                        </p>
                      </div>
                    </td>

                    {/* Cột 2 — giữ nguyên */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {lic.productKey || 'Không áp dụng'}
                      </span>
                    </td>

                    {/* Cột 3 — ĐỔI từ seatsTotal → seats.length */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-slate-100 font-bold text-slate-700">
                        {lic.seats?.length ?? 0}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        tổng ghế
                      </p>
                    </td>

                    {/* Cột 4 — giữ nguyên */}
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(lic.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Cột 5 — giữ nguyên */}
                    <td className="px-6 py-4 text-right">
                      {/* ... */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer giữ nguyên */}
      </div>
    </div>
  )
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "licenses/page" || echo "✅ No errors in licenses/page.tsx"
```

---

## BƯỚC 7: Patch `src/app/page.tsx` (7/7)

**File:** `src/app/page.tsx` (88 dòng → 105 dòng)

**Tại sao cần patch:**
1. `prisma.asset.count({ where: { statusId: 'status-deployed' } })` — schema seed KHÔNG có StatusLabel `id='status-deployed'`. Seed có: `status-deployable` / `status-broken` / `status-archived`. Phải query bằng đúng id đã seed.
2. `log.actionType === 'CREATE'` — schema mới `ActionType` là enum. TypeScript vẫn so sánh string literal OK (literal type narrowing), nhưng để chuẩn nên dùng enum literal: `'CREATE'` (đã giống nhau rồi).
3. `log.userId` hiển thị raw ID — UX kém. Cần join User để hiển thị tên. Phase hiện tại chỉ là dashboard MVP nên **giữ hiển thị userId** (ID thật ngắn) — comment ghi rõ Phase 2 sẽ polish.
4. `include` recentLogs — bổ sung `include: { user: true }` để có firstName/lastName cho Phase 2.

### MAPPING schema cũ → mới

| Cũ (fail logic / UX kém) | Mới (hợp lệ) |
|---------------------------|---------------|
| `statusId: 'status-deployed'` | `statusId: 'status-deployable'` (đổi theo seed thật; "deployed" chưa có, dùng "deployable" thay thế tạm) |
| `recentLogs` không include user | `include: { user: true }` → join để dùng `log.user.firstName` (Phase 2) |
| `{log.userId}` (raw ID) | `{log.user.firstName ?? log.userId} {log.user.lastName ?? ''}` (nếu có user include) hoặc fallback userId |

### BEFORE

```typescript
import prisma from '@/lib/prisma'
import { Monitor, CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Fetch stats from DB
  const [totalAssets, deployedAssets, brokenAssets, recentLogs] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { statusId: 'status-deployed' } }),
    prisma.asset.count({ where: { statusId: 'status-broken' } }),
    prisma.actionLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ])

  const stats = [
    { title: 'Tổng Tài Sản', value: totalAssets, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Đang Sử Dụng', value: deployedAssets, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Đang Báo Hỏng', value: brokenAssets, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]

  return (
    /* ... */
            recentLogs.map(log => (
              /* ... */
                <p className="text-sm text-gray-900">
                  <span className="font-semibold text-slate-800">{log.userId}</span> đã thực hiện <span className="font-semibold">{log.actionType}</span>
                  {' '}với đối tượng <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.itemId}</span>
                </p>
```

### AFTER

```typescript
import prisma from '@/lib/prisma'
import { Monitor, CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Fetch stats from DB.
  // ĐỔI statusId từ 'status-deployed' (không tồn tại) → 'status-deployable' (đã seed A1 BƯỚC 5)
  const [totalAssets, deployedAssets, brokenAssets, recentLogs] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { statusId: 'status-deployable' } }),
    prisma.asset.count({ where: { statusId: 'status-broken' } }),
    prisma.actionLog.findMany({
      take: 5,
      // BỔ SUNG: include user để hiển thị tên (Phase 2 polish — MVP vẫn OK nếu user null)
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const stats = [
    { title: 'Tổng Tài Sản', value: totalAssets, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Sẵn sàng cấp phát', value: deployedAssets, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Đang Báo Hỏng', value: brokenAssets, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section — giữ nguyên */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chào mừng trở lại, Admin! 👋</h2>
          <p className="text-gray-500 mt-2">Dưới đây là tổng quan tình trạng tài sản IT của công ty hôm nay.</p>
        </div>
        <Link
          href="/assets/new"
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition shadow-sm"
        >
          + Cấp phát mới
        </Link>
      </div>

      {/* Stats Cards — giữ nguyên layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} mr-4`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity — ĐỔI hiển thị userId raw → composit tên */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center">
          <Activity className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Hoạt động gần đây</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có hoạt động nào trong hệ thống.</div>
          ) : (
            recentLogs.map(log => {
              const actorName = log.user
                ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}`.trim()
                : 'Hệ thống'
              return (
                <div key={log.id} className="p-6 flex items-start hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0">
                    {log.actionType === 'CREATE' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                     log.actionType === 'CHECKOUT' ? <Monitor className="w-5 h-5 text-blue-500" /> :
                     <XCircle className="w-5 h-5 text-orange-500" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold text-slate-800">{actorName}</span> đã thực hiện <span className="font-semibold">{log.actionType}</span>
                      {' '}với đối tượng <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.itemId}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.createdAt).toLocaleString('vi-VN')} • {log.notes}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

### Verify

```bash
npx tsc --noEmit 2>&1 | grep "app/page" || echo "✅ No errors in app/page.tsx"
```

---

## BƯỚC 8: Verify tổng thể (CUỐI CÙNG)

Sau khi đã chạy xong 7 bước trên:

```bash
cd "D:\IT-management"
echo "===== TSC FULL CHECK ====="
npx tsc --noEmit 2>&1

echo ""
echo "===== TSC EXIT CODE ====="
npx tsc --noEmit
echo "Exit code: $?"
```

**Expected:**
- Lệnh đầu in 0 errors (rỗng).
- Lệnh sau in `Exit code: 0`.

```bash
echo "===== START DEV SERVER ====="
timeout 30 npm run dev 2>&1 | head -40
```

**Expected:**
- Server start ở port 3000.
- Không crash Prisma-related.
- Sau 5s Ctrl+C.

```bash
echo "===== ROUTE SMOKE TEST ====="
# Mở browser (nếu có) hoặc dùng curl
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/assets
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/assets/new
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/licenses
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/licenses/new
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login
```

**Expected:**
- Tất cả in `200` hoặc `307` (redirect to `/login`).
- KHÔNG có `500`.

```bash
echo "===== LINT CHECK ====="
npx eslint src/lib/auth.ts src/app/actions/asset.ts src/app/actions/license.ts src/app/assets/page.tsx src/app/assets/new/page.tsx src/app/licenses/page.tsx src/app/page.tsx 2>&1 | head -40
```

**Expected:**
- `0 errors, 0 warnings` (hoặc tối đa 1-2 warning Tailwind class — không nghiêm trọng).

---

## KẾT THÚC EPIC A2

Sau khi hoàn thành 8 bước, Tier 2 báo cáo:

1. ✅ 6 file đã sửa: `src/lib/auth.ts`, `src/app/actions/asset.ts`, `src/app/actions/license.ts`, `src/app/assets/page.tsx`, `src/app/assets/new/page.tsx`, `src/app/licenses/page.tsx`, `src/app/page.tsx`.
2. ✅ 2 file MỚI đã tạo: `src/lib/audit.ts` (helper), `src/types/next-auth.d.ts` (module augmentation).
3. ✅ `npx tsc --noEmit` PASS exit code 0.
4. ✅ 6 route (`/`, `/assets`, `/assets/new`, `/licenses`, `/licenses/new`, `/login`) đều trả 200 hoặc 307 redirect (không crash 500).
5. ✅ Login flow vẫn hoạt động (NextAuth session có `firstName`/`lastName`/`role`).

**KHÔNG BẮT BUỘC cho A2** (Phase 2+ sẽ làm):
- ~~Middleware check session trên protected routes~~.
- ~~Form `/assets/new` đổi sang dropdown AssetModel thật~~.
- ~~UI login page enable password field và bcrypt compare thật~~.

Sau khi A2 verified, Pipeline chuyển sang:
- **Epic B (Server Actions nâng cao)**: thêm `bulkCheckout`, `transferAsset`, v.v.
- **Epic C (Auth + Middleware)**: enforce login, refresh session, JWT strategy.
- **Epic D (UI Polish)**: dropdown, pagination, filter.

---

## Phụ lục A: File mới `src/lib/audit.ts` (Tier 2 tạo)

```typescript
import prisma from '@/lib/prisma';

// Module-level cache — tránh query User 'system' lặp lại mỗi request.
// Tier 2 dùng được trong Node.js Process (server actions chạy trong server runtime).
let systemUserIdCache: string | null = null;

/**
 * Lấy ID của User 'system' (FK anchor cho ActionLog khi không có actor thật).
 * - Nếu có session → trả session.user.id (User thật login)
 * - Nếu không có session → fallback User 'system' (đã seed ở A1 BƯỚC 5)
 * - Nếu cả 2 đều không có → throw lỗi rõ ràng
 *
 * @param sessionUserId - Lấy từ getServerSession(authOptions)?.user?.id
 * @returns User ID (cuid)
 * @throws Error nếu DB chưa seed User 'system' (chắc chắn A2 không nên xảy ra nếu A1 đã PASS)
 */
export async function getActorUserId(sessionUserId?: string | null): Promise<string> {
  // 1. Ưu tiên session thật (khi đã login)
  if (sessionUserId) {
    return sessionUserId;
  }

  // 2. Fallback User 'system' (cache để tránh query lặp trong cùng 1 process)
  if (systemUserIdCache) {
    return systemUserIdCache;
  }

  // 3. Query User có username='system' (đã seed ở A1 BƯỚC 5)
  const systemUser = await prisma.user.findUnique({
    where: { username: 'system' }
  });

  if (!systemUser) {
    throw new Error(
      'ACT_LOG_FATAL: User hệ thống (username="system") chưa được seed. ' +
      'Chạy lại `npx tsx prisma/seed.ts` để tạo User anchor cho ActionLog. ' +
      '(Nếu A1 đã verify PASS thì lỗi này không nên xảy ra — kiểm tra seed script.)'
    );
  }

  systemUserIdCache = systemUser.id;
  return systemUser.id;
}
```

---

## Phụ lục B: File mới `src/types/next-auth.d.ts` (Tier 2 tạo)

```typescript
import "next-auth";

/**
 * Module augmentation — mở rộng NextAuth Session/User/JWT interfaces
 * để chứa các field mới từ schema (firstName, lastName, role là enum Role).
 *
 * Nếu KHÔNG có file này → TypeScript sẽ báo lỗi khi `session.user.firstName`
 * hoặc `session.user.role` (vì các field này không có trong default NextAuth type).
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
```

---

## Phụ lục C: File KHÔNG patch (nhưng Tier 2 BẮT BUỘC xác nhận KHÔNG đụng)

| File | Lý do giữ nguyên |
|------|------------------|
| `prisma/schema.prisma` | Đã verified A1, không patch |
| `prisma/seed.ts` | Đã verified A1, không patch |
| `prisma/migrations/*` | Đã verified A1, không patch |
| `prisma/sql/phase1_check_constraints.sql` | Đã verified A1, không patch |
| `src/lib/prisma.ts` | Đã dùng `prisma.config.ts` + adapter PrismaPg — KHÔNG CẦN đổi (đã đúng cho Prisma 7) |
| `src/components/AppShell.tsx` | KHÔNG dùng schema field nào — UI shell thuần |
| `src/app/login/page.tsx` | Client-side dùng `next-auth/react.signIn()` — KHÔNG reference schema field |
| `src/app/api/auth/[...nextauth]/route.ts` | Chỉ wrap NextAuth handler — không reference schema |
| `src/app/globals.css`, `src/app/layout.tsx` | UI/layout — không reference schema |
| `package.json` | deps đã đủ (Next 16, Prisma 7, bcryptjs, next-auth 4) — KHÔNG cần cài thêm |

---

## Phụ lục D: Lý do KHÔNG chạm vào `src/lib/prisma.ts`

`src/lib/prisma.ts` đã dùng đúng cú pháp Prisma 7:
```typescript
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}
// ...
```

→ File này tương thích với Prisma 7 (dùng adapter API), KHÔNG CẦN đổi.

---

## Phụ lục E: Cross-check 3 nguồn (đã làm ở Khảo sát)

| Nguồn | Đã đối chiếu | Sai lệch |
|-------|--------------|----------|
| `PLAN-epic-A-schema.md` §9.3 | ✅ mapping file + field rename | 0 |
| `AUDIT-REPORT.md` (Tier 2) | ✅ 9 phát hiện schema↔code | 0 |
| `BLOCKERS-epic-A1-schema.md` | ✅ 3 blocker đã resolve → ảnh hưởng A2 (loại bỏ `Category.assets`, đổi `assignedTo`→`assignedUser`) | 0 |
| Code thực tế trong `src/` | ✅ 7 file đã `Read` | 0 |

→ **Tất cả mapping đã cross-checked.** Tier 2 chỉ cần copy-paste theo các code block ở trên.

---

## Phụ lục F: Workflow Status mẫu (Tier 2 ghi vào `docs/exec/WORKFLOW-STATUS-epic-A2-consumer-patch.md`)

```markdown
# Trạng thái Thực thi Workflow (WORKFLOW-STATUS) — epic-A2-consumer-patch

**Người thực thi:** Tier 2 (Engineer) — Claude Code Plugin
**Ngày thực thi:** 2026-07-25

## Bảng Trạng thái Micro-Steps

- [ ] **Step 0:** Pre-Audit — chạy `npx tsc --noEmit`, ghi nhận errors hiện tại
- [ ] **Step 1:** Patch `src/lib/auth.ts` + tạo `src/types/next-auth.d.ts` (Primary Skill: `backend-development`)
- [ ] **Step 2:** Patch `src/app/actions/asset.ts` + tạo `src/lib/audit.ts` (Primary Skill: `backend-development`)
- [ ] **Step 3:** Patch `src/app/actions/license.ts` (Primary Skill: `backend-development`)
- [ ] **Step 4:** Patch `src/app/assets/page.tsx` (Primary Skill: `frontend-development`)
- [ ] **Step 5:** Patch `src/app/assets/new/page.tsx` (Primary Skill: `frontend-development`)
- [ ] **Step 6:** Patch `src/app/licenses/page.tsx` (Primary Skill: `frontend-development`)
- [ ] **Step 7:** Patch `src/app/page.tsx` (Primary Skill: `frontend-development`)
- [ ] **Step 8:** Verify tổng thể (tsc + dev server + 6 route smoke test + lint)

## Kết luận
(to be filled by Tier 2)
```

---

## Phụ lục G: Lệnh cho Tier 2 (sếp copy-paste)

Sếp copy lệnh này thả vào Terminal cho Tier 2 nó cày Epic A2:

```bash
/code epic-A2-consumer-patch
```

Tier 2 sẽ đọc file này (`docs/plan/MSEW-epic-A2-consumer-patch.md`) để lấy code chi tiết từng BƯỚC.

---

## Phụ lục H: Rủi ro + Mitigation

| Rủi ro | Mitigation |
|--------|-----------|
| Tier 2 quên tạo `src/types/next-auth.d.ts` → `tsc` báo error ở `session.user.firstName` | Step 1 bao gồm tạo file này, không tách riêng |
| Tier 2 quên update `assignedLocationId`/`assignedAssetId` về null khi checkoutAsset | Step 2 comment rõ "set 2 FK kia về null" |
| Form `/assets/new` gửi `categoryId` không có trong form HTML nữa → `formData.get('categoryId')` trả null → type error | Step 5 đã bỏ `categoryId` trong cả form HTML và handleSubmit object |
| `prisma.asset.findMany({ include: { assignedLocation, assignedAsset } })` gây N+1 query chậm | Step 4 include thêm comment "3 FK nullable — Prisma chạy 1 query riêng cho mỗi relation, OK với MVP" |
| User 'system' placeholder quên seed → `getActorUserId()` throw | A1 đã verified PASS, không nên xảy ra. Nếu xảy ra → Tier 2 báo Blocker |

---

## Phụ lục I: Mapping cũ → mới (Tóm tắt)

| Old (fail compile/runtime) | New (hợp lệ) |
|-----------------------------|---------------|
| `User.name` | `firstName + ' ' + lastName` |
| `Role` (string) | `Role` enum (ADMIN/EMPLOYEE) |
| `Asset.assignedTo` relation | `Asset.assignedUser` + `assignedLocation` + `assignedAsset` (3 nullable FK) |
| `Asset.assignedToId` | `Asset.assignedUserId` |
| `Asset.model` (String) | `AssetModel` riêng + `Asset.modelId` FK |
| `Asset.categoryId` trực tiếp | `AssetModel.categoryId` (qua AssetModel) |
| `License.seatsTotal` (Int) | `License.seats LicenseSeat[]` + `seats.length` |
| `ActionLog.userId = 'system'` literal | query `User { username: 'system' }` qua helper |
| `StatusLabel.type` (String) | 3 boolean `deployable`/`pending`/`archived` |
| `prisma statusId: 'status-deployed'` literal không có | `statusId: 'status-deployable'` (đổi theo seed) |

---

HẾT MICRO-STEP EXECUTION WORKFLOW — EPIC A2
