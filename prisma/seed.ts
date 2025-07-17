import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcryptjs.hash('Admin123!', 10);
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
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