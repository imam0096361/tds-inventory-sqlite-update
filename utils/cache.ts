/**
 * Smart Browser Cache System
 * - First load: Fetch from API
 * - Subsequent loads: Use cache (FAST!)
 * - Auto-refresh: Update cache in background
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: string;
}

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    forceRefresh?: boolean;
    staleWhileRevalidate?: boolean;
}

const CACHE_VERSION = '1.0.0';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Smart cache with stale-while-revalidate pattern
 */
export class SmartCache {
    private prefix: string;

    constructor(prefix: string = 'tds_cache') {
        this.prefix = prefix;
    }

    /**
     * Get cache key with prefix
     */
    private getKey(key: string): string {
        return `${this.prefix}_${key}`;
    }

    /**
     * Check if cache entry is valid
     */
    private isValid<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
        if (!entry) return false;
        if (entry.version !== CACHE_VERSION) return false;
        
        const now = Date.now();
        const age = now - entry.timestamp;
        return age < ttl;
    }

    /**
     * Get data from cache
     */
    get<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
        try {
            const cacheKey = this.getKey(key);
            const cached = localStorage.getItem(cacheKey);
            
            if (!cached) return null;

            const entry: CacheEntry<T> = JSON.parse(cached);
            
            if (this.isValid(entry, ttl)) {
                console.log(`[Cache HIT] ${key} (age: ${Date.now() - entry.timestamp}ms)`);
                return entry.data;
            } else {
                console.log(`[Cache EXPIRED] ${key}`);
                this.delete(key);
                return null;
            }
        } catch (error) {
            console.error('[Cache Error]', error);
            return null;
        }
    }

    /**
     * Set data in cache
     */
    set<T>(key: string, data: T): void {
        try {
            const cacheKey = this.getKey(key);
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(entry));
            console.log(`[Cache SET] ${key}`);
        } catch (error) {
            console.error('[Cache Error]', error);
            // If localStorage is full, clear old entries
            this.cleanup();
        }
    }

    /**
     * Delete cache entry
     */
    delete(key: string): void {
        const cacheKey = this.getKey(key);
        localStorage.removeItem(cacheKey);
        console.log(`[Cache DELETE] ${key}`);
    }

    /**
     * Clear all cache entries with this prefix
     */
    clear(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log(`[Cache CLEAR] All entries cleared`);
    }

    /**
     * Cleanup old cache entries
     */
    private cleanup(): void {
        const keys = Object.keys(localStorage);
        const entries: Array<{ key: string; timestamp: number }> = [];

        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const entry = JSON.parse(data);
                        entries.push({ key, timestamp: entry.timestamp || 0 });
                    }
                } catch (e) {
                    // Invalid entry, remove it
                    localStorage.removeItem(key);
                }
            }
        });

        // Sort by timestamp and remove oldest 25%
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = Math.floor(entries.length * 0.25);
        
        for (let i = 0; i < toRemove; i++) {
            localStorage.removeItem(entries[i].key);
        }

        console.log(`[Cache CLEANUP] Removed ${toRemove} old entries`);
    }

    /**
     * Get cache statistics
     */
    getStats(): { total: number; size: string } {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
        
        let totalSize = 0;
        cacheKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += item.length * 2; // UTF-16 = 2 bytes per char
            }
        });

        return {
            total: cacheKeys.length,
            size: `${(totalSize / 1024).toFixed(2)} KB`
        };
    }
}

/**
 * Cached Fetch with stale-while-revalidate pattern
 */
export async function cachedFetch<T>(
    url: string,
    options: CacheOptions = {}
): Promise<T> {
    const cache = new SmartCache();
    const cacheKey = `api_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const { ttl = DEFAULT_TTL, forceRefresh = false, staleWhileRevalidate = true } = options;

    // If force refresh, skip cache
    if (forceRefresh) {
        console.log(`[Fetch] Force refresh: ${url}`);
        const data = await fetchFromAPI<T>(url);
        cache.set(cacheKey, data);
        return data;
    }

    // Try to get from cache first
    const cachedData = cache.get<T>(cacheKey, ttl);

    if (cachedData) {
        // Return cached data immediately
        console.log(`[Fetch] Using cache (FAST!): ${url}`);

        // If stale-while-revalidate, fetch new data in background
        if (staleWhileRevalidate) {
            console.log(`[Fetch] Refreshing cache in background: ${url}`);
            fetchFromAPI<T>(url)
                .then(freshData => {
                    cache.set(cacheKey, freshData);
                    console.log(`[Fetch] Background refresh complete: ${url}`);
                })
                .catch(err => console.error('[Fetch] Background refresh failed:', err));
        }

        return cachedData;
    }

    // No cache, fetch from API
    console.log(`[Fetch] Cache miss, fetching: ${url}`);
    const data = await fetchFromAPI<T>(url);
    cache.set(cacheKey, data);
    return data;
}

/**
 * Fetch from API (helper)
 */
async function fetchFromAPI<T>(url: string): Promise<T> {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Invalidate cache for specific endpoints
 */
export function invalidateCache(patterns: string[]): void {
    const cache = new SmartCache();
    patterns.forEach(pattern => {
        const cacheKey = `api_${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`;
        cache.delete(cacheKey);
    });
}

/**
 * Preload data into cache (for critical pages)
 */
export async function preloadCache(urls: string[]): Promise<void> {
    console.log('[Cache] Preloading critical data...');
    const promises = urls.map(url => 
        cachedFetch(url, { staleWhileRevalidate: false })
            .catch(err => console.error(`[Cache] Preload failed for ${url}:`, err))
    );
    await Promise.all(promises);
    console.log('[Cache] Preload complete!');
}

/**
 * Global cache instance
 */
export const cache = new SmartCache();

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
    // Cache durations for different data types
    STATIC_DATA: 24 * 60 * 60 * 1000, // 24 hours (PC/Laptop/Server info)
    DYNAMIC_DATA: 5 * 60 * 1000, // 5 minutes (Dashboard stats)
    LOGS: 2 * 60 * 1000, // 2 minutes (Peripheral logs)
    REPORTS: 10 * 60 * 1000, // 10 minutes (Department summary)
};

/**
 * Hook for React components
 */
export function useCachedFetch<T>(
    url: string,
    options: CacheOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
    const [data, setData] = React.useState<T | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    const fetchData = React.useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);
            const result = await cachedFetch<T>(url, { ...options, forceRefresh });
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [url]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = React.useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    return { data, loading, error, refresh };
}

// Import React for the hook
import React from 'react';

