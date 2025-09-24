import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { testNotificationSettings } from '@/lib/notifications'

// GET /api/user/notifications - Get user's notification settings
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .select('notificationSettings')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Ensure default notification settings exist
    const defaultSettings = {
      email: {
        newChapters: true,
        newFollowers: true,
        storyUpdates: true,
        mentions: true
      },
      discord: {
        enabled: false,
        webhookUrl: '',
        newChapters: false,
        milestones: false
      },
      telegram: {
        enabled: false,
        botToken: '',
        chatId: '',
        newChapters: false,
        milestones: false
      }
    }

    const settings = user.notificationSettings || defaultSettings

    // Mask sensitive data for security
    const maskedSettings = {
      ...settings,
      discord: {
        ...settings.discord,
        webhookUrl: settings.discord?.webhookUrl ? '***CONFIGURED***' : ''
      },
      telegram: {
        ...settings.telegram,
        botToken: settings.telegram?.botToken ? '***CONFIGURED***' : '',
        chatId: settings.telegram?.chatId ? '***CONFIGURED***' : ''
      }
    }

    return NextResponse.json({
      notificationSettings: maskedSettings
    })

  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification settings' },
      { status: 500 }
    )
  }
}

// PUT /api/user/notifications - Update user's notification settings
export async function PUT(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const updates = await request.json()
    const { email, discord, telegram } = updates

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Initialize notification settings if they don't exist
    if (!user.notificationSettings) {
      user.notificationSettings = {
        email: {
          newChapters: true,
          newFollowers: true,
          storyUpdates: true,
          mentions: true
        },
        discord: {
          enabled: false,
          webhookUrl: '',
          newChapters: false,
          milestones: false
        },
        telegram: {
          enabled: false,
          botToken: '',
          chatId: '',
          newChapters: false,
          milestones: false
        }
      }
    }

    // Update email settings
    if (email) {
      Object.assign(user.notificationSettings.email, email)
    }

    // Update Discord settings
    if (discord) {
      // Don't update webhookUrl if it's the masked value
      if (discord.webhookUrl && discord.webhookUrl !== '***CONFIGURED***') {
        user.notificationSettings.discord.webhookUrl = discord.webhookUrl
      }

      // Update other Discord settings
      if (discord.enabled !== undefined) user.notificationSettings.discord.enabled = discord.enabled
      if (discord.newChapters !== undefined) user.notificationSettings.discord.newChapters = discord.newChapters
      if (discord.milestones !== undefined) user.notificationSettings.discord.milestones = discord.milestones
    }

    // Update Telegram settings
    if (telegram) {
      // Don't update sensitive fields if they're the masked value
      if (telegram.botToken && telegram.botToken !== '***CONFIGURED***') {
        user.notificationSettings.telegram.botToken = telegram.botToken
      }
      if (telegram.chatId && telegram.chatId !== '***CONFIGURED***') {
        user.notificationSettings.telegram.chatId = telegram.chatId
      }

      // Update other Telegram settings
      if (telegram.enabled !== undefined) user.notificationSettings.telegram.enabled = telegram.enabled
      if (telegram.newChapters !== undefined) user.notificationSettings.telegram.newChapters = telegram.newChapters
      if (telegram.milestones !== undefined) user.notificationSettings.telegram.milestones = telegram.milestones
    }

    await user.save()

    return NextResponse.json({
      message: 'Notification settings updated successfully'
    })

  } catch (error) {
    console.error('Update notification settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}

// POST /api/user/notifications - Test notification settings
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { platform } = await request.json() // 'discord' or 'telegram'

    if (!platform || !['discord', 'telegram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Use "discord" or "telegram"' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    try {
      const result = await testNotificationSettings(user, platform)

      return NextResponse.json({
        message: `Test notification sent successfully to ${platform}`,
        result
      })

    } catch (error) {
      return NextResponse.json(
        { error: `Failed to send test notification: ${error.message}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'Failed to test notification' },
      { status: 500 }
    )
  }
}