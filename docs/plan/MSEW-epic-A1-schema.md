# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC A1 — REWRITE PRISMA SCHEMA + SEED

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-25
**Phạm vi:** CHỈ schema.prisma + seed.ts + migration + CHECK constraint
**Phạm vi LOẠI TRỪ:** KHÔNG đụng tới `src/app/actions/`, `src/app/**/page.tsx`, `src/lib/auth.ts` — đó là Epic A2.

---

## Quyết định của Planner (từ AUDIT-REPORT Tier 2)

| Q | Câu hỏi | Quyết định |
|---|---|---|
| Q1 | Đề xuất A / B / C? | **B — Tách Epic A → A1 + A2** (xem `PLAN-epic-A-schema.md` §9) |
| Q2 | Chạy `db push --force-reset` trên Neon DB? | **OK** — Neon dev branch, data cũ là demo. Backup `.env` trước. Dùng `prisma migrate dev` ưu tiên, fallback `db push --force-reset --accept-data-loss`. |
| Q3 | bcryptjs hay argon2? | **bcryptjs + @types/bcryptjs** (thuần JS, không native binding). Tier 2 được phép `npm install`. |
| Q4 | ActionLog.userId FK Restrict + User 'system'? | **Giữ Restrict + tạo User `id='system'` placeholder trong seed.** User `system` có `activated=false`, `password=null` — chỉ là FK anchor. |

**Tiêu chí nghiệm thu A1 (BÃ� bỏ `tsc --noEmit`):**
- [ ] `npx prisma format` PASS
- [ ] `npx prisma validate` PASS
- [ ] `npx prisma generate` PASS
- [ ] `npx prisma migrate dev --name phase1_schema` PASS (hoặc `db push --force-reset --accept-data-loss` nếu Neon pooler chặn migration)
- [ ] `npx tsx prisma/seed.ts` PASS (insert thành công 14 model + 5 LicenseSeat)
- [ ] CHECK constraint `asset_assignment_only_one` + `license_seat_assignment_only_one` đã apply
- [ ] `npx prisma studio` hiển thị đủ 14 model + data mẫu

**Tiêu chí KHÔNG yêu cầu cho A1:**
- ~~`tsc --noEmit` PASS~~ — sẽ FAIL vì `src/` đang dùng schema cũ. **A2 sẽ fix.**

---

## BƯỚC 1: Backup

```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
cp prisma/seed.ts prisma/seed.ts.backup
cp .env .env.backup-before-a1
```

Backup xong, nếu có git:
```bash
git add -A
git commit -m "chore: backup before epic-A1 schema rewrite"
```

---

## BƯỚC 2: Rewrite `prisma/schema.prisma`

**Xóa toàn bộ nội dung cũ**, thay bằng schema dưới đây:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum Role {
  ADMIN
  EMPLOYEE
}

enum StatusMetaType {
  DEPLOYABLE
  PENDING
  UNDEPLOYABLE
  ARCHIVED
}

enum ActionType {
  CREATE
  UPDATE
  CHECKOUT
  CHECKIN
  AUDIT
  DELETE
  RESTORE
  NOTE_ADDED
  ACCEPTED
  DECLINED
}

enum ItemType {
  ASSET
  LICENSE
  LICENSE_SEAT
  USER
  CATEGORY
  LOCATION
  DEPARTMENT
  MANUFACTURER
  SUPPLIER
  STATUS_LABEL
  ASSET_MODEL
  DEPRECIATION
  COMPANY
}

enum TargetType {
  USER
  LOCATION
  ASSET
}

enum DepreciationType {
  LINEAR
  HALF_YEAR
}

// ============================================================================
// COMPANY (FMCS — disabled ở Phase 1)
// ============================================================================

model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users       CompanyUser[]
  locations   Location[]
  assets      Asset[]
  licenses    License[]
  departments Department[]
}

model CompanyUser {
  companyId String
  userId    String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([companyId, userId])
}

// ============================================================================
// MASTER DATA
// ============================================================================

model Category {
  id                String   @id @default(cuid())
  name              String
  categoryType      String   @default("ASSET")
  color             String?
  eulaText          String?  @db.Text
  requireAcceptance Boolean  @default(false)
  checkinEmail      String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  assets      Asset[]
  assetModels AssetModel[]
  licenses    License[]
}

model Manufacturer {
  id           String   @id @default(cuid())
  name         String   @unique
  url          String?
  supportUrl   String?
  supportPhone String?
  supportEmail String?
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  assets      Asset[]
  assetModels AssetModel[]
  licenses    License[]
}

model Supplier {
  id        String   @id @default(cuid())
  name      String
  contact   String?
  address   String?
  phone     String?
  email     String?
  url       String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  assets   Asset[]
  licenses License[]
}

