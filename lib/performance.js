// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
  }

  // Start timing an operation
  startTimer(label) {
    this.metrics.set(label, {
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed
    })
    return label
  }

  // End timing and log results
  endTimer(label) {
    const metric = this.metrics.get(label)
    if (!metric) {
      console.warn(`Performance timer '${label}' not found`)
      return null
    }

    const endTime = Date.now()
    const endMemory = process.memoryUsage().heapUsed

    const result = {
      label,
      duration: endTime - metric.startTime,
      memoryDelta: endMemory - metric.startMemory,
      timestamp: new Date().toISOString()
    }

    this.metrics.delete(label)

    // Log slow operations (>100ms)
    if (result.duration > 100) {
      console.warn(`🐌 Slow operation detected: ${label} took ${result.duration}ms`)
    }

    return result
  }

  // Measure a function's performance
  async measure(label, fn) {
    this.startTimer(label)
    try {
      const result = await fn()
      this.endTimer(label)
      return result
    } catch (error) {
      this.endTimer(label)
      throw error
    }
  }

  // Get current memory usage
  getMemoryUsage() {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(usage.external / 1024 / 1024) + 'MB',
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
    }
  }
}

const monitor = new PerformanceMonitor()

// HOF for API route performance monitoring
export function withPerformanceMonitoring(handler, routeName) {
  return async function(request, context) {
    const label = `API:${routeName}:${request.method}`

    try {
      return await monitor.measure(label, () => handler(request, context))
    } catch (error) {
      console.error(`❌ Error in ${label}:`, error.message)
      throw error
    }
  }
}

// Database query performance wrapper
export async function withQueryPerformance(queryName, queryFn) {
  const label = `DB:${queryName}`
  return monitor.measure(label, queryFn)
}

// React component performance hook
export function usePerformance(componentName) {
  if (typeof window === 'undefined') return {} // Server-side

  const startTime = performance.now()

  return {
    logRenderTime: () => {
      const renderTime = performance.now() - startTime
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    },
    measureAsync: async (operationName, fn) => {
      const opStart = performance.now()
      try {
        const result = await fn()
        const opTime = performance.now() - opStart
        if (opTime > 100) {
          console.warn(`🐌 Slow operation: ${componentName}:${operationName} took ${opTime.toFixed(2)}ms`)
        }
        return result
      } catch (error) {
        console.error(`❌ Error in ${componentName}:${operationName}:`, error.message)
        throw error
      }
    }
  }
}

// Web Vitals monitoring (client-side)
export function reportWebVitals(metric) {
  if (typeof window === 'undefined') return

  const { name, value, id } = metric

  // Log poor scores
  const thresholds = {
    CLS: 0.1,
    FID: 100,
    FCP: 1800,
    LCP: 2500,
    TTFB: 800
  }

  if (value > thresholds[name]) {
    console.warn(`📊 Poor ${name}: ${value} (threshold: ${thresholds[name]})`)
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics
    // analytics.track('Web Vital', { name, value, id })
  }
}

// Bundle analyzer helper (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return

  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0]

    console.group('📦 Bundle Analysis')
    console.log('Load time:', Math.round(navigation.loadEventEnd - navigation.fetchStart) + 'ms')
    console.log('DOM ready:', Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) + 'ms')
    console.log('Memory usage:', monitor.getMemoryUsage())
    console.groupEnd()
  }
}

export default monitor