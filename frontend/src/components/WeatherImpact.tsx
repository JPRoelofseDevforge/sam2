import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Eye, Zap, Activity, Target, Clock, RefreshCw, Dna, Shield, Heart, Brain, Eye as EyeIcon } from 'lucide-react';
import weatherApiService from '../services/weatherApi';
import { getAqiLevel } from '../utils/weatherUtils';

interface WeatherImpactProps {
  athleteId: string;
  geneticData: any[];
}

interface WeatherData {
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
  uvIndex?: number;
  visibility?: number;
  dewPoint?: number;
}

interface PerformanceImpact {
  score: number;
  category: 'optimal' | 'good' | 'moderate' | 'challenging' | 'dangerous';
  factors: string[];
  recommendations: string[];
}

interface GeneticImpact {
  gene: string;
  genotype: string;
  impact: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  icon: React.ReactNode;
  category: 'power' | 'endurance' | 'recovery' | 'metabolism' | 'stress';
}

export const WeatherImpact: React.FC<WeatherImpactProps> = ({ athleteId, geneticData }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'genetics' | 'performance' | 'forecast'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 🔧 CONFIG: Location settings for weather API
  const CITY = import.meta.env.VITE_CITY || 'Stellenbosch';
  const STATE = import.meta.env.VITE_STATE || 'Western Cape';
  const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

  // Fetch comprehensive weather data from backend API
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);

        const response = await weatherApiService.getCurrentWeather(CITY, STATE, COUNTRY);

        if (!response.success || !response.data) {
          throw new Error(response.error || response.message || 'Failed to fetch weather data');
        }

        const backendData = response.data;

        // Map backend response to component's expected format
        setWeatherData({
          temperature: backendData.current.temperature,
          humidity: backendData.current.humidity,
          aqi: backendData.current.air_quality_index || 0,
          co: 0, // Backend doesn't provide CO data
          pm25: 0, // Backend doesn't provide PM2.5 data
          pm10: 0, // Backend doesn't provide PM10 data
          windSpeed: backendData.current.wind_speed,
          pressure: backendData.current.pressure,
          weatherCondition: backendData.current.weather_condition,
          lastUpdated: new Date().toLocaleTimeString(),
          uvIndex: backendData.current.uv_index,
          visibility: backendData.current.visibility,
          dewPoint: backendData.current.dew_point,
        });
        setLastRefresh(new Date());
      } catch (err: any) {
        console.error('Weather API Error:', err);
        setWeatherData(null); // Set to null on error to handle gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [CITY, STATE, COUNTRY]);

  // Utility functions
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

  // Enhanced genetic analysis with comprehensive factors
  const analyzeGeneticImpacts = useMemo((): GeneticImpact[] => {
    if (!geneticData || !weatherData) return [];

    const impacts: GeneticImpact[] = [];
    const { temperature, humidity, windSpeed, aqi, uvIndex } = weatherData;

    // ACTN3 - Power and sprint performance in heat
    const actn3Genotype = geneticData.find(g => g.gene === 'ACTN3')?.genotype;
    if (actn3Genotype && temperature && temperature > 28) {
      if (actn3Genotype === 'XX') {
        impacts.push({
          gene: 'ACTN3',
          genotype: actn3Genotype,
          impact: 'Reduced power output in heat',
          severity: 'high',
          recommendation: 'Focus on endurance work, avoid high-intensity efforts',
          icon: <Zap className="w-5 h-5" />,
          category: 'power'
        });
      } else if (actn3Genotype === 'RR') {
        impacts.push({
          gene: 'ACTN3',
          genotype: actn3Genotype,
          impact: 'Better heat tolerance for power activities',
          severity: 'low',
          recommendation: 'Can maintain power training in moderate heat',
          icon: <Zap className="w-5 h-5" />,
          category: 'power'
        });
      }
    }

    // ADRB2 - Sweat response and thermoregulation
    const adrb2Genotype = geneticData.find(g => g.gene === 'ADRB2')?.genotype;
    if (adrb2Genotype && humidity && humidity > 70) {
      if (adrb2Genotype === 'Gly16Gly') {
        impacts.push({
          gene: 'ADRB2',
          genotype: adrb2Genotype,
          impact: 'Reduced sweat efficiency in high humidity',
          severity: 'medium',
          recommendation: 'Monitor hydration closely, use cooling strategies',
          icon: <Droplets className="w-5 h-5" />,
          category: 'recovery'
        });
      }
    }

    // CFTR - Dehydration and electrolyte balance
    const cftrGenotype = geneticData.find(g => g.gene === 'CFTR')?.genotype;
    if (cftrGenotype && temperature && temperature > 25) {
      if (cftrGenotype.includes('del')) {
        impacts.push({
          gene: 'CFTR',
          genotype: cftrGenotype,
          impact: 'Increased dehydration risk in heat',
          severity: 'high',
          recommendation: 'Aggressive hydration protocol, electrolyte monitoring',
          icon: <Shield className="w-5 h-5" />,
          category: 'recovery'
        });
      }
    }

    // PPARGC1A - Mitochondrial efficiency and cold adaptation
    const ppargc1aGenotype = geneticData.find(g => g.gene === 'PPARGC1A')?.genotype;
    if (ppargc1aGenotype && temperature && temperature < 10) {
      if (ppargc1aGenotype.includes('Ser')) {
        impacts.push({
          gene: 'PPARGC1A',
          genotype: ppargc1aGenotype,
          impact: 'Better cold adaptation and fat metabolism',
          severity: 'low',
          recommendation: 'Can train effectively in cold conditions',
          icon: <Heart className="w-5 h-5" />,
          category: 'metabolism'
        });
      }
    }

    // ACE - Cardiovascular response to heat
    const aceGenotype = geneticData.find(g => g.gene === 'ACE')?.genotype;
    if (aceGenotype && temperature && temperature > 30) {
      if (aceGenotype === 'DD') {
        impacts.push({
          gene: 'ACE',
          genotype: aceGenotype,
          impact: 'Higher heat stress risk due to vascular response',
          severity: 'medium',
          recommendation: 'Monitor blood pressure, avoid extreme heat exposure',
          icon: <Activity className="w-5 h-5" />,
          category: 'stress'
        });
      }
    }

    // NOS3 - Nitric oxide production and blood flow
    const nos3Genotype = geneticData.find(g => g.gene === 'NOS3')?.genotype;
    if (nos3Genotype && aqi && aqi > 100) {
      if (nos3Genotype === 'TT') {
        impacts.push({
          gene: 'NOS3',
          genotype: nos3Genotype,
          impact: 'Reduced blood vessel dilation in poor air quality',
          severity: 'medium',
          recommendation: 'Consider indoor training during high pollution',
          icon: <Brain className="w-5 h-5" />,
          category: 'endurance'
        });
      }
    }

    // COL5A1 - Injury risk in high winds
    const col5a1Genotype = geneticData.find(g => g.gene === 'COL5A1')?.genotype;
    if (col5a1Genotype && windSpeed && windSpeed > 15) {
      if (col5a1Genotype === 'CC') {
        impacts.push({
          gene: 'COL5A1',
          genotype: col5a1Genotype,
          impact: 'Increased soft tissue injury risk in windy conditions',
          severity: 'medium',
          recommendation: 'Focus on stability work, use wind protection',
          icon: <Shield className="w-5 h-5" />,
          category: 'recovery'
        });
      }
    }

    // HFE - Iron metabolism in UV exposure
    const hfeGenotype = geneticData.find(g => g.gene === 'HFE')?.genotype;
    if (hfeGenotype && uvIndex && uvIndex > 7) {
      if (hfeGenotype.includes('C282Y')) {
        impacts.push({
          gene: 'HFE',
          genotype: hfeGenotype,
          impact: 'Iron absorption affected by UV exposure',
          severity: 'low',
          recommendation: 'Monitor iron levels, consider sun protection',
          icon: <EyeIcon className="w-5 h-5" />,
          category: 'metabolism'
        });
      }
    }

    return impacts;
  }, [geneticData, weatherData]);

  // Performance impact calculation
  const calculatePerformanceImpact = useMemo((): PerformanceImpact => {
    if (!weatherData) {
      return {
        score: 50,
        category: 'moderate',
        factors: [],
        recommendations: []
      };
    }

    const { temperature, humidity, windSpeed, aqi } = weatherData;
    let score = 100;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Temperature impact
    if (temperature && temperature > 35) {
      score -= 40;
      factors.push('Extreme heat reduces performance by ~15-25%');
      recommendations.push('Consider indoor training or early morning sessions');
    } else if (temperature && temperature > 30) {
      score -= 25;
      factors.push('High heat impacts endurance and power output');
      recommendations.push('Increase hydration, use cooling strategies');
    } else if (temperature && temperature < 5) {
      score -= 20;
      factors.push('Cold weather reduces muscle performance');
      recommendations.push('Extended warm-up, appropriate layering');
    } else if (temperature && temperature >= 15 && temperature <= 25) {
      score += 10;
      factors.push('Optimal temperature range for performance');
    }

    // Humidity impact
    if (humidity && humidity > 85) {
      score -= 20;
      factors.push('High humidity impairs heat dissipation');
      recommendations.push('Monitor core temperature, use fans');
    } else if (humidity && humidity < 30) {
      score -= 10;
      factors.push('Low humidity increases respiratory stress');
      recommendations.push('Stay well hydrated');
    }

    // Wind impact
    if (windSpeed && windSpeed > 15) {
      score -= 15;
      factors.push('Strong winds affect pacing and energy expenditure');
      recommendations.push('Adjust pacing strategy, consider protected routes');
    }

    // Air quality impact
    if (aqi && aqi > 150) {
      score -= 30;
      factors.push('Poor air quality reduces lung function');
      recommendations.push('Consider indoor training, use air filtration');
    } else if (aqi && aqi > 100) {
      score -= 15;
      factors.push('Moderate air pollution affects respiratory performance');
      recommendations.push('Monitor breathing rate, consider masks');
    }

    // Genetic factors
    analyzeGeneticImpacts.forEach(impact => {
      if (impact.severity === 'high') score -= 15;
      else if (impact.severity === 'medium') score -= 8;
    });

    score = Math.max(0, Math.min(100, score));

    let category: PerformanceImpact['category'];
    if (score >= 80) category = 'optimal';
    else if (score >= 65) category = 'good';
    else if (score >= 45) category = 'moderate';
    else if (score >= 25) category = 'challenging';
    else category = 'dangerous';

    return { score, category, factors, recommendations };
  }, [weatherData, analyzeGeneticImpacts]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white-900">🌤️ Weather Impact Analysis</h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-enhanced p-4">
              <div className="h-16 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        <div className="card-enhanced p-6">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Component renders even when weatherData is null, showing placeholder content

  const performanceImpact = calculatePerformanceImpact;
  const geneticImpacts = analyzeGeneticImpacts;

  return (
    <div className="weather-impact-container">
      {/* Enhanced Header */}
      <div className="weather-impact-header">
        <div className="header-left">
          <div className="weather-indicator-enhanced">
            <div className="indicator-pulse-enhanced"></div>
            <div className="indicator-dot-enhanced"></div>
          </div>
          <div className="header-content">
            <h2 className="weather-impact-title">Weather Impact Analysis</h2>
            <p className="weather-impact-subtitle">Genetic × Environmental Performance Factors</p>
          </div>
        </div>
        <div className="header-status">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
          <div className="update-time">
            <Clock className="w-4 h-4" />
            <span>Updated {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Performance Impact Overview */}
      <div className="performance-overview-card">
        <div className="performance-header">
          <h3 className="performance-title">Performance Impact Score</h3>
          <div className={`performance-badge ${performanceImpact.category}`}>
            {performanceImpact.category.toUpperCase()}
          </div>
        </div>

        <div className="performance-content">
          <div className="performance-gauge">
            <div className="gauge-container">
              <svg className="performance-gauge-svg" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="gauge-background"
                />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${3.14 * performanceImpact.score} 314`}
                  className={`gauge-progress ${performanceImpact.category}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="gauge-value">
                <span className="gauge-number">{performanceImpact.score}</span>
                <span className="gauge-percent">%</span>
              </div>
            </div>
          </div>

          <div className="performance-factors">
            <div className="factors-list">
              {performanceImpact.factors?.slice(0, 3).map((factor, index) => (
                <div key={index} className="factor-item">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="factor-text">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="weather-tabs-container">
        <div className="weather-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: '📊', color: 'blue' },
            { id: 'genetics', label: 'Genetics', icon: '🧬', color: 'purple' },
            { id: 'performance', label: 'Performance', icon: '⚡', color: 'green' }
            
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`weather-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && <div className={`tab-indicator ${tab.color}`}></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="weather-tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Weather Conditions Cards */}
            <div className="conditions-grid">
              <div className="condition-card primary">
                <div className="condition-icon">
                  {weatherData ? getWeatherIcon(weatherData.weatherCondition) : '❓'}
                </div>
                <div className="condition-info">
                  <div className="condition-name">
                    {weatherData ? getWeatherDescription(weatherData.weatherCondition) : 'Weather Unavailable'}
                  </div>
                  <div className="condition-label">Current Conditions</div>
                </div>
              </div>

              <div className="condition-card">
                <Thermometer className="w-6 h-6 text-orange-500" />
                <div className="condition-info">
                  <div className="condition-value temp-value-enhanced">
                    {weatherData ? `${weatherData.temperature}°C` : '--°C'}
                  </div>
                  <div className="condition-label">Temperature</div>
                </div>
                <div className="condition-trend">
                  {weatherData && weatherData.temperature > 25 ? <TrendingUp className="w-4 h-4 text-red-500" /> :
                   weatherData && weatherData.temperature < 15 ? <TrendingDown className="w-4 h-4 text-blue-500" /> :
                   <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </div>

              <div className="condition-card">
                <Droplets className="w-6 h-6 text-blue-500" />
                <div className="condition-info">
                  <div className="condition-value humidity-value-enhanced">
                    {weatherData ? `${weatherData.humidity}%` : '--%'}
                  </div>
                  <div className="condition-label">Humidity</div>
                </div>
                <div className="condition-bar">
                  <div className="condition-progress humidity-progress"
                       style={{width: `${weatherData ? weatherData.humidity : 0}%`}}></div>
                </div>
              </div>

              <div className="condition-card">
                <Wind className="w-6 h-6 text-gray-500" />
                <div className="condition-info">
                  <div className="condition-value wind-value-enhanced">
                    {weatherData ? `${weatherData.windSpeed} km/h` : '-- km/h'}
                  </div>
                  <div className="condition-label">Wind Speed</div>
                </div>
                <div className="wind-intensity">
                  {weatherData && weatherData.windSpeed < 5 ? 'Calm' :
                   weatherData && weatherData.windSpeed < 15 ? 'Light' :
                   weatherData && weatherData.windSpeed < 25 ? 'Moderate' : 'Strong'}
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="secondary-metrics">
              <div className="metric-secondary">
                <div className="metric-header">
                  <h4 className="metric-title">Air Quality</h4>
                  <div className={`aqi-badge ${getAqiLevel(weatherData?.aqi || 0).class}`}>
                    {getAqiLevel(weatherData?.aqi || 0).label}
                  </div>
                </div>
                <div className="metric-value-large aqi-value-enhanced">
                  {weatherData ? weatherData.aqi : '--'}
                </div>
                <div className="metric-subtitle">AQI Index</div>
              </div>

              <div className="metric-secondary">
                <div className="metric-header">
                  <h4 className="metric-title">UV Index</h4>
                  <div className={`uv-badge ${
                    weatherData && (weatherData.uvIndex || 0) <= 2 ? 'low' :
                    weatherData && (weatherData.uvIndex || 0) <= 5 ? 'moderate' :
                    weatherData && (weatherData.uvIndex || 0) <= 7 ? 'high' : 'extreme'
                  }`}>
                    {weatherData && (weatherData.uvIndex || 0) <= 2 ? 'Low' :
                     weatherData && (weatherData.uvIndex || 0) <= 5 ? 'Moderate' :
                     weatherData && (weatherData.uvIndex || 0) <= 7 ? 'High' : 'Extreme'}
                  </div>
                </div>
                <div className="metric-value-large">
                  {weatherData ? (weatherData.uvIndex || 0) : '--'}
                </div>
                <div className="metric-subtitle">UV Index</div>
              </div>

              <div className="metric-secondary">
                <div className="metric-header">
                  <h4 className="metric-title">Visibility</h4>
                  <Eye className="w-5 h-5 text-gray-600" />
                </div>
                <div className="metric-value-large">
                  {weatherData ? `${weatherData.visibility || 10} km` : '-- km'}
                </div>
                <div className="metric-subtitle">Visibility Range</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'genetics' && (
          <div className="genetics-tab">
            <div className="genetics-header">
              <Dna className="w-8 h-8 text-purple-500" />
              <h3 className="genetics-title">Genetic Impact Analysis</h3>
              <p className="genetics-subtitle">Weather-responsive genetic factors</p>
            </div>

            {geneticImpacts.length > 0 ? (
              <div className="genetic-impacts-grid">
                {geneticImpacts.map((impact, index) => (
                  <div key={index} className={`genetic-impact-card ${impact.category}`}>
                    <div className="impact-header">
                      <div className="impact-icon-container">
                        {impact.icon}
                      </div>
                      <div className="impact-gene-info">
                        <h4 className="impact-gene">{impact.gene}</h4>
                        <p className="impact-genotype">Genotype: {impact.genotype}</p>
                      </div>
                      <div className={`impact-severity ${impact.severity}`}>
                        {impact.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="impact-content">
                      <p className="impact-description">{impact.impact}</p>
                      <div className="impact-recommendation">
                        <Target className="w-4 h-4" />
                        <span>{impact.recommendation}</span>
                      </div>
                    </div>
                    <div className={`impact-category-badge ${impact.category}`}>
                      {impact.category}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-genetic-impacts">
                <Dna className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="no-impacts-title">No Genetic Impacts Detected</h4>
                <p className="no-impacts-text">Current weather conditions don't trigger any significant genetic responses for this athlete.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-tab">
            <div className="performance-recommendations">
              <div className="recommendations-section">
                <h3 className="section-title">Training Recommendations</h3>
                <div className="recommendations-grid">
                  <div className="recommendation-card">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h4 className="rec-title">Recommended Actions</h4>
                    <ul className="rec-list">
                      {performanceImpact.recommendations?.map((rec, index) => (
                        <li key={index} className="rec-item">{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="recommendation-card">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h4 className="rec-title">Avoid These</h4>
                    <ul className="rec-list">
                      <li className="rec-item">Ignore hydration needs</li>
                      <li className="rec-item">Push through extreme discomfort</li>
                      <li className="rec-item">Train without monitoring vital signs</li>
                      <li className="rec-item">Skip warm-up in cold conditions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="training-intensity-section">
                <h3 className="section-title">Training Intensity Guide</h3>
                <div className="intensity-cards">
                  <div className="intensity-card">
                    <div className="intensity-icon">🏃‍♂️</div>
                    <div className="intensity-info">
                      <div className="intensity-name">Cardiovascular</div>
                      <div className="intensity-level">
                        {performanceImpact.score > 70 ? 'High intensity OK' :
                         performanceImpact.score > 50 ? 'Moderate intensity' : 'Low intensity only'}
                      </div>
                    </div>
                  </div>

                  <div className="intensity-card">
                    <div className="intensity-icon">💪</div>
                    <div className="intensity-info">
                      <div className="intensity-name">Strength Training</div>
                      <div className="intensity-level">
                        {performanceImpact.score > 60 ? 'Full strength work' : 'Light weights only'}
                      </div>
                    </div>
                  </div>

                  <div className="intensity-card">
                    <div className="intensity-icon">🎯</div>
                    <div className="intensity-info">
                      <div className="intensity-name">Skill Work</div>
                      <div className="intensity-level">
                        {performanceImpact.score > 40 ? 'Technical training OK' : 'Focus on recovery'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="forecast-tab">
            <div className="forecast-placeholder">
              <div className="forecast-icon">🔮</div>
              <h3 className="forecast-title">Advanced Weather Forecasting</h3>
              <p className="forecast-description">5-day weather predictions and trend analysis</p>
              <div className="forecast-features">
                <div className="forecast-feature">
                  <span className="feature-icon">📈</span>
                  <span className="feature-text">Performance trend analysis</span>
                </div>
                <div className="forecast-feature">
                  <span className="feature-icon">🎯</span>
                  <span className="feature-text">Optimal training windows</span>
                </div>
                <div className="forecast-feature">
                  <span className="feature-icon">⚠️</span>
                  <span className="feature-text">Weather risk alerts</span>
                </div>
              </div>
              <div className="forecast-coming-soon">
                Coming Soon - Q2 2024
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};