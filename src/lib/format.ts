const PRAGUE_TIMEZONE = 'Europe/Prague'
const CS_LOCALE = 'cs-CZ'

const dateFormatter = new Intl.DateTimeFormat(CS_LOCALE, {
  timeZone: PRAGUE_TIMEZONE,
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(CS_LOCALE, {
  timeZone: PRAGUE_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat(CS_LOCALE, {
  timeZone: PRAGUE_TIMEZONE,
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Format date in Europe/Prague timezone (e.g. "1. 3. 2026")
 */
export function formatDatePrague(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatter.format(d)
}

/**
 * Format time in Europe/Prague timezone (e.g. "14:30")
 */
export function formatTimePrague(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return timeFormatter.format(d)
}

/**
 * Format date and time in Europe/Prague timezone (e.g. "1. 3. 2026 14:30")
 */
export function formatDateTimePrague(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateTimeFormatter.format(d)
}
