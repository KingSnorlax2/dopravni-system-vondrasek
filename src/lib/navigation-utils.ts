/**
 * Navigation utilities for dynamic RBAC filtering
 */

export interface NavItem {
  name?: string
  title?: string
  href: string
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  show?: boolean
  [key: string]: any
}

/**
 * Normalize path for comparison (remove trailing slash, query params)
 */
function normalizePath(path: string): string {
  const withoutQuery = path.split('?')[0]
  return withoutQuery.endsWith('/') && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery
}

/**
 * Check if a path is allowed based on allowedPages array
 * Supports exact match and prefix matching (e.g., /dashboard/transakce allows /dashboard/transakce/new)
 * Special case: if allowedPages includes '*', allow everything (superuser fallback)
 * 
 * IMPORTANT: Prefix matching only works for specific paths, not parent paths.
 * Example: /dashboard/transakce in allowedPages allows /dashboard/transakce/new
 * But /dashboard in allowedPages does NOT automatically allow /dashboard/transakce
 * (to prevent overly permissive access - use specific paths like /dashboard/auta instead)
 */
function isPathAllowed(pathname: string, allowedPages: string[]): boolean {
  if (!Array.isArray(allowedPages) || allowedPages.length === 0) {
    return false
  }

  // Superuser fallback: '*' allows everything
  if (allowedPages.includes('*')) {
    return true
  }

  const normalized = normalizePath(pathname)

  return allowedPages.some((page) => {
    const allowed = normalizePath(page)
    // Exact match
    if (normalized === allowed) {
      return true
    }
    // Prefix match: /dashboard/transakce allows /dashboard/transakce/new
    // BUT: Only if the allowed page has at least one segment after the root
    // This prevents /dashboard from allowing all /dashboard/* paths
    // Example: /dashboard/auta allows /dashboard/auta/detail, but /dashboard alone doesn't allow /dashboard/auta
    if (allowed.split('/').length >= 3 && normalized.startsWith(allowed + '/')) {
      return true
    }
    return false
  })
}

/**
 * Filter navigation items based on allowedPages
 * @param items - Array of navigation items to filter
 * @param allowedPages - Array of allowed page paths from session
 * @returns Filtered array of navigation items
 */
export function filterNavItems<T extends NavItem>(
  items: T[],
  allowedPages: string[] | undefined
): T[] {
  if (!allowedPages || !Array.isArray(allowedPages) || allowedPages.length === 0) {
    return []
  }

  return items.filter((item) => isPathAllowed(item.href, allowedPages))
}
