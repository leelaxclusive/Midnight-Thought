import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { sanitizeForStorage } from '@/lib/sanitize'
import { generateUniqueUsername } from '@/lib/username-generator'
import {
  validatePassword,
  validateEmail,
  checkRegistrationRateLimit
} from '@/lib/password-validation'

export async function POST(req) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limiting
    const rateLimit = checkRegistrationRateLimit(ip)
    if (!rateLimit.allowed) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Registration rate limit exceeded', {
          ip,
          timeUntilReset: rateLimit.timeUntilReset,
          timestamp: new Date().toISOString()
        })
      }
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimit.timeUntilReset
        },
        { status: 429 }
      )
    }

    const { name, email, password } = await req.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Sanitize input fields
    const sanitizedName = sanitizeForStorage(name.trim(), 'comments')
    const sanitizedEmail = email.trim().toLowerCase()

    // Validate name
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }

    // Validate email
    const emailValidation = validateEmail(sanitizedEmail)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.errors[0] },
        { status: 400 }
      )
    }


    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors,
          strength: passwordValidation.strength
        },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check for existing email
    const existingUser = await User.findOne({ email: sanitizedEmail })

    if (existingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Registration attempt with existing email', {
          ip,
          email: sanitizedEmail,
          timestamp: new Date().toISOString()
        })
      }

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Generate unique username
    const generatedUsername = await generateUniqueUsername(sanitizedName)

    // Create user with enhanced security fields
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password, // Will be hashed by the User model pre-save hook
      username: generatedUsername,
      role: 'reader',
      isActive: true,
      isVerified: false, // Require email verification
      emailVerified: null,
      loginAttempts: 0
    })

    // Log successful registration
    console.info('New user registered', {
      userId: user._id,
      email: sanitizedEmail,
      username: generatedUsername,
      ip,
      timestamp: new Date().toISOString()
    })

    // Return user data (excluding sensitive information)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified
    }

    return NextResponse.json(
      {
        message: 'Account created successfully. Please verify your email to complete registration.',
        user: userResponse,
        requiresVerification: true
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    })

    // Handle database constraint violations
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { error: `This ${field} is already registered. Please use a different one.` },
        { status: 409 }
      )
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        {
          error: 'Registration failed due to validation errors',
          details: messages
        },
        { status: 400 }
      )
    }

    // Handle network/connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Generic server error (don't expose internal details)
    return NextResponse.json(
      { error: 'Registration failed. Please try again later.' },
      { status: 500 }
    )
  }
}