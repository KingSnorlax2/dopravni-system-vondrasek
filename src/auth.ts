import NextAuth, { NextAuthOptions } from "next-auth"
import { type DefaultSession } from "next-auth"
import bcryptjs from 'bcryptjs'
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

// Helper function to calculate defaultLandingPage with consistent priority
function calculateDefaultLandingPage(
  userPreferences: { defaultLandingPage?: string | null } | null | undefined,
  roleDefaultLandingPage: string | null | undefined,
  userRole: string
): string {
  // Role-based defaultLandingPage mapping (fallback)
  const roleLandingPages: Record<string, string> = {
    'ADMIN': '/dashboard/admin',
    'DRIVER': '/dashboard/noviny/distribuce/driver-route',
    'USER': '/dashboard/auta',
  };

  // Priority: 1. User preferences, 2. Role defaultLandingPage, 3. Role-based mapping
  return userPreferences?.defaultLandingPage 
    || roleDefaultLandingPage 
    || roleLandingPages[userRole] 
    || '/dashboard/auta';
}

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
        let defaultLandingPage = '/dashboard/auta';
        
        if (user.roles && user.roles.length > 0) {
          const adminRole = user.roles.find(r => r.role.name === 'ADMIN');
          const mainRole = adminRole || user.roles[0];
          userRole = mainRole.role.name;
          
          // Calculate defaultLandingPage using consistent helper function
          defaultLandingPage = calculateDefaultLandingPage(
            user.preferences,
            (mainRole.role as any).defaultLandingPage,
            userRole
          );
          
          if (userRole === 'ADMIN') {
            // Admin: allow everything
            allowedPages = [
              '/',
              '/homepage',
              '/welcome',
              '/dashboard',
              '/dashboard/admin',
              '/dashboard/admin/users',
              '/dashboard/admin/settings',
              '/dashboard/admin/driver-settings',
              '/dashboard/auta',
              '/dashboard/auta/servis',
              '/dashboard/auta/stk',
              '/dashboard/auta/archiv',
              '/dashboard/auta/mapa',
              '/dashboard/grafy',
              '/dashboard/settings',
              '/dashboard/account',
              '/dashboard/transakce',
              '/dashboard/noviny',
              '/dashboard/noviny/distribuce',
              '/dashboard/noviny/distribuce/driver-route',
              '/dashboard/noviny/distribuce/driver-login',
            ];
          } else {
            // For non-admin roles, get allowedPages from database
            allowedPages = (mainRole.role as any).allowedPages || [];
            
            // Ensure defaultLandingPage is always in allowedPages
            if (defaultLandingPage && !allowedPages.includes(defaultLandingPage)) {
              allowedPages.push(defaultLandingPage);
            }
          }
        } else {
          // No roles assigned - use USER defaults
          defaultLandingPage = calculateDefaultLandingPage(user.preferences, null, 'USER');
          allowedPages = [defaultLandingPage];
        }

        // Add welcome page to allowedPages (as a fallback redirect target, but not as defaultLandingPage)
        if (!allowedPages.includes('/welcome')) {
          allowedPages.push('/welcome');
        }
        
        // Ensure defaultLandingPage is always in allowedPages
        if (defaultLandingPage && !allowedPages.includes(defaultLandingPage)) {
          allowedPages.push(defaultLandingPage);
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
    async jwt({ token, user, trigger }) {
      // Initial login - set user data
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role as string;
        token.permissions = (user as any).permissions as string[] || [];
        token.allowedPages = (user as any).allowedPages as string[] || [];
        token.defaultLandingPage = (user as any).defaultLandingPage as string || '/dashboard/auta';
        return token;
      }

      // On every request, refresh user data from database to get latest roles and allowedPages
      // This ensures restrictions work immediately without requiring re-login
      if (token.id) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { 
              roles: { 
                include: { role: true },
                where: {
                  role: {
                    isActive: true
                  }
                }
              }
            },
          });

          // Fetch user preferences
          const userPreferences = await prisma.userPreferences.findUnique({
            where: { userId: currentUser.id }
          });

          if (currentUser && currentUser.roles && currentUser.roles.length > 0) {
            // Get the highest role (ADMIN > others)
            const adminRole = currentUser.roles.find(r => r.role.name === 'ADMIN');
            const mainRole = adminRole || currentUser.roles[0];
            const userRole = mainRole.role.name;

            let allowedPages: string[] = [];
            
            // Calculate defaultLandingPage using consistent helper function
            const defaultLandingPage = calculateDefaultLandingPage(
              userPreferences,
              (mainRole.role as any).defaultLandingPage,
              userRole
            );

            if (userRole === 'ADMIN') {
              // Admin: allow everything
              allowedPages = [
                '/',
                '/homepage',
                '/welcome',
                '/dashboard',
                '/dashboard/admin',
                '/dashboard/admin/users',
                '/dashboard/admin/settings',
                '/dashboard/admin/driver-settings',
                '/dashboard/auta',
                '/dashboard/auta/servis',
                '/dashboard/auta/stk',
                '/dashboard/auta/archiv',
                '/dashboard/auta/mapa',
                '/dashboard/grafy',
                '/dashboard/settings',
                '/dashboard/account',
                '/dashboard/transakce',
                '/dashboard/noviny',
                '/dashboard/noviny/distribuce',
                '/dashboard/noviny/distribuce/driver-route',
                '/dashboard/noviny/distribuce/driver-login',
              ];
            } else {
              // For non-admin roles, get allowedPages from database
              allowedPages = (mainRole.role as any).allowedPages || [];
              
              // Ensure defaultLandingPage is always in allowedPages
              if (defaultLandingPage && !allowedPages.includes(defaultLandingPage)) {
                allowedPages.push(defaultLandingPage);
              }
            }

            // Always add welcome page to allowedPages (as a fallback redirect target)
            if (!allowedPages.includes('/welcome')) {
              allowedPages.push('/welcome');
            }
            
            // Ensure defaultLandingPage is always in allowedPages
            if (defaultLandingPage && !allowedPages.includes(defaultLandingPage)) {
              allowedPages.push(defaultLandingPage);
            }

            // Update permissions
            const userPermissions: string[] = [];
            for (const userRole of currentUser.roles) {
              const rolePermissions = await prisma.rolePermission.findMany({
                where: { roleId: userRole.role.id }
              });
              userPermissions.push(...rolePermissions.map(rp => rp.permission));
            }

            // Update token with fresh data - ensure defaultLandingPage is set correctly
            token.role = userRole;
            token.allowedPages = allowedPages;
            token.defaultLandingPage = defaultLandingPage; // This should be set from calculateDefaultLandingPage
            token.permissions = userPermissions;
          } else {
            // No roles - use USER defaults
            const defaultLandingPage = calculateDefaultLandingPage(userPreferences, null, 'USER');
            token.defaultLandingPage = defaultLandingPage;
            token.allowedPages = [defaultLandingPage, '/welcome'];
            token.permissions = [];
          }
        } catch (error) {
          // If database fetch fails, keep existing token data
          console.error('JWT callback: Error fetching user data:', error);
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as string
        session.user.permissions = token.permissions || []
        session.user.allowedPages = token.allowedPages || []
        // Use token.defaultLandingPage if available, otherwise fallback to '/dashboard/auta'
        // Don't use '/welcome' as fallback since it redirects anyway
        session.user.defaultLandingPage = token.defaultLandingPage || '/dashboard/auta'
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