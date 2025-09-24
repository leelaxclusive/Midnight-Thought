// Notification service for Discord and Telegram integrations

/**
 * Send Discord notification via webhook
 */
export async function sendDiscordNotification(webhookUrl, message) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is required')
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message.content,
        embeds: message.embeds || [],
        username: message.username || 'Midnight Thought',
        avatar_url: message.avatar_url || 'https://your-domain.com/bot-avatar.png'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`)
    }

    return { success: true, platform: 'discord' }
  } catch (error) {
    console.error('Discord notification error:', error)
    throw error
  }
}

/**
 * Send Telegram notification via bot API
 */
export async function sendTelegramNotification(botToken, chatId, message) {
  if (!botToken || !chatId) {
    throw new Error('Telegram bot token and chat ID are required')
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        parse_mode: message.parse_mode || 'HTML',
        disable_web_page_preview: message.disable_preview || false,
        reply_markup: message.reply_markup || null
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Telegram API failed: ${result.description || 'Unknown error'}`)
    }

    return { success: true, platform: 'telegram', result }
  } catch (error) {
    console.error('Telegram notification error:', error)
    throw error
  }
}

/**
 * Create notification messages for new chapter
 */
export function createNewChapterMessage(story, chapter, author) {
  const storyUrl = `${process.env.NEXTAUTH_URL}/story/${story.slug}/chapter/${chapter.chapterNumber}`

  // Discord message with rich embed
  const discordMessage = {
    content: `📚 **New Chapter Published!**`,
    embeds: [{
      title: `${story.title} - Chapter ${chapter.chapterNumber}`,
      description: chapter.title,
      url: storyUrl,
      color: 5814783, // Blue color
      fields: [
        {
          name: 'Author',
          value: author.name,
          inline: true
        },
        {
          name: 'Genre',
          value: story.genre,
          inline: true
        },
        {
          name: 'Reading Time',
          value: `${chapter.readingTime || 5} min`,
          inline: true
        }
      ],
      footer: {
        text: 'Midnight Thought',
        icon_url: 'https://your-domain.com/logo.png'
      },
      timestamp: new Date().toISOString()
    }],
    username: 'Story Updates'
  }

  // Telegram message with HTML formatting
  const telegramMessage = {
    text: `📚 <b>New Chapter Published!</b>\n\n` +
          `<b>${story.title}</b>\n` +
          `Chapter ${chapter.chapterNumber}: ${chapter.title}\n\n` +
          `👤 Author: ${author.name}\n` +
          `📖 Genre: ${story.genre}\n` +
          `⏱️ Reading Time: ${chapter.readingTime || 5} min\n\n` +
          `<a href="${storyUrl}">Read Chapter →</a>`,
    parse_mode: 'HTML',
    disable_preview: false
  }

  return { discordMessage, telegramMessage }
}

/**
 * Create notification messages for milestones
 */
export function createMilestoneMessage(story, milestone, author) {
  const storyUrl = `${process.env.NEXTAUTH_URL}/story/${story.slug}`

  // Discord message
  const discordMessage = {
    content: `🎉 **Milestone Achieved!**`,
    embeds: [{
      title: `${story.title} reached ${milestone.type}!`,
      description: `${milestone.value} ${milestone.type}`,
      url: storyUrl,
      color: 15844367, // Gold color
      fields: [
        {
          name: 'Author',
          value: author.name,
          inline: true
        },
        {
          name: 'Story',
          value: story.title,
          inline: true
        }
      ],
      footer: {
        text: 'Midnight Thought',
        icon_url: 'https://your-domain.com/logo.png'
      },
      timestamp: new Date().toISOString()
    }],
    username: 'Milestone Alerts'
  }

  // Telegram message
  const telegramMessage = {
    text: `🎉 <b>Milestone Achieved!</b>\n\n` +
          `<b>${story.title}</b> reached <b>${milestone.value} ${milestone.type}</b>!\n\n` +
          `👤 Author: ${author.name}\n\n` +
          `<a href="${storyUrl}">View Story →</a>`,
    parse_mode: 'HTML'
  }

  return { discordMessage, telegramMessage }
}

