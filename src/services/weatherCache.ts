import { WeatherData, WeatherCacheEntry } from '../types';

export interface CacheConfig {
  defaultTtl: number; // Time to live in seconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class WeatherCache {
  private cache: Map<string, WeatherCacheEntry> = new Map();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private redisClient?: any; // Redis client (optional)

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 15 * 60, // 15 minutes default
      maxSize: 1000, // 1000 entries max
      cleanupInterval: 5 * 60 * 1000, // 5 minutes cleanup
      ...config,
    };

    // Start cleanup timer
    this.startCleanupTimer();

    // Initialize Redis if available
    this.initializeRedis();
  }

  /**
   * Initialize Redis client if Redis is available
   */
  private async initializeRedis() {
    try {
      // Check if Redis is configured
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        // Dynamic import to avoid requiring Redis if not installed
        let redis: any = null;
        try {
          redis = require('redis');
        } catch (importError) {
          console.log('Weather cache: Redis package not installed, using memory cache only');
          return;
        }

        if (!redis) {
          console.log('Weather cache: Redis package not available, using memory cache only');
          return;
        }

        const { createClient } = redis;
        this.redisClient = createClient({ url: redisUrl });

        this.redisClient.on('error', (err: any) => {
          console.warn('Redis connection error:', err.message);
          this.redisClient = null;
        });

        await this.redisClient.connect();
        console.log('Weather cache: Redis connected successfully');
      }
    } catch (error) {
      console.log('Weather cache: Redis not available, using memory cache only');
    }
  }

  /**
   * Generate cache key from location parameters
   */
  generateCacheKey(city?: string, state?: string, country?: string, lat?: number, lon?: number): string {
    if (city && state && country) {
      return `weather:city:${city.toLowerCase()}:${state.toLowerCase()}:${country.toLowerCase()}`;
    } else if (lat !== undefined && lon !== undefined) {
      return `weather:coords:${lat.toFixed(4)}:${lon.toFixed(4)}`;
    } else {
      return 'weather:ip';
    }
  }

  /**
   * Get cached weather data
   */
  async get(key: string): Promise<WeatherData | null> {
    try {
      // Try Redis first if available
      if (this.redisClient) {
        const redisData = await this.redisClient.get(key);
        if (redisData) {
          const entry: WeatherCacheEntry = JSON.parse(redisData);
          if (this.isExpired(entry)) {
            await this.delete(key);
            return null;
          }
          console.log(`Weather cache: Redis hit for key ${key}`);
          return entry.data;
        }
      }

      // Fall back to memory cache
      const entry = this.cache.get(key);
      if (entry && !this.isExpired(entry)) {
        console.log(`Weather cache: Memory hit for key ${key}`);
        return entry.data;
      }

      if (entry && this.isExpired(entry)) {
        this.cache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Weather cache: Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Set weather data in cache
   */
  async set(key: string, data: WeatherData, ttl?: number): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = now + (ttl || this.config.defaultTtl) * 1000;
      const entry: WeatherCacheEntry = {
        data,
        timestamp: now,
        expiresAt,
      };

      // Set in Redis if available
      if (this.redisClient) {
        await this.redisClient.setEx(key, ttl || this.config.defaultTtl, JSON.stringify(entry));
        console.log(`Weather cache: Redis set for key ${key}`);
      }

      // Set in memory cache
      this.cache.set(key, entry);

      // Enforce max size for memory cache
      if (this.cache.size > this.config.maxSize) {
        this.evictOldest();
      }

      console.log(`Weather cache: Memory set for key ${key}`);
    } catch (error) {
      console.error('Weather cache: Error setting cached data:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from Redis if available
      if (this.redisClient) {
        await this.redisClient.del(key);
      }

      // Delete from memory cache
      this.cache.delete(key);
      console.log(`Weather cache: Deleted key ${key}`);
    } catch (error) {
      console.error('Weather cache: Error deleting cached data:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis if available
      if (this.redisClient) {
        await this.redisClient.flushDb();
      }

      // Clear memory cache
      this.cache.clear();
      console.log('Weather cache: All data cleared');
    } catch (error) {
      console.error('Weather cache: Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    maxSize: number;
    redisAvailable: boolean;
    hitRate?: number;
  } {
    return {
      memoryEntries: this.cache.size,
      maxSize: this.config.maxSize,
      redisAvailable: !!this.redisClient,
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: WeatherCacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`Weather cache: Evicted oldest entry ${oldestKey}`);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Weather cache: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Stop cleanup timer and close Redis connection
   */
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('Weather cache: Redis connection closed');
      } catch (error) {
        console.error('Weather cache: Error closing Redis connection:', error);
      }
    }
  }

  /**
   * Get or set cache entry with automatic cache miss handling
   */
  async getOrSet(
    key: string,
    fetcher: () => Promise<WeatherData>,
    ttl?: number
  ): Promise<WeatherData> {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await this.set(key, data, ttl);

    return data;
  }
}

// Export singleton instance
export const weatherCache = new WeatherCache();
export default weatherCache;