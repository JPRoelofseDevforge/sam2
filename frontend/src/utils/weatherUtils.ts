// Weather utility functions
export const getAqiLevel = (aqi: number) => {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-100', class: 'aqi-good' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', class: 'aqi-fair' };
  if (aqi <= 150) return { label: 'Unhealthy (S)', color: 'text-orange-600', bg: 'bg-orange-100', class: 'aqi-poor' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-100', class: 'aqi-poor' };
  return { label: 'Hazardous', color: 'text-purple-600', bg: 'bg-purple-100', class: 'aqi-poor' };
};

export const getWeatherIcon = (condition: string | undefined): string => {
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

export const getWeatherDescription = (condition: string | undefined): string => {
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

export const getWeatherImpact = (temperature?: number, humidity?: number, windSpeed?: number): string[] => {
  const impacts = [];
  if (temperature && temperature > 30) impacts.push("Heat stress risk");
  if (temperature && temperature < 5) impacts.push("Cold stress risk");
  if (humidity && humidity > 80) impacts.push("High humidity impact");
  if (windSpeed && windSpeed > 10) impacts.push("High wind resistance");
  return impacts.length > 0 ? impacts : ["Optimal conditions"];
};

export const getWeatherRecommendations = (temperature?: number, humidity?: number, windSpeed?: number): string[] => {
  const recommendations = [];
  if (temperature && temperature > 30) recommendations.push("Increase hydration, consider electrolyte supplementation");
  if (temperature && temperature < 5) recommendations.push("Extended warm-up, layer clothing appropriately");
  if (humidity && humidity > 80) recommendations.push("Monitor hydration closely, expect reduced evaporative cooling");
  if (windSpeed && windSpeed > 10) recommendations.push("Adjust pacing strategy, expect increased energy expenditure");
  if (temperature && temperature >= 20 && temperature <= 25) recommendations.push("Optimal performance conditions");
  return recommendations.length > 0 ? recommendations : ["Standard training protocols apply"];
};

export const getWeatherAlert = (temperature?: number, humidity?: number, windSpeed?: number, aqi?: number) => {
  if (aqi && aqi > 150) return { type: 'high', message: 'Poor air quality - increased respiratory stress risk' };
  if (temperature && temperature > 35) return { type: 'high', message: 'Extreme heat - heat illness risk' };
  if (temperature && temperature < 0) return { type: 'high', message: 'Extreme cold - hypothermia risk' };
  if (windSpeed && windSpeed > 15) return { type: 'medium', message: 'Strong winds - increased injury risk' };
  if (humidity && humidity > 90) return { type: 'medium', message: 'Very high humidity - heat dissipation impaired' };
  if (aqi && aqi > 100) return { type: 'medium', message: 'Moderate air quality - some respiratory sensitivity' };
  return { type: 'low', message: 'Weather conditions are favorable for training' };
};