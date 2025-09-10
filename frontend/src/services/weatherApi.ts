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
  private testMode: boolean = false;
  private testScenario: string = 'normal';

  constructor(config?: Partial<WeatherApiConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5288/api',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config,
    };
  }

  /**
   * Enable test mode for simulating API failures
   */
  setTestMode(enabled: boolean, scenario: string = 'normal'): void {
    this.testMode = enabled;
    this.testScenario = scenario;
    // console.log(`Weather API Test Mode: ${enabled ? 'ENABLED' : 'DISABLED'} - Scenario: ${scenario}`);
  }

  /**
   * Simulate different test scenarios for debugging
   */
  private simulateTestScenario(scenario: string): WeatherApiResponse {
    // console.log(`Simulating test scenario: ${scenario}`);

    switch (scenario) {
      case 'network-error':
        // Simulate network connectivity failure
        return {
          success: false,
          error: 'Network Error: Unable to connect to weather service',
          message: 'Weather data retrieval failed',
          timestamp: new Date().toISOString(),
        };

      case 'timeout':
        // Simulate API timeout
        return {
          success: false,
          error: 'Request timeout: Weather service took too long to respond',
          message: 'Weather data retrieval failed',
          timestamp: new Date().toISOString(),
        };

      case 'invalid-response':
        // Simulate invalid/malformed response
        return {
          success: false,
          error: 'Invalid response format from weather service',
          message: 'Weather data retrieval failed',
          timestamp: new Date().toISOString(),
        };

      case 'server-error':
        // Simulate server error (5xx)
        return {
          success: false,
          error: 'Server Error: Weather service is temporarily unavailable (500)',
          message: 'Weather data retrieval failed',
          timestamp: new Date().toISOString(),
        };

      default:
        // Normal operation - should not reach here in test mode
        return {
          success: false,
          error: 'Test mode enabled but no valid scenario selected',
          message: 'Weather data retrieval failed',
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * Get current weather data by city
   */
  async getCurrentWeather(city: string, state?: string, country?: string): Promise<WeatherApiResponse> {
    // Handle test scenarios for debugging
    if (this.testMode) {
      return this.simulateTestScenario(this.testScenario);
    }

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

      // Get response text first for validation and debugging
      const responseText = await response.text();

      // Validate Content-Type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // console.error(`Weather API returned non-JSON content. Content-Type: ${contentType}`);
        // console.error(`Raw response: ${responseText.substring(0, 500)}...`);
        throw new Error(`Weather API returned non-JSON content. Content-Type: ${contentType}, Status: ${response.status}`);
      }

      // Check if response body is empty
      if (!responseText || responseText.trim().length === 0) {
        // console.error('Weather API returned empty response body');
        throw new Error(`Weather API returned empty response body. Status: ${response.status}`);
      }

      // Log raw response for debugging (first 200 chars)
      // console.log(`Weather API raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      let data: WeatherServiceResponse;
      try {
        data = JSON.parse(responseText) as WeatherServiceResponse;
      } catch (parseError) {
        // console.error(`JSON parsing failed. Raw response: ${responseText}`);
        throw new Error(`Invalid JSON response from weather API. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}, Status: ${response.status}`);
      }

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

      // Get response text first for validation and debugging
      const responseText = await response.text();

      // Validate Content-Type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // console.error(`Weather API returned non-JSON content. Content-Type: ${contentType}`);
        // console.error(`Raw response: ${responseText.substring(0, 500)}...`);
        throw new Error(`Weather API returned non-JSON content. Content-Type: ${contentType}, Status: ${response.status}`);
      }

      // Check if response body is empty
      if (!responseText || responseText.trim().length === 0) {
        // console.error('Weather API returned empty response body');
        throw new Error(`Weather API returned empty response body. Status: ${response.status}`);
      }

      // Log raw response for debugging (first 200 chars)
      // console.log(`Weather API raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      let data: WeatherServiceResponse;
      try {
        data = JSON.parse(responseText) as WeatherServiceResponse;
      } catch (parseError) {
        // console.error(`JSON parsing failed. Raw response: ${responseText}`);
        throw new Error(`Invalid JSON response from weather API. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}, Status: ${response.status}`);
      }

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

      // Get response text first for validation and debugging
      const responseText = await response.text();

      // Validate Content-Type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // console.error(`Weather API returned non-JSON content. Content-Type: ${contentType}`);
        // console.error(`Raw response: ${responseText.substring(0, 500)}...`);
        throw new Error(`Weather API returned non-JSON content. Content-Type: ${contentType}, Status: ${response.status}`);
      }

      // Check if response body is empty
      if (!responseText || responseText.trim().length === 0) {
        // console.error('Weather API returned empty response body');
        throw new Error(`Weather API returned empty response body. Status: ${response.status}`);
      }

      // Log raw response for debugging (first 200 chars)
      // console.log(`Weather API raw response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      let data: WeatherServiceResponse;
      try {
        data = JSON.parse(responseText) as WeatherServiceResponse;
      } catch (parseError) {
        // console.error(`JSON parsing failed. Raw response: ${responseText}`);
        throw new Error(`Invalid JSON response from weather API. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}, Status: ${response.status}`);
      }

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
        // console.warn(`Weather API request failed (attempt ${attempt}), retrying in ${this.config.retryDelay}ms...`);
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

    // console.error(`Weather API Error:`, errorMessage);

    const errorResponse: WeatherApiResponse = {
      success: false,
      error: errorMessage,
      message: 'Weather data retrieval failed',
      timestamp: new Date().toISOString(),
    };

    return errorResponse;
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