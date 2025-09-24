import User from '@/models/User'

/**
 * Generate a unique username from a display name
 * @param {string} name - The user's display name
 * @returns {Promise<string>} - A unique username
 */
export async function generateUniqueUsername(name) {
  if (!name) {
    name = 'User'
  }

  // Clean the name: remove special characters, convert to lowercase, replace spaces with dashes
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .substring(0, 15) // Limit length

  // If the cleaned name is empty, use 'user'
  if (!baseUsername) {
    baseUsername = 'user'
  }

  // Check if the base username is available
  let username = baseUsername
  let suffix = 1
  let isUnique = false

  while (!isUnique) {
    try {
      const existingUser = await User.findOne({ username })
      if (!existingUser) {
        isUnique = true
      } else {
        // Add a number suffix and try again
        username = `${baseUsername}-${suffix}`
        suffix++

        // Prevent infinite loop by limiting attempts
        if (suffix > 9999) {
          // Fallback to timestamp-based username
          username = `${baseUsername}-${Date.now().toString().slice(-6)}`
          break
        }
      }
    } catch (error) {
      console.error('Error checking username uniqueness:', error)
      // Fallback to timestamp-based username on error
      username = `${baseUsername}-${Date.now().toString().slice(-6)}`
      break
    }
  }

  return username
}

/**
 * Generate a random username for anonymous users
 * @returns {Promise<string>} - A unique random username
 */
export async function generateRandomUsername() {
  const adjectives = [
    'clever', 'bright', 'swift', 'gentle', 'brave', 'wise', 'calm', 'bold',
    'quiet', 'sharp', 'quick', 'kind', 'noble', 'pure', 'free', 'true'
  ]

  const nouns = [
    'writer', 'reader', 'dreamer', 'thinker', 'seeker', 'wanderer', 'creator',
    'storyteller', 'wordsmith', 'scribe', 'author', 'poet', 'sage', 'scholar'
  ]

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 999) + 1

  const baseUsername = `${adjective}-${noun}-${number}`

  // Ensure uniqueness
  let username = baseUsername
  let suffix = 1
  let isUnique = false

  while (!isUnique) {
    try {
      const existingUser = await User.findOne({ username })
      if (!existingUser) {
        isUnique = true
      } else {
        username = `${baseUsername}-${suffix}`
        suffix++

        if (suffix > 99) {
          username = `${baseUsername}-${Date.now().toString().slice(-4)}`
          break
        }
      }
    } catch (error) {
      console.error('Error checking random username uniqueness:', error)
      username = `${baseUsername}-${Date.now().toString().slice(-4)}`
      break
    }
  }

  return username
}

/**
 * Validate username format (for reference, usernames are auto-generated)
 * @param {string} username - Username to validate
 * @returns {boolean} - Whether the username is valid
 */
export function isValidUsername(username) {
  // Username should be 3-20 characters, alphanumeric with dashes
  const usernameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
  return username &&
         username.length >= 3 &&
         username.length <= 20 &&
         usernameRegex.test(username) &&
         !username.includes('--') // No consecutive dashes
}