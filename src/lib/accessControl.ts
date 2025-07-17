/*
Global Access Control Utility
============================

Usage (Frontend):
-----------------
import { useAccessControl } from "@/hooks/useAccessControl";
const { hasPermission, hasRole } = useAccessControl();
if (hasPermission("manage_users")) { ... }

Usage (Backend/API):
--------------------
import { hasPermission, hasRole } from "@/lib/accessControl";
if (!hasPermission(session.user, "manage_users")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

Permissions and roles are defined in src/lib/auth.ts (ROLE_PERMISSIONS).
*/
// Access control utility for roles and permissions
import { ROLE_PERMISSIONS } from "@/lib/auth";

export type UserLike = {
  id: string;
  role?: string;
  permissions?: string[];
};

// Check if user has a specific role
export function hasRole(user: UserLike | null | undefined, role: string): boolean {
  if (!user || !user.role) return false;
  return user.role === role;
}

// Check if user has a specific permission (direct or via role)
export function hasPermission(user: UserLike | null | undefined, permission: string): boolean {
  if (!user) return false;
  // Direct permissions (if present)
  if (user.permissions && user.permissions.includes(permission)) return true;
  // Role-based permissions
  if (user.role && ROLE_PERMISSIONS[user.role]) {
    return ROLE_PERMISSIONS[user.role].includes(permission);
  }
  return false;
}

// Check if user has any of the given permissions
export function hasAnyPermission(user: UserLike | null | undefined, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(user, perm));
}

// Check if user has all of the given permissions
export function hasAllPermissions(user: UserLike | null | undefined, permissions: string[]): boolean {
  return permissions.every((perm) => hasPermission(user, perm));
} 