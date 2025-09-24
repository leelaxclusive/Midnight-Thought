'use client'

import { useAutoPublisher } from '@/hooks/useAutoPublisher'

/**
 * Background component that automatically checks for and publishes scheduled chapters
 * This should be included in the main layout to run whenever users are on the site
 */
export default function AutoPublisher() {
  useAutoPublisher()
  return null // This component renders nothing but runs the auto-publisher hook
}