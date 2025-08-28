import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator function
  handler?: (req: Request, res: Response, next: NextFunction) => void; // Custom handler for rate limit exceeded
  onLimitReached?: (req: Request, res: Response) => void; // Callback when limit is reached
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class WeatherRateLimiter {
  private config: RateLimitConfig;
  private requestCounts: Map<string, RateLimitEntry> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      ...config,
    };

    // Start cleanup timer to remove expired entries
    this.startCleanupTimer();
  }

  /**
   * Default key generator using IP address
   */
  private defaultKeyGenerator(req: Request): string {
    // Get client IP, considering proxy headers
    const clientIP = req.ip ||
                     req.connection.remoteAddress ||
                     (req as any).socket?.remoteAddress ||
                     req.headers['x-forwarded-for'] as string ||
                     req.headers['x-real-ip'] as string ||
                     'unknown';

    // Handle comma-separated IPs from x-forwarded-for
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
    return ip.split(',')[0].trim();
  }

  /**
   * Middleware function for Express
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.config.keyGenerator!(req);
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get or create rate limit entry
      let entry = this.requestCounts.get(key);
      if (!entry || entry.resetTime < now) {
        // Create new entry or reset expired entry
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
          firstRequest: now,
        };
        this.requestCounts.set(key, entry);
      }

      // Check if limit exceeded
      if (entry.count >= this.config.maxRequests) {
        // Set rate limit headers
        this.setRateLimitHeaders(res, entry, this.config.maxRequests);

        // Call custom handler or default
        if (this.config.handler) {
          this.config.handler(req, res, next);
        } else {
          this.defaultRateLimitHandler(req, res, next);
        }

        // Call onLimitReached callback
        if (this.config.onLimitReached) {
          this.config.onLimitReached(req, res);
        }

        return;
      }

      // Increment request count
      entry.count++;

      // Set rate limit headers
      this.setRateLimitHeaders(res, entry, this.config.maxRequests);

      // Add response interceptor to handle successful/failed requests
      const originalSend = res.send;
      res.send = (body: any) => {
        // Check if we should skip rate limiting for this response
        const shouldSkip = this.shouldSkipRateLimit(req, res);

        if (shouldSkip && entry) {
          // Decrement count if we're skipping
          entry.count = Math.max(0, entry.count - 1);
        }

        return originalSend.call(res, body);
      };

      next();
    };
  }

  /**
   * Set rate limit headers on response
   */
  private setRateLimitHeaders(res: Response, entry: RateLimitEntry, maxRequests: number): void {
    const now = Date.now();
    const remainingRequests = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil((entry.resetTime - now) / 1000); // seconds until reset

    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
      'X-RateLimit-Reset-After': resetTime.toString(),
      'Retry-After': resetTime.toString(),
    });
  }

  /**
   * Default rate limit exceeded handler
   */
  private defaultRateLimitHandler(req: Request, res: Response, next: NextFunction): void {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((this.requestCounts.get(this.config.keyGenerator!(req))?.resetTime || Date.now()) / 1000),
    });
  }

  /**
   * Check if rate limiting should be skipped for this request/response
   */
  private shouldSkipRateLimit(req: Request, res: Response): boolean {
    if (this.config.skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 300) {
      return true;
    }

    if (this.config.skipFailedRequests && res.statusCode >= 400) {
      return true;
    }

    return false;
  }

  /**
   * Get rate limit status for a key
   */
  getRateLimitStatus(key: string): RateLimitEntry | null {
    return this.requestCounts.get(key) || null;
  }

  /**
   * Reset rate limit for a specific key
   */
  resetRateLimit(key: string): void {
    this.requestCounts.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requestCounts.clear();
  }

  /**
   * Get statistics about current rate limiting
   */
  getStats(): {
    totalKeys: number;
    activeWindows: number;
    config: RateLimitConfig;
  } {
    const now = Date.now();
    let activeWindows = 0;

    for (const entry of this.requestCounts.values()) {
      if (entry.resetTime > now) {
        activeWindows++;
      }
    }

    return {
      totalKeys: this.requestCounts.size,
      activeWindows,
      config: this.config,
    };
  }

  /**
   * Start cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    // Clean up every minute
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.requestCounts.entries()) {
      if (entry.resetTime < now) {
        this.requestCounts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Weather rate limiter: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// Create weather-specific rate limiter instance
export const weatherRateLimiter = new WeatherRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes for weather endpoints
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Export middleware function
export const weatherRateLimitMiddleware = weatherRateLimiter.middleware();

// Export default
export default weatherRateLimiter;