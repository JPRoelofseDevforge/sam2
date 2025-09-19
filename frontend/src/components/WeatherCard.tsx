import React from 'react';
import { getAqiLevel, getWeatherIcon, getWeatherDescription } from '../utils/weatherUtils';

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

interface WeatherCardProps {
  airQuality: AirQualityData | null;
  city: string;
  formattedDate: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ airQuality, city, formattedDate }) => {
  return (
    <section className="environment-card">
      <div className="card-header">
        <div className="indicator-dot"></div>
        <h2 className="card-title">
          Environmental Health • {city} • {formattedDate}
        </h2>
      </div>

      <div className="metrics-grid">
        <div className="metric-item metric-item-temp">
          <div className="metric-icon">🌡️</div>
          <div className="metric-value temp-value">{airQuality?.temperature}°C</div>
          <div className="metric-label">Temp</div>
        </div>

        <div className="metric-item metric-item-humidity">
          <div className="metric-icon">💧</div>
          <div className="metric-value humidity-value">{airQuality?.humidity}%</div>
          <div className="metric-label">Humidity</div>
        </div>

        <div className="metric-item metric-item-aqi">
          <div className="metric-icon">🌫️</div>
          <div className={`metric-value aqi-value ${getAqiLevel(airQuality?.aqi || 0).class}`}>
            {airQuality?.aqi}
          </div>
          <div className="metric-label">
            AQI • {getAqiLevel(airQuality?.aqi || 0).label}
          </div>
        </div>

        <div className="metric-item metric-item-wind">
          <div className="metric-icon">💨</div>
          <div className="metric-value wind-value">{airQuality?.windSpeed} m/s</div>
          <div className="metric-label">Wind</div>
        </div>

        <div className="metric-item metric-item-pressure">
          <div className="metric-icon">🔽</div>
          <div className="metric-value pressure-value">{airQuality?.pressure} hPa</div>
          <div className="metric-label">Pressure</div>
        </div>

        <div className="metric-item metric-item-condition">
          <div className="metric-icon">
            {getWeatherIcon(airQuality?.weatherCondition)}
          </div>
          <div className="metric-value condition-value">
            {getWeatherDescription(airQuality?.weatherCondition)}
          </div>
          <div className="metric-label">Condition</div>
        </div>
      </div>

      <div className="last-updated">
        ⏱️ Updated: {airQuality?.lastUpdated || '—'} • Every 5 min
      </div>
    </section>
  );
};