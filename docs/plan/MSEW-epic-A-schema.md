# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC A — MỞ RỘNG PRISMA SCHEMA

Yêu cầu Tầng 2 (Coder) thực hiện chính xác các bước dưới đây, không tự ý sáng tạo hay bẻ lái logic kiến trúc.

> **Lưu ý quan trọng**: Trước khi bắt đầu, Tier 2 BẮT BUỘC đọc `docs/DOMAIN-KNOWLEDGE.md` (file đã có sẵn) để nắm 4 chốt chặn nghiệp vụ sống còn.
> Tier 2 cũng nên đọc `docs/plan/PLAN-CLONE-FROM-SNIPEIT.md` (chỉ phần liên quan schema) để hiểu invariant đang clone.
> Sau khi code xong, bắt buộc chạy:
> ```bash
> npx prisma format && npx prisma validate && npx prisma generate
> npx tsx prisma/seed.ts
> npx tsc --noEmit
> ```
> Nếu thất bại quá 3 lần → lập tức xuất `ERROR_REPORT.md` xin ý kiến Tier 1.

---

## BƯỚC 1: Backup schema hiện tại (rollback safety)

```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
```

Backup cũng được commit vào git (nếu có) hoặc lưu local.

---

## BƯỚC 2: Rewrite `prisma/schema.prisma`

**Xóa toàn bộ nội dung cũ**, thay bằng schema mới dưới đây:

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
  DEPLOYABLE   // Sẵn sàng cấp phát (assignable)
  PENDING      // Chờ xử lý (vẫn có thể assign theo rule Snipe-IT)
  UNDEPLOYABLE // Hỏng/Mất/Đang sửa (không thể checkout)
  ARCHIVED     // Đã thanh lý (ẩn khỏi danh sách)
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

  users      CompanyUser[]
  locations  Location[]
  assets     Asset[]
  licenses   License[]
  departments Department[]
}

// Bảng pivot cho FMCS. Ở Phase 1 mặc định user thuộc 1 company qua User.companyId.
// Bảng này dành cho tương lai khi bật FMCS.
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
  categoryType      String   @default("ASSET") // ASSET | LICENSE | ACCESSORY | CONSUMABLE | COMPONENT
  color             String?  // hex color cho badge
  eulaText          String?  @db.Text
  requireAcceptance Boolean  @default(false)
  checkinEmail      String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  assets       Asset[]
  assetModels  AssetModel[]
  licenses     License[]
}

model Manufacturer {
  id        String   @id @default(cuid())
  name      String   @unique
  url       String?
  supportUrl String?
  supportPhone String?
  supportEmail String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

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

  assets    Asset[]
  licenses  License[]
}

model Depreciation {
  id            String   @id @default(cuid())
  name          String   @unique
  months        Int      // số tháng khấu hao
  depreciationType DepreciationType @default(LINEAR)
  minimumValue  Decimal  @default(0) @db.Decimal(15, 2)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  assetModels AssetModel[]
  assets      Asset[]
}

model AssetModel {
  id              String   @id @default(cuid())
  name            String
  modelNumber     String?
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  manufacturerId  String?
  manufacturer    Manufacturer? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)
  depreciationId  String?
  depreciation    Depreciation? @relation(fields: [depreciationId], references: [id], onDelete: SetNull)
  eol             Int?     // End of Life (tháng) — tính từ purchase_date
  requireSerial   Boolean  @default(false)
  notes           String?
  image           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

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

  // Asset locations
  assetsCurrent    Asset[] @relation("AssetCurrentLocation")
  assetsRtd        Asset[] @relation("AssetRtdLocation")
  usersHome        User[]  @relation("UserHomeLocation")

  @@index([parentId])
  @@index([companyId])
}

model Department {
  id        String   @id @default(cuid())
  name      String
  managerId String?
  manager   User?    @relation("DepartmentManager", fields: [managerId], references: [id], onDelete: SetNull)
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  locationId String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  users User[]

  @@index([companyId])
}

