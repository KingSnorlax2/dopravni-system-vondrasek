/**
 * Maintenance script: fix invalid Uzivatel.role values that cause
 * "Value not found in enum UzivatelRole" errors.
 *
 * Updates any Uzivatel whose role is not one of ADMIN, DISPECER, RIDIC, DRIVER
 * to role = 'RIDIC'. Uses raw SQL so Prisma enum validation does not block the update.
 */

import { PrismaClient } from '@prisma/client'

const VALID_ROLES = ['ADMIN', 'DISPECER', 'RIDIC', 'DRIVER'] as const
const FALLBACK_ROLE = 'RIDIC'

async function main() {
  const prisma = new PrismaClient({
    log: ['error'],
  })

  try {
    // Raw SQL: update rows where role (as text) is not in the valid enum list.
    // $executeRawUnsafe is required because normal Prisma queries validate enum and throw.
    const sql = `
      UPDATE "Uzivatel"
      SET role = $1::"UzivatelRole"
      WHERE role::text NOT IN ($2, $3, $4, $5)
    `
    const params = [FALLBACK_ROLE, ...VALID_ROLES]

    const updatedCount = await prisma.$executeRawUnsafe(sql, ...params)

    if (updatedCount > 0) {
      console.log(`[fix-invalid-roles] Updated ${updatedCount} record(s) to role "${FALLBACK_ROLE}".`)
    } else {
      console.log('[fix-invalid-roles] No invalid roles found. No records updated.')
    }
  } catch (err) {
    console.error('[fix-invalid-roles] Error:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
