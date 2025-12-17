import "next-auth";
import type { DefaultSession } from "next-auth"
import "next-auth/jwt"
import { UzivatelRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string;
    role: UzivatelRole;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UzivatelRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    role: UzivatelRole;
  }
} 