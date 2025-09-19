import { useState, useEffect } from 'react';
import weatherApiService from '../services/weatherApi';

interface AirQualityData {
  temperature: number;
  humidity: number;
  aqi: number;
  co: number;
  pm25: number;
  pm10: number;
  windSpeed: number;
  pressure: number;
  weatherCondition: string;
  lastUpdated: string;
}

interface UseWeatherDataResult {
  airQuality: AirQualityData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// 🔧 CONFIG: Location settings for weather API
const CITY = import.meta.env.VITE_CITY || 'Pretoria';
const STATE = import.meta.env.VITE_STATE || 'Gauteng';
const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

export const useWeatherData = (refreshInterval: number = 300000): UseWeatherDataResult => {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await weatherApiService.getCurrentWeather(CITY, STATE, COUNTRY);

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || 'Failed to fetch air quality data');
      }

      const backendData = response.data;

      // Map backend response to component's expected format
      setAirQuality({
        temperature: backendData.current?.temperature || 0,
        humidity: backendData.current?.humidity || 0,
        aqi: backendData.current?.air_quality_index || 0,
        co: 0, // Backend doesn't provide CO data
        pm25: 0, // Backend doesn't provide PM2.5 data
        pm10: 0, // Backend doesn't provide PM10 data
        windSpeed: backendData.current?.wind_speed || 0,
        pressure: backendData.current?.pressure || 0,
        weatherCondition: backendData.current?.weather_condition || 'Unknown',
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      // Set default/placeholder data instead of showing error
      setAirQuality({
        temperature: 22,
        humidity: 60,
        aqi: 25,
        co: 0,
        pm25: 0,
        pm10: 0,
        windSpeed: 5,
        pressure: 1013,
        weatherCondition: 'Partly Cloudy',
        lastUpdated: new Date().toLocaleTimeString(),
      });
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    airQuality,
    loading,
    error,
    refetch: fetchWeatherData,
  };
};