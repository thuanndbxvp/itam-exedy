import { randomUUID } from 'node:crypto'
import { PGlite, type Transaction } from '@electric-sql/pglite'

export type SeedIds = {
  adminId: string
  employeeId: string
  companyId: string
  systemUserId: string
  readyStatusId: string
  deployedStatusId: string
}

export type TestAsset = {
  id: string
  assetTag: string
  name: string
  serial: string | null
  modelId: string | null
  categoryId: string | null
  statusId: string
  assignedUserId: string | null
  assignedLocationId: string | null
  assignedAssetId: string | null
  lastCheckout: Date | null
  lastCheckin: Date | null
  expectedCheckin: Date | null
  checkoutCounter: number
  checkinCounter: number
  createdAt: Date
  updatedAt: Date
}

export type TestLocation = {
  id: string
  name: string
  companyId: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TestLicenseSeat = {
  id: string
  licenseId: string
  assignedUserId: string | null
  assignedAssetId: string | null
  notes: string | null
  unreassignableSeat: boolean
  createdAt: Date
  updatedAt: Date
}

export type TestLicense = {
  id: string
  name: string
  productKey: string | null
  expirationDate: Date | null
  reassignable: boolean
  createdAt: Date
  updatedAt: Date
  seats?: TestLicenseSeat[]
}

export type TestActionLog = {
  id: string
  actionType: string
  itemType: string
  itemId: string
  targetType: string | null
  targetId: string | null
  userId: string
  notes: string | null
  createdAt: Date
}

export async function findAssetById(id: string): Promise<TestAsset | null> {
  const prisma = await getPrisma()
  const result = (await prisma.asset.findUnique({ where: { id } })) as TestAsset | null
  return result
}

export async function findLocationById(id: string): Promise<TestLocation | null> {
  const prisma = await getPrisma()
  const result = (await prisma.location.findUnique({ where: { id } })) as TestLocation | null
  return result
}

export async function findSeatById(id: string): Promise<TestLicenseSeat | null> {
  const prisma = await getPrisma()
  const result = (await prisma.licenseSeat.findUnique({ where: { id } })) as TestLicenseSeat | null
  return result
}

export async function findActionLogs(filter: { itemId?: string; itemType?: string; actionType?: string; userId?: string }): Promise<TestActionLog[]> {
  const prisma = await getPrisma()
  const result = (await prisma.actionLog.findMany({ where: filter })) as TestActionLog[]
  return result
}

type Queryable = Pick<PGlite, 'query'> | Pick<Transaction, 'query'>
type QueryArgs = Record<string, unknown>
type DelegateArgs = readonly QueryArgs[]
type DelegateMethod = (...args: DelegateArgs) => Promise<unknown>
type TestDelegate = Record<string, DelegateMethod>

export type TestPrismaClient = {
  company: TestDelegate
  statusLabel: TestDelegate
  category: TestDelegate
  location: TestDelegate
  user: TestDelegate
  asset: TestDelegate
  license: TestDelegate
  licenseSeat: TestDelegate
  actionLog: TestDelegate
  $transaction: <T>(callback: (tx: TestPrismaClient) => Promise<T>) => Promise<T>
  $disconnect: () => Promise<void>
}

let pgInstance: PGlite | null = null
let schemaReady = false

const schemaSql = `
  CREATE TABLE IF NOT EXISTS "Company" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "notes" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "StatusLabel" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "deployable" boolean NOT NULL DEFAULT false,
    "pending" boolean NOT NULL DEFAULT false,
    "archived" boolean NOT NULL DEFAULT false,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "Category" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "Location" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "companyId" text REFERENCES "Company"("id") ON DELETE SET NULL,
    "deletedAt" timestamptz,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "User" (
    "id" text PRIMARY KEY,
    "firstName" text NOT NULL,
    "lastName" text,
    "username" text UNIQUE,
    "email" text UNIQUE,
    "password" text,
    "activated" boolean NOT NULL DEFAULT true,
    "role" text NOT NULL DEFAULT 'EMPLOYEE',
    "companyId" text REFERENCES "Company"("id") ON DELETE SET NULL,
    "deletedAt" timestamptz,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "Asset" (
    "id" text PRIMARY KEY,
    "assetTag" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "serial" text,
    "modelId" text,
    "categoryId" text REFERENCES "Category"("id") ON DELETE SET NULL,
    "statusId" text NOT NULL REFERENCES "StatusLabel"("id") ON DELETE RESTRICT,
    "assignedUserId" text REFERENCES "User"("id") ON DELETE SET NULL,
    "assignedLocationId" text REFERENCES "Location"("id") ON DELETE SET NULL,
    "assignedAssetId" text REFERENCES "Asset"("id") ON DELETE SET NULL,
    "lastCheckout" timestamptz,
    "lastCheckin" timestamptz,
    "expectedCheckin" timestamptz,
    "checkoutCounter" integer NOT NULL DEFAULT 0,
    "checkinCounter" integer NOT NULL DEFAULT 0,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "License" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "productKey" text,
    "expirationDate" timestamptz,
    "reassignable" boolean NOT NULL DEFAULT true,
    "companyId" text REFERENCES "Company"("id") ON DELETE SET NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "LicenseSeat" (
    "id" text PRIMARY KEY,
    "licenseId" text NOT NULL REFERENCES "License"("id") ON DELETE CASCADE,
    "assignedUserId" text REFERENCES "User"("id") ON DELETE SET NULL,
    "assignedAssetId" text REFERENCES "Asset"("id") ON DELETE SET NULL,
    "notes" text,
    "unreassignableSeat" boolean NOT NULL DEFAULT false,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "ActionLog" (
    "id" text PRIMARY KEY,
    "actionType" text NOT NULL,
    "itemType" text NOT NULL,
    "itemId" text NOT NULL,
    "targetType" text,
    "targetId" text,
    "userId" text NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "notes" text,
    "createdAt" timestamptz NOT NULL DEFAULT now()
  );
`

function createId(prefix: string): string {
  return `${prefix}-${randomUUID()}`
}

async function one<T>(db: Queryable, sql: string, params: unknown[] = []): Promise<T | null> {
  const result = await db.query<T>(sql, params)
  return result.rows[0] ?? null
}

async function many<T>(db: Queryable, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db.query<T>(sql, params)
  return [...result.rows]
}

async function decorateAsset(db: Queryable, asset: QueryArgs | null): Promise<QueryArgs | null> {
  if (!asset) return null
  const status = await one<QueryArgs>(db, 'SELECT * FROM "StatusLabel" WHERE "id" = $1', [asset.statusId])
  const assignedUser = asset.assignedUserId
    ? await one<QueryArgs>(db, 'SELECT * FROM "User" WHERE "id" = $1', [asset.assignedUserId])
    : null
  const assignedLocation = asset.assignedLocationId
    ? await one<QueryArgs>(db, 'SELECT * FROM "Location" WHERE "id" = $1', [asset.assignedLocationId])
    : null
  const assignedAsset = asset.assignedAssetId
    ? await one<QueryArgs>(db, 'SELECT * FROM "Asset" WHERE "id" = $1', [asset.assignedAssetId])
    : null
  return { ...asset, status, assignedUser, assignedLocation, assignedAsset }
}

async function decorateSeat(db: Queryable, seat: QueryArgs | null): Promise<QueryArgs | null> {
  if (!seat) return null
  const license = await one<QueryArgs>(db, 'SELECT * FROM "License" WHERE "id" = $1', [seat.licenseId])
  const assignedUser = seat.assignedUserId
    ? await one<QueryArgs>(db, 'SELECT * FROM "User" WHERE "id" = $1', [seat.assignedUserId])
    : null
  const assignedAsset = seat.assignedAssetId
    ? await one<QueryArgs>(db, 'SELECT * FROM "Asset" WHERE "id" = $1', [seat.assignedAssetId])
    : null
  return { ...seat, license, assignedUser, assignedAsset }
}

function createClient(db: Queryable): TestPrismaClient {
  const client: TestPrismaClient = {
    company: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "Company" ("id", "name", "notes") VALUES ($1, $2, $3) RETURNING *', [value.id ?? createId('company'), value.name, value.notes ?? null])
      },
      findFirst: async () => one<QueryArgs>(db, 'SELECT * FROM "Company" ORDER BY "createdAt" LIMIT 1'),
      deleteMany: async () => db.query('DELETE FROM "Company"'),
    },
    statusLabel: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "StatusLabel" ("id", "name", "deployable", "pending", "archived") VALUES ($1, $2, $3, $4, $5) RETURNING *', [value.id ?? createId('status'), value.name, value.deployable ?? false, value.pending ?? false, value.archived ?? false])
      },
      deleteMany: async () => db.query('DELETE FROM "StatusLabel"'),
    },
    category: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "Category" ("id", "name") VALUES ($1, $2) RETURNING *', [value.id ?? createId('category'), value.name])
      },
      findFirst: async () => one<QueryArgs>(db, 'SELECT * FROM "Category" ORDER BY "createdAt" LIMIT 1'),
      deleteMany: async () => db.query('DELETE FROM "Category"'),
    },
    location: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "Location" ("id", "name", "companyId") VALUES ($1, $2, $3) RETURNING *', [value.id ?? createId('location'), value.name, value.companyId ?? null])
      },
      findUnique: async ({ where }: QueryArgs) => {
        const value = where as QueryArgs
        return one<QueryArgs>(db, 'SELECT * FROM "Location" WHERE "id" = $1', [value.id])
      },
      deleteMany: async () => db.query('DELETE FROM "Location"'),
    },
    user: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "User" ("id", "firstName", "lastName", "username", "email", "password", "activated", "role", "companyId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [value.id ?? createId('user'), value.firstName, value.lastName ?? null, value.username ?? null, value.email ?? null, value.password ?? null, value.activated ?? true, value.role ?? 'EMPLOYEE', value.companyId ?? null])
      },
      findUnique: async ({ where }: QueryArgs) => {
        const value = where as QueryArgs
        if (value.username) return one<QueryArgs>(db, 'SELECT * FROM "User" WHERE "username" = $1', [value.username])
        return one<QueryArgs>(db, 'SELECT * FROM "User" WHERE "id" = $1', [value.id])
      },
      findFirst: async ({ where }: QueryArgs = {}) => {
        const value = (where ?? {}) as QueryArgs
        if (value.role) return one<QueryArgs>(db, 'SELECT * FROM "User" WHERE "role" = $1 ORDER BY "createdAt" LIMIT 1', [value.role])
        return one<QueryArgs>(db, 'SELECT * FROM "User" ORDER BY "createdAt" LIMIT 1')
      },
      count: async () => Number((await one<{ count: number }>(db, 'SELECT count(*)::int AS count FROM "User"'))?.count ?? 0),
      deleteMany: async () => db.query('DELETE FROM "User"'),
    },
    asset: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "Asset" ("id", "assetTag", "name", "serial", "modelId", "categoryId", "statusId", "assignedUserId", "assignedLocationId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [value.id ?? createId('asset'), value.assetTag, value.name, value.serial ?? null, value.modelId ?? null, value.categoryId ?? null, value.statusId, value.assignedUserId ?? null, value.assignedLocationId ?? null])
      },
      findUnique: async ({ where }: QueryArgs) => {
        const value = where as QueryArgs
        const asset = value.assetTag
          ? await one<QueryArgs>(db, 'SELECT * FROM "Asset" WHERE "assetTag" = $1', [value.assetTag])
          : await one<QueryArgs>(db, 'SELECT * FROM "Asset" WHERE "id" = $1', [value.id])
        return decorateAsset(db, asset)
      },
      update: async ({ where, data }: QueryArgs) => {
        const id = (where as QueryArgs).id
        const value = data as QueryArgs
        const current = await one<QueryArgs>(db, 'SELECT * FROM "Asset" WHERE "id" = $1', [id])
        if (!current) throw new Error(`Asset not found: ${String(id)}`)
        const checkoutIncrement = ((value.checkoutCounter as QueryArgs | undefined)?.increment as number | undefined) ?? 0
        const checkinIncrement = ((value.checkinCounter as QueryArgs | undefined)?.increment as number | undefined) ?? 0
        const assignedUserId = Object.prototype.hasOwnProperty.call(value, 'assignedUserId') ? value.assignedUserId : current.assignedUserId ?? null
        const assignedLocationId = Object.prototype.hasOwnProperty.call(value, 'assignedLocationId') ? value.assignedLocationId : current.assignedLocationId ?? null
        const assignedAssetId = Object.prototype.hasOwnProperty.call(value, 'assignedAssetId') ? value.assignedAssetId : current.assignedAssetId ?? null
        const updated = await one<QueryArgs>(db, 'UPDATE "Asset" SET "assignedUserId"=$2, "assignedLocationId"=$3, "assignedAssetId"=$4, "lastCheckout"=$5, "lastCheckin"=$6, "expectedCheckin"=$7, "checkoutCounter"="checkoutCounter"+$8, "checkinCounter"="checkinCounter"+$9, "updatedAt"=now() WHERE "id"=$1 RETURNING *', [id, assignedUserId, assignedLocationId, assignedAssetId, value.lastCheckout ?? current.lastCheckout ?? null, value.lastCheckin ?? current.lastCheckin ?? null, value.expectedCheckin ?? current.expectedCheckin ?? null, checkoutIncrement, checkinIncrement])
        return decorateAsset(db, updated)
      },
      count: async () => Number((await one<{ count: number }>(db, 'SELECT count(*)::int AS count FROM "Asset"'))?.count ?? 0),
      deleteMany: async () => db.query('DELETE FROM "Asset"'),
    },
    license: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        const seatData = ((value.seats as QueryArgs | undefined)?.create as QueryArgs[] | undefined) ?? []
        const license = await one<QueryArgs>(db, 'INSERT INTO "License" ("id", "name", "productKey", "expirationDate", "reassignable") VALUES ($1,$2,$3,$4,$5) RETURNING *', [value.id ?? createId('license'), value.name, value.productKey ?? null, value.expirationDate ?? null, value.reassignable ?? true])
        if (!license) throw new Error('License insert failed')
        const seats: QueryArgs[] = []
        for (const seat of seatData) {
          const created = await one<QueryArgs>(db, 'INSERT INTO "LicenseSeat" ("id", "licenseId", "notes") VALUES ($1,$2,$3) RETURNING *', [createId('seat'), license.id, seat.notes ?? null])
          if (created) seats.push(created)
        }
        return { ...license, seats }
      },
      findUnique: async ({ where }: QueryArgs) => one<QueryArgs>(db, 'SELECT * FROM "License" WHERE "id" = $1', [(where as QueryArgs).id]),
      deleteMany: async () => db.query('DELETE FROM "License"'),
    },
    licenseSeat: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "LicenseSeat" ("id", "licenseId", "assignedUserId", "assignedAssetId", "notes", "unreassignableSeat") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [value.id ?? createId('seat'), value.licenseId, value.assignedUserId ?? null, value.assignedAssetId ?? null, value.notes ?? null, value.unreassignableSeat ?? false])
      },
      findUnique: async ({ where }: QueryArgs) => decorateSeat(db, await one<QueryArgs>(db, 'SELECT * FROM "LicenseSeat" WHERE "id" = $1', [(where as QueryArgs).id])),
      findFirst: async ({ where }: QueryArgs = {}) => {
        const value = (where ?? {}) as QueryArgs
        const seat = value.licenseId
          ? await one<QueryArgs>(db, 'SELECT * FROM "LicenseSeat" WHERE "licenseId" = $1 ORDER BY "createdAt" LIMIT 1', [value.licenseId])
          : await one<QueryArgs>(db, 'SELECT * FROM "LicenseSeat" ORDER BY "createdAt" LIMIT 1')
        return decorateSeat(db, seat)
      },
      update: async ({ where, data }: QueryArgs) => {
        const id = (where as QueryArgs).id
        const value = data as QueryArgs
        const current = await one<QueryArgs>(db, 'SELECT * FROM "LicenseSeat" WHERE "id"=$1', [id])
        if (!current) throw new Error(`LicenseSeat not found: ${String(id)}`)
        const updated = await one<QueryArgs>(db, 'UPDATE "LicenseSeat" SET "assignedUserId"=$2, "assignedAssetId"=$3, "unreassignableSeat"=$4, "updatedAt"=now() WHERE "id"=$1 RETURNING *', [id, value.assignedUserId ?? null, value.assignedAssetId ?? null, value.unreassignableSeat ?? current.unreassignableSeat])
        return decorateSeat(db, updated)
      },
      count: async () => Number((await one<{ count: number }>(db, 'SELECT count(*)::int AS count FROM "LicenseSeat"'))?.count ?? 0),
      deleteMany: async () => db.query('DELETE FROM "LicenseSeat"'),
    },
    actionLog: {
      create: async ({ data }: QueryArgs) => {
        const value = data as QueryArgs
        return one<QueryArgs>(db, 'INSERT INTO "ActionLog" ("id", "actionType", "itemType", "itemId", "targetType", "targetId", "userId", "notes") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [value.id ?? createId('log'), value.actionType, value.itemType, value.itemId, value.targetType ?? null, value.targetId ?? null, value.userId, value.notes ?? null])
      },
      findMany: async ({ where }: QueryArgs = {}) => {
        const value = (where ?? {}) as QueryArgs
        const clauses: string[] = []
        const params: unknown[] = []
        for (const key of ['itemId', 'itemType', 'actionType', 'userId']) {
          if (value[key] !== undefined) {
            params.push(value[key])
            clauses.push(`"${key}" = $${params.length}`)
          }
        }
        return many<QueryArgs>(db, `SELECT * FROM "ActionLog"${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY "createdAt"`, params)
      },
      count: async (where: QueryArgs = {}) => {
        const rows = await client.actionLog.findMany({ where })
        return Array.isArray(rows) ? rows.length : 0
      },
      deleteMany: async () => db.query('DELETE FROM "ActionLog"'),
    },
    $transaction: async <T>(callback: (tx: TestPrismaClient) => Promise<T>): Promise<T> => {
      const pg = await getPg()
      return pg.transaction((tx) => callback(createClient(tx)))
    },
    $disconnect: async () => undefined,
  }
  return client
}

