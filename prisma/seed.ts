import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcryptjs.hash('Admin123!', 10);
  
  // Create enhanced ADMIN role
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      displayName: 'System Administrator',
      description: 'Full system access with all permissions',
      icon: '🛡️',
      color: '#dc2626',
      isSystem: true,
      isActive: true,
      priority: 100,
      allowedPages: [
        '/',
        '/logined',
        '/homepage',
        '/dashboard',
        '/dashboard/admin',
        '/dashboard/admin/users',
        '/dashboard/admin/settings',
        '/dashboard/auta',
        '/dashboard/grafy',
        '/dashboard/settings',
        '/dashboard/noviny',
        '/dashboard/noviny/distribuce',
        '/dashboard/noviny/distribuce/driver-route',
        '/dashboard/noviny/distribuce/driver-route/edit',
        // Add more as needed
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: false,
        timeRestriction: false,
        budgetLimit: false
      }
    },
    create: {
      name: 'ADMIN',
      displayName: 'System Administrator',
      description: 'Full system access with all permissions',
      icon: '🛡️',
      color: '#dc2626',
      isSystem: true,
      isActive: true,
      priority: 100,
      allowedPages: [
        '/',
        '/logined',
        '/homepage',
        '/dashboard',
        '/dashboard/admin',
        '/dashboard/admin/users',
        '/dashboard/admin/settings',
        '/dashboard/auta',
        '/dashboard/grafy',
        '/dashboard/settings',
        '/dashboard/noviny',
        '/dashboard/noviny/distribuce',
        '/dashboard/noviny/distribuce/driver-route',
        '/dashboard/noviny/distribuce/driver-route/edit',
        // Add more as needed
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: false,
        timeRestriction: false,
        budgetLimit: false
      }
    },
  });

  // Create Fleet Manager role
  await prisma.role.upsert({
    where: { name: 'FLEET_MANAGER' },
    update: {
      displayName: 'Fleet Manager',
      description: 'Manages vehicle fleet operations, maintenance scheduling, and driver assignments',
      icon: '🚗',
      color: '#2563eb',
      isSystem: false,
      isActive: true,
      priority: 80,
      allowedPages: [
        '/homepage',
        '/dashboard',
        '/dashboard/auta',
        '/dashboard/grafy',
        '/dashboard/noviny',
        '/dashboard/transakce'
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: true,
        timeRestriction: true,
        budgetLimit: 1000
      }
    },
    create: {
      name: 'FLEET_MANAGER',
      displayName: 'Fleet Manager',
      description: 'Manages vehicle fleet operations, maintenance scheduling, and driver assignments',
      icon: '🚗',
      color: '#2563eb',
      isSystem: false,
      isActive: true,
      priority: 80,
      allowedPages: [
        '/homepage',
        '/dashboard',
        '/dashboard/auta',
        '/dashboard/grafy',
        '/dashboard/noviny',
        '/dashboard/transakce'
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: true,
        timeRestriction: true,
        budgetLimit: 1000
      }
    },
  });

  // Create Driver role
  await prisma.role.upsert({
    where: { name: 'DRIVER' },
    update: {
      displayName: 'Driver',
      description: 'Operates assigned vehicles and reports maintenance issues',
      icon: '👨‍💼',
      color: '#059669',
      isSystem: false,
      isActive: true,
      priority: 50,
      allowedPages: [
        '/homepage',
        '/dashboard',
        '/dashboard/auta'
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: true,
        timeRestriction: false,
        budgetLimit: 0
      }
    },
    create: {
      name: 'DRIVER',
      displayName: 'Driver',
      description: 'Operates assigned vehicles and reports maintenance issues',
      icon: '👨‍💼',
      color: '#059669',
      isSystem: false,
      isActive: true,
      priority: 50,
      allowedPages: [
        '/homepage',
        '/dashboard',
        '/dashboard/auta'
      ],
      defaultLandingPage: '/homepage',
      dynamicRules: {
        departmentRestriction: true,
        timeRestriction: false,
        budgetLimit: 0
      }
    },
  });

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@admin.com',
      username: 'admin',
      password,
      status: 'ACTIVE',
      department: 'IT',
      position: 'System Administrator',
      trustScore: 100,
      roles: {
        create: [
          {
            role: { connect: { name: 'ADMIN' } },
          },
        ],
      },
    },
  });

  // Add permissions to ADMIN role
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id }
    });

    // Add all permissions
    const allPermissions = [
      'view_dashboard', 'customize_dashboard', 'export_dashboard',
      'view_users', 'create_users', 'edit_users', 'delete_users', 'assign_roles', 'manage_roles',
      'view_vehicles', 'create_vehicles', 'edit_vehicles', 'delete_vehicles', 'track_vehicles', 'assign_vehicles',
      'view_transactions', 'create_transactions', 'edit_transactions', 'delete_transactions', 'approve_expenses', 'view_financial_reports',
      'view_maintenance', 'schedule_maintenance', 'approve_maintenance', 'edit_maintenance', 'delete_maintenance', 'track_service_history',
      'view_distribution', 'manage_distribution', 'assign_routes', 'edit_routes',
      'system_settings', 'view_audit_logs', 'manage_departments', 'backup_restore',
      'view_reports', 'generate_reports', 'export_reports', 'view_analytics',
      'driver_access', 'view_personal_history', 'report_issues', 'update_vehicle_status'
    ];

    await prisma.rolePermission.createMany({
      data: allPermissions.map(permission => ({
        roleId: adminRole.id,
        permission: permission as any
      }))
    });
  }

  // Add permissions to FLEET_MANAGER role
  const fleetManagerRole = await prisma.role.findUnique({ where: { name: 'FLEET_MANAGER' } });
  if (fleetManagerRole) {
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: fleetManagerRole.id }
    });

    // Add fleet manager permissions
    const fleetManagerPermissions = [
      'view_dashboard', 'customize_dashboard', 'export_dashboard',
      'view_users',
      'view_vehicles', 'edit_vehicles', 'track_vehicles', 'assign_vehicles',
      'view_transactions', 'create_transactions', 'edit_transactions', 'approve_expenses',
      'view_maintenance', 'schedule_maintenance', 'approve_maintenance', 'edit_maintenance',
      'view_reports', 'generate_reports'
    ];

    await prisma.rolePermission.createMany({
      data: fleetManagerPermissions.map(permission => ({
        roleId: fleetManagerRole.id,
        permission: permission as any
      }))
    });
  }

  // Add permissions to DRIVER role
  const driverRole = await prisma.role.findUnique({ where: { name: 'DRIVER' } });
  if (driverRole) {
    // Clear existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: driverRole.id }
    });

    // Add driver permissions
    const driverPermissions = [
      'view_dashboard',
      'view_vehicles',
      'update_vehicle_status',
      'report_issues',
      'view_personal_history'
    ];

    await prisma.rolePermission.createMany({
      data: driverPermissions.map(permission => ({
        roleId: driverRole.id,
        permission: permission as any
      }))
    });
  }

  console.log('Enhanced role system seeded successfully!');
  console.log('Admin user created: admin@admin.com / admin / Admin123!');
}

main().finally(() => prisma.$disconnect()); 