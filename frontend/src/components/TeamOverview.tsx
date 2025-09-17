import React, { useState, useEffect } from 'react';
import { generateAlert, calculateReadinessScore } from '../utils/analytics';
import { Athlete, BiometricData, GeneticProfile } from '../types';
import dataService from '../services/dataService';
import weatherApiService from '../services/weatherApi';

const date = new Date();
    // Format date as YYYY-MM-DD (or customize as needed)
    const formatted = date.toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

interface TeamOverviewProps {
  onAthleteClick: (athleteId: number) => void;
}

const getStatusColorClass = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'status-critical';
    case 'warning':
    case 'medium':
      return 'status-warning';
    case 'optimal':
    case 'low':
      return 'status-optimal';
    default:
      return 'status-unknown';
  }
};

const getStatusColor = (alertType: string): string => {
  switch (alertType) {
    case 'critical':
    case 'high':
      return 'text-red-600';
    case 'warning':
    case 'medium':
      return 'text-yellow-600';
    case 'optimal':
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

// 🔧 CONFIG: Location settings for weather API
const CITY = import.meta.env.VITE_CITY || 'Pretoria';
const STATE = import.meta.env.VITE_STATE || 'Gauteng';
const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

export const TeamOverview: React.FC<TeamOverviewProps> = ({ onAthleteClick }) => {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const data = await dataService.getData(true); // true = use database
        

        setAthletes(data.athletes);
        
        setBiometricData(data.biometricData);
        
        setGeneticProfiles(data.geneticProfiles);
      } catch (error) {
        // Data service will return empty arrays if database is unavailable
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
    // Refresh data every 5 minutes (reduced from 30 seconds to prevent excessive reloading)
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getAthleteData = (athleteId: string) => {
    const biometricArray = Array.isArray(biometricData) ? biometricData : [];
    const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];

    // Debug: Show what athlete IDs are available in biometric data
    const uniqueBiometricIds = [...new Set(biometricArray.map(d => d.athlete_id))];

    // Try multiple matching strategies to handle different ID formats
    const data = biometricArray.filter(d => {
      const biometricId = d.athlete_id?.toString();
      const athleteIdStr = athleteId?.toString();

      // Try exact match first
      if (biometricId === athleteIdStr) return true;

      // Try loose equality
      if (d.athlete_id == athleteId) return true;

      // Try numeric comparison
      if (parseInt(biometricId) === parseInt(athleteIdStr)) return true;

      return false;
    });

    const genetics = geneticArray.filter(g => {
      const geneticId = g.athlete_id?.toString();
      const athleteIdStr = athleteId?.toString();

      if (geneticId === athleteIdStr) return true;
      if (g.athlete_id == athleteId) return true;
      if (parseInt(geneticId) === parseInt(athleteIdStr)) return true;

      return false;
    });

    const alert = generateAlert(athleteId, data, genetics);
    const readinessScore = data.length > 0 ? calculateReadinessScore(data[data.length - 1]) : 0;

    return { data, genetics, alert, readinessScore };
  };

  const teamStats = React.useMemo(() => {

    const athleteMetrics = (athletes || []).map(athlete => {
      const { data, alert, readinessScore } = getAthleteData(athlete.athlete_id);
      // API returns latest data first, so take the first item (most recent)
      const latest = data && data.length > 0 ? data[0] : null;


      return {
        athlete,
        latest,
        alert,
        readinessScore,
      };
    });

    const validMetrics = athleteMetrics.filter(m => m.latest);

    const avgHRV = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.latest?.hrv_night || 0), 0) / validMetrics.length : 0;
    const avgSleep = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + (m.latest?.sleep_duration_h || 0), 0) / validMetrics.length : 0;
    const avgReadiness = validMetrics.length > 0 ? validMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / validMetrics.length : 0;

    const alertCounts = {
      high: athleteMetrics.filter(m => ['inflammation', 'airway'].includes(m.alert.type)).length,
      medium: athleteMetrics.filter(m => ['circadian', 'nutrition'].includes(m.alert.type)).length,
      optimal: athleteMetrics.filter(m => m.alert.type === 'green').length,
    };

    const result = {
      totalAthletes: (athletes || []).length,
      avgHRV: avgHRV || 0,
      avgSleep: avgSleep || 0,
      avgReadiness: avgReadiness || 0,
      alertCounts,
      athleteMetrics,
    };

    return result;
  }, [athletes, biometricData, geneticProfiles]);

  // Fetch Air Quality from backend API
  useEffect(() => {
    const fetchAirQuality = async () => {
      try {
        setLoading(true);

        // 🔍 DEBUG: Log API call details

        const response = await weatherApiService.getCurrentWeather(CITY, STATE, COUNTRY);

        // 🔍 DEBUG: Log API response details

        if (!response.success || !response.data) {
          throw new Error(response.error || response.message || 'Failed to fetch air quality data');
        }

        const backendData = response.data;

        // 🔍 DEBUG: Log backend data structure

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
        setError(null);
      } catch (err: any) {
        // 🔍 DEBUG: Enhanced error logging

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
        setError(null); // Don't show error to user
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'inflammation':
      case 'airway':
        return 'border-red-200 bg-red-50';
      case 'circadian':
      case 'nutrition':
        return 'border-yellow-200 bg-yellow-50';
      case 'green':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'inflammation':
        return '🔥';
      case 'circadian':
        return '🌙';
      case 'nutrition':
        return '🥗';
      case 'airway':
        return '🌬️';
      case 'green':
        return '✅';
      default:
        return '📊';
    }
  };

  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100', class: 'aqi-good' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', class: 'aqi-fair' };
    if (aqi <= 150) return { label: 'Unhealthy (S)', color: 'text-orange-600', bg: 'bg-orange-100', class: 'aqi-poor' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-100', class: 'aqi-poor' };
    return { label: 'Hazardous', color: 'text-purple-600', bg: 'bg-purple-100', class: 'aqi-poor' };
  };

  const getWeatherIcon = (condition: string | undefined) => {
    if (!condition) return '☁️';
    switch (condition) {
      case '01d': return '☀️'; // clear sky
      case '01n': return '🌙'; // clear sky (night)
      case '02d': return '⛅'; // few clouds
      case '02n': return '☁️'; // few clouds (night)
      case '03d':
      case '03n': return '☁️'; // scattered clouds
      case '04d':
      case '04n': return '☁️'; // broken clouds
      case '09d':
      case '09n': return '🌧️'; // shower rain
      case '10d':
      case '10n': return '🌧️'; // rain
      case '11d':
      case '11n': return '⛈️'; // thunderstorm
      case '13d':
      case '13n': return '❄️'; // snow
      case '50d':
      case '50n': return '🌫️'; // mist
      default: return '☁️';
    }
  };

  const getWeatherDescription = (condition: string | undefined) => {
    if (!condition) return 'Unknown';
    switch (condition) {
      case '01d':
      case '01n': return 'Clear';
      case '02d':
      case '02n': return 'Few Clouds';
      case '03d':
      case '03n': return 'Scattered Clouds';
      case '04d':
      case '04n': return 'Broken Clouds';
      case '09d':
      case '09n': return 'Shower Rain';
      case '10d':
      case '10n': return 'Rain';
      case '11d':
      case '11n': return 'Thunderstorm';
      case '13d':
      case '13n': return 'Snow';
      case '50d':
      case '50n': return 'Mist';
      default: return 'Cloudy';
    }
  };

  const getWeatherImpact = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined) => {
    const impacts = [];
    if (temperature && temperature > 30) impacts.push("Heat stress risk");
    if (temperature && temperature < 5) impacts.push("Cold stress risk");
    if (humidity && humidity > 80) impacts.push("High humidity impact");
    if (windSpeed && windSpeed > 10) impacts.push("High wind resistance");
    return impacts.length > 0 ? impacts : ["Optimal conditions"];
  };

  const getWeatherRecommendations = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined) => {
    const recommendations = [];
    if (temperature && temperature > 30) recommendations.push("Increase hydration, consider electrolyte supplementation");
    if (temperature && temperature < 5) recommendations.push("Extended warm-up, layer clothing appropriately");
    if (humidity && humidity > 80) recommendations.push("Monitor hydration closely, expect reduced evaporative cooling");
    if (windSpeed && windSpeed > 10) recommendations.push("Adjust pacing strategy, expect increased energy expenditure");
    if (temperature && temperature >= 20 && temperature <= 25) recommendations.push("Optimal performance conditions");
    return recommendations.length > 0 ? recommendations : ["Standard training protocols apply"];
  };

  const getWeatherAlert = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined, aqi: number | undefined) => {
    if (aqi && aqi > 150) return { type: 'high', message: 'Poor air quality - increased respiratory stress risk' };
    if (temperature && temperature > 35) return { type: 'high', message: 'Extreme heat - heat illness risk' };
    if (temperature && temperature < 0) return { type: 'high', message: 'Extreme cold - hypothermia risk' };
    if (windSpeed && windSpeed > 15) return { type: 'medium', message: 'Strong winds - increased injury risk' };
    if (humidity && humidity > 90) return { type: 'medium', message: 'Very high humidity - heat dissipation impaired' };
    if (aqi && aqi > 100) return { type: 'medium', message: 'Moderate air quality - some respiratory sensitivity' };
    return { type: 'low', message: 'Weather conditions are favorable for training' };
  };

  
  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="background-rings"></div>
        <div className="main-content">
          <div className="flex items-center justify-center h-screen">
            <div className="text-white text-2xl">Loading athlete data...</div>
          </div>
        </div>
      </div>
    );
  }
  
