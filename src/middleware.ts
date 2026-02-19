import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth",
  "/reset-password",
]

/**
 * Check if a path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )
}

/**
 * Normalize path for comparison (no trailing slash, no query)
 */
function normalizePath(p: string): string {
  const pathname = p.split("?")[0]
  return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname
}

/**
 * Check if a pathname is allowed based on allowedPages array.
 * Supports exact match and prefix match for sub-paths.
 * Note: Including "/dashboard" alone would allow all dashboard routes; use specific paths (e.g. "/dashboard/auta") to restrict.
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

  const normalized = normalizePath(pathname)

  return allowedPages.some((page) => {
    const allowed = normalizePath(page)
    // Exact match
    if (normalized === allowed) return true
    // Prefix match: /dashboard/transakce allows /dashboard/transakce/new
    // BUT: Only if the allowed page has at least one segment after the root
    // This prevents /dashboard from allowing all /dashboard/* paths
    // Example: /dashboard/auta allows /dashboard/auta/detail, but /dashboard alone doesn't allow /dashboard/auta
    if (allowed.split('/').length >= 3 && normalized.startsWith(allowed + "/")) {
      return true
    }
    return false
  })
}

/**
 * Check if route requires authentication
 * All routes except public paths require authentication
 */
function requiresAuth(pathname: string): boolean {
  return !isPublicPath(pathname)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })

  // Redirect /dashboard to /dashboard/auta (main dashboard page was removed)
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/auta", request.url))
  }

  // Handle root path (/) and login page for authenticated users
  if (pathname === "/" || pathname === "/login") {
    if (token) {
      // User is logged in - redirect to their default landing page
      const defaultLandingPage = (token as any).defaultLandingPage as string | null
      const landingPage = defaultLandingPage || "/dashboard/auta"
      return NextResponse.redirect(new URL(landingPage, request.url))
    }
    // User not logged in - allow access to login page
    if (pathname === "/login") {
      return NextResponse.next()
    }
    // Root path - allow access (will show login form)
    return NextResponse.next()
  }

  // Allow public paths for unauthenticated users
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Allow GET for vehicle photo thumbnails without auth (img src may not send cookies reliably)
  if (
    request.method === "GET" &&
    /^\/api\/auta\/[^/]+\/fotky\/[^/]+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    // User not authenticated - redirect to login
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // CRITICAL: API routes should be handled by their own authentication
    // Don't block API routes based on allowedPages - let API endpoints handle authorization
    if (pathname.startsWith("/api/")) {
      return NextResponse.next()
    }

    // Get user role from token
    const userRole = (token as any).role as string | undefined
    
    // CRITICAL: ADMIN role has access to everything - bypass allowedPages check
    if (userRole === "ADMIN") {
      return NextResponse.next()
    }

    // For non-ADMIN users, check allowedPages for page routes
    const allowedPages = (token as any).allowedPages as string[] | undefined
    const defaultLandingPage = (token as any).defaultLandingPage as string | null
    const landingPage = defaultLandingPage || "/dashboard/auta"
    const normalizedLanding = normalizePath(landingPage)

    // CRITICAL: Always allow access to defaultLandingPage to prevent redirect loops
    if (normalizePath(pathname) === normalizedLanding) {
      return NextResponse.next()
    }

    // Check if current path is allowed
    if (!isPathAllowed(pathname, allowedPages || [])) {
      // Access denied - redirect to default landing page with error message
      const redirectUrl = new URL(landingPage, request.url)
      redirectUrl.searchParams.set(
        "error",
        "Nemáte oprávnění k přístupu na tuto stránku"
      )
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled by NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
