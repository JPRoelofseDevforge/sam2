import { WeatherData, WeatherServiceResponse, ApiResponse } from '../types';

export interface WeatherApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface WeatherApiResponse extends ApiResponse<WeatherData> {
  cached?: boolean;
  timestamp?: string;
}

export class WeatherApiService {
  private config: WeatherApiConfig;

  constructor(config?: Partial<WeatherApiConfig>) {
    this.config = {
      baseUrl: '/api',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config,
    };
  }

  /**
   * Get current weather data by city
   */
  async getCurrentWeather(city: string, state?: string, country?: string): Promise<WeatherApiResponse> {
    try {
      const params = new URLSearchParams({
        city,
        ...(state && { state }),
        ...(country && { country }),
      });

      const response = await this.makeRequestWithRetry(
        `${this.config.baseUrl}/weather/current?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WeatherServiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch weather data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        cached: data.cached,
        timestamp: data.timestamp,
      };
    } catch (error: unknown) {
      return this.handleError(error, 'Failed to retrieve current weather data');
    }
  }

  /**
   * Get current weather data by coordinates
   */
  async getWeatherByCoordinates(latitude: number, longitude: number): Promise<WeatherApiResponse> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
      });

      const response = await this.makeRequestWithRetry(
        `${this.config.baseUrl}/weather/coordinates?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WeatherServiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch weather data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        cached: data.cached,
        timestamp: data.timestamp,
      };
    } catch (error: unknown) {
      return this.handleError(error, 'Failed to retrieve weather data by coordinates');
    }
  }

  /**
   * Get current weather data by IP address
   */
  async getWeatherByIP(): Promise<WeatherApiResponse> {
    try {
      const response = await this.makeRequestWithRetry(
        `${this.config.baseUrl}/weather/ip`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WeatherServiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch weather data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        cached: data.cached,
        timestamp: data.timestamp,
      };
    } catch (error: unknown) {
      return this.handleError(error, 'Failed to retrieve weather data by IP');
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetry(url: string, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      const err = error as Error;
      if (attempt < this.config.retryAttempts && err.name !== 'AbortError') {
        console.warn(`Weather API request failed (attempt ${attempt}), retrying in ${this.config.retryDelay}ms...`);
        await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        return this.makeRequestWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle and standardize error responses
   */
  private handleError(error: unknown, defaultMessage: string): WeatherApiResponse {
    let errorMessage = defaultMessage;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    console.error(`Weather API Error:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      message: 'Weather data retrieval failed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate service configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseUrl) {
      errors.push('Base URL not configured');
    }

    if (this.config.timeout <= 0) {
      errors.push('Timeout must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const weatherApiService = new WeatherApiService();
export default weatherApiService;