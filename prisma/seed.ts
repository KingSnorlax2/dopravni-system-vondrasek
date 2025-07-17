import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcryptjs.hash('Admin123!', 10);
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      allowedPages: [
        '/',
        '/logined',
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
      defaultLandingPage: '/dashboard',
    },
    create: {
      name: 'ADMIN',
      allowedPages: [
        '/',
        '/logined',
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
      defaultLandingPage: '/dashboard',
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@admin.com',
      username: 'admin',
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
  });
  console.log('Admin user created: admin@admin.com / admin / Admin123!');
}

main().finally(() => prisma.$disconnect()); 