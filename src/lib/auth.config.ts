import 'server-only'
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"
import { UzivatelRole } from "@prisma/client"

const FALLBACK_DEFAULT_PAGE = '/dashboard/auta'
const FALLBACK_PAGES: Record<string, string[]> = {
  ADMIN: ['/dashboard/auta', '/dashboard/admin', '/dashboard/admin/users', '/dashboard/transakce', '/dashboard/opravy', '/dashboard/grafy', '/homepage'],
  DISPECER: ['/dashboard/auta'],
  RIDIC: ['/dashboard/auta'],
  DRIVER: ['/homepage', '/dashboard/auta'],
}

function setFallbackPermissions(token: JWT) {
  if (token.role === 'ADMIN') {
    token.allowedPages = FALLBACK_PAGES.ADMIN
    token.defaultLandingPage = FALLBACK_DEFAULT_PAGE
    return
  }
  const pages = [...(FALLBACK_PAGES[token.role as string] || [FALLBACK_DEFAULT_PAGE])]
  if (!pages.includes(FALLBACK_DEFAULT_PAGE)) pages.push(FALLBACK_DEFAULT_PAGE)
  token.allowedPages = pages
  token.defaultLandingPage = FALLBACK_DEFAULT_PAGE
}

/**
 * NextAuth configuration with Credentials Provider
 * Uses Uzivatel model with Czech column names
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "vas@email.cz"
        },
        password: { 
          label: "Heslo", 
          type: "password" 
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email a heslo jsou povinné")
          }

          // Fetch user from database using Czech column names
          // Use base prisma client (not db) since Uzivatel doesn't have soft delete
          const uzivatel = await prisma.uzivatel.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!uzivatel) {
            throw new Error("Nesprávný email nebo heslo")
          }

          // Compare password with bcrypt
          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            uzivatel.heslo
          )

          if (!isPasswordValid) {
            throw new Error("Nesprávný email nebo heslo")
          }

          // Return user object for session (never expose password hash)
          return {
            id: uzivatel.id.toString(),
            email: uzivatel.email,
            name: uzivatel.jmeno || null,
            role: uzivatel.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          // Return null to indicate failed authentication
          // NextAuth will handle the error message
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial login - set user data from authorize return
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role as UzivatelRole
      }

      // CRITICAL: Always fetch allowedPages from DB on every request to ensure dynamic role updates
      // This ensures that when an admin changes a role's allowedPages, users get the new permissions immediately
      if (token.role) {
        try {
          const roleData = await prisma.role.findUnique({
            where: { name: token.role },
            select: { 
              allowedPages: true, 
              defaultLandingPage: true,
              isActive: true 
            },
          })

          if (roleData && roleData.isActive) {
            const defaultLandingPage = roleData.defaultLandingPage || '/dashboard/auta'
            const allowedPages = [...(roleData.allowedPages || [])]
            
            // CRITICAL: Always include defaultLandingPage in allowedPages to prevent redirect loops
            if (!allowedPages.includes(defaultLandingPage)) {
              allowedPages.push(defaultLandingPage)
            }
            
            token.allowedPages = allowedPages
            token.defaultLandingPage = defaultLandingPage
          } else {
            // Role not found or inactive - use fallback
            setFallbackPermissions(token)
          }
        } catch (error) {
          console.error('Error fetching role permissions:', error)
          setFallbackPermissions(token)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Extend session with user data from token
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as UzivatelRole
        session.user.allowedPages = token.allowedPages || []
        session.user.defaultLandingPage = token.defaultLandingPage || '/dashboard/auta'
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