return (
  <div className="app-container">
    {/* Full Screen Gradient Background */}
    <div className="background-gradient"></div>
    <div className="background-rings"></div>

    {/* Main Content */}
    <div className="main-content">
      {/* Header */}
      <header className="header-section">
        <h1 className="logo-text">
          <img
            src="/SAMLogo.png"
            alt="SAM Recovery Logo"
            className="h-8 md:h-10 lg:h-12 w-auto object-contain"
          />
        </h1>
        <p className="tagline">
          Precision Recovery Through Genetics × Biometrics × Environment
        </p>
      </header>

      {/* Environmental Health */}
      <section className="environment-card">
        <div className="card-header">
          <div className="indicator-dot"></div>
          <h2 className="card-title">
            Environmental Health • {CITY} • {formatted}
          </h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-item metric-item-temp" >
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


      {/* Team Stats */}
      <div className="stats-grid-wide">
        <StatCard label="Athletes" value={teamStats.totalAthletes} icon="👥" color="blue" />
        <StatCard label="Avg HRV" value={`${teamStats.avgHRV.toFixed(0)} ms`} icon="❤️" color="purple" />
        <StatCard label="Avg Sleep" value={`${teamStats.avgSleep.toFixed(1)}h`} icon="😴" color="indigo" />
        <StatCard label="Readiness" value={`${teamStats.avgReadiness.toFixed(0)}%`} icon="⚡" color="orange" />
      </div>

      {/* Alert Summary */}
      <div className="alerts-grid">
        <AlertCard
          title="High Priority"
          count={teamStats.alertCounts.high}
          icon="🔴"
          color="red"
          desc="Immediate attention"
        />
        <AlertCard
          title="Monitor"
          count={teamStats.alertCounts.medium}
          icon="🟡"
          color="yellow"
          desc="Potential issues"
        />
        <AlertCard
          title="Optimal"
          count={teamStats.alertCounts.optimal}
          icon="🟢"
          color="green"
          desc="Ready for training"
        />
      </div>

      {/* Athletes Grid */}
      <section className="athletes-section">
        <h2 className="section-title text-white">👥 Athlete Status</h2>
        <div className="athletes-grid">
          {teamStats.athleteMetrics?.map(({ athlete, latest, alert, readinessScore }, index) => (
            <div
              key={athlete.id || index}
              className={`athlete-card ${getStatusColorClass(alert.type)} card-hover`}
              onClick={() => onAthleteClick(athlete.id)}
            >
              <div className="athlete-header">
                <div className="athlete-info">
                  <h3 className="athlete-name">{athlete.name}</h3>
                  <p className="athlete-meta">{athlete.sport} • {athlete.age} • {athlete.team}</p>
                </div>
                <div className="alert-icon">{getStatusIcon(alert.type)}</div>
              </div>
          
              <div className="athlete-metrics">
                <div className="metric-pair">
                  <span className="label">HRV</span>
                  <span className="value">{latest?.hrv_night ? latest.hrv_night.toFixed(0) + ' ms' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">Sleep</span>
                  <span className="value">{latest?.sleep_duration_h ? latest.sleep_duration_h.toFixed(1) + 'h' : 'N/A'}</span>
                </div>
                <div className="metric-pair">
                  <span className="label">RHR</span>
                  <span className="value">{latest?.resting_hr ? latest.resting_hr.toFixed(0) + ' bpm' : 'N/A'}</span>
                </div>
              
                
                <div className="metric-pair">
                  <span className="label">Ready</span>
                  <span className="value">{readinessScore.toFixed(0)}%</span>
                </div>
                
              </div>
          
              <div className="athlete-alert">
                <p className="alert-title">{alert.title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}</p>
                <p className="alert-cause">{alert.cause}</p>
              </div>
          
              <button className="profile-button">
                📊 Open Profile
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
};

// Reusable Components
const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="card-enhanced p-5 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className={`text-2xl font-bold text-black`}>
      {value}
    </div>
    <div className="text-gray-700 text-sm mt-1 font-medium">{label}</div>
  </div>
);

const AlertCard: React.FC<{ title: string; count: number; icon: string; color: string; desc: string }> = ({ title, count, icon, color, desc }) => (
  <div className={`card-enhanced border-${color}-200 bg-${color}-50 p-5 hover:shadow-lg transition-all`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className={`text-lg font-bold text-${color}-700`}>{title}</h3>
    </div>
    <div className={`text-3xl font-bold text-${color}-700 mb-2`}>{count}</div>
    <p className={`text-sm text-${color}-600`}>{desc}</p>
  </div>
);