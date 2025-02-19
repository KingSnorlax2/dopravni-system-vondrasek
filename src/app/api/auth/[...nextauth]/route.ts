import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

const config: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === "admin" && credentials?.password === "admin") {
          // Create or update admin user in database
          const user = await prisma.user.upsert({
            where: { email: "admin@example.com" },
            update: {},
            create: {
              name: "Admin",
              email: "admin@example.com",
              role: "ADMIN"
            }
          })
          return user
        }
        return null
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.role = user.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
} satisfies NextAuthConfig

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(config) 