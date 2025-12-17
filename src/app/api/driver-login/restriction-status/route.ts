import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// Get current restriction status
export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'driver_navigation_restricted' }
    });

    const isRestricted = setting?.value === 'true';
    
    return NextResponse.json({ 
      isRestricted,
      message: isRestricted ? 'Driver navigation is restricted after login' : 'Drivers have full navigation access'
    });
  } catch (error) {
    console.error('Error fetching driver restriction status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restriction status' },
      { status: 500 }
    );
  }
}

// Update restriction status (admin only)
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

    const { isRestricted } = await request.json();

    // Upsert the setting
    await prisma.settings.upsert({
      where: { key: 'driver_navigation_restricted' },
      update: { 
        value: isRestricted.toString(),
        updatedAt: new Date()
      },
      create: {
        key: 'driver_navigation_restricted',
        value: isRestricted.toString(),
        category: 'driver_access',
        label: 'Driver Navigation Restricted',
        type: 'boolean'
      }
    });

    return NextResponse.json({ 
      isRestricted,
      message: isRestricted ? 'Driver navigation has been restricted' : 'Driver navigation has been enabled'
    });
  } catch (error) {
    console.error('Error updating driver restriction status:', error);
    return NextResponse.json(
      { error: 'Failed to update restriction status' },
      { status: 500 }
    );
  }
}