model StatusLabel {
  id         String   @id @default(cuid())
  name       String   @unique
  // 3 cờ quyết định meta-type (Invariant #1)
  deployable Boolean  @default(false)  // Có thể checkout
  pending    Boolean  @default(false)  // Trạng thái chờ
  archived   Boolean  @default(false)  // Đã ẩn/archived
  color      String?  // hex color cho badge UI
  showInNav  Boolean  @default(true)
  defaultLabel Boolean @default(false)
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?

  assets Asset[]
}

// ============================================================================
// USER
// ============================================================================

model User {
  id           String   @id @default(cuid())
  // Snipe-IT pattern: tách firstName/lastName (Invariant #2 friendly cho search)
  firstName    String
  lastName     String?
  username     String?  @unique
  email        String?  @unique
  password     String?  // bcrypt hash; null nếu user LDAP/SSO
  employeeNum  String?  @unique
  jobTitle     String?
  phone        String?
  mobile       String?
  address      String?
  city         String?
  state        String?
  country      String?
  zip          String?
  notes        String?
  avatar       String?
  activated    Boolean  @default(true)
  role         Role     @default(EMPLOYEE)
  // Org
  companyId    String?
  company      Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  locationId   String?
  location     Location? @relation("UserHomeLocation", fields: [locationId], references: [id], onDelete: SetNull)
  managerId    String?
  manager      User?    @relation("UserManager", fields: [managerId], references: [id], onDelete: SetNull)
  subordinates User[]  @relation("UserManager")
  // 2FA (Phase 5)
  twoFactorSecret String?
  twoFactorEnrolled Boolean @default(false)
  twoFactorOptin     Boolean @default(false)
  // Settings
  locale       String?  @default("vi-VN")
  remote       Boolean  @default(false)
  vip          Boolean  @default(false)
  autoassignLicenses Boolean @default(false)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  // Reverse relations
  managedLocations Location[] @relation("LocationManager")
  managedDepartments Department[] @relation("DepartmentManager")
  companies    CompanyUser[]
  assetAssigned Asset[] @relation("AssetAssignedUser")
  licenseSeatsAssigned LicenseSeat[] @relation("LicenseSeatAssignedUser")
  logs         ActionLog[] @relation("ActionLogActor")

  @@index([companyId])
  @@index([managerId])
}

// ============================================================================
// ASSET (mở rộng)
// ============================================================================