model Depreciation {
  id               String           @id @default(cuid())
  name             String           @unique
  months           Int
  depreciationType DepreciationType @default(LINEAR)
  minimumValue     Decimal          @default(0) @db.Decimal(15, 2)
  notes            String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?

  assetModels AssetModel[]
  assets      Asset[]
}

model AssetModel {
  id             String   @id @default(cuid())
  name           String
  modelNumber    String?
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  manufacturerId String?
  manufacturer   Manufacturer? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)
  depreciationId String?
  depreciation   Depreciation? @relation(fields: [depreciationId], references: [id], onDelete: SetNull)
  eol            Int?
  requireSerial  Boolean  @default(false)
  notes          String?
  image          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?

  assets Asset[]

  @@unique([name, manufacturerId])
  @@index([categoryId])
}

model Location {
  id        String   @id @default(cuid())
  name      String
  address   String?
  city      String?
  state     String?
  country   String?
  zip       String?
  parentId  String?
  parent    Location? @relation("LocationTree", fields: [parentId], references: [id], onDelete: SetNull)
  children  Location[] @relation("LocationTree")
  managerId String?
  manager   User?    @relation("LocationManager", fields: [managerId], references: [id], onDelete: SetNull)
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  assetsCurrent Asset[] @relation("AssetCurrentLocation")
  assetsRtd     Asset[] @relation("AssetRtdLocation")
  usersHome     User[]  @relation("UserHomeLocation")

  @@index([parentId])
  @@index([companyId])
}

model Department {
  id         String   @id @default(cuid())
  name       String
  managerId  String?
  manager    User?    @relation("DepartmentManager", fields: [managerId], references: [id], onDelete: SetNull)
  companyId  String?
  company    Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  locationId String?
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?

  users User[]

  @@index([companyId])
}

model StatusLabel {
  id           String   @id @default(cuid())
  name         String   @unique
  deployable   Boolean  @default(false)
  pending      Boolean  @default(false)
  archived     Boolean  @default(false)
  color        String?
  showInNav    Boolean  @default(true)
  defaultLabel Boolean  @default(false)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  assets Asset[]
}

// ============================================================================
// USER
// ============================================================================

model User {
  id          String  @id @default(cuid())
  firstName   String
  lastName    String?
  username    String? @unique
  email       String? @unique
  password    String?
  employeeNum String? @unique
  jobTitle    String?
  phone       String?
  mobile      String?
  address     String?
  city        String?
  state       String?
  country     String?
  zip         String?
  notes       String?
  avatar      String?
  activated   Boolean @default(true)
  role        Role    @default(EMPLOYEE)

  companyId    String?
  company      Company?    @relation(fields: [companyId], references: [id], onDelete: SetNull)
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  locationId   String?
  location     Location?   @relation("UserHomeLocation", fields: [locationId], references: [id], onDelete: SetNull)
  managerId    String?
  manager      User?       @relation("UserManager", fields: [managerId], references: [id], onDelete: SetNull)
  subordinates User[]      @relation("UserManager")

  twoFactorSecret    String? @db.Text
  twoFactorEnrolled  Boolean @default(false)
  twoFactorOptin     Boolean @default(false)

  locale              String  @default("vi-VN")
  remote              Boolean @default(false)
  vip                 Boolean @default(false)
  autoassignLicenses  Boolean @default(false)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  managedLocations       Location[]      @relation("LocationManager")
  managedDepartments     Department[]    @relation("DepartmentManager")
  companies              CompanyUser[]
  assetAssigned          Asset[]         @relation("AssetAssignedUser")
  licenseSeatsAssigned   LicenseSeat[]   @relation("LicenseSeatAssignedUser")
  logs                   ActionLog[]     @relation("ActionLogActor")

  @@index([companyId])
  @@index([managerId])
}

// ============================================================================
// ASSET
// ============================================================================

model Asset {
  id       String  @id @default(cuid())
  assetTag String  @unique
  name     String
  serial   String?
  image    String?

  modelId String?
  model   AssetModel? @relation(fields: [modelId], references: [id], onDelete: SetNull)

  statusId String
  status   StatusLabel @relation(fields: [statusId], references: [id], onDelete: Restrict)

  assignedUserId     String?
  assignedUser       User?     @relation("AssetAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedLocationId String?
  assignedLocation   Location? @relation("AssetCurrentLocation", fields: [assignedLocationId], references: [id], onDelete: SetNull)
  assignedAssetId    String?
  assignedAsset      Asset?    @relation("AssetAssignedAsset", fields: [assignedAssetId], references: [id], onDelete: SetNull)
  assignedToAssets   Asset[]   @relation("AssetAssignedAsset")

  rtdLocationId String?
  rtdLocation   Location? @relation("AssetRtdLocation", fields: [rtdLocationId], references: [id], onDelete: SetNull)

  purchaseDate   DateTime?
  purchaseCost   Decimal?  @db.Decimal(15, 2)
  supplierId     String?
  supplier       Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  orderNumber    String?
  warrantyMonths Int?

  assetEolDate   DateTime?
  eolExplicit    Boolean   @default(false)
  depreciationId String?
  depreciation   Depreciation? @relation(fields: [depreciationId], references: [id], onDelete: SetNull)

  requestable Boolean @default(true)
  byod        Boolean @default(false)

  lastAuditDate   DateTime?
  nextAuditDate   DateTime?
  lastCheckout    DateTime?
  lastCheckin     DateTime?
  expectedCheckin DateTime?

  checkoutCounter Int @default(0)
  checkinCounter  Int @default(0)

  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)

  notes     String?   @db.Text
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  licenseSeats LicenseSeat[]

  @@index([modelId])
  @@index([statusId])
  @@index([assignedUserId])
  @@index([assignedLocationId])
  @@index([companyId])
}

