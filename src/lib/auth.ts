import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string
            }
          })

          if (!user || !user.password) {
            return null
          }
          const isPasswordValid = await compare(
            credentials.password as string,
            user.password as string
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/'
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: { strategy: "jwt" }
}

// Role and permissions config for UI and backend
export const ROLES = [
  { key: 'USER', label: 'Uživatel' },
  { key: 'ADMIN', label: 'Administrátor' },
  { key: 'DRIVER', label: 'Řidič' },
  { key: 'MANAGER', label: 'Manažer' },
];

export const PERMISSIONS = [
  { key: 'view_dashboard', label: 'Zobrazit dashboard' },
  { key: 'manage_users', label: 'Spravovat uživatele' },
  { key: 'manage_vehicles', label: 'Spravovat vozidla' },
  { key: 'view_reports', label: 'Zobrazit reporty' },
  { key: 'manage_distribution', label: 'Spravovat distribuci novin' },
  { key: 'driver_access', label: 'Přístup pro řidiče' },
];

// Default permissions for each role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: ['view_dashboard'],
  ADMIN: ['view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports', 'manage_distribution', 'driver_access'],
  DRIVER: ['driver_access'],
  MANAGER: ['view_dashboard', 'view_reports', 'manage_distribution'],
}; 