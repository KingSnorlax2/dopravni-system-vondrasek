import NextAuth from 'next-auth';
import { DefaultSession, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from "next-auth/providers/credentials"

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user']
  }
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        // For testing, always return admin user
        return {
          id: "1",
          name: "Admin",
          email: "admin@example.com",
          role: "ADMIN"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: any }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  }
};

export async function auth(request?: Request) {
  // Placeholder for authentication logic
  // In a real app, this would validate the user's session
  return {
    user: null,
    isAuthenticated: false
  };
}
