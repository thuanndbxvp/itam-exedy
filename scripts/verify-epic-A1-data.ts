import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // Counts per table
  const tables = [
    'Company', 'CompanyUser', 'Location', 'Department', 'StatusLabel',
    'Category', 'Manufacturer', 'Supplier', 'Depreciation', 'AssetModel',
    'User', 'Asset', 'License', 'LicenseSeat', 'ActionLog'
  ]

  for (const t of tables) {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM "${t}"`)
    console.log(`  ${t.padEnd(15)} = ${rows[0].count}`)
  }

  // Specific checks
  console.log('\n--- Specific data ---')

  const users = await pool.query(`SELECT id, "firstName", "lastName", email, role, activated, password IS NOT NULL as has_password FROM "User" ORDER BY id`)
  console.log('Users:')
  for (const u of users.rows) {
    console.log(`  ${u.id.padEnd(15)} ${u.firstName} ${u.lastName || ''} (${u.email}) role=${u.role} activated=${u.activated} password=${u.has_password ? 'YES' : 'null'}`)
  }

  const statuses = await pool.query(`SELECT id, name, deployable, pending, archived FROM "StatusLabel" ORDER BY id`)
  console.log('\nStatusLabels:')
  for (const s of statuses.rows) {
    console.log(`  ${s.id.padEnd(20)} ${s.name} (deployable=${s.deployable} pending=${s.pending} archived=${s.archived})`)
  }

  const assets = await pool.query(`SELECT a."assetTag", a.name, status.name as status_name, a."assignedUserId" IS NULL as unassigned FROM "Asset" a JOIN "StatusLabel" status ON a."statusId" = status.id ORDER BY a."assetTag"`)
  console.log('\nAssets:')
  for (const a of assets.rows) {
    console.log(`  ${a.assetTag} - ${a.name} (status=${a.status_name}, unassigned=${a.unassigned})`)
  }

  const licenses = await pool.query(`SELECT name, (SELECT COUNT(*) FROM "LicenseSeat" WHERE "licenseId" = l.id) as seat_count FROM "License" l`)
  console.log('\nLicenses:')
  for (const l of licenses.rows) {
    console.log(`  ${l.name} (${l.seat_count} seats)`)
  }

  const seats = await pool.query(`SELECT COUNT(*) FROM "LicenseSeat" WHERE "assignedUserId" IS NULL AND "assignedAssetId" IS NULL`)
  console.log(`\nUnassigned LicenseSeats: ${seats.rows[0].count} / 5 expected`)

  const logs = await pool.query(`SELECT "actionType", "itemType", "userId", notes FROM "ActionLog"`)
  console.log('\nActionLogs:')
  for (const l of logs.rows) {
    console.log(`  ${l.actionType} ${l.itemType} by user=${l.userId} - ${l.notes}`)
  }

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
