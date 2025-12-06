import "next-auth";
import type { DefaultSession } from "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    permissions?: string[]; // List of permission keys for fine-grained access control
    allowedPages?: string[]; // List of allowed page routes for this user
    defaultLandingPage?: string; // Default landing page for this user based on role
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      permissions: string[];
      allowedPages: string[];
      defaultLandingPage: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    role: string;
    permissions: string[];
    allowedPages: string[];
    defaultLandingPage: string;
  }
} 