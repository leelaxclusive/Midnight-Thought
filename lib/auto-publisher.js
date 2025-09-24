import { publishScheduledChapters } from './scheduled-publisher'

// Track last check time to avoid excessive DB queries
let lastCheck = 0
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Auto-publisher that runs in the background
 * This will be called on various user interactions to ensure scheduled chapters get published
 */
export async function autoPublishScheduled() {
  try {
    const now = Date.now()

    // Only check every 5 minutes to avoid excessive DB queries
    if (now - lastCheck < CHECK_INTERVAL) {
      return { skipped: true, reason: 'Too soon since last check' }
    }

    lastCheck = now

    // Run the scheduled publisher
    const result = await publishScheduledChapters()

    if (result.published > 0) {
      console.log(`Auto-publisher: Published ${result.published} scheduled chapters`)
    }

    return result

  } catch (error) {
    console.error('Error in auto-publisher:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Middleware wrapper to add auto-publishing to API routes
 */
export function withAutoPublishing(handler) {
  return async function(request, context) {
    // Run auto-publisher in background (don't await to avoid blocking the request)
    autoPublishScheduled().catch(error => {
      // Silent failure - don't break the main request
      if (process.env.NODE_ENV === 'development') {
        console.error('Background auto-publisher failed:', error)
      }
    })

    // Continue with the original handler
    return handler(request, context)
  }
}

/**
 * Client-side function to trigger scheduled publishing
 * This can be called from the frontend periodically
 */
export async function triggerScheduledPublishing() {
  try {
    const response = await fetch('/api/admin/publish-scheduled', {
      method: 'GET'
    })

    if (response.ok) {
      const result = await response.json()
      return result
    } else {
      throw new Error(`API returned ${response.status}`)
    }
  } catch (error) {
    console.error('Error triggering scheduled publishing:', error)
    return { success: false, error: error.message }
  }
}