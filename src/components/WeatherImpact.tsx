import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Eye, Zap, Activity, Target, Clock, RefreshCw } from 'lucide-react';

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
}

export const WeatherImpact: React.FC<WeatherImpactProps> = ({ athleteId, geneticData }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'genetics' | 'performance' | 'forecast'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 🔧 CONFIG: Replace with your actual location and IQAir API key
  const IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY || 'f8e6fb6c-6ec0-4064-a46b-a173e4137718';
  const CITY = import.meta.env.VITE_CITY || 'Pretoria';
  const STATE = import.meta.env.VITE_STATE || 'Gauteng';
  const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

  // Fetch comprehensive weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const url = new URL('https://api.airvisual.com/v2/city');
        url.searchParams.append('city', CITY);
        url.searchParams.append('state', STATE);
        url.searchParams.append('country', COUNTRY);
        url.searchParams.append('key', IQAIR_API_KEY);

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const json = await res.json();
        const current = json.data.current;

        setWeatherData({
          temperature: current.weather.tp,
          humidity: current.weather.hu,
          aqi: current.pollution.aqius,
          co: current.pollution.co,
          pm25: current.pollution.pm25,
          pm10: current.pollution.pm10,
          windSpeed: current.weather.ws,
          pressure: current.weather.pr,
          weatherCondition: current.weather.ic,
          lastUpdated: new Date().toLocaleTimeString(),
          uvIndex: Math.floor(Math.random() * 11), // Mock UV data
          visibility: Math.floor(Math.random() * 20) + 5, // Mock visibility
          dewPoint: current.weather.tp - (100 - current.weather.hu) / 5, // Calculate dew point
        });
        setError(null);
        setLastRefresh(new Date());
      } catch (err: any) {
        console.error('Weather API Error:', err);
        setError(err.message || 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

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

  // Advanced genetic analysis
  const analyzeGeneticImpacts = useMemo((): GeneticImpact[] => {
    if (!geneticData || !weatherData) return [];

    const impacts: GeneticImpact[] = [];
    const { temperature, humidity, windSpeed } = weatherData;

    // ACTN3 - Power and endurance in heat
    const actn3Genotype = geneticData.find(g => g.gene === 'ACTN3')?.genotype;
    if (actn3Genotype) {
      if (temperature && temperature > 28) {
        if (actn3Genotype === 'XX') {
          impacts.push({
            gene: 'ACTN3',
            genotype: actn3Genotype,
            impact: 'Reduced power output in heat',
            severity: 'high',
            recommendation: 'Focus on endurance work, avoid high-intensity efforts'
          });
        } else if (actn3Genotype === 'RR') {
          impacts.push({
            gene: 'ACTN3',
            genotype: actn3Genotype,
            impact: 'Better heat tolerance for power activities',
            severity: 'low',
            recommendation: 'Can maintain power training in moderate heat'
          });
        }
      }
    }

    // ADRB2 - Sweat response in humidity
    const adrb2Genotype = geneticData.find(g => g.gene === 'ADRB2')?.genotype;
    if (adrb2Genotype && humidity && humidity > 70) {
      if (adrb2Genotype === 'Gly16Gly') {
        impacts.push({
          gene: 'ADRB2',
          genotype: adrb2Genotype,
          impact: 'Reduced sweat efficiency in high humidity',
          severity: 'medium',
          recommendation: 'Monitor hydration closely, use cooling strategies'
        });
      }
    }

    // CFTR - Dehydration risk
    const cftrGenotype = geneticData.find(g => g.gene === 'CFTR')?.genotype;
    if (cftrGenotype && temperature && temperature > 25) {
      if (cftrGenotype.includes('del')) {
        impacts.push({
          gene: 'CFTR',
          genotype: cftrGenotype,
          impact: 'Increased dehydration risk in heat',
          severity: 'high',
          recommendation: 'Aggressive hydration protocol, electrolyte monitoring'
        });
      }
    }

    // PPARGC1A - Mitochondrial efficiency
    const ppargc1aGenotype = geneticData.find(g => g.gene === 'PPARGC1A')?.genotype;
    if (ppargc1aGenotype && temperature && temperature < 10) {
      if (ppargc1aGenotype.includes('Ser')) {
        impacts.push({
          gene: 'PPARGC1A',
          genotype: ppargc1aGenotype,
          impact: 'Better cold adaptation',
          severity: 'low',
          recommendation: 'Can train effectively in cold conditions'
        });
      }
    }

    // ACE - Blood pressure regulation
    const aceGenotype = geneticData.find(g => g.gene === 'ACE')?.genotype;
    if (aceGenotype && temperature && temperature > 30) {
      if (aceGenotype === 'DD') {
        impacts.push({
          gene: 'ACE',
          genotype: aceGenotype,
          impact: 'Higher heat stress risk',
          severity: 'medium',
          recommendation: 'Monitor blood pressure, avoid extreme heat exposure'
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
          <h2 className="text-2xl font-bold text-gray-900">🌤️ Weather Impact Analysis</h2>
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

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">🌤️ Weather Impact Analysis</h2>
        <div className="card-enhanced p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Weather Data Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  const performanceImpact = calculatePerformanceImpact;
  const geneticImpacts = analyzeGeneticImpacts;

  return (
    <div className="space-y-6">
      {/* Header with refresh indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">🌤️ Weather Impact Analysis</h2>
        <div className="flex items-center space-x-2 text-gray-600 text-sm">
          <Clock className="w-4 h-4" />
          <span>Updated {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Performance Score Card */}
      <div className="card-enhanced p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Performance Impact Score</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            performanceImpact.category === 'optimal' ? 'bg-green-100 text-green-800' :
            performanceImpact.category === 'good' ? 'bg-blue-100 text-blue-800' :
            performanceImpact.category === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
            performanceImpact.category === 'challenging' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {performanceImpact.category.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-700"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2.51 * performanceImpact.score} 251`}
                className={`transition-all duration-1000 ${
                  performanceImpact.category === 'optimal' ? 'text-green-500' :
                  performanceImpact.category === 'good' ? 'text-blue-500' :
                  performanceImpact.category === 'moderate' ? 'text-yellow-500' :
                  performanceImpact.category === 'challenging' ? 'text-orange-500' :
                  'text-red-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{performanceImpact.score}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="space-y-2">
              {performanceImpact.factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-300">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'genetics', label: 'Genetics', icon: '🧬' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
            { id: 'forecast', label: 'Forecast', icon: '🔮' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Current Conditions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-enhanced p-4 text-center">
                <div className="text-4xl mb-2">{getWeatherIcon(weatherData.weatherCondition)}</div>
                <div className="text-lg font-semibold text-gray-900">{getWeatherDescription(weatherData.weatherCondition)}</div>
                <div className="text-gray-600 text-sm">Condition</div>
              </div>

              <div className="card-enhanced p-4 text-center">
                <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{weatherData.temperature}°C</div>
                <div className="text-gray-600 text-sm">Temperature</div>
                <div className="flex items-center justify-center mt-1">
                  {weatherData.temperature > 25 ? <TrendingUp className="w-4 h-4 text-red-500" /> :
                   weatherData.temperature < 15 ? <TrendingDown className="w-4 h-4 text-blue-500" /> :
                   <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </div>

              <div className="card-enhanced p-4 text-center">
                <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{weatherData.humidity}%</div>
                <div className="text-gray-600 text-sm">Humidity</div>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${weatherData.humidity}%` }}
                  ></div>
                </div>
              </div>

              <div className="card-enhanced p-4 text-center">
                <Wind className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{weatherData.windSpeed}</div>
                <div className="text-gray-600 text-sm">km/h Wind</div>
                <div className="text-xs text-gray-500 mt-1">
                  {weatherData.windSpeed < 5 ? 'Calm' :
                   weatherData.windSpeed < 15 ? 'Light' :
                   weatherData.windSpeed < 25 ? 'Moderate' : 'Strong'}
                </div>
              </div>
            </div>

            {/* Air Quality and Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-enhanced p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Air Quality</h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    weatherData.aqi <= 50 ? 'bg-green-100 text-green-800' :
                    weatherData.aqi <= 100 ? 'bg-yellow-100 text-yellow-800' :
                    weatherData.aqi <= 150 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {weatherData.aqi <= 50 ? 'Good' :
                     weatherData.aqi <= 100 ? 'Moderate' :
                     weatherData.aqi <= 150 ? 'Unhealthy' : 'Hazardous'}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{weatherData.aqi}</div>
                <div className="text-sm text-gray-600">AQI Index</div>
              </div>

              <div className="card-enhanced p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">UV Index</h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    (weatherData.uvIndex || 0) <= 2 ? 'bg-green-100 text-green-800' :
                    (weatherData.uvIndex || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' :
                    (weatherData.uvIndex || 0) <= 7 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(weatherData.uvIndex || 0) <= 2 ? 'Low' :
                     (weatherData.uvIndex || 0) <= 5 ? 'Moderate' :
                     (weatherData.uvIndex || 0) <= 7 ? 'High' : 'Very High'}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{weatherData.uvIndex || 0}</div>
                <div className="text-sm text-gray-600">UV Index</div>
              </div>

              <div className="card-enhanced p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Visibility</h4>
                  <Eye className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{weatherData.visibility || 10}</div>
                <div className="text-sm text-gray-600">km Visibility</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'genetics' && (
          <div className="space-y-4">
            <div className="card-enhanced p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Genetic Impact Analysis</h3>
              {geneticImpacts.length > 0 ? (
                <div className="space-y-4">
                  {geneticImpacts.map((impact, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-blue-600">{impact.gene}</h4>
                          <p className="text-sm text-gray-600">Genotype: {impact.genotype}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          impact.severity === 'high' ? 'bg-red-100 text-red-800' :
                          impact.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {impact.severity.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{impact.impact}</p>
                      <p className="text-sm text-blue-600">{impact.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🧬</div>
                  <p className="text-gray-600">No significant genetic impacts detected for current conditions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="card-enhanced p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Do's</h4>
                  <ul className="space-y-2">
                    {performanceImpact.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Don'ts</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Ignore hydration needs</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Push through extreme discomfort</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Train without monitoring vital signs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Training Intensity Recommendations */}
            <div className="card-enhanced p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommended Training Intensity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-300 rounded-lg">
                  <div className="text-2xl mb-2">🏃‍♂️</div>
                  <div className="font-semibold text-gray-900">Cardio</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {performanceImpact.score > 70 ? 'High intensity OK' :
                     performanceImpact.score > 50 ? 'Moderate intensity' : 'Low intensity only'}
                  </div>
                </div>
                <div className="text-center p-4 border border-gray-300 rounded-lg">
                  <div className="text-2xl mb-2">💪</div>
                  <div className="font-semibold text-gray-900">Strength</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {performanceImpact.score > 60 ? 'Full strength work' : 'Light weights only'}
                  </div>
                </div>
                <div className="text-center p-4 border border-gray-300 rounded-lg">
                  <div className="text-2xl mb-2">⚽</div>
                  <div className="font-semibold text-gray-900">Skill Work</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {performanceImpact.score > 40 ? 'Technical training OK' : 'Focus on recovery'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="card-enhanced p-6 text-center">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Weather Forecasting</h3>
              <p className="text-gray-600">Advanced forecasting features coming soon</p>
              <p className="text-sm text-gray-500 mt-2">This will include 5-day forecasts and weather trend analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};