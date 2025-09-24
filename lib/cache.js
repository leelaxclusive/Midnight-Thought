// Simple in-memory cache for development
// In production, you should use Redis or similar
class MemoryCache {
	constructor() {
		this.cache = new Map();
		this.ttls = new Map();
	}

	set(key, value, ttl = 300000) {
		// 5 minutes default
		this.cache.set(key, value);
		this.ttls.set(key, Date.now() + ttl);

		// Clean up expired entries periodically
		setTimeout(() => this.cleanup(), ttl + 1000);
	}

	get(key) {
		const ttl = this.ttls.get(key);

		if (!ttl || Date.now() > ttl) {
			this.cache.delete(key);
			this.ttls.delete(key);
			return null;
		}

		return this.cache.get(key);
	}

	delete(key) {
		this.cache.delete(key);
		this.ttls.delete(key);
	}

	clear() {
		this.cache.clear();
		this.ttls.clear();
	}

	cleanup() {
		const now = Date.now();
		for (const [key, ttl] of this.ttls.entries()) {
			if (now > ttl) {
				this.cache.delete(key);
				this.ttls.delete(key);
			}
		}
	}

	size() {
		return this.cache.size;
	}
}

const cache = new MemoryCache();

// Cache wrapper for API responses
export async function withCache(key, fetcher, ttl = 300000) {
	// Skip caching in development
	if (process.env.NODE_ENV === 'development') {
		return await fetcher();
	}

	// Try to get from cache first
	const cached = cache.get(key);
	if (cached) {
		// Recreate NextResponse from cached data
		if (cached.isNextResponse) {
			const { NextResponse } = await import("next/server");
			return NextResponse.json(cached.data, {
				status: cached.status,
				headers: cached.headers,
			});
		}
		return cached;
	}

	// If not in cache, fetch and store
	try {
		const result = await fetcher();

		// Handle NextResponse objects by extracting the data
		if (result && typeof result.json === "function" && result.constructor?.name === "NextResponse") {
			try {
				const data = await result.clone().json();
				const cacheEntry = {
					isNextResponse: true,
					data: data,
					status: result.status,
					headers: Object.fromEntries(result.headers.entries()),
				};
				cache.set(key, cacheEntry, ttl);
			} catch (jsonError) {
				if (process.env.NODE_ENV === 'development') {
					console.warn("Failed to cache NextResponse:", jsonError.message);
				}
			}
		} else {
			cache.set(key, result, ttl);
		}

		return result;
	} catch (error) {
		// Don't cache errors
		throw error;
	}
}

// Cache invalidation helpers
export function invalidateCache(pattern) {
	if (typeof pattern === "string") {
		// Exact match
		cache.delete(pattern);
	} else if (pattern instanceof RegExp) {
		// Pattern match
		for (const key of cache.cache.keys()) {
			if (pattern.test(key)) {
				cache.delete(key);
			}
		}
	}
}

// Predefined cache keys
export const CacheKeys = {
	// Home page data
	HOME_STATS: "home:stats",
	HOME_TRENDING: (limit) => `home:trending:${limit}`,
	HOME_RECENT: (limit) => `home:recent:${limit}`,
	HOME_COMPLETED: (limit) => `home:completed:${limit}`,

	// Stories
	STORY: (slug) => `story:${slug}`,
	STORY_CHAPTERS: (slug) => `story:${slug}:chapters`,
	USER_STORIES: (userId) => `user:${userId}:stories`,

	// User data
	USER_PROFILE: (userId) => `user:${userId}:profile`,
	USER_LIBRARY: (userId) => `user:${userId}:library`,
	USER_READING_HISTORY: (userId) => `user:${userId}:reading-history`,

	// Search and explore
	EXPLORE_STORIES: (filters) => `explore:${JSON.stringify(filters)}`,
	SEARCH_RESULTS: (query, filters) => `search:${query}:${JSON.stringify(filters)}`,
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
	SHORT: 60000, // 1 minute
	MEDIUM: 300000, // 5 minutes
	LONG: 1800000, // 30 minutes
	VERY_LONG: 3600000, // 1 hour
};

export default cache;
