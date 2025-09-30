/**
 * Weather API Service - WeatherAPI.com Integration
 * Fetches current weather data from WeatherAPI.com
 */

import { WeatherData } from '../types';

export interface WeatherApiResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface WeatherApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export class WeatherApiService {
  private config: WeatherApiConfig;

  constructor() {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey) {
      throw new Error('Weather API key not configured in environment variables');
    }

    this.config = {
      apiKey,
      baseUrl: 'https://api.weatherapi.com/v1',
      timeout: 15000, // 15 seconds
    };
  }

  /**
   * Get current weather by city name
   */
  async getCurrentWeather(city: string, state?: string, country?: string): Promise<WeatherApiResponse> {
    try {
      // Build location string
      let location = city;
      if (state && country) {
        location = `${city},${state},${country}`;
      } else if (country && country !== 'South Africa') {
        location = `${city},${country}`;
      }

      const url = this.buildApiUrl('current', {
        q: location,
        aqi: 'yes'
      });

      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle API error responses
      if (data.error) {
        throw new Error(`Weather API error: ${data.error.message}`);
      }

      // Transform response to our format
      const weatherData = this.transformWeatherResponse(data);

      return {
        success: true,
        data: weatherData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve weather data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current weather by coordinates
   */
  async getWeatherByCoordinates(latitude: number, longitude: number): Promise<WeatherApiResponse> {
    try {
      const url = this.buildApiUrl('current', {
        q: `${latitude},${longitude}`,
        aqi: 'yes'
      });

      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Weather API error: ${data.error.message}`);
      }

      const weatherData = this.transformWeatherResponse(data);

      return {
        success: true,
        data: weatherData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve weather data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current weather by IP address
   */
  async getWeatherByIP(): Promise<WeatherApiResponse> {
    try {
      const url = this.buildApiUrl('current', {
        q: 'auto:ip',
        aqi: 'yes'
      });

      const response = await this.makeRequest(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Weather API error: ${data.error.message}`);
      }

      const weatherData = this.transformWeatherResponse(data);

      return {
        success: true,
        data: weatherData,
        message: 'Weather data retrieved successfully',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve weather data',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Build API URL with parameters
   */
  private buildApiUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${this.config.baseUrl}/${endpoint}.json`);
    url.searchParams.set('key', this.config.apiKey);

    // Add all other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Transform WeatherAPI.com response to our WeatherData format
   */
  private transformWeatherResponse(apiResponse: any): WeatherData {
    return {
      location: {
        city: apiResponse.location.name,
        state: apiResponse.location.region,
        country: apiResponse.location.country,
        coordinates: {
          latitude: apiResponse.location.lat,
          longitude: apiResponse.location.lon,
        },
      },
      current: {
        temperature: apiResponse.current.temp_c,
        humidity: apiResponse.current.humidity,
        pressure: apiResponse.current.pressure_mb,
        wind_speed: apiResponse.current.wind_kph,
        wind_direction: apiResponse.current.wind_degree,
        weather_condition: apiResponse.current.condition.code.toString(),
        weather_description: apiResponse.current.condition.text,
        uv_index: apiResponse.current.uv,
        visibility: apiResponse.current.vis_km,
        cloud_cover: apiResponse.current.cloud,
        feels_like: apiResponse.current.feelslike_c,
        dew_point: apiResponse.current.dewpoint_c,
        precipitation_probability: Math.round(apiResponse.current.precip_mm * 100),
        air_quality_index: apiResponse.current.air_quality?.['us-epa-index'] || 0,
        air_quality_category: this.getAirQualityCategory(apiResponse.current.air_quality?.['us-epa-index'] || 0),
        timestamp: apiResponse.current.last_updated,
      },
    };
  }

  /**
   * Get air quality category from AQI index
   */
  private getAirQualityCategory(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }
}

// Create and export singleton instance
export const weatherApiService = new WeatherApiService();
export default weatherApiService;