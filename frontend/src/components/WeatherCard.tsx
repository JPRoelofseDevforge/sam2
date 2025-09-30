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
    <section className="weather-card-enhanced">
      {/* Header Section */}
      <div className="weather-header">
        <div className="weather-header-left">
          <div className="weather-indicator">
            <div className="indicator-pulse"></div>
            <div className="indicator-dot-enhanced"></div>
          </div>
          <div className="weather-title-section">
            <h2 className="weather-main-title">Environmental Health</h2>
            <p className="weather-subtitle">{city} • {formattedDate}</p>
          </div>
        </div>
        <div className="weather-status-badge">
          <span className="status-live">● LIVE</span>
          <span className="status-text">Real-time Data</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="weather-metrics-container">
        <div className="metrics-primary-grid">
          {/* Temperature - Featured Metric */}
          <div className="metric-featured metric-temperature">
            <div className="metric-icon-container">
              <span className="metric-icon-large">🌡️</span>
              <div className="metric-glow-effect"></div>
            </div>
            <div className="metric-content">
              <div className="metric-value-featured temp-value-enhanced">
                {airQuality?.temperature || '--'}
                <span className="metric-unit">°C</span>
              </div>
              <div className="metric-label-enhanced">Temperature</div>
              <div className="metric-trend">
                <span className="trend-indicator">↗</span>
                <span className="trend-text">Optimal Range</span>
              </div>
            </div>
          </div>

          {/* Air Quality - Featured Metric */}
          <div className="metric-featured metric-aqi">
            <div className="metric-icon-container">
              <span className="metric-icon-large">🌫️</span>
              <div className={`aqi-glow ${getAqiLevel(airQuality?.aqi || 0).class}`}></div>
            </div>
            <div className="metric-content">
              <div className={`metric-value-featured aqi-value-enhanced ${getAqiLevel(airQuality?.aqi || 0).class}`}>
                {airQuality?.aqi || '--'}
              </div>
              <div className="metric-label-enhanced">Air Quality Index</div>
              <div className="metric-badge">
                <span className={`aqi-badge ${getAqiLevel(airQuality?.aqi || 0).class}`}>
                  {getAqiLevel(airQuality?.aqi || 0).label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="metrics-secondary-grid">
          <div className="metric-secondary">
            <div className="metric-icon-small">💧</div>
            <div className="metric-info">
              <div className="metric-value-small humidity-value-enhanced">{airQuality?.humidity || '--'}%</div>
              <div className="metric-label-small">Humidity</div>
            </div>
            <div className="metric-bar">
              <div className="metric-progress humidity-progress" style={{width: `${airQuality?.humidity || 0}%`}}></div>
            </div>
          </div>

          <div className="metric-secondary">
            <div className="metric-icon-small">💨</div>
            <div className="metric-info">
              <div className="metric-value-small wind-value-enhanced">{airQuality?.windSpeed || '--'} km/h</div>
              <div className="metric-label-small">Wind Speed</div>
            </div>
            <div className="metric-bar">
              <div className="metric-progress wind-progress" style={{width: `${Math.min((airQuality?.windSpeed || 0) * 5, 100)}%`}}></div>
            </div>
          </div>

          <div className="metric-secondary">
            <div className="metric-icon-small">🔽</div>
            <div className="metric-info">
              <div className="metric-value-small pressure-value-enhanced">{airQuality?.pressure || '--'} hPa</div>
              <div className="metric-label-small">Pressure</div>
            </div>
            <div className="metric-bar">
              <div className="metric-progress pressure-progress" style={{width: `${Math.min((airQuality?.pressure || 0) / 10, 100)}%`}}></div>
            </div>
          </div>

          <div className="metric-secondary">
            <div className="metric-icon-small">
              {getWeatherIcon(airQuality?.weatherCondition)}
            </div>
            <div className="metric-info">
              <div className="metric-value-small condition-value-enhanced">
                {getWeatherDescription(airQuality?.weatherCondition)}
              </div>
              <div className="metric-label-small">Conditions</div>
            </div>
            <div className="metric-bar">
              <div className="metric-progress condition-progress"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="weather-footer">
        <div className="update-info">
          <span className="update-icon">⏱️</span>
          <span className="update-text">Last updated: {airQuality?.lastUpdated || '—'}</span>
        </div>
        <div className="refresh-info">
          <span className="refresh-badge">Auto-refresh: 5 min</span>
        </div>
      </div>
    </section>
  );
};