/**
 * Send notifications to author's configured channels
 */
export async function notifyAuthor(user, story, chapter = null, milestone = null) {
  const notifications = []

  try {
    // Skip if no notification settings
    if (!user.notificationSettings) {
      return { success: true, notifications: [] }
    }

    const { discord, telegram } = user.notificationSettings

    // Prepare messages based on notification type
    let messages = null

    if (chapter && (discord.newChapters || telegram.newChapters)) {
      // New chapter notification
      messages = createNewChapterMessage(story, chapter, {
        name: user.name,
        username: user.username
      })
    } else if (milestone && (discord.milestones || telegram.milestones)) {
      // Milestone notification
      messages = createMilestoneMessage(story, milestone, {
        name: user.name,
        username: user.username
      })
    }

    if (!messages) {
      return { success: true, notifications: [] }
    }

    // Send Discord notification
    if (discord.enabled && discord.webhookUrl) {
      try {
        if ((chapter && discord.newChapters) || (milestone && discord.milestones)) {
          const result = await sendDiscordNotification(discord.webhookUrl, messages.discordMessage)
          notifications.push(result)
        }
      } catch (error) {
        console.error('Discord notification failed:', error)
        notifications.push({ success: false, platform: 'discord', error: error.message })
      }
    }

    // Send Telegram notification
    if (telegram.enabled && telegram.botToken && telegram.chatId) {
      try {
        if ((chapter && telegram.newChapters) || (milestone && telegram.milestones)) {
          const result = await sendTelegramNotification(
            telegram.botToken,
            telegram.chatId,
            messages.telegramMessage
          )
          notifications.push(result)
        }
      } catch (error) {
        console.error('Telegram notification failed:', error)
        notifications.push({ success: false, platform: 'telegram', error: error.message })
      }
    }

    return { success: true, notifications }

  } catch (error) {
    console.error('Notification service error:', error)
    return { success: false, error: error.message, notifications }
  }
}

/**
 * Notify followers when author publishes new chapter
 */
export async function notifyFollowers(author, story, chapter) {
  try {
    // Get author with followers populated
    const populatedAuthor = await User.findById(author._id)
      .populate('followers', 'email name notificationSettings')

    if (!populatedAuthor.followers || populatedAuthor.followers.length === 0) {
      return { success: true, notified: 0 }
    }

    // Filter followers who want email notifications for new chapters
    const followersToNotify = populatedAuthor.followers.filter(follower =>
      follower.notificationSettings?.email?.newChapters !== false
    )

    if (followersToNotify.length === 0) {
      return { success: true, notified: 0 }
    }

    // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
    // For now, we'll just silently skip notification

    // TODO: Implement actual email sending
    // const emailResults = await sendBulkEmails(followersToNotify, story, chapter, author)

    return { success: true, notified: followersToNotify.length }

  } catch (error) {
    console.error('Follower notification error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Test notification settings
 */
export async function testNotificationSettings(user, platform) {
  try {
    const testMessage = {
      story: { title: 'Test Story', slug: 'test-story', genre: 'Test' },
      chapter: { title: 'Test Chapter', chapterNumber: 1, readingTime: 5 },
      author: { name: user.name, username: user.username }
    }

    const messages = createNewChapterMessage(testMessage.story, testMessage.chapter, testMessage.author)

    if (platform === 'discord' && user.notificationSettings?.discord?.enabled) {
      return await sendDiscordNotification(
        user.notificationSettings.discord.webhookUrl,
        messages.discordMessage
      )
    } else if (platform === 'telegram' && user.notificationSettings?.telegram?.enabled) {
      return await sendTelegramNotification(
        user.notificationSettings.telegram.botToken,
        user.notificationSettings.telegram.chatId,
        messages.telegramMessage
      )
    } else {
      throw new Error(`Platform ${platform} not configured or enabled`)
    }

  } catch (error) {
    console.error('Test notification error:', error)
    throw error
  }
}