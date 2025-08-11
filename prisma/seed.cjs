const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const ALL_PERMISSIONS = [
    'view_dashboard',
    'manage_users',
    'manage_vehicles',
    'view_reports',
    'manage_distribution',
    'driver_access',
    'manage_roles',
  ];
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'Admin123!';

  // Upsert ADMIN role
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });
  // Ensure ADMIN role has all permissions
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: ALL_PERMISSIONS.map((perm) => ({ roleId: adminRole.id, permission: perm })),
    skipDuplicates: true,
  });
  // Upsert constant admin user (cannot be deleted or demoted by UI/API)
  const password = await bcryptjs.hash(ADMIN_PASSWORD, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin',
      username: ADMIN_USERNAME,
      password,
      status: 'ACTIVE',
    },
    create: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password,
      status: 'ACTIVE',
      roles: {
        create: [
          {
            role: { connect: { name: 'ADMIN' } },
          },
        ],
      },
    },
    include: { roles: true },
  });
  // Ensure admin user always has ADMIN role
  const hasAdminRole = await prisma.userRole.findFirst({ where: { userId: adminUser.id, roleId: adminRole.id } });
  if (!hasAdminRole) {
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
  }
  console.log('Constant admin user created: admin@admin.com / Admin123! (ADMIN role has all permissions, cannot be deleted or demoted by UI/API)');
}

main().finally(() => prisma.$disconnect()); 