model Asset {
  id          String   @id @default(cuid())
  assetTag    String   @unique
  name        String
  serial      String?
  image       String?
  // Model + Category (qua model)
  modelId     String?
  model       AssetModel? @relation(fields: [modelId], references: [id], onDelete: SetNull)
  // Status
  statusId    String
  status      StatusLabel @relation(fields: [statusId], references: [id], onDelete: Restrict)
  // Assignment (3 nullable FK — Invariant #2)
  assignedUserId     String?
  assignedUser       User?    @relation("AssetAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedLocationId String?
  assignedLocation   Location? @relation("AssetCurrentLocation", fields: [assignedLocationId], references: [id], onDelete: SetNull)
  assignedAssetId    String?
  assignedAsset      Asset?   @relation("AssetAssignedAsset", fields: [assignedAssetId], references: [id], onDelete: SetNull)
  assignedToAssets   Asset[]  @relation("AssetAssignedAsset")
  // Location
  rtdLocationId      String?  // nơi asset quay về sau checkin (Invariant #3)
  rtdLocation        Location? @relation("AssetRtdLocation", fields: [rtdLocationId], references: [id], onDelete: SetNull)
  // Mua sắm + tài chính
  purchaseDate       DateTime?
  purchaseCost       Decimal? @db.Decimal(15, 2)
  supplierId         String?
  supplier           Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  orderNumber        String?
  warrantyMonths     Int?
  // EOL
  assetEolDate       DateTime?  // EOL explicit (override)
  eolExplicit        Boolean  @default(false)
  depreciationId     String?
  depreciation       Depreciation? @relation(fields: [depreciationId], references: [id], onDelete: SetNull)
  // Requestable
  requestable        Boolean  @default(true)
  byod               Boolean  @default(false) // Bring Your Own Device
  // Audit
  lastAuditDate      DateTime?
  nextAuditDate      DateTime?
  // Checkin/Checkout timestamps
  lastCheckout       DateTime?
  lastCheckin        DateTime?
  expectedCheckin    DateTime?
  // Counters
  checkoutCounter    Int      @default(0)
  checkinCounter     Int      @default(0)
  // Multi-company
  companyId          String?
  company            Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  // Notes
  notes              String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  licenseSeats LicenseSeat[]

  @@index([modelId])
  @@index([statusId])
  @@index([assignedUserId])
  @@index([assignedLocationId])
  @@index([companyId])
}

// ============================================================================
// LICENSE & LICENSE SEAT (Invariant #4)
// ============================================================================

model License {
  id                String   @id @default(cuid())
  name              String
  productKey        String?
  serial            String?
  // Seats — đếm theo số row license_seats (KHÔNG dùng seatsTotal int cũ)
  // seats = COUNT(license_seats WHERE deleted_at IS NULL)
  expirationDate    DateTime?
  terminationDate   DateTime?
  reassignable      Boolean  @default(true)
  maintained        Boolean  @default(true)
  // Mua sắm
  purchaseDate      DateTime?
  purchaseCost      Decimal? @db.Decimal(15, 2)
  purchaseOrder     String?
  orderNumber       String?
  supplierId        String?
  supplier          Supplier? @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  manufacturerId    String?
  manufacturer      Manufacturer? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)
  categoryId        String?
  category          Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  companyId         String?
  company           Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  notes             String?  @db.Text
  // Email liên hệ
  licenseEmail      String?
  licenseName       String?
  // Low-water alert
  minAmt            Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  seats LicenseSeat[]

  @@index([categoryId])
  @@index([manufacturerId])
  @@index([companyId])
}

model LicenseSeat {
  id                  String   @id @default(cuid())
  licenseId           String
  license             License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  // Gán cho User HOẶC Asset (chỉ 1 trong 2 non-null)
  assignedUserId      String?
  assignedUser        User?    @relation("LicenseSeatAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedAssetId     String?
  assignedAsset       Asset?   @relation(fields: [assignedAssetId], references: [id], onDelete: SetNull)
  notes               String?
  // Khi checkin license không reassignable → set true (ghế bị "burned")
  unreassignableSeat  Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  @@index([licenseId])
  @@index([assignedUserId])
  @@index([assignedAssetId])
}

// ============================================================================
// ACTION LOG (Invariant #5)
// ============================================================================

model ActionLog {
  id          String     @id @default(cuid())
  actionType  ActionType
  // Item polymorphic (cái bị tác động)
  itemType    ItemType
  itemId      String
  // Target polymorphic (User/Location/Asset được nhận)
  targetType  TargetType?
  targetId    String?
  // Actor
  userId      String
  user        User       @relation("ActionLogActor", fields: [userId], references: [id], onDelete: Restrict)
  notes       String?    @db.Text
  // Audit metadata
  oldValues   Json?
  newValues   Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime   @default(now())
  // KHÔNG updatedAt — log bất biến

  @@index([itemType, itemId])
  @@index([targetType, targetId])
  @@index([userId])
  @@index([createdAt])
}
```

**Giải thích các quyết định chính** (Tier 2 đọc hiểu, KHÔNG tự sửa):

1. **`AssetModel`**: tách riêng khỏi `Asset` để clone Invariant "Asset thuộc 1 model, model định nghĩa category + depreciation + EOL". Hiện tại MVP không bắt buộc asset phải có model — `modelId` nullable. Phase 2 sẽ enforce.

2. **`Asset.assignedUserId` + `assignedLocationId` + `assignedAssetId`**: 3 FK nullable. Application layer (Epic B) enforce "chỉ 1 trong 3 non-null". Chưa thêm DB constraint vì Prisma 7 chưa hỗ trợ CHECK constraint qua schema syntax — sẽ thêm raw SQL trong BƯỚC 4.

3. **`LicenseSeat`**: tách riêng. Khi tạo License, application layer (Epic B) phải insert N row LicenseSeat. Schema không có trigger/auto-tạo (Postgres không hỗ trợ cú pháp đó trong Prisma 7).

4. **`User.password` nullable**: cho phép user LDAP/SSO (Phase 5) không có password local.

5. **`ActionLog.userId` là FK `Restrict`** (không cascade) — đảm bảo không thể xóa user nếu còn log (Invariant #5: log bất biến).

6. **`ActionLog` KHÔNG có `updatedAt`**: để rõ ràng log immutable. Migration sẽ tạo column timestamps không update.

7. **`Asset.companyId` + `License.companyId`**: chuẩn bị cho FMCS Phase 5. Phase 1 query coi như 1 tenant.

8. **`Asset.expectedCheckin` + `nextAuditDate`**: lưu DateTime đầy đủ; accessor sẽ format ngày UI.

---

## BƯỚC 3: Generate migration

```bash
# Đảm bảo Postgres đang chạy (Laragon)
npx prisma format
npx prisma validate
npx prisma migrate dev --name phase1_schema --create-only
```

Lệnh `--create-only` sinh file SQL nhưng KHÔNG apply — để bạn kiểm tra trước.

Mở file `prisma/migrations/<timestamp>_phase1_schema/migration.sql` sinh ra, kiểm tra có:
- DROP TABLE cho 5 bảng cũ (`User`, `StatusLabel`, `Asset`, `License`, `LicenseSeat`, `ActionLog`) — **OK vì data cũ là demo**.
- CREATE TABLE cho 14 bảng mới.
- Index đầy đủ.

Sau đó apply:

```bash
npx prisma migrate dev
```

(Nếu bị lỗi do FK conflict, dùng `npx prisma db push --force-reset --accept-data-loss` — chấp nhận mất data cũ.)

---

## BƯỚC 4: Thêm CHECK constraint cho Asset assignment

Prisma không hỗ trợ CHECK constraint. Tạo file `prisma/migrations/<timestamp>_phase1_schema_extra/migration.sql` (Tạo thư mục thủ công nếu cần):

```sql
-- Đảm bảo Asset chỉ được assign cho 1 trong 3 target (Invariant #2)
ALTER TABLE "Asset" ADD CONSTRAINT "asset_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedLocationId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );

-- Tương tự cho LicenseSeat
ALTER TABLE "LicenseSeat" ADD CONSTRAINT "license_seat_assignment_only_one"
  CHECK (
    (CASE WHEN "assignedUserId" IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN "assignedAssetId" IS NOT NULL THEN 1 ELSE 0 END)
    <= 1
  );
```

Apply:

```bash
npx prisma migrate dev
```

Nếu Prisma báo "no schema changes", chạy raw SQL:

```bash
npx prisma db execute --stdin --schema prisma/schema.prisma < prisma/migrations/<timestamp>_phase1_schema_extra/migration.sql
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

  // 4. StatusLabels (Invariant #1: 4 meta-type)
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
  const statusDeployed = await prisma.statusLabel.upsert({
    where: { id: 'status-deployed' },
    update: {},
    create: {
      id: 'status-deployed',
      name: 'Đang sử dụng',
      deployable: false, // Status "deployed" không phải status label — suy ra từ assignedTo != null
      pending: false,
      archived: false,
      color: '#3B82F6',
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
  console.log('✓ 4 StatusLabels')

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
  console.log('✓ 2 Categories')

  // 6. Manufacturer
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
  console.log('✓ 2 Manufacturers')

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
      eol: 60, // 5 năm
      requireSerial: true,
    },
  })
  console.log('✓ 1 AssetModel')

  // 8. Users (mật khẩu mặc định: "password123" — bcrypt)
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

  // 9. Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: 'sup-default' },
    update: {},
    create: {
      id: 'sup-default',
      name: 'Nhà cung cấp mặc định',
      email: 'sales@supplier.com',
    },
  })

  // 10. Asset mẫu (chưa assign)
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
  console.log('✓ 2 Assets (LAP-001, LAP-002)')

  // 11. License + LicenseSeats (Invariant #4)
  const office365 = await prisma.license.create({
    data: {
      name: 'Microsoft Office 365 Business',
      productKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
      seats: 5, // 5 ghế
      reassignable: true,
      expirationDate: new Date('2027-12-31'),
      categoryId: laptopCat.id,
      manufacturerId: apple.id,
      supplierId: supplier.id,
      companyId: company.id,
      seatsRel: {
        create: Array.from({ length: 5 }).map(() => ({})), // tạo 5 LicenseSeat rows
      },
    },
  })
  console.log('✓ License Office 365 (5 seats)')

  console.log('\n🎉 Seed hoàn tất!')
  console.log('Đăng nhập: admin@congty.com / password123')
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

**Lưu ý quan trọng cho Tier 2**:

- `prisma.license.create` ở trên dùng `seatsRel: { create: [...] }` để tạo 5 LicenseSeat cùng lúc. Đây là cú pháp Prisma 7 nested create.
- Nếu Prisma báo lỗi relation field `seatsRel` không tồn tại, kiểm tra schema — phải có `seats LicenseSeat[]` (không phải `licenseseats`).
- Nếu bcrypt import lỗi, chạy `npm install bcryptjs @types/bcryptjs` (Tier 2 PHẢI kiểm tra dependency trước khi báo lỗi — xem rule Tier 2 số 1 trong `docs/plan/TIER2_PROMPT.md`).

---

## BƯỚC 6: Verify

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx tsx prisma/seed.ts
npx tsc --noEmit
```

**Tất cả phải exit code 0.** Nếu có lỗi, fix ngay — không bỏ qua.

Sau khi tất cả pass:

```bash
npx prisma studio
```

Mở Prisma Studio trên trình duyệt, kiểm tra:

- [ ] Có 14 model (User, Company, CompanyUser, Location, Department, StatusLabel, Category, Manufacturer, Supplier, Depreciation, AssetModel, Asset, License, LicenseSeat, ActionLog).
- [ ] Bảng `User` có 2 row (admin + nhanvien), password là chuỗi bcrypt `$2...`.
- [ ] Bảng `Asset` có 2 row (LAP-001, LAP-002), status = "Sẵn sàng cấp phát".
- [ ] Bảng `License` có 1 row (Office 365), seats = 5.
- [ ] Bảng `LicenseSeat` có 5 row, tất cả `assignedUserId = null`, `assignedAssetId = null`.
- [ ] Bảng `ActionLog` rỗng.

Nếu mọi thứ OK, Epic A hoàn thành.

---

## BƯỚC 7: Commit

```bash
git add prisma/schema.prisma prisma/seed.ts prisma/migrations/
git commit -m "feat(schema): Phase 1 schema rewrite — clone 5 invariant từ Snipe-IT"
```

(Nếu không có git, báo cáo Tier 1.)

---

## KẾT THÚC EPIC A

Sau khi hoàn thành, Tier 2 báo cáo:
- Danh sách file đã sửa.
- Output của `npx prisma validate` (phải OK).
- Output của `npx tsx prisma/seed.ts` (phải OK).
- Output của `npx tsc --noEmit` (phải OK).
- Ảnh chụp Prisma Studio (optional).

Sếp review xong sẽ chuyển sang Epic B (domain commands).