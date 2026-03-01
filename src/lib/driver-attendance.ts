import type { Prisma } from '@prisma/client'

const VALID_SORT_BY = ['date', 'clockIn', 'name', 'email', 'clockOut'] as const
export type SmenaRidicSortBy = (typeof VALID_SORT_BY)[number]

/**
 * Maps URL sort params to Prisma orderBy for SmenaRidic.
 * Used by driver-settings page and export-driver-logs API.
 */
export function getSmenaRidicOrderBy(
  sortBy?: string,
  sortOrder?: string
): Prisma.SmenaRidicOrderByWithRelationInput[] {
  const by = VALID_SORT_BY.includes(sortBy as SmenaRidicSortBy) ? sortBy : 'date'
  const order = sortOrder === 'asc' ? 'asc' : 'desc'

  if (by === 'date') return [{ datum: order }, { casPrichodu: order }]
  if (by === 'clockIn') return [{ casPrichodu: order }, { datum: order }]
  if (by === 'clockOut') return [{ casOdjezdu: order }, { datum: 'desc' }]
  return [{ ridicEmail: order }, { datum: 'desc' }, { casPrichodu: 'desc' }]
}
