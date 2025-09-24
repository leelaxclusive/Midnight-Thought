import { withCache, invalidateCache } from './cache'
import { withPerformanceMonitoring } from './performance'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map()

// Rate limiting middleware
export function withRateLimit(limit = 100, windowMs = 15 * 60 * 1000) { // 100 requests per 15 minutes
  return function(handler) {
    return async function(request, context) {
      const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'

      const key = `rate_limit:${ip}`
      const now = Date.now()

      const windowStart = now - windowMs
      const requests = rateLimitStore.get(key) || []

      // Filter out requests outside the current window
      const validRequests = requests.filter(timestamp => timestamp > windowStart)

      if (validRequests.length >= limit) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfter: Math.ceil(windowMs / 1000) },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(windowMs / 1000)),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil((now + windowMs) / 1000))
            }
          }
        )
      }

      // Add current request
      validRequests.push(now)
      rateLimitStore.set(key, validRequests)

      // Add rate limit headers
      const response = await handler(request, context)

      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', String(limit))
        response.headers.set('X-RateLimit-Remaining', String(limit - validRequests.length))
        response.headers.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
      }

      return response
    }
  }
}

// Authentication middleware
export function withAuth(handler, requireAdmin = false) {
  return async function(request, context) {
    try {
      const session = await getServerSession(authOptions)

      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (requireAdmin && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      // Add session to context
      return handler(request, { ...context, session })
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

// Caching middleware for GET requests
export function withCaching(cacheKey, ttl = 300000) {
  return function(handler) {
    return async function(request, context) {
      // Only cache GET requests
      if (request.method !== 'GET') {
        return handler(request, context)
      }

      // Generate cache key with query params
      const url = new URL(request.url)
      const fullCacheKey = typeof cacheKey === 'function'
        ? cacheKey(url.searchParams, context)
        : `${cacheKey}:${url.search}`

      try {
        return await withCache(fullCacheKey, () => handler(request, context), ttl)
      } catch (error) {
        // If caching fails, proceed without cache
        if (process.env.NODE_ENV === 'development') {
          console.warn('Cache error:', error.message)
        }
        return handler(request, context)
      }
    }
  }
}

// CORS middleware
export function withCORS(allowedOrigins = ['http://localhost:3000']) {
  return function(handler) {
    return async function(request, context) {
      const origin = request.headers.get('origin')

      const response = await handler(request, context)

      if (response instanceof NextResponse) {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
          response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          response.headers.set('Access-Control-Max-Age', '86400')
        }

        // Set CORS headers
        if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
          response.headers.set('Access-Control-Allow-Origin', origin)
          response.headers.set('Access-Control-Allow-Credentials', 'true')
        }
      }

      return response
    }
  }
}

// Error handling middleware
export function withErrorHandling(handler) {
  return async function(request, context) {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', {
        url: request.url,
        method: request.method,
        error: error.message,
        stack: error.stack
      })

      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message

      return NextResponse.json(
        { error: message },
        { status: error.status || 500 }
      )
    }
  }
}

// Compose multiple middlewares
export function createHandler(...middlewares) {
  return function(handler) {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc)
    }, handler)
  }
}

// Predefined middleware combinations
export const publicAPI = createHandler(
  withErrorHandling,
  withPerformanceMonitoring,
  withRateLimit(200, 15 * 60 * 1000), // 200 requests per 15 minutes
  withCORS()
)

export const authenticatedAPI = createHandler(
  withErrorHandling,
  withPerformanceMonitoring,
  withRateLimit(500, 15 * 60 * 1000), // 500 requests per 15 minutes for authenticated users
  withAuth,
  withCORS()
)

export const adminAPI = createHandler(
  withErrorHandling,
  withPerformanceMonitoring,
  withRateLimit(1000, 15 * 60 * 1000), // Higher limit for admins
  (handler) => withAuth(handler, true), // Require admin
  withCORS()
)

export const cachedPublicAPI = (cacheKey, ttl) => createHandler(
  withErrorHandling,
  withPerformanceMonitoring,
  withRateLimit(200, 15 * 60 * 1000),
  withCaching(cacheKey, ttl),
  withCORS()
)

// Cache invalidation helper for mutations
export function invalidateCacheOnMutation(patterns) {
  return function(handler) {
    return async function(request, context) {
      const response = await handler(request, context)

      // Only invalidate on successful mutations
      if (response instanceof NextResponse &&
          ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
          response.status >= 200 && response.status < 300) {

        patterns.forEach(pattern => invalidateCache(pattern))
      }

      return response
    }
  }
}