// ============================================================================
// LICENSE & LICENSE SEAT
// ============================================================================

model License {
  id              String    @id @default(cuid())
  name            String
  productKey      String?
  serial          String?
  expirationDate  DateTime?
  terminationDate DateTime?
  reassignable    Boolean   @default(true)
  maintained      Boolean   @default(true)

  purchaseDate  DateTime?
  purchaseCost  Decimal?  @db.Decimal(15, 2)
  purchaseOrder String?
  orderNumber   String?

  supplierId     String?
  supplier       Supplier?     @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  manufacturerId String?
  manufacturer   Manufacturer? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)
  categoryId     String?
  category       Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  companyId      String?
  company        Company?      @relation(fields: [companyId], references: [id], onDelete: SetNull)

  notes        String?  @db.Text
  licenseEmail String?
  licenseName  String?
  minAmt       Int?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  seats LicenseSeat[]

  @@index([categoryId])
  @@index([manufacturerId])
  @@index([companyId])
}

model LicenseSeat {
  id                 String  @id @default(cuid())
  licenseId          String
  license            License @relation(fields: [licenseId], references: [id], onDelete: Cascade)

  assignedUserId  String?
  assignedUser    User?   @relation("LicenseSeatAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedAssetId String?
  assignedAsset   Asset?  @relation(fields: [assignedAssetId], references: [id], onDelete: SetNull)

  notes              String?
  unreassignableSeat Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  @@index([licenseId])
  @@index([assignedUserId])
  @@index([assignedAssetId])
}

// ============================================================================
// ACTION LOG
// ============================================================================

model ActionLog {
  id         String     @id @default(cuid())
  actionType ActionType
  itemType   ItemType
  itemId     String
  targetType TargetType?
  targetId   String?
  userId     String
  user       User       @relation("ActionLogActor", fields: [userId], references: [id], onDelete: Restrict)

  notes     String? @db.Text
  oldValues Json?
  newValues Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([itemType, itemId])
  @@index([targetType, targetId])
  @@index([userId])
  @@index([createdAt])
}
```

**Giải thích các quyết định chính** (Tier 2 đọc hiểu, KHÔNG tự sửa):

1. **`AssetModel`**: tách riêng khỏi `Asset` để clone Invariant "Asset thuộc 1 model, model định nghĩa category + depreciation + EOL". `modelId` nullable cho MVP.
2. **`Asset.assignedUserId` + `assignedLocationId` + `assignedAssetId`**: 3 FK nullable. DB layer enforce "chỉ 1 trong 3 non-null" qua CHECK constraint (BƯỚC 4).
3. **`LicenseSeat`**: tách riêng. Application layer (Epic B) insert N row LicenseSeat khi tạo License.
4. **`User.password` nullable**: cho phép user LDAP/SSO (Phase 5).
5. **`ActionLog.userId` FK Restrict** (không cascade) — không thể xóa user nếu còn log.
6. **`ActionLog` KHÔNG có `updatedAt`** — log immutable.
7. **`User `system`** placeholder sẽ tạo trong seed (BƯỚC 5) — làm FK anchor cho ActionLog.userId khi chưa có actor thật.

---

## BƯỚC 3: Generate migration

```bash
npx prisma format
npx prisma validate
```

Nếu validate PASS, apply schema:

**Ưu tiên #1** — dùng migrate dev (an toàn, sinh migration file đúng chuẩn):
```bash
npx prisma migrate dev --name phase1_schema
```

**Nếu lỗi vì Neon connection pooler** — fallback dùng db push (CHẤP NHẬN mất data cũ):
```bash
npx prisma db push --force-reset --accept-data-loss
npx prisma generate
```

Sau khi apply thành công:
```bash
npx prisma generate
```

---

## BƯỚC 4: Thêm CHECK constraint cho Asset assignment

Prisma không hỗ trợ CHECK constraint qua schema syntax. Tạo file `prisma/sql/phase1_check_constraints.sql` (mkdir trước nếu cần):

```bash
mkdir -p prisma/sql
```

Tạo file `prisma/sql/phase1_check_constraints.sql`:

```sql
-- Invariant #2: Asset chỉ được assign cho 1 trong 3 target
ALTER TABLE "Asset" ADD CONSTRAINT "asset_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedLocationId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );

-- Tương tự cho LicenseSeat: gán User HOẶC Asset
ALTER TABLE "LicenseSeat" ADD CONSTRAINT "license_seat_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );
```

Apply bằng raw SQL:
```bash
npx prisma db execute --file prisma/sql/phase1_check_constraints.sql --schema prisma/schema.prisma
```

Verify constraint đã apply (kết nối DB Neon hoặc dùng Prisma Studio):
```bash
npx prisma studio
# Mở Asset table → SQL view: check rằng có 2 CHECK constraint như trên
```

Hoặc dùng psql (nếu có sẵn):
```bash
psql "$DATABASE_URL" -c "\d \"Asset\"" | grep -A 2 "Check constraints"
```

---

## BƯỚC 5: Rewrite `prisma/seed.ts`

Xóa nội dung cũ, thay bằng:

```typescript
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Bắt đầu seed Phase 1...')

  // 1. Company
  const company = await prisma.company.upsert({
    where: { name: 'Công ty ABC' },
    update: {},
    create: { name: 'Công ty ABC', notes: 'Công ty mặc định' },
  })
  console.log('✓ Company:', company.name)

  // 2. Location
  const hanoi = await prisma.location.upsert({
    where: { id: 'loc-hanoi' },
    update: {},
    create: {
      id: 'loc-hanoi',
      name: 'Văn phòng Hà Nội',
      city: 'Hà Nội',
      country: 'VN',
      companyId: company.id,
    },
  })
  console.log('✓ Location:', hanoi.name)

  // 3. Department
  const itDept = await prisma.department.upsert({
    where: { id: 'dept-it' },
    update: {},
    create: {
      id: 'dept-it',
      name: 'Phòng IT',
      companyId: company.id,
      locationId: hanoi.id,
    },
  })
  console.log('✓ Department:', itDept.name)

  // 4. StatusLabels (4 meta-type — Invariant #1)
  const statusDeployable = await prisma.statusLabel.upsert({
    where: { id: 'status-deployable' },
    update: {},
    create: {
      id: 'status-deployable',
      name: 'Sẵn sàng cấp phát',
      deployable: true,
      pending: false,
      archived: false,
      color: '#10B981',
      defaultLabel: true,
    },
  })
  const statusBroken = await prisma.statusLabel.upsert({
    where: { id: 'status-broken' },
    update: {},
    create: {
      id: 'status-broken',
      name: 'Báo hỏng',
      deployable: false,
      pending: false,
      archived: false,
      color: '#EF4444',
    },
  })
  const statusArchived = await prisma.statusLabel.upsert({
    where: { id: 'status-archived' },
    update: {},
    create: {
      id: 'status-archived',
      name: 'Đã thanh lý',
      deployable: false,
      pending: false,
      archived: true,
      color: '#6B7280',
    },
  })
  console.log('✓ 3 StatusLabels (deployable/broken/archived)')

  // 5. Categories
  const laptopCat = await prisma.category.upsert({
    where: { id: 'cat-laptop' },
    update: {},
    create: {
      id: 'cat-laptop',
      name: 'Laptop',
      categoryType: 'ASSET',
      color: '#3B82F6',
    },
  })
  const monitorCat = await prisma.category.upsert({
    where: { id: 'cat-monitor' },
    update: {},
    create: {
      id: 'cat-monitor',
      name: 'Màn hình',
      categoryType: 'ASSET',
      color: '#8B5CF6',
    },
  })
  const softwareCat = await prisma.category.upsert({
    where: { id: 'cat-software' },
    update: {},
    create: {
      id: 'cat-software',
      name: 'Phần mềm',
      categoryType: 'LICENSE',
      color: '#F59E0B',
    },
  })
  console.log('✓ 3 Categories (laptop/monitor/software)')

  // 6. Manufacturers
  const apple = await prisma.manufacturer.upsert({
    where: { id: 'mfr-apple' },
    update: {},
    create: {
      id: 'mfr-apple',
      name: 'Apple',
      url: 'https://apple.com',
    },
  })
  const dell = await prisma.manufacturer.upsert({
    where: { id: 'mfr-dell' },
    update: {},
    create: {
      id: 'mfr-dell',
      name: 'Dell',
      url: 'https://dell.com',
    },
  })
  const microsoft = await prisma.manufacturer.upsert({
    where: { id: 'mfr-microsoft' },
    update: {},
    create: {
      id: 'mfr-microsoft',
      name: 'Microsoft',
      url: 'https://microsoft.com',
    },
  })
  console.log('✓ 3 Manufacturers (Apple/Dell/Microsoft)')

  // 7. AssetModel
  const macbookM2 = await prisma.assetModel.upsert({
    where: { id: 'model-mbp-m2' },
    update: {},
    create: {
      id: 'model-mbp-m2',
      name: 'MacBook Pro M2',
      modelNumber: 'MBP14-M2',
      categoryId: laptopCat.id,
      manufacturerId: apple.id,
      eol: 60,
      requireSerial: true,
    },
  })
  console.log('✓ 1 AssetModel (MacBook Pro M2)')

  // 8. User placeholder 'system' (FK anchor cho ActionLog khi chưa có actor thật)
  const systemUser = await prisma.user.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      firstName: 'System',
      lastName: 'Bot',
      email: 'system@internal.local',
      username: 'system',
      password: null,
      role: 'ADMIN',
      activated: false,
      companyId: company.id,
      notes: 'Tài khoản hệ thống — KHÔNG đăng nhập. Làm FK anchor cho ActionLog.userId.',
    },
  })
  console.log('✓ User system (id=system, activated=false)')

  // 9. Users (password: "password123" — bcrypt)
  const adminPwd = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@congty.com' },
    update: { password: adminPwd },
    create: {
      firstName: 'Admin',
      lastName: 'IT',
      email: 'admin@congty.com',
      username: 'admin',
      password: adminPwd,
      role: 'ADMIN',
      activated: true,
      companyId: company.id,
      departmentId: itDept.id,
      locationId: hanoi.id,
    },
  })

  const employeePwd = await bcrypt.hash('password123', 10)
  const employee = await prisma.user.upsert({
    where: { email: 'nhanvien@congty.com' },
    update: { password: employeePwd },
    create: {
      firstName: 'Nguyễn Văn',
      lastName: 'Nhân Viên',
      email: 'nhanvien@congty.com',
      username: 'nhanvien',
      password: employeePwd,
      role: 'EMPLOYEE',
      activated: true,
      companyId: company.id,
      departmentId: itDept.id,
      locationId: hanoi.id,
    },
  })
  console.log('✓ 2 Users (admin@congty.com / nhanvien@congty.com) — password: password123')

  // 10. Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: 'sup-default' },
    update: {},
    create: {
      id: 'sup-default',
      name: 'Nhà cung cấp mặc định',
      email: 'sales@supplier.com',
    },
  })
  console.log('✓ Supplier')

  // 11. Assets mẫu (chưa assign)
  const lap001 = await prisma.asset.upsert({
    where: { assetTag: 'LAP-001' },
    update: {},
    create: {
      assetTag: 'LAP-001',
      name: 'MacBook Pro 14" M2',
      serial: 'C02ABC123',
      modelId: macbookM2.id,
      statusId: statusDeployable.id,
      rtdLocationId: hanoi.id,
      purchaseDate: new Date('2024-01-15'),
      purchaseCost: 45000000,
      warrantyMonths: 24,
      supplierId: supplier.id,
      companyId: company.id,
    },
  })

  const lap002 = await prisma.asset.upsert({
    where: { assetTag: 'LAP-002' },
    update: {},
    create: {
      assetTag: 'LAP-002',
      name: 'Dell XPS 13',
      serial: 'DXP123456',
      statusId: statusDeployable.id,
      rtdLocationId: hanoi.id,
      purchaseDate: new Date('2024-06-20'),
      purchaseCost: 28000000,
      warrantyMonths: 24,
      supplierId: supplier.id,
      companyId: company.id,
    },
  })
  console.log('✓ 2 Assets (LAP-001, LAP-002) — chưa assign')

  // 12. License + 5 LicenseSeats (Invariant #4)
  const office365 = await prisma.license.create({
    data: {
      name: 'Microsoft Office 365 Business',
      productKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
      reassignable: true,
      expirationDate: new Date('2027-12-31'),
      categoryId: softwareCat.id,
      manufacturerId: microsoft.id,
      supplierId: supplier.id,
      companyId: company.id,
      seats: {
        create: Array.from({ length: 5 }).map(() => ({
          notes: 'Auto-created seat',
        })),
      },
    },
  })
  console.log('✓ License Office 365 với 5 LicenseSeats (nested create)')

  // 13. ActionLog mẫu — log việc tạo LAP-001
  await prisma.actionLog.create({
    data: {
      actionType: 'CREATE',
      itemType: 'ASSET',
      itemId: lap001.id,
      userId: systemUser.id, // dùng system placeholder
      newValues: { assetTag: lap001.assetTag, name: lap001.name },
      notes: 'Seed data — initial asset creation',
    },
  })
  console.log('✓ 1 ActionLog mẫu (CREATE ASSET LAP-001)')

  console.log('\n🎉 Seed hoàn tất!')
  console.log('Đăng nhập: admin@congty.com / password123')
  console.log('User hệ thống: id=system (không thể đăng nhập)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Lưu ý quan trọng cho Tier 2:**

1. **`seats: { create: [...] }`** — KHÔNG dùng `seatsRel` (đây là bug trong MSEW-epic-A-schema.md cũ dòng 865). Trong Prisma, tên relation field tự sinh giống tên field trong schema (`seats LicenseSeat[]` → dùng `seats`).

2. **KHÔNG gán `seats: 5`** (cũng là bug trong MSEW-epic-A-schema.md cũ dòng 858). Field `seats` là relation, không phải counter — số ghế = COUNT license_seats.

3. **`bcryptjs`**: Nếu import lỗi, chạy `npm install bcryptjs @types/bcryptjs` — Tier 2 PHẢI tự kiểm tra dependency trước khi báo lỗi (xem rule Tier 2 trong `docs/plan/TIER2_PROMPT.md`).

4. **User `id='system'`** là FK anchor. Password = null, activated = false, không dùng để login. Khi Epic A2 patch `src/app/actions/asset.ts`, Tier 2 sẽ dùng `userId: admin.id` (lấy từ session) hoặc fallback `'system'`.

5. **ActionLog.userId = systemUser.id** ở dòng cuối seed — verify FK Restrict hoạt động đúng (nếu seed FAIL ở dòng này → CHECK constraint sai, xem lại BƯỚC 4).

---

## BƯỚC 6: Verify (KHÔNG cần `tsc --noEmit`)

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx tsx prisma/seed.ts
```

**Tất cả phải exit code 0.** Nếu có lỗi, fix ngay — không bỏ qua.

Sau khi seed PASS:
```bash
npx prisma studio
```

Kiểm tra trong Prisma Studio:

- [ ] Có 14 model (User, Company, CompanyUser, Location, Department, StatusLabel, Category, Manufacturer, Supplier, Depreciation, AssetModel, Asset, License, LicenseSeat, ActionLog).
- [ ] Bảng `User` có 3 row (system/admin/nhanvien). admin + nhanvien có password bcrypt `$2...`; system có password = null.
- [ ] Bảng `StatusLabel` có 3 row (deployable/broken/archived) với 3 cờ boolean đúng.
- [ ] Bảng `Category` có 3 row (laptop/monitor/software).
- [ ] Bảng `Asset` có 2 row (LAP-001, LAP-002), assignedUserId = null, status = "Sẵn sàng cấp phát".
- [ ] Bảng `License` có 1 row (Office 365).
- [ ] Bảng `LicenseSeat` có 5 row, tất cả assignedUserId = null, assignedAssetId = null.
- [ ] Bảng `ActionLog` có 1 row (CREATE ASSET LAP-001, userId = 'system').
- [ ] CHECK constraint `asset_assignment_only_one` + `license_seat_assignment_only_one` đã apply (xem tab SQL hoặc chạy psql).

Nếu mọi thứ OK → Epic A1 hoàn thành. **KHÔNG chạy `npx tsc --noEmit`** — sẽ FAIL đỏ vì `src/` chưa patch. Đó là việc của Epic A2.

---

## BƯỚC 7: Commit

```bash
git add prisma/schema.prisma prisma/seed.ts prisma/sql/ prisma/migrations/
git commit -m "feat(schema): Epic A1 — Phase 1 schema rewrite với 14 model + CHECK constraint"
```

(Nếu không có git, báo cáo Tier 1.)

---

## KẾT THÚC EPIC A1

Sau khi hoàn thành, Tier 2 báo cáo:

1. Danh sách file đã sửa (`prisma/schema.prisma`, `prisma/seed.ts`, `prisma/sql/*.sql`, `prisma/migrations/*`).
2. Output của `npx prisma validate` (phải OK).
3. Output của `npx tsx prisma/seed.ts` (phải OK — không có lỗi FK).
4. Output của Prisma Studio (14 model + data mẫu).
5. Kết quả verify CHECK constraint (asset_assignment_only_one + license_seat_assignment_only_one).

**⚠️ KHÔNG chạy `tsc --noEmit`** — sẽ FAIL vì src/ chưa patch. Tier 2 KHÔNG được tự ý patch `src/` ở A1.

Sếp review A1 xong sẽ chuyển sang Epic A2 (Consumer Patch) — Tier 1 sẽ xuất `MSEW-epic-A2-consumer-patch.md` sau khi A1 verified.

---

## Prisma 7 patches đã apply ở thực thi thực tế (RETRO-UPDATE 2026-07-25)

> **Phạm vi:** Section này KHÔNG có trong bản gốc khi viết. Nó được bổ sung SAU khi Tier 2 thực thi BƯỚC 2 / BƯỚC 5 gặp phải 3 blocker (xem `docs/exec/BLOCKERS-epic-A1-schema.md`). Mục đích: ghi lại 5 patch tối thiểu đã apply, để junior coder hiểu TẠI SAO schema cuối cùng khác schema trong BƯỚC 2 ở trên.
>
> **Nếu bạn đọc schema cuối cùng tại `prisma/schema.prisma` và thấy KHÁC với code block trong BƯỚC 2** — đó là vì các patch dưới đây đã được apply thành công. Đây là "ground truth" của codebase hiện tại.

### Patch #1 — Xóa `url = env("DATABASE_URL")` khỏi `datasource db`

**Tại sao cần patch:**
Prisma 7.9.0 đã bỏ cú pháp khai báo URL trong file `schema.prisma`. Lỗi khi `prisma validate`:
```
error: The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts` and pass either `adapter`
for a direct database connection or `accelerateUrl` for Accelerate to the `PrismaClient`
constructor.
```
URL đã có sẵn ở `prisma.config.ts` dòng 13 (`url: process.env["DATABASE_URL"]`), nên schema chỉ cần khai báo `provider`.

**Before (BƯỚC 2 — code cũ):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After (ground truth — schema hiện tại):**
```prisma
datasource db {
  provider = "postgresql"
}
```

**Junior coder copy-paste:** Tìm `datasource db { ... }` trong `prisma/schema.prisma`, xóa dòng `url = env("DATABASE_URL")` (nếu vẫn còn).

---

### Patch #2 — Đặt tên relation tường minh `CompanyUsers` (Prisma 7 strict)

**Tại sao cần patch:**
Prisma 7 strict yêu cầu relation 2 chiều phải có tên `@relation("Name")` rõ ràng để tránh Prisma tự suy ra tên mặc định. Vì Company có 2 quan hệ với User:
1. Trực tiếp: `User.companyId` (đơn tenant Phase 1) → relation `CompanyMember`.
2. Qua pivot: `CompanyUser` join table → quan hệ N-N (FMCS Phase 5+).

Prisma 7 sẽ báo conflict "Field users is already defined on model Company" nếu cả 2 dùng cùng tên mặc định.

**Before (BƯỚC 2 — code cũ, khai báo mơ hồ):**
```prisma
model Company {
  // ...
  users       CompanyUser[]
  // ...
}

model CompanyUser {
  companyId String
  userId    String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([companyId, userId])
}

model User {
  // ...
  companies CompanyUser[]
  // ...
}
```

**After (ground truth — schema hiện tại):**
```prisma
model Company {
  // ...
  users       CompanyUser[] @relation("CompanyUsers")
  members     User[]        @relation("CompanyMember") // direct relation từ User.companyId
  // ...
}

model CompanyUser {
  companyId String
  userId    String
  company   Company @relation("CompanyUsers", fields: [companyId], references: [id], onDelete: Cascade)
  user      User    @relation("CompanyUsers", fields: [userId], references: [id], onDelete: Cascade)
  @@id([companyId, userId])
}

model User {
  // ...
  companyId    String?
  company      Company?    @relation("CompanyMember", fields: [companyId], references: [id], onDelete: SetNull)
  // ...
  companies    CompanyUser[] @relation("CompanyUsers")
  // ...
}
```

**Junior coder copy-paste:**
1. Thêm chuỗi `@relation("CompanyUsers")` vào `Company.users` và `User.companies`.
2. Thêm `@relation("CompanyUsers", ...)` cho cả 2 chiều trong `CompanyUser`.
3. Thêm relation mới `Company.members User[] @relation("CompanyMember")` đối xứng với `User.company @relation("CompanyMember", ...)`.

---

### Patch #3 — Loại bỏ `Category.assets`, `Manufacturer.assets`, `Supplier.assets`

**Tại sao cần patch:**
Prisma 7 không cho phép relation 1 phía (orphan). `Asset` KHÔNG có FK trực tiếp tới `Category`/`Manufacturer`/`Supplier` (chỉ qua `AssetModel`), nên các relation ngược `Category.assets Asset[]`, `Manufacturer.assets Asset[]`, `Supplier.assets Asset[]` là không khả thi.

**Cách query thay thế:**
```typescript
// ĐÚNG (sau patch):
const assets = await prisma.asset.findMany({
  where: { model: { categoryId: 'cat-laptop' } }
})

// SAI (sẽ không còn compile):
const assets = await prisma.category.findUnique({
  where: { id: 'cat-laptop' },
  include: { assets: true } // ❌ property 'assets' không tồn tại trên Category
})
```

**Before (BƯỚC 2 — code cũ, KHÔNG khả thi trong Prisma 7):**
```prisma
model Category {
  // ...
  assets      Asset[]
  assetModels AssetModel[]
  licenses    License[]
}

model Manufacturer {
  // ...
  assets      Asset[]
  assetModels AssetModel[]
  licenses    License[]
}

model Supplier {
  // ...
  assets   Asset[]
  licenses License[]
}
```

**After (ground truth — schema hiện tại, loại bỏ orphan relations):**
```prisma
model Category {
  // ...
  // KHÔNG có `assets Asset[]` — query qua AssetModel
  assetModels AssetModel[] @relation("CategoryAssetModel")
  licenses    License[]    @relation("CategoryLicense")
}

model Manufacturer {
  // ...
  // KHÔNG có `assets Asset[]` — query qua AssetModel
  assetModels AssetModel[] @relation("ManufacturerAssetModel")
  licenses    License[]    @relation("ManufacturerLicense")
}

model Supplier {
  // ...
  // KHÔNG có `assets Asset[]`
  licenses License[]
}
```

**Lưu ý:** `Asset.category/manufacturer` trong schema thực tế (sau khi Tier 2 debug thêm) là dạng DIRECT FK nullable (không qua AssetModel) để phục vụ MVP đơn giản. Tuy nhiên relation ngược trên Category/Manufacturer KHÔNG tồn tại — vẫn giữ logic "query qua `model: { categoryId }`". Nếu muốn query ngược trực tiếp từ Category, cần thêm relation name `@relation("AssetCategory")` & `@relation("AssetManufacturer")` (đã có trong schema thực tế).

**Junior coder copy-paste:** Nếu thấy `Category.assets Asset[]` / `Manufacturer.assets Asset[]` / `Supplier.assets Asset[]` đâu đó trong schema, xóa chúng đi. Prisma sẽ validate OK ngay.

---

### Patch #4 — Loại bỏ `--schema` flag khỏi `prisma db execute`

**Tại sao cần patch:**
Prisma 7 tự động detect schema file khi chạy `db execute` — thêm `--schema` flag dư sẽ gây warning hoặc error. File schema được config sẵn qua `prisma.config.ts` (dòng 7 `schema: "prisma/schema.prisma"`).

**Before (BƯỚC 4 — code cũ):**
```bash
npx prisma db execute --file prisma/sql/phase1_check_constraints.sql --schema prisma/schema.prisma
```

**After (ground truth — command đã chạy thành công):**
```bash
npx prisma db execute --file prisma/sql/phase1_check_constraints.sql
```

**Junior coder copy-paste:** Tìm command có `--schema prisma/schema.prisma` trong BƯỚC 4, xóa flag đó đi. Prisma 7 sẽ tự tìm schema.

---

### Patch #5 — Thêm deps `bcryptjs` + `@types/bcryptjs` TRƯỚC khi viết `seed.ts`

**Tại sao cần patch:**
`prisma/seed.ts` đã được viết với `import bcrypt from 'bcryptjs'` ngay từ đầu (BƯỚC 5). Nếu deps chưa có trong `package.json`, khi chạy `npx tsx prisma/seed.ts` sẽ throw "Cannot find module 'bcryptjs'" — dừng toàn bộ pipeline.

Trong thực tế, Tier 2 đã thêm 2 deps vào `package.json` (BƯỚC 5 sub-step) trước khi viết seed:
```json
"dependencies": {
  // ... các deps khác ...
  "@types/bcryptjs": "^2.4.6",
  "bcryptjs": "^3.0.3"
}
```

Cả 2 deps giờ đã có sẵn (xem `package.json` hiện tại) — không cần cài lại.

**Junior coder copy-paste (nếu reset DB và chạy lại seed):**
```bash
# Chỉ cần nếu CHƯA có trong package.json — đã có sẵn trong workspace này
npm install bcryptjs @types/bcryptjs
```

---

## Tổng kết patches

| # | Patch | Lý do Prisma 7 | Tác động |
|---|-------|----------------|----------|
| 1 | Xóa `url` trong `datasource` | Prisma 7 bỏ cú pháp, URL chuyển sang `prisma.config.ts` | Schema gọn, validate pass |
| 2 | Đặt tên relation `"CompanyUsers"` | Prisma 7 strict về relation name khi có nhiều relation cùng cặp | Tránh conflict tên field |
| 3 | Loại bỏ orphan relations (`*.assets`) | Prisma 7 không cho relation 1 phía | Query phải qua `model.categoryId` |
| 4 | Bỏ `--schema` flag | Prisma 7 auto-detect từ config | Command sạch hơn |
| 5 | Thêm `bcryptjs` deps | Tránh crash khi seed | Seed chạy thành công |

Nếu A1 bị reset và cần chạy lại từ đầu, áp dụng ĐỦ 5 patches (theo thứ tự). Nếu chỉ đọc schema hiện tại để patch consumer ở A2, **BỎ QUA** section này — schema trên disk đã đúng.

---

## Cross-reference

- Blocker chi tiết: `docs/exec/BLOCKERS-epic-A1-schema.md` (3 blockers đã giải quyết).
- Bản A1 đã verify PASS: xem `scripts/verify-epic-A1-data.ts` + CHANGELOG-EXEC-epic-A1-schema.md.
- Bản vẽ epic kế tiếp: `docs/plan/MSEW-epic-A2-consumer-patch.md` (sẽ xuất ngay sau document này).
