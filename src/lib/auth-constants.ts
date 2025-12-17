/**
 * Auth Constants
 * Client-safe constants for roles and permissions
 * This file does NOT import Prisma and can be used in Client Components
 */

// Role and permissions config for UI and backend
export interface Role {
  id: number;
  name: string;
  permissions: string[];
  allowedPages: string[]; // List of allowed page routes
  defaultLandingPage?: string; // Default landing page for this role
}

// Example config for roles (for UI reference, not used directly by backend)
export const EXAMPLE_ROLE_CONFIG: Role[] = [
  {
    id: 1,
    name: 'ADMIN',
    permissions: [
      'view_dashboard',
      'manage_users',
      'manage_vehicles',
      'view_reports',
      'manage_distribution',
      'driver_access',
    ],
    allowedPages: [
      '/dashboard/auta',
      '/dashboard/admin/users',
      '/dashboard/admin/settings',
      '/dashboard/grafy',
      '/dashboard/settings',
      '/homepage',
    ],
    defaultLandingPage: '/dashboard/auta',
  },
  {
    id: 2,
    name: 'DRIVER',
    permissions: ['driver_access'],
    allowedPages: ['/dashboard/noviny/distribuce/driver-route', '/homepage'],
    defaultLandingPage: '/dashboard/noviny/distribuce/driver-route',
  },
  {
    id: 3,
    name: 'USER',
    permissions: ['view_dashboard'],
    allowedPages: ['/dashboard/auta', '/homepage'],
    defaultLandingPage: '/dashboard/auta',
  },
];

export const PERMISSIONS = [
  { key: 'view_dashboard', label: 'Zobrazit dashboard' },
  { key: 'manage_users', label: 'Spravovat uživatele' },
  { key: 'manage_vehicles', label: 'Spravovat vozidla' },
  { key: 'view_reports', label: 'Zobrazit reporty' },
  { key: 'manage_distribution', label: 'Spravovat distribuci novin' },
  { key: 'driver_access', label: 'Přístup pro řidiče' },
];

// Default permissions for each role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: ['view_dashboard'],
  ADMIN: ['view_dashboard', 'manage_users', 'manage_vehicles', 'view_reports', 'manage_distribution', 'driver_access', 'manage_roles'],
  DRIVER: ['driver_access'],
  MANAGER: ['view_dashboard', 'view_reports', 'manage_distribution'],
};


