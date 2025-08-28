import { Router, Request, Response, NextFunction } from 'express';
import weatherService from '../../services/weatherService';
import weatherCache from '../../services/weatherCache';
import { weatherRateLimitMiddleware } from '../../middleware/rateLimiter';
import { WeatherServiceResponse, ApiResponse } from '../../types';

const router = Router();

// Apply rate limiting to all weather routes
router.use(weatherRateLimitMiddleware);

// Custom validation functions
const validateCityWeatherParams = (req: Request, res: Response, next: NextFunction) => {
  const { city } = req.query;
  const errors: string[] = [];

  if (!city || typeof city !== 'string' || city.length < 1 || city.length > 100) {
    errors.push('City name is required and must be 1-100 characters');
  }

  const { state } = req.query;
  if (state && (typeof state !== 'string' || state.length < 1 || state.length > 100)) {
    errors.push('State must be 1-100 characters');
  }

  const { country } = req.query;
  if (country && (typeof country !== 'string' || country.length < 1 || country.length > 100)) {
    errors.push('Country must be 1-100 characters');
  }

  if (errors.length > 0) {
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: 'Invalid request parameters',
    };

    if (process.env.NODE_ENV !== 'production') {
      (errorResponse as any).validationErrors = errors;
    }

    return res.status(400).json(errorResponse);
  }

  next();
};

const validateCoordinatesParams = (req: Request, res: Response, next: NextFunction) => {
  const { lat, lon } = req.query;
  const errors: string[] = [];

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push('Latitude must be a number between -90 and 90');
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push('Longitude must be a number between -180 and 180');
  }

  if (errors.length > 0) {
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: 'Invalid request parameters',
    };

    if (process.env.NODE_ENV !== 'production') {
      (errorResponse as any).validationErrors = errors;
    }

    return res.status(400).json(errorResponse);
  }

  next();
};

// Error handling middleware for weather routes
const weatherErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Weather API Error:', error);

  const errorResponse: ApiResponse<null> = {
    success: false,
    error: 'Weather service error',
    message: 'An error occurred while processing your weather request',
  };

  // Add more specific error information in development
  if (process.env.NODE_ENV !== 'production') {
    (errorResponse as any).details = error.message;
    (errorResponse as any).stack = error.stack;
  }

  res.status(500).json(errorResponse);
};

// =====================================================
// WEATHER ENDPOINTS
// =====================================================

// GET /api/weather/current - Get current weather by city
router.get('/current', validateCityWeatherParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { city, state = 'South Africa', country = 'South Africa' } = req.query as {
        city: string;
        state?: string;
        country?: string;
      };

      // Generate cache key
      const cacheKey = weatherCache.generateCacheKey(city, state, country);

      // Try to get from cache first
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        const response: WeatherServiceResponse = {
          success: true,
          data: cachedData,
          message: 'Weather data retrieved from cache',
          cached: true,
          timestamp: new Date().toISOString(),
        };
        return res.json(response);
      }

      // Fetch fresh data
      const result = await weatherService.getWeatherByCity(city, state, country);

      if (result.success && result.data) {
        // Cache the result for 15 minutes
        await weatherCache.set(cacheKey, result.data, 15 * 60);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/weather/coordinates - Get current weather by coordinates
router.get('/coordinates', validateCoordinatesParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lon } = req.query as { lat: string; lon: string };
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // Generate cache key
      const cacheKey = weatherCache.generateCacheKey(undefined, undefined, undefined, latitude, longitude);

      // Try to get from cache first
      const cachedData = await weatherCache.get(cacheKey);
      if (cachedData) {
        const response: WeatherServiceResponse = {
          success: true,
          data: cachedData,
          message: 'Weather data retrieved from cache',
          cached: true,
          timestamp: new Date().toISOString(),
        };
        return res.json(response);
      }

      // Fetch fresh data
      const result = await weatherService.getWeatherByCoordinates(latitude, longitude);

      if (result.success && result.data) {
        // Cache the result for 15 minutes
        await weatherCache.set(cacheKey, result.data, 15 * 60);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/weather/ip - Get current weather by IP address
router.get('/ip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate cache key
    const cacheKey = weatherCache.generateCacheKey();

    // Try to get from cache first
    const cachedData = await weatherCache.get(cacheKey);
    if (cachedData) {
      const response: WeatherServiceResponse = {
        success: true,
        data: cachedData,
        message: 'Weather data retrieved from cache',
        cached: true,
        timestamp: new Date().toISOString(),
      };
      return res.json(response);
    }

    // Fetch fresh data
    const result = await weatherService.getWeatherByIP();

    if (result.success && result.data) {
      // Cache the result for 15 minutes
      await weatherCache.set(cacheKey, result.data, 15 * 60);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/weather/cache/stats - Get cache statistics (development only)
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Cache statistics are only available in development mode',
      });
    }

    const stats = weatherCache.getStats();
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/weather/cache/clear - Clear weather cache (admin only)
router.post('/cache/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you would check for admin authentication here
    // For now, we'll just clear the cache
    await weatherCache.clear();

    res.json({
      success: true,
      message: 'Weather cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/weather/health - Weather service health check
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceHealth = weatherService.validateConfiguration();
    const cacheStats = weatherCache.getStats();

    res.json({
      success: true,
      data: {
        service: {
          status: serviceHealth.valid ? 'healthy' : 'unhealthy',
          errors: serviceHealth.errors,
        },
        cache: {
          status: 'healthy',
          ...cacheStats,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'Weather service health check completed',
    });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware
router.use(weatherErrorHandler);

export default router;