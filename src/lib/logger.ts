/**
 * Development-only logging. No-op in production.
 * Use console.error for errors that should appear in production.
 */

export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

export function devWarn(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args)
  }
}

export function devInfo(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(...args)
  }
}
