import 'dotenv/config'
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const assetConstraints = await pool.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'Asset' AND c.contype = 'c'
  `)
  console.log('Asset CHECK constraints:')
  for (const row of assetConstraints.rows) {
    console.log(`  - ${row.conname}: ${row.pg_get_constraintdef}`)
  }

  const seatConstraints = await pool.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'LicenseSeat' AND c.contype = 'c'
  `)
  console.log('LicenseSeat CHECK constraints:')
  for (const row of seatConstraints.rows) {
    console.log(`  - ${row.conname}: ${row.pg_get_constraintdef}`)
  }

  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `)
  console.log('\nTables:')
  for (const row of tables.rows) {
    console.log(`  - ${row.table_name}`)
  }

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
