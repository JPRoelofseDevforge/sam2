import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { WeatherData, WeatherApiConfig, WeatherServiceResponse } from '../types';

export class WeatherService {
  private api: AxiosInstance;
  private config: WeatherApiConfig;
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.AIRVISUAL_API_KEY || '',
      baseUrl: 'https://api.airvisual.com/v2',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    };

    // Support for multiple API keys for rotation
    this.apiKeys = (process.env.AIRVISUAL_API_KEYS || this.config.apiKey)
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (this.apiKeys.length === 0) {
      throw new Error('No AirVisual API keys configured. Please set AIRVISUAL_API_KEY or AIRVISUAL_API_KEYS environment variable.');
    }

    this.api = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for API key rotation
    this.api.interceptors.request.use((config) => {
      const apiKey = this.getNextApiKey();
      config.params = {
        ...config.params,
        key: apiKey,
      };
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Weather API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the next API key for rotation
   */
  private getNextApiKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  /**
   * Get weather data by city and state
   */
  async getWeatherByCity(city: string, state: string, country: string = 'South Africa'): Promise<WeatherServiceResponse> {
    try {
      const response = await this.makeRequestWithRetry(
        `/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`
      );

      const transformedData = this.transformAirVisualData(response.data);
      return {
        success: true,
        data: transformedData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return this.handleError(error, 'Failed to retrieve weather data by city');
    }
  }

  /**
   * Get weather data by coordinates
   */
  async getWeatherByCoordinates(latitude: number, longitude: number): Promise<WeatherServiceResponse> {
    try {
      const response = await this.makeRequestWithRetry(
        `/nearest_city?lat=${latitude}&lon=${longitude}`
      );

      const transformedData = this.transformAirVisualData(response.data);
      return {
        success: true,
        data: transformedData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return this.handleError(error, 'Failed to retrieve weather data by coordinates');
    }
  }

  /**
   * Get weather data by IP address (nearest city)
   */
  async getWeatherByIP(): Promise<WeatherServiceResponse> {
    try {
      const response = await this.makeRequestWithRetry('/nearest_city');

      const transformedData = this.transformAirVisualData(response.data);
      return {
        success: true,
        data: transformedData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return this.handleError(error, 'Failed to retrieve weather data by IP');
    }
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequestWithRetry(url: string, attempt: number = 1): Promise<AxiosResponse> {
    try {
      return await this.api.get(url);
    } catch (error: any) {
      if (attempt < this.config.retryAttempts) {
        console.warn(`Weather API request failed (attempt ${attempt}), retrying in ${this.config.retryDelay}ms...`);
        await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        return this.makeRequestWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Transform AirVisual API response to our standardized format
   */
  private transformAirVisualData(apiData: any): WeatherData {
    const { data } = apiData;

    return {
      location: {
        city: data.city,
        state: data.state,
        country: data.country,
        coordinates: {
          latitude: data.location.coordinates[1],
          longitude: data.location.coordinates[0],
        },
      },
      current: {
        temperature: data.current.weather.tp,
        humidity: data.current.weather.hu,
        pressure: data.current.weather.pr,
        wind_speed: data.current.weather.ws,
        wind_direction: data.current.weather.wd,
        weather_condition: data.current.weather.ic,
        weather_description: this.getWeatherDescription(data.current.weather.ic),
        uv_index: data.current.weather.uv || 0,
        visibility: data.current.weather.vi || 10,
        cloud_cover: data.current.weather.cl || 0,
        feels_like: data.current.weather.tp, // AirVisual doesn't provide feels_like, using temperature
        dew_point: data.current.weather.dp || 0,
        precipitation_probability: 0, // AirVisual doesn't provide this
        air_quality_index: data.current.pollution?.aqius,
        air_quality_category: this.getAirQualityCategory(data.current.pollution?.aqius),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get human-readable weather description from AirVisual icon code
   */
  private getWeatherDescription(iconCode: string): string {
    const descriptions: { [key: string]: string } = {
      '01d': 'Clear sky',
      '01n': 'Clear sky',
      '02d': 'Few clouds',
      '02n': 'Few clouds',
      '03d': 'Scattered clouds',
      '03n': 'Scattered clouds',
      '04d': 'Broken clouds',
      '04n': 'Broken clouds',
      '09d': 'Shower rain',
      '09n': 'Shower rain',
      '10d': 'Rain',
      '10n': 'Rain',
      '11d': 'Thunderstorm',
      '11n': 'Thunderstorm',
      '13d': 'Snow',
      '13n': 'Snow',
      '50d': 'Mist',
      '50n': 'Mist',
    };

    return descriptions[iconCode] || 'Unknown';
  }

  /**
   * Get air quality category from AQI value
   */
  private getAirQualityCategory(aqi?: number): string {
    if (!aqi) return 'Unknown';

    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Handle and standardize error responses
   */
  private handleError(error: any, defaultMessage: string): WeatherServiceResponse {
    let errorMessage = defaultMessage;
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      const apiError = error.response.data;

      switch (statusCode) {
        case 400:
          errorMessage = 'Invalid request parameters';
          break;
        case 401:
          errorMessage = 'Invalid API key';
          break;
        case 403:
          errorMessage = 'API key quota exceeded or access denied';
          break;
        case 404:
          errorMessage = 'Location not found';
          break;
        case 429:
          errorMessage = 'API rate limit exceeded';
          break;
        case 500:
          errorMessage = 'Weather service internal error';
          break;
        default:
          errorMessage = apiError?.message || defaultMessage;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network connection error';
      statusCode = 503;
    }

    console.error(`Weather Service Error (${statusCode}):`, errorMessage);

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
   * Validate API key configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.apiKeys.length === 0) {
      errors.push('No API keys configured');
    }

    if (!this.config.baseUrl) {
      errors.push('Base URL not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;