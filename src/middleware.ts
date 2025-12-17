import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Role type for Edge Runtime compatibility
 * Note: Cannot import Prisma types in Edge Runtime
 */
type Role = "ADMIN" | "DISPECER" | "RIDIC"

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
 * Route protection configuration
 * Maps route patterns to required roles
 */
const PROTECTED_ROUTES: Array<{
  pattern: RegExp
  role?: Role
  requireAuth?: boolean
}> = [
  // Admin routes - require ADMIN role
  { pattern: /^\/dashboard\/admin(\/|$)/, role: "ADMIN" },
  { pattern: /^\/api\/admin\//, role: "ADMIN" },
  
  // Dispatcher routes - require DISPECER or ADMIN
  { pattern: /^\/dashboard\/dispecer(\/|$)/, role: "DISPECER" },
  
  // Driver routes - require RIDIC or higher
  { pattern: /^\/dashboard\/ridic(\/|$)/, role: "RIDIC" },
  
  // All dashboard routes require authentication
  { pattern: /^\/dashboard(\/|$)/, requireAuth: true },
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
 * Check if user has required role for a route
 */
function hasRequiredRole(userRole: string, requiredRole?: Role): boolean {
  if (!requiredRole) return true
  
  // Role hierarchy: ADMIN > DISPECER > RIDIC
  const roleHierarchy: Record<Role, number> = {
    ADMIN: 3,
    DISPECER: 2,
    RIDIC: 1,
  }
  
  const userRoleLevel = roleHierarchy[userRole as Role] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole]
  
  return userRoleLevel >= requiredRoleLevel
}

/**
 * Get required role for a path
 */
function getRequiredRole(pathname: string): Role | null {
  for (const route of PROTECTED_ROUTES) {
    if (route.pattern.test(pathname)) {
      return route.role || null
    }
  }
  return null
}

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  // Check if it's a public path
  if (isPublicPath(pathname)) {
    return false
  }
  
  // Check protected routes
  for (const route of PROTECTED_ROUTES) {
    if (route.pattern.test(pathname)) {
      return route.requireAuth !== false // Default to true if not specified
    }
  }
  
  // Default: require auth for all routes except public ones
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })

  // Redirect /dashboard to /dashboard/auta (main dashboard page was removed)
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/auta", request.url))
  }

  // Allow public paths for unauthenticated users
  if (isPublicPath(pathname)) {
    // If user is already logged in and tries to access login page, redirect to vehicles page
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard/auta", request.url))
    }
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

    // Check role requirements
    const requiredRole = getRequiredRole(pathname)
    if (requiredRole) {
      const userRole = (token as any).role as string
      
      if (!hasRequiredRole(userRole, requiredRole)) {
        // User doesn't have required role - redirect to vehicles page with error
        const vehiclesUrl = new URL("/dashboard/auta", request.url)
        vehiclesUrl.searchParams.set(
          "error",
          "Nemáte oprávnění k přístupu na tuto stránku"
        )
        return NextResponse.redirect(vehiclesUrl)
      }
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
