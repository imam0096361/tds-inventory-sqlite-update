/**
 * Intelligent Query Caching System
 * Caches AI query results to reduce API calls and improve response time
 */

interface CachedQuery {
    query: string;
    response: any;
    timestamp: number;
    hitCount: number;
}

class QueryCache {
    private cache: Map<string, CachedQuery> = new Map();
    private maxSize: number = 100; // Max 100 cached queries
    private ttl: number = 1000 * 60 * 15; // 15 minutes TTL

    /**
     * Generate cache key from query
     */
    private generateKey(query: string, filters?: any): string {
        const normalizedQuery = query.toLowerCase().trim();
        const filterKey = filters ? JSON.stringify(filters) : '';
        return `${normalizedQuery}:${filterKey}`;
    }

    /**
     * Get cached result if available and fresh
     */
    get(query: string, filters?: any): any | null {
        const key = this.generateKey(query, filters);
        const cached = this.cache.get(key);

        if (!cached) return null;

        // Check if expired
        const age = Date.now() - cached.timestamp;
        if (age > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Increment hit count
        cached.hitCount++;
        console.log(`✅ Cache HIT for "${query}" (${cached.hitCount} hits)`);

        return cached.response;
    }

    /**
     * Store result in cache
     */
    set(query: string, response: any, filters?: any): void {
        const key = this.generateKey(query, filters);

        // If cache is full, remove least recently used
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        this.cache.set(key, {
            query,
            response,
            timestamp: Date.now(),
            hitCount: 0,
        });

        console.log(`💾 Cached result for "${query}"`);
    }

    /**
     * Evict least recently used (LRU) cache entry
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        this.cache.forEach((value, key) => {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`🗑️ Evicted LRU cache entry`);
        }
    }

    /**
     * Invalidate cache entries related to a specific module
     */
    invalidateModule(module: string): void {
        let count = 0;
        this.cache.forEach((value, key) => {
            if (key.includes(module)) {
                this.cache.delete(key);
                count++;
            }
        });
        console.log(`🔄 Invalidated ${count} cache entries for module: ${module}`);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        totalHits: number;
        entries: Array<{ query: string; hits: number; age: number }>;
    } {
        let totalHits = 0;
        const entries: Array<{ query: string; hits: number; age: number }> = [];

        this.cache.forEach(value => {
            totalHits += value.hitCount;
            entries.push({
                query: value.query,
                hits: value.hitCount,
                age: Math.round((Date.now() - value.timestamp) / 1000),
            });
        });

        return {
            size: this.cache.size,
            totalHits,
            entries: entries.sort((a, b) => b.hits - a.hits),
        };
    }

    /**
     * Check if query should be cached (avoid caching time-sensitive queries)
     */
    shouldCache(query: string): boolean {
        const timeKeywords = [
            'today',
            'yesterday',
            'this week',
            'this month',
            'recent',
            'latest',
            'now',
        ];

        const queryLower = query.toLowerCase();
        return !timeKeywords.some(keyword => queryLower.includes(keyword));
    }
}

// Singleton instance
export const queryCache = new QueryCache();

/**
 * Middleware for cache-aware query handler
 */
export async function withCache<T>(
    query: string,
    filters: any,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Check cache first
    if (queryCache.shouldCache(query)) {
        const cached = queryCache.get(query, filters);
        if (cached) {
            return cached;
        }
    }

    // Execute query
    const result = await fetchFn();

    // Store in cache
    if (queryCache.shouldCache(query)) {
        queryCache.set(query, result, filters);
    }

    return result;
}
