import 'server-only'
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"
import { UzivatelRole } from "@prisma/client"

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
      return token
    },
    async session({ session, token }) {
      // Extend session with user data from token
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as UzivatelRole
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

