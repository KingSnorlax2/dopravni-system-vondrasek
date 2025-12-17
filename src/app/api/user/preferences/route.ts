import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/preferences - Get user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences from the database
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id }
    })

    const defaultCustom = {
      timezone: 'Europe/Prague',
      notificationTopics: {
        systemUpdates: true,
        assignments: true,
        approvals: true,
        maintenance: true
      },
      digestFrequency: 'weekly',
      widgetVisibility: {
        fleetStatus: true,
        financialKpis: true,
        distributionMap: true
      },
      autoRefreshInterval: '60s',
      defaultVehicleFilter: 'ACTIVE'
    }

    if (!userPreferences) {
      return NextResponse.json({
        defaultLandingPage: '/homepage',
        theme: 'system',
        language: 'cs',
        timezone: defaultCustom.timezone,
        compactMode: false,
        notifications: {
          email: true,
          push: true,
          sms: false,
          topics: defaultCustom.notificationTopics,
          digestFrequency: defaultCustom.digestFrequency
        },
        dashboard: {
          widgetVisibility: defaultCustom.widgetVisibility,
          autoRefreshInterval: defaultCustom.autoRefreshInterval,
          defaultVehicleFilter: defaultCustom.defaultVehicleFilter
        }
      })
    }

    const customSettings = (userPreferences.customSettings as any) || {}

    return NextResponse.json({
      defaultLandingPage: userPreferences.defaultLandingPage,
      theme: userPreferences.theme,
      language: userPreferences.language,
      timezone: customSettings.timezone || defaultCustom.timezone,
      compactMode: userPreferences.compactMode,
      notifications: {
        email: userPreferences.emailNotifications,
        push: userPreferences.pushNotifications,
        sms: userPreferences.smsNotifications,
        topics: {
          systemUpdates: customSettings.notificationTopics?.systemUpdates ?? defaultCustom.notificationTopics.systemUpdates,
          assignments: customSettings.notificationTopics?.assignments ?? defaultCustom.notificationTopics.assignments,
          approvals: customSettings.notificationTopics?.approvals ?? defaultCustom.notificationTopics.approvals,
          maintenance: customSettings.notificationTopics?.maintenance ?? defaultCustom.notificationTopics.maintenance
        },
        digestFrequency: customSettings.digestFrequency || defaultCustom.digestFrequency
      },
      dashboard: {
        widgetVisibility: {
          fleetStatus: customSettings.widgetVisibility?.fleetStatus ?? defaultCustom.widgetVisibility.fleetStatus,
          financialKpis: customSettings.widgetVisibility?.financialKpis ?? defaultCustom.widgetVisibility.financialKpis,
          distributionMap: customSettings.widgetVisibility?.distributionMap ?? defaultCustom.widgetVisibility.distributionMap
        },
        autoRefreshInterval: customSettings.autoRefreshInterval || defaultCustom.autoRefreshInterval,
        defaultVehicleFilter: customSettings.defaultVehicleFilter || defaultCustom.defaultVehicleFilter
      }
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      defaultLandingPage,
      theme,
      language,
      timezone,
      compactMode,
      notifications,
      dashboard
    } = body

    // Validate the preferences
    if (!defaultLandingPage || !notifications || !dashboard) {
      return NextResponse.json(
        { error: 'Missing required preference fields' },
        { status: 400 }
      )
    }

    // Validate default landing page
    const validPages = [
      '/homepage', '/dashboard', '/dashboard/auta', '/dashboard/grafy',
      '/dashboard/transakce', '/dashboard/noviny', '/dashboard/users', '/dashboard/settings'
    ]
    
    if (!validPages.includes(defaultLandingPage)) {
      return NextResponse.json(
        { error: 'Invalid default landing page' },
        { status: 400 }
      )
    }

    const customSettings = {
      timezone: timezone || 'Europe/Prague',
      notificationTopics: {
        systemUpdates: notifications?.topics?.systemUpdates ?? true,
        assignments: notifications?.topics?.assignments ?? true,
        approvals: notifications?.topics?.approvals ?? true,
        maintenance: notifications?.topics?.maintenance ?? true
      },
      digestFrequency: notifications?.digestFrequency || 'weekly',
      widgetVisibility: {
        fleetStatus: dashboard?.widgetVisibility?.fleetStatus ?? true,
        financialKpis: dashboard?.widgetVisibility?.financialKpis ?? true,
        distributionMap: dashboard?.widgetVisibility?.distributionMap ?? true
      },
      autoRefreshInterval: dashboard?.autoRefreshInterval || '60s',
      defaultVehicleFilter: dashboard?.defaultVehicleFilter || 'ACTIVE'
    }

    // Save preferences to database
    const userPreferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        defaultLandingPage,
        theme: theme || 'system',
        language: language || 'cs',
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        smsNotifications: notifications.sms,
        compactMode: compactMode ?? false,
        showAvatars: true,
        autoRefresh: (dashboard?.autoRefreshInterval || 'manual') !== 'manual',
        customSettings,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        defaultLandingPage,
        theme: theme || 'system',
        language: language || 'cs',
        emailNotifications: notifications.email,
        pushNotifications: notifications.push,
        smsNotifications: notifications.sms,
        compactMode: compactMode ?? false,
        showAvatars: true,
        autoRefresh: (dashboard?.autoRefreshInterval || 'manual') !== 'manual',
        customSettings
      }
    })

    // Log the preference update for audit purposes
    console.log(`User ${session.user.id} updated preferences:`, {
      defaultLandingPage,
      theme,
      language,
      notifications,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: {
        defaultLandingPage,
        theme,
        language,
        timezone: customSettings.timezone,
        compactMode: compactMode ?? false,
        notifications,
        dashboard
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
