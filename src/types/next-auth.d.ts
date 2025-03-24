import "next-auth";
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string;
  }
  
  interface Session {
    user?: User;
  }
} 