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

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname === "/";
  const isHomepage = request.nextUrl.pathname === "/homepage";
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Allow public access to the home page
  if (isAuthPage) {
    if (token) {
      // Redirect to landing page if already logged in
      const landing = String(token.defaultLandingPage || "/homepage");
      return NextResponse.redirect(new URL(landing, request.url));
    }
    return NextResponse.next();
  }

  // Protect homepage route
  if (isHomepage) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Enforce allowedPages
    const allowedPages: string[] = Array.isArray(token.allowedPages) ? token.allowedPages : [];
    const path = request.nextUrl.pathname;
    // Allow if the path matches any allowedPage (exact or as a prefix for subpages)
    const isAllowed = allowedPages.some(page => path === page || path.startsWith(page + "/"));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (isDashboardPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Enforce allowedPages
    const allowedPages: string[] = Array.isArray(token.allowedPages) ? token.allowedPages : [];
    const path = request.nextUrl.pathname;
    // Allow if the path matches any allowedPage (exact or as a prefix for subpages)
    const isAllowed = allowedPages.some(page => path === page || path.startsWith(page + "/"));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
} 