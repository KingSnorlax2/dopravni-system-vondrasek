import { useSession } from "next-auth/react";
import { hasRole, hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/accessControl";

export function useAccessControl() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return {
    user,
    isAuthenticated: !!user,
    loading: status === "loading",
    hasRole: (role: string) => hasRole(user, role),
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(user, permissions),
  };
} 