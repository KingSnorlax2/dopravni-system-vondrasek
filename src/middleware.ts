import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Map of protected routes to required permissions or roles
const routePermissions: { pattern: RegExp; permission?: string; role?: string }[] = [
  // Admin routes
  { pattern: /^\/dashboard\/admin(\/|$)/, role: "ADMIN" },
  { pattern: /^\/api\/admin\//, role: "ADMIN" },
  // Driver routes
  { pattern: /^\/dashboard\/noviny\/distribuce\/driver-route(\/|$)/, role: "DRIVER" },
  // Add more as needed
];

// Helper function to check if a path is allowed
function isPathAllowed(path: string, allowedPages: string[]): boolean {
  // Check exact match or prefix match
  return allowedPages.some(page => {
    // Exact match
    if (path === page) return true;
    // Prefix match for sub-pages (e.g., /dashboard/admin matches /dashboard/admin/users)
    if (path.startsWith(page + "/")) return true;
    return false;
  });
}

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/api/auth",
  "/reset-password",
  "/dashboard/noviny/distribuce/driver-login",
  "/dashboard/noviny/distribuce/driver-reset-password",
];

// Note: /welcome is now automatically redirected to defaultLandingPage

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"));
  
  // Allow public paths for unauthenticated users
  if (isPublicPath && !token) {
    return NextResponse.next();
  }

  // Scenario A: Already logged in user tries to access login pages
  if (token && (pathname === "/" || pathname === "/dashboard/noviny/distribuce/driver-login")) {
    const defaultLandingPage = (token as any).defaultLandingPage || "/dashboard/auta";
    
    // Prevent redirect loop - if we're already being redirected to the same page, allow it
    if (pathname === defaultLandingPage) {
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL(defaultLandingPage, request.url));
  }

  // Protect all other routes - require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Get user's allowed pages and role from token (which is refreshed on every request via JWT callback)
  const allowedPages: string[] = Array.isArray((token as any).allowedPages) ? (token as any).allowedPages : [];
  const userRole = (token as any).role as string || 'USER';
  const defaultLandingPage = (token as any).defaultLandingPage || '/dashboard/auta';
  
  // If allowedPages is empty, add defaultLandingPage as fallback
  if (allowedPages.length === 0) {
    // This shouldn't happen if JWT callback works correctly, but safety fallback
    const roleDefaults: Record<string, string> = {
      'ADMIN': '/dashboard/admin',
      'DRIVER': '/dashboard/noviny/distribuce/driver-route',
      'USER': '/dashboard/auta',
    };
    const fallbackLandingPage = roleDefaults[userRole] || '/dashboard/auta';
    if (!allowedPages.includes(fallbackLandingPage)) {
      allowedPages.push(fallbackLandingPage);
    }
    if (!allowedPages.includes('/welcome')) {
      allowedPages.push('/welcome');
    }
  }

  // Redirect /welcome to defaultLandingPage immediately for authenticated users
  if (pathname === "/welcome" && token) {
    // Prevent redirect loop - if defaultLandingPage is /welcome, allow it
    if (defaultLandingPage === "/welcome") {
      return NextResponse.next();
    }
    // Ensure defaultLandingPage is allowed before redirecting
    if (isPathAllowed(defaultLandingPage, allowedPages)) {
      return NextResponse.redirect(new URL(defaultLandingPage, request.url));
    }
    // If defaultLandingPage is not allowed (shouldn't happen), allow welcome
    return NextResponse.next();
  }

  // Scenario C: Driver Isolation - Strictly prevent DRIVER from accessing admin routes
  if (userRole === "DRIVER" && pathname.startsWith("/dashboard/admin")) {
    // Prevent redirect loop
    if (pathname === defaultLandingPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(defaultLandingPage, request.url));
  }

  // Scenario B: Access Control - Check if path is in allowedPages
  if (!isPathAllowed(pathname, allowedPages)) {
    // Prevent redirect loop - if we're trying to redirect to the same page, allow it
    if (pathname === defaultLandingPage) {
      return NextResponse.next();
    }
    
    // Redirect directly to defaultLandingPage (not welcome, as welcome will redirect anyway)
    if (isPathAllowed(defaultLandingPage, allowedPages)) {
      return NextResponse.redirect(new URL(defaultLandingPage, request.url));
    }
    
    // If defaultLandingPage is not allowed (shouldn't happen), allow current path as fallback
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)"
  ]
} 