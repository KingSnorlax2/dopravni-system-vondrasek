import { Session, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";

interface ExtendedSession extends DefaultSession {
  user: {
    id: string;
    role: string;
  } & DefaultSession["user"]
}

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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
    async session({ session, token }): Promise<ExtendedSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? '',
          role: token.role as string
        }
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  session: { strategy: "jwt" },
  trustHost: true,
};
