import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// Get current lock status
export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'driver_login_locked' }
    });

    const isLocked = setting?.value === 'true';
    
    return NextResponse.json({ 
      isLocked,
      message: isLocked ? 'Driver login is currently locked' : 'Driver login is open'
    });
  } catch (error) {
    console.error('Error fetching driver login lock status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lock status' },
      { status: 500 }
    );
  }
}

// Update lock status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges (prefer session role, fallback to DB roles)
    let hasAdminAccess = (session.user as any).role === 'ADMIN'
    if (!hasAdminAccess) {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: session.user.id },
        include: { role: true }
      });
      hasAdminAccess = userRoles.some(ur => ur.role.name === 'ADMIN' || ur.role.name === 'FLEET_MANAGER')
    }

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { isLocked } = await request.json();

    // Upsert the setting
    await prisma.settings.upsert({
      where: { key: 'driver_login_locked' },
      update: { 
        value: isLocked.toString(),
        updatedAt: new Date()
      },
      create: {
        key: 'driver_login_locked',
        value: isLocked.toString(),
        category: 'driver_access',
        label: 'Driver Login Locked',
        type: 'boolean'
      }
    });

    return NextResponse.json({ 
      isLocked,
      message: isLocked ? 'Driver login has been locked' : 'Driver login has been unlocked'
    });
  } catch (error) {
    console.error('Error updating driver login lock status:', error);
    return NextResponse.json(
      { error: 'Failed to update lock status' },
      { status: 500 }
    );
  }
}
