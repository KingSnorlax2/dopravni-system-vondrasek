import { auth } from "@/auth"

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                          req.nextUrl.pathname.startsWith('/api');

  if (isProtectedRoute && !isAuthenticated) {
    return Response.redirect(new URL('/', req.url));
  }
  return null;
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
} 