import NextAuth, { NextAuthOptions } from "next-auth"
import { type DefaultSession } from "next-auth"
import bcryptjs from 'bcryptjs'
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Try to find user by email or username
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { username: credentials.email }, // 'email' field is used for both
              ],
            },
            include: { 
              roles: { include: { role: true } },
              preferences: true // Include user preferences for default landing page
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

        // Get the highest role (ADMIN > others)
        let userRole = 'USER';
        let allowedPages: string[] = [];
        let defaultLandingPage = '/homepage';
        if (user.roles && user.roles.length > 0) {
          const adminRole = user.roles.find(r => r.role.name === 'ADMIN');
          const mainRole = adminRole || user.roles[0];
          userRole = mainRole.role.name;
          if (userRole === 'ADMIN') {
            // Admin: allow everything
            allowedPages = [
              '/',
              '/homepage',
              '/dashboard',
              '/dashboard/admin',
              '/dashboard/admin/users',
              '/dashboard/admin/settings',
              '/dashboard/auta',
              '/dashboard/grafy',
              '/dashboard/settings',
              '/dashboard/noviny',
              '/dashboard/noviny/distribuce',
              '/dashboard/noviny/distribuce/driver-route',
              // Add more as needed, or use a wildcard logic if supported
            ];
            defaultLandingPage = '/homepage';
          } else {
            allowedPages = (mainRole.role as any).allowedPages || [];
            defaultLandingPage = (mainRole.role as any).defaultLandingPage || '/homepage';
          }
        }

        // Use user's personal preference if available, otherwise use role default
        if (user.preferences?.defaultLandingPage) {
          defaultLandingPage = user.preferences.defaultLandingPage;
        }

        // Get user permissions from database
        const userPermissions: string[] = [];
        if (user.roles && user.roles.length > 0) {
          for (const userRole of user.roles) {
            const rolePermissions = await prisma.rolePermission.findMany({
              where: { roleId: userRole.role.id }
            });
            userPermissions.push(...rolePermissions.map(rp => rp.permission));
          }
        }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: userRole,
            permissions: userPermissions,
            allowedPages,
            defaultLandingPage,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role as string;
        token.permissions = (user as any).permissions as string[];
        (token as any).allowedPages = (user as any).allowedPages as string[];
        (token as any).defaultLandingPage = (user as any).defaultLandingPage as string;
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as string
        session.user.permissions = (token as any).permissions as string[];
        (session.user as any).allowedPages = (token as any).allowedPages as string[]
        (session.user as any).defaultLandingPage = (token as any).defaultLandingPage as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/"
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)