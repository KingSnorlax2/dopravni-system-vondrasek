import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[id]/preferences - Get user preferences (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user preferences from the database
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: userId }
    })

    if (!userPreferences) {
      // Return default preferences if none exist
      const defaultPreferences = {
        defaultLandingPage: '/homepage',
        theme: 'system',
        language: 'cs',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        display: {
          compactMode: false,
          showAvatars: true,
          autoRefresh: true
        }
      }
      return NextResponse.json(defaultPreferences)
    }

    // Transform database preferences to match the expected format
    const preferences = {
      defaultLandingPage: userPreferences.defaultLandingPage,
      theme: userPreferences.theme,
      language: userPreferences.language,
      notifications: {
        email: userPreferences.emailNotifications,
        push: userPreferences.pushNotifications,
        sms: userPreferences.smsNotifications
      },
      display: {
        compactMode: userPreferences.compactMode,
        showAvatars: userPreferences.showAvatars,
        autoRefresh: userPreferences.autoRefresh
      }
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id]/preferences - Update user preferences (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()
    const {
      defaultLandingPage,
      theme,
      language,
      notifications,
      display
    } = body

    // Validate the preferences
    if (!defaultLandingPage || !notifications || !display) {
      return NextResponse.json(
        { error: 'Missing required preference fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate default landing page
    const validPages = [
      '/homepage', '/dashboard', '/dashboard/auta', '/dashboard/grafy',
      '/dashboard/transakce', '/dashboard/noviny', '/dashboard/admin/users', '/dashboard/settings'
    ]
    
    if (!validPages.includes(defaultLandingPage)) {
      return NextResponse.json(
        { error: 'Invalid default landing page' },
        { status: 400 }
      )
    }

    // Save preferences to database
    const userPreferences = await prisma.userPreferences.upsert({
      where: { userId: userId },
      update: {
        defaultLandingPage,
        theme: theme || 'system',
        language: language || 'cs',
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        smsNotifications: notifications.sms,
        compactMode: display.compactMode,
        showAvatars: display.showAvatars,
        autoRefresh: display.autoRefresh,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        defaultLandingPage,
        theme: theme || 'system',
        language: language || 'cs',
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        smsNotifications: notifications.sms,
        compactMode: display.compactMode,
        showAvatars: display.showAvatars,
        autoRefresh: display.autoRefresh
      }
    })

    // Log the preference update for audit purposes
    console.log(`Admin ${session.user.id} updated preferences for user ${userId}:`, {
      defaultLandingPage,
      theme,
      language,
      notifications,
      display,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'User preferences updated successfully',
      preferences: {
        defaultLandingPage,
        theme,
        language,
        notifications,
        display
      }
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
