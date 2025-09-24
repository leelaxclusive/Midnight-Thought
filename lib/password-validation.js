/**
 * Password validation utilities for enhanced security
 */

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} - Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = []

  // Basic length check
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  // Character type requirements
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!hasNumber) {
    errors.push('Password must contain at least one number')
  }

  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /^(?=.*password)/i,
    /^(?=.*123456)/,
    /^(?=.*qwerty)/i,
    /^(?=.*admin)/i,
    /^(?=.*login)/i,
    /^(?=.*welcome)/i,
    /(.)\1{3,}/, // 4 or more consecutive identical characters
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns that are easily guessed')
      break
    }
  }

  // Sequential characters check
  if (hasSequentialChars(password)) {
    errors.push('Password should not contain sequential characters (e.g., 123, abc)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  }
}

/**
 * Calculate password strength score
 * @param {string} password - The password to evaluate
 * @returns {object} - Strength score and level
 */
function calculatePasswordStrength(password) {
  let score = 0

  // Length bonus
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

  // Additional complexity bonus
  if (/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

  const level = score <= 3 ? 'weak' : score <= 5 ? 'medium' : score <= 7 ? 'strong' : 'very-strong'

  return { score, level }
}

/**
 * Check for sequential characters
 * @param {string} password - The password to check
 * @returns {boolean} - True if sequential characters found
 */
function hasSequentialChars(password) {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiopasdfghjklzxcvbnm'
  ]

  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3)
      if (password.toLowerCase().includes(subseq) ||
          password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
        return true
      }
    }
  }

  return false
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {object} - Validation result
 */
export function validateEmail(email) {
  const errors = []

  if (!email) {
    errors.push('Email is required')
    return { isValid: false, errors }
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address')
  }

  // Length validation
  if (email.length > 254) {
    errors.push('Email address is too long')
  }

  // Domain validation
  const domain = email.split('@')[1]
  if (domain && domain.length > 253) {
    errors.push('Email domain is too long')
  }

  // Disposable email detection (basic)
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'temp-mail.org'
  ]

  if (domain && disposableDomains.includes(domain.toLowerCase())) {
    errors.push('Disposable email addresses are not allowed')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate username
 * @param {string} username - The username to validate
 * @returns {object} - Validation result
 */
export function validateUsername(username) {
  const errors = []

  if (!username) {
    errors.push('Username is required')
    return { isValid: false, errors }
  }

  // Length validation
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long')
  }

  if (username.length > 20) {
    errors.push('Username must be less than 20 characters')
  }

  // Character validation
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens')
  }

  // Must start with letter or number
  if (!/^[a-zA-Z0-9]/.test(username)) {
    errors.push('Username must start with a letter or number')
  }

  // Reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'moderator', 'mod',
    'api', 'www', 'mail', 'ftp', 'blog', 'support',
    'help', 'info', 'contact', 'about', 'terms',
    'privacy', 'legal', 'null', 'undefined', 'test',
    'guest', 'user', 'username', 'password'
  ]

  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push('This username is reserved and cannot be used')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting helper for registration attempts
 * Simple in-memory rate limiting (use Redis in production)
 */
const registrationAttempts = new Map()

export function checkRegistrationRateLimit(ip) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  if (!registrationAttempts.has(ip)) {
    registrationAttempts.set(ip, [])
  }

  const attempts = registrationAttempts.get(ip)

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs)
  registrationAttempts.set(ip, recentAttempts)

  if (recentAttempts.length >= maxAttempts) {
    return {
      allowed: false,
      timeUntilReset: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
    }
  }

  // Add current attempt
  recentAttempts.push(now)
  registrationAttempts.set(ip, recentAttempts)

  return {
    allowed: true,
    remaining: maxAttempts - recentAttempts.length
  }
}