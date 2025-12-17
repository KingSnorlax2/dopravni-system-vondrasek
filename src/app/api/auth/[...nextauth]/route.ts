import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth.config"

/**
 * NextAuth API Route Handler
 * Handles all authentication requests (sign in, sign out, session, etc.)
 * 
 * This route is automatically created by NextAuth.js
 * All requests to /api/auth/* are handled here
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
