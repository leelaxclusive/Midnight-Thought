import { useEffect, useRef } from 'react'

/**
 * Hook to automatically trigger scheduled chapter publishing
 * This runs in the browser and periodically calls the publishing API
 */
export function useAutoPublisher() {
  const intervalRef = useRef(null)

  useEffect(() => {
    // Function to check for scheduled chapters
    const checkScheduledChapters = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auto-publisher checking for scheduled chapters...')
        }

        const response = await fetch('/api/admin/publish-scheduled', {
          method: 'GET'
        })

        if (response.ok) {
          const result = await response.json()
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Auto-publisher result:', result)
          }
          if (result.published > 0) {
            console.log(`✅ Auto-published ${result.published} scheduled chapters`)
          }
        } else {
          console.error('Auto-publisher API failed:', response.status, await response.text())
        }
      } catch (error) {
        // Show errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Auto-publisher check failed:', error)
        }
      }
    }

    // Initial check
    checkScheduledChapters()

    // Set up interval to check every 2 minutes in development, 10 minutes in production
    const interval = process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 10 * 60 * 1000
    intervalRef.current = setInterval(checkScheduledChapters, interval)

    if (process.env.NODE_ENV === 'development') {
      console.log(`🕒 Auto-publisher scheduled to run every ${interval / 60000} minutes`)
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null
}