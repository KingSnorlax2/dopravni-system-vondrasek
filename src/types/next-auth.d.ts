import "next-auth";
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    permissions?: string[]; // List of permission keys for fine-grained access control
  }
  
  interface Session {
    user: User;
  }
} 