export async function getPg(): Promise<PGlite> {
  if (!pgInstance) {
    pgInstance = new PGlite()
    await pgInstance.waitReady
  }
  if (!schemaReady) {
    await pgInstance.exec(schemaSql)
    schemaReady = true
  }
  return pgInstance
}

export async function getPrisma(): Promise<TestPrismaClient> {
  return createClient(await getPg())
}

export async function resetDb(): Promise<void> {
  const prisma = await getPrisma()
  await prisma.actionLog.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.licenseSeat.deleteMany()
  await prisma.license.deleteMany()
  await prisma.user.deleteMany()
  await prisma.statusLabel.deleteMany()
  await prisma.category.deleteMany()
  await prisma.company.deleteMany()
  await prisma.location.deleteMany()
}

export async function seedMinimal(): Promise<SeedIds> {
  const prisma = await getPrisma()
  const companyId = 'company-test'
  const adminId = 'user-admin'
  const employeeId = 'user-employee'
  const systemUserId = 'user-system'
  const readyStatusId = 'status-ready'
  const deployedStatusId = 'status-deployed'

  await prisma.company.create({ data: { id: companyId, name: 'Test Corp' } })
  await prisma.statusLabel.create({ data: { id: readyStatusId, name: 'Ready to Deploy', deployable: true, pending: false, archived: false } })
  await prisma.statusLabel.create({ data: { id: deployedStatusId, name: 'Deployed', deployable: false, pending: false, archived: false } })
  await prisma.user.create({ data: { id: systemUserId, firstName: 'System', username: 'system', role: 'ADMIN', activated: true, companyId } })
  await prisma.user.create({ data: { id: adminId, firstName: 'Test Admin', email: 'admin@test.com', username: 'admin', password: '$2b$10$test-only', role: 'ADMIN', activated: true, companyId } })
  await prisma.user.create({ data: { id: employeeId, firstName: 'Test Employee', email: 'employee@test.com', username: 'employee', password: '$2b$10$test-only', role: 'EMPLOYEE', activated: true, companyId } })

  return { adminId, employeeId, companyId, systemUserId, readyStatusId, deployedStatusId }
}

export async function teardownDb(): Promise<void> {
  if (pgInstance) await pgInstance.close()
  pgInstance = null
  schemaReady = false
}
