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

// ---------- Genetics normalization (robust across shapes) ----------
type GeneDict = Record<string, string>;

const normalizeGenetics = (data: any[]): GeneDict => {
 const dict: GeneDict = {};
 if (!Array.isArray(data)) return dict;

 for (const item of data) {
   // Simple shape
   const simpleGene = item?.gene ?? item?.Gene ?? item?.rsid ?? item?.RSID;
   const simpleGeno = item?.genotype ?? item?.Genotype ?? item?.value ?? item?.Value;
   if (simpleGene && simpleGeno) {
     dict[String(simpleGene).toUpperCase()] = String(simpleGeno);
   }

   // Nested "Genes" field (string or array/object)
   let genesField = item?.Genes ?? item?.genes;
   if (typeof genesField === 'string') {
     try {
       genesField = JSON.parse(genesField);
     } catch {
       // ignore invalid JSON
     }
   }
   if (Array.isArray(genesField)) {
     for (const g of genesField) {
       const k = g?.gene ?? g?.Gene ?? g?.rsid ?? g?.RSID ?? g?.Key ?? g?.key;
       const v = g?.genotype ?? g?.Genotype ?? g?.Value ?? g?.value;
       if (k && v) {
         dict[String(k).toUpperCase()] = String(v);
       }
     }
   } else if (genesField && typeof genesField === 'object') {
     for (const [k, v] of Object.entries(genesField)) {
       if (!String(k).startsWith('$') && v != null) {
         dict[String(k).toUpperCase()] = String(v as any);
       }
     }
   }
 }
 return dict;
};

// ---------- Environmental indices and helpers ----------
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const cToF = (c: number) => (c * 9) / 5 + 32;
const fToC = (f: number) => ((f - 32) * 5) / 9;

// Magnus formula dewpoint from T/RH
const dewPointFromTempRH = (tC: number, rh: number) => {
  const a = 17.625;
  const b = 243.04;
  const alpha = Math.log(rh / 100) + (a * tC) / (b + tC);
  return (b * alpha) / (a - alpha);
};

// Heat Index (Steadman) in °C
const heatIndexC = (tC: number, rh: number) => {
  const T = cToF(tC);
  const R = rh;
  const HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  return fToC(HI);
};

// Humidex approximation (°C)
const humidex = (tC: number, rh: number) => {
  const td = dewPointFromTempRH(tC, rh);
  const e = 6.11 * Math.exp(5417.7530 * ((1 / 273.16) - 1 / (td + 273.15)));
  return tC + (5 / 9) * (e - 10);
};

// Wind chill (°C), valid when t <= 10C and wind > 4.8 km/h
const windChillC = (tC: number, windKph: number) => {
  if (tC > 10 || windKph <= 4.8) return tC;
  const v = Math.pow(windKph, 0.16);
  return 13.12 + 0.6215 * tC - 11.37 * v + 0.3965 * tC * v;
};

// WBGT shade approximation (°C): Stull (2011) approximation
const wbgtApproxC = (tC: number, rh: number) => {
  const es = 6.105 * Math.exp((17.27 * tC) / (237.7 + tC));
  const e = es * (rh / 100);
  return 0.567 * tC + 0.393 * e + 3.94; // shade estimate
};

const envRiskCategory = (score: number): { label: 'low' | 'moderate' | 'high' | 'extreme'; color: string } => {
  if (score <= 30) return { label: 'low', color: 'text-green-600' };
  if (score <= 60) return { label: 'moderate', color: 'text-yellow-600' };
  if (score <= 80) return { label: 'high', color: 'text-orange-600' };
  return { label: 'extreme', color: 'text-red-600' };
};

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

  // Environmental stress metrics derived from current weather + genetics
  const envMetrics = useMemo(() => {
    if (!weatherData) {
      return {
        available: false,
        stressScore: 0,
        risk: 'low',
        riskColor: 'text-gray-500',
        hi: 0,
        humidex: 0,
        windChill: 0,
        wbgt: 0,
        hydrationMlPerHour: 0,
        sodiumMgPerHour: 0,
        recommendations: [] as string[],
      };
    }
    const t = weatherData.temperature ?? 0;
    const rh = weatherData.humidity ?? 0;
    const wind = weatherData.windSpeed ?? 0;
    const aqi = weatherData.aqi ?? 0;

    const hi = heatIndexC(t, rh);
    const hdx = humidex(t, rh);
    const wc = windChillC(t, wind);
    const wbgt = wbgtApproxC(t, rh);

    // Normalize impacts (0..1)
    const norm = (v: number, min: number, max: number) => clamp((v - min) / (max - min), 0, 1);
    const heatImpact = t >= 20 ? norm(wbgt, 22, 32) : 0; // WBGT-driven heat stress
    const humidityImpact = norm(rh, 30, 90);
    const aqiImpact = aqi ? norm(aqi, 50, 200) : 0;
    const coldWindImpact = t < 10 ? norm(10 - wc, 0, 15) : 0;

    // Composite environmental stress score (0..100, higher = worse)
    const stressScore = Math.round(
      clamp(heatImpact * 0.5 + humidityImpact * 0.2 + aqiImpact * 0.2 + coldWindImpact * 0.1, 0, 1) * 100
    );
    const riskInfo = envRiskCategory(stressScore);

    // Hydration plan (ml/h) baseline
    let hydrationMlPerHour = clamp(
      500 + (t - 20) * 30 + (rh - 50) * 5 + wind * 5,
      400,
      1500
    );

    // Genetic modifiers
    const hasAQP5 = !!geneticData?.find((g: any) => g.gene === 'AQP5');
    const hasCFTR = !!geneticData?.find((g: any) => g.gene === 'CFTR');
    const hasSCNN1A = !!geneticData?.find((g: any) => g.gene === 'SCNN1A');

    let hydrationFactor = 1;
    if (hasAQP5 && t > 28) hydrationFactor += 0.1;
    if (hasCFTR && t > 25) hydrationFactor += 0.15;
    if (hasSCNN1A && t > 30) hydrationFactor += 0.1;

    hydrationMlPerHour = Math.round(hydrationMlPerHour * hydrationFactor);

    // Sodium mg/h (approx 500 mg/L)
    const sodiumMgPerHour = Math.round(hydrationMlPerHour * 0.5);

    // Recommendations
    const recs: string[] = [];
    if (stressScore >= 60) recs.push('Shorten intervals and extend rest; monitor RPE closely');
    if (t > 28) recs.push('Pre-cool (ice towel/vest) and use shade when possible');
    if (rh > 75) recs.push('Use fan/airflow; prioritize evaporative cooling');
    if (aqi > 100) recs.push('Prefer indoor training; consider filtration/mask');
    if (t < 10 && wind > 10) recs.push('Layer clothing and extend warm-up to 15–20 min');

    return {
      available: true,
      stressScore,
      risk: riskInfo.label,
      riskColor: riskInfo.color,
      hi: Math.round(hi),
      humidex: Math.round(hdx),
      windChill: Math.round(wc),
      wbgt: Math.round(wbgt),
      hydrationMlPerHour,
      sodiumMgPerHour,
      recommendations: recs,
    };
  }, [weatherData, geneticData]);

  // Parse genetics into a consistent dictionary
  const geneDict = useMemo<GeneDict>(() => normalizeGenetics(geneticData), [geneticData]);

  // Sensitivity watchlist (shown when no active impacts are triggered)
  const potentialImpacts = useMemo<GeneticImpact[]>(() => {
    const list: GeneticImpact[] = [];
    const G = (n: string) => geneDict[n.toUpperCase()];
    // Heat/sweat/electrolyte
    if (G('AQP5')) {
      list.push({
        gene: 'AQP5',
        genotype: G('AQP5')!,
        impact: 'Sweat gland water channel; Trigger: Heat > 28°C or long-duration sessions',
        severity: 'medium',
        recommendation: 'Plan higher fluid intake; monitor sweat rate and cooling',
        icon: <Droplets className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    if (G('CFTR')) {
      list.push({
        gene: 'CFTR',
        genotype: G('CFTR')!,
        impact: 'Electrolyte loss risk; Trigger: Heat > 25°C, humid conditions',
        severity: 'high',
        recommendation: 'Use electrolyte drinks; consider sodium pre-load on hot days',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    if (G('SCNN1A')) {
      list.push({
        gene: 'SCNN1A',
        genotype: G('SCNN1A')!,
        impact: 'Sodium balance in sweat; Trigger: Heat > 30°C, heavy sweating',
        severity: 'medium',
        recommendation: 'Increase sodium replacement; monitor cramps signs',
        icon: <Droplets className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    // Cold/vascular
    if (G('NOS3')) {
      list.push({
        gene: 'NOS3',
        genotype: G('NOS3')!,
        impact: 'Nitric oxide/circulation; Trigger: Cold < 10°C',
        severity: 'low',
        recommendation: 'Longer warm-up; add light aerobic priming',
        icon: <Activity className="w-5 h-5" />,
        category: 'endurance'
      });
    }
    if (G('ADRB2')) {
      list.push({
        gene: 'ADRB2',
        genotype: G('ADRB2')!,
        impact: 'Vasoconstriction response; Trigger: Cold/windy sessions',
        severity: 'medium',
        recommendation: 'Extra layering; protect extremities; progressive warm-ups',
        icon: <Thermometer className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    // Circadian/light
    if (G('CLOCK')) {
      list.push({
        gene: 'CLOCK',
        genotype: G('CLOCK')!,
        impact: 'Circadian sensitivity; Trigger: High UV, schedule shifts',
        severity: 'medium',
        recommendation: 'Keep consistent sleep/wake; manage late light exposure',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }
    if (G('PER3')) {
      list.push({
        gene: 'PER3',
        genotype: G('PER3')!,
        impact: 'Chronotype; Trigger: Late-evening sessions, bright light at night',
        severity: 'low',
        recommendation: 'Align training with chronotype; avoid screens pre-sleep',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }
    // Airway/inflammation
    if (G('IL13')) {
      list.push({
        gene: 'IL13',
        genotype: G('IL13')!,
        impact: 'Airway sensitivity; Trigger: Humidity > 75%, allergens',
        severity: 'high',
        recommendation: 'Prefer dry indoor sessions; nasal breathing; warm-up longer',
        icon: <Wind className="w-5 h-5" />,
        category: 'endurance'
      });
    }
    if (G('TNF')) {
      list.push({
        gene: 'TNF',
        genotype: G('TNF')!,
        impact: 'Inflammatory response; Trigger: Cold, large load spikes',
        severity: 'medium',
        recommendation: 'Increase anti-inflammatory nutrition; manage load ramp',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    // UV/vitamin D / skin
    if (G('VDR')) {
      list.push({
        gene: 'VDR',
        genotype: G('VDR')!,
        impact: 'Vitamin D receptor; Trigger: Low sun seasons',
        severity: 'low',
        recommendation: 'Check vitamin D status; time outdoor sessions with sun',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'metabolism'
      });
    }
    if (G('MC1R')) {
      list.push({
        gene: 'MC1R',
        genotype: G('MC1R')!,
        impact: 'UV sensitivity; Trigger: UV index > 7, midday sun',
        severity: 'high',
        recommendation: 'Use sunscreen/UV eyewear; avoid midday exposures',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'recovery'
      });
    }
    // Neurological/weather triggers
    if (G('TRPV1')) {
      list.push({
        gene: 'TRPV1',
        genotype: G('TRPV1')!,
        impact: 'Barometric/wind sensitivity; Trigger: Wind > 20 km/h',
        severity: 'high',
        recommendation: 'Prefer sheltered routes; reduce exposure window',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }
    if (G('BDNF')) {
      list.push({
        gene: 'BDNF',
        genotype: G('BDNF')!,
        impact: 'Mood regulation; Trigger: UV < 4, low-light days',
        severity: 'medium',
        recommendation: 'Use morning bright-light exposure; keep training regular',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }
    return list;
  }, [geneDict]);

  // Enhanced genetic analysis with comprehensive weather-responsive genes
  const analyzeGeneticImpacts = useMemo((): GeneticImpact[] => {
    if (!geneticData || !weatherData) return [];

    const impacts: GeneticImpact[] = [];
    const { temperature, humidity, windSpeed, aqi, uvIndex } = weatherData;

    // 🌡️ Temperature Sensitivity Genes
    // UCP1, UCP2, ADRB3 - Cold tolerance and thermogenesis
    const ucp1Genotype = geneticData.find(g => g.gene === 'UCP1')?.genotype;
    if (ucp1Genotype && temperature && temperature < 10) {
      impacts.push({
        gene: 'UCP1',
        genotype: ucp1Genotype,
        impact: 'Cold tolerance and brown fat thermogenesis',
        severity: ucp1Genotype.includes('A') ? 'low' : 'medium',
        recommendation: 'Better cold adaptation, maintain training in cold weather',
        icon: <Thermometer className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    const adrb3Genotype = geneticData.find(g => g.gene === 'ADRB3')?.genotype;
    if (adrb3Genotype && temperature && temperature < 15) {
      impacts.push({
        gene: 'ADRB3',
        genotype: adrb3Genotype,
        impact: 'Cold-induced thermogenesis regulation',
        severity: 'medium',
        recommendation: 'Monitor cold exposure, ensure proper warm-up',
        icon: <Thermometer className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // AQP5, CFTR, ENaC/SCNN1A - Heat tolerance and sweating
    const aqp5Genotype = geneticData.find(g => g.gene === 'AQP5')?.genotype;
    if (aqp5Genotype && temperature && temperature > 28) {
      impacts.push({
        gene: 'AQP5',
        genotype: aqp5Genotype,
        impact: 'Sweat gland water channel function',
        severity: 'medium',
        recommendation: 'Monitor hydration, optimize electrolyte balance',
        icon: <Droplets className="w-5 h-5" />,
        category: 'recovery'
      });
    }

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

    const scnn1aGenotype = geneticData.find(g => g.gene === 'SCNN1A')?.genotype;
    if (scnn1aGenotype && temperature && temperature > 30) {
      impacts.push({
        gene: 'SCNN1A',
        genotype: scnn1aGenotype,
        impact: 'Salt retention and sweat electrolyte balance',
        severity: 'medium',
        recommendation: 'Monitor sodium levels, adjust electrolyte supplementation',
        icon: <Droplets className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // NOS3, ADRB2 - Vasoconstriction in cold
    const nos3Genotype = geneticData.find(g => g.gene === 'NOS3')?.genotype;
    if (nos3Genotype && temperature && temperature < 10) {
      if (nos3Genotype === 'TT') {
        impacts.push({
          gene: 'NOS3',
          genotype: nos3Genotype,
          impact: 'Optimal nitric oxide production for circulation',
          severity: 'low',
          recommendation: 'Better blood flow in cold conditions',
          icon: <Activity className="w-5 h-5" />,
          category: 'endurance'
        });
      }
    }

    const adrb2Genotype = geneticData.find(g => g.gene === 'ADRB2')?.genotype;
    if (adrb2Genotype && temperature && temperature < 15) {
      if (adrb2Genotype === 'Gly16Gly') {
        impacts.push({
          gene: 'ADRB2',
          genotype: adrb2Genotype,
          impact: 'Reduced vasoconstriction efficiency in cold',
          severity: 'medium',
          recommendation: 'Extra warm-up needed, monitor for cold stress',
          icon: <Thermometer className="w-5 h-5" />,
          category: 'recovery'
        });
      }
    }

    // ☀️ Light, Circadian, and Seasonal Response Genes
    // CLOCK, PER2, PER3, ARNTL/BMAL1 - Circadian rhythm
    const clockGenotype = geneticData.find(g => g.gene === 'CLOCK')?.genotype;
    if (clockGenotype && uvIndex && uvIndex > 6) {
      impacts.push({
        gene: 'CLOCK',
        genotype: clockGenotype,
        impact: 'Circadian rhythm regulation affected by light exposure',
        severity: clockGenotype === 'AA' ? 'low' : 'medium',
        recommendation: clockGenotype === 'AA' ? 'Strong circadian drive, maintain light consistency' : 'Flexible rhythm, use light therapy if needed',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const per2Genotype = geneticData.find(g => g.gene === 'PER2')?.genotype;
    if (per2Genotype && uvIndex && uvIndex > 8) {
      impacts.push({
        gene: 'PER2',
        genotype: per2Genotype,
        impact: 'Light-sensitive circadian regulation',
        severity: 'medium',
        recommendation: 'Monitor sleep quality with high UV exposure',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const per3Genotype = geneticData.find(g => g.gene === 'PER3')?.genotype;
    if (per3Genotype && uvIndex && uvIndex > 7) {
      impacts.push({
        gene: 'PER3',
        genotype: per3Genotype,
        impact: 'Morning/evening preference influenced by light',
        severity: per3Genotype === 'long' ? 'medium' : 'low',
        recommendation: per3Genotype === 'long' ? 'Evening type, avoid bright light before bed' : 'Morning type, use morning light exposure',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const arntlGenotype = geneticData.find(g => g.gene === 'ARNTL')?.genotype;
    if (arntlGenotype && uvIndex && uvIndex > 5) {
      impacts.push({
        gene: 'ARNTL',
        genotype: arntlGenotype,
        impact: 'BMAL1 protein affects light-dependent gene expression',
        severity: 'medium',
        recommendation: 'Optimize light exposure timing for circadian health',
        icon: <Clock className="w-5 h-5" />,
        category: 'stress'
      });
    }

    // SLC6A4, TPH2, MAOA - Seasonal mood response
    const slc6a4Genotype = geneticData.find(g => g.gene === 'SLC6A4')?.genotype;
    if (slc6a4Genotype && uvIndex && uvIndex < 3) {
      impacts.push({
        gene: 'SLC6A4',
        genotype: slc6a4Genotype,
        impact: 'Serotonin transporter affected by seasonal light changes',
        severity: slc6a4Genotype === 'LL' ? 'low' : 'high',
        recommendation: slc6a4Genotype === 'LL' ? 'Good serotonin regulation' : 'Monitor mood in low light seasons',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const tph2Genotype = geneticData.find(g => g.gene === 'TPH2')?.genotype;
    if (tph2Genotype && uvIndex && uvIndex < 4) {
      impacts.push({
        gene: 'TPH2',
        genotype: tph2Genotype,
        impact: 'Serotonin synthesis affected by light availability',
        severity: 'medium',
        recommendation: 'Consider light therapy in low-sunlight periods',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }

    // GC/DBP, CYP2R1, VDR - Vitamin D metabolism
    const gcGenotype = geneticData.find(g => g.gene === 'GC')?.genotype;
    if (gcGenotype && uvIndex && uvIndex < 5) {
      impacts.push({
        gene: 'GC',
        genotype: gcGenotype,
        impact: 'Vitamin D binding protein affects UV utilization',
        severity: 'medium',
        recommendation: 'Monitor vitamin D levels, consider supplementation',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'metabolism'
      });
    }

    const cyp2r1Genotype = geneticData.find(g => g.gene === 'CYP2R1')?.genotype;
    if (cyp2r1Genotype && uvIndex && uvIndex < 6) {
      impacts.push({
        gene: 'CYP2R1',
        genotype: cyp2r1Genotype,
        impact: 'Vitamin D 25-hydroxylase enzyme efficiency',
        severity: 'medium',
        recommendation: 'May need higher UV exposure for vitamin D production',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'metabolism'
      });
    }

    const vdrGenotype = geneticData.find(g => g.gene === 'VDR')?.genotype;
    if (vdrGenotype && uvIndex && uvIndex > 8) {
      impacts.push({
        gene: 'VDR',
        genotype: vdrGenotype,
        impact: 'Vitamin D receptor sensitivity to sunlight',
        severity: 'low',
        recommendation: 'Good vitamin D utilization from UV exposure',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'metabolism'
      });
    }

    // 💨 Air Pressure, Humidity, and Weather-Triggered Symptoms
    // TRPV1, CACNA1A, HCRTR1 - Migraine weather sensitivity
    const trpv1Genotype = geneticData.find(g => g.gene === 'TRPV1')?.genotype;
    if (trpv1Genotype && windSpeed && windSpeed > 20) {
      impacts.push({
        gene: 'TRPV1',
        genotype: trpv1Genotype,
        impact: 'Sensory nerve sensitivity to barometric pressure',
        severity: 'high',
        recommendation: 'Monitor for migraine triggers in windy conditions',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const cacna1aGenotype = geneticData.find(g => g.gene === 'CACNA1A')?.genotype;
    if (cacna1aGenotype && windSpeed && windSpeed > 15) {
      impacts.push({
        gene: 'CACNA1A',
        genotype: cacna1aGenotype,
        impact: 'Calcium channel affects nerve excitability',
        severity: 'medium',
        recommendation: 'Wind may trigger neurological symptoms',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }

    // IL6, TNF, COL1A1 - Joint pain and inflammation
    const il6Genotype = geneticData.find(g => g.gene === 'IL6')?.genotype;
    if (il6Genotype && humidity && humidity > 80) {
      impacts.push({
        gene: 'IL6',
        genotype: il6Genotype,
        impact: 'Inflammation response to humidity changes',
        severity: 'medium',
        recommendation: 'Monitor joint pain in high humidity',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    const tnfGenotype = geneticData.find(g => g.gene === 'TNF')?.genotype;
    if (tnfGenotype && temperature && temperature < 10) {
      impacts.push({
        gene: 'TNF',
        genotype: tnfGenotype,
        impact: 'Cold-triggered inflammation response',
        severity: 'medium',
        recommendation: 'Cold weather may increase joint inflammation',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    const col1a1Genotype = geneticData.find(g => g.gene === 'COL1A1')?.genotype;
    if (col1a1Genotype && windSpeed && windSpeed > 15) {
      impacts.push({
        gene: 'COL1A1',
        genotype: col1a1Genotype,
        impact: 'Collagen structure affects joint stability',
        severity: 'medium',
        recommendation: 'Wind may affect joint stability and pain',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // IL13, ADRB2, ORMDL3 - Asthma and humidity sensitivity
    const il13Genotype = geneticData.find(g => g.gene === 'IL13')?.genotype;
    if (il13Genotype && humidity && humidity > 75) {
      impacts.push({
        gene: 'IL13',
        genotype: il13Genotype,
        impact: 'Airway inflammation response to humidity',
        severity: 'high',
        recommendation: 'Monitor respiratory symptoms in humid conditions',
        icon: <Wind className="w-5 h-5" />,
        category: 'endurance'
      });
    }

    const ormdl3Genotype = geneticData.find(g => g.gene === 'ORMDL3')?.genotype;
    if (ormdl3Genotype && humidity && humidity > 70) {
      impacts.push({
        gene: 'ORMDL3',
        genotype: ormdl3Genotype,
        impact: 'Bronchial hyperresponsiveness to humidity',
        severity: 'medium',
        recommendation: 'Humidity may trigger asthma symptoms',
        icon: <Wind className="w-5 h-5" />,
        category: 'endurance'
      });
    }

    // 🌤️ UV and Sun Exposure Adaptation
    // MC1R, SLC24A5, TYR, OCA2 - Skin pigmentation
    const mc1rGenotype = geneticData.find(g => g.gene === 'MC1R')?.genotype;
    if (mc1rGenotype && uvIndex && uvIndex > 7) {
      impacts.push({
        gene: 'MC1R',
        genotype: mc1rGenotype,
        impact: 'Melanin production and UV protection',
        severity: mc1rGenotype.includes('R') ? 'high' : 'low',
        recommendation: mc1rGenotype.includes('R') ? 'Higher UV sensitivity, use sun protection' : 'Better natural UV protection',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    const slc24a5Genotype = geneticData.find(g => g.gene === 'SLC24A5')?.genotype;
    if (slc24a5Genotype && uvIndex && uvIndex > 6) {
      impacts.push({
        gene: 'SLC24A5',
        genotype: slc24a5Genotype,
        impact: 'Skin pigmentation and UV tolerance',
        severity: 'medium',
        recommendation: 'Monitor skin response to UV exposure',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // XPC, ERCC2, TP53 - DNA repair
    const xpcGenotype = geneticData.find(g => g.gene === 'XPC')?.genotype;
    if (xpcGenotype && uvIndex && uvIndex > 8) {
      impacts.push({
        gene: 'XPC',
        genotype: xpcGenotype,
        impact: 'DNA repair efficiency after UV damage',
        severity: 'medium',
        recommendation: 'Monitor for UV-induced skin damage',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    const ercc2Genotype = geneticData.find(g => g.gene === 'ERCC2')?.genotype;
    if (ercc2Genotype && uvIndex && uvIndex > 7) {
      impacts.push({
        gene: 'ERCC2',
        genotype: ercc2Genotype,
        impact: 'Nucleotide excision repair capacity',
        severity: 'medium',
        recommendation: 'UV exposure may affect DNA repair processes',
        icon: <Shield className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // OPN1LW, OPN1MW, GRK1 - Eye light sensitivity
    const opn1lwGenotype = geneticData.find(g => g.gene === 'OPN1LW')?.genotype;
    if (opn1lwGenotype && uvIndex && uvIndex > 9) {
      impacts.push({
        gene: 'OPN1LW',
        genotype: opn1lwGenotype,
        impact: 'Long-wavelength cone sensitivity to bright light',
        severity: 'medium',
        recommendation: 'Use UV-protective eyewear in bright sunlight',
        icon: <EyeIcon className="w-5 h-5" />,
        category: 'recovery'
      });
    }

    // 🧠 Mood and Cognitive Weather Response
    // BDNF Val66Met, SLC6A4, COMT - Weather-linked mood shifts
    const bdnfGenotype = geneticData.find(g => g.gene === 'BDNF')?.genotype;
    if (bdnfGenotype && uvIndex && uvIndex < 4) {
      impacts.push({
        gene: 'BDNF',
        genotype: bdnfGenotype,
        impact: 'Brain-derived neurotrophic factor and mood regulation',
        severity: bdnfGenotype === 'Val/Val' ? 'low' : 'high',
        recommendation: bdnfGenotype === 'Val/Val' ? 'Better mood stability' : 'Monitor mood in low-light conditions',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
    }

    const comtGenotype = geneticData.find(g => g.gene === 'COMT')?.genotype;
    if (comtGenotype && temperature && temperature < 5) {
      impacts.push({
        gene: 'COMT',
        genotype: comtGenotype,
        impact: 'Dopamine metabolism affected by cold stress',
        severity: comtGenotype === 'GG' ? 'low' : 'high',
        recommendation: comtGenotype === 'GG' ? 'Better cold stress response' : 'Cold may affect cognitive function',
        icon: <Brain className="w-5 h-5" />,
        category: 'stress'
      });
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

    // Environmental stress penalty and recommendations
    if (envMetrics.available) {
      // Up to 30% penalty from environment
      score -= Math.round(envMetrics.stressScore * 0.3);
      envMetrics.recommendations.slice(0, 3).forEach(r => recommendations.push(r));
      factors.push(`Environmental stress: ${envMetrics.risk.toUpperCase()}`);
    }

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
        {activeTab === 'overview' && (<>
          <div className="overview-tab">
            {/* Weather Conditions Cards */}
            <div className="conditions-grid">
              <div className="condition-card ">
                <div className="condition-icon">
                  {weatherData ? getWeatherIcon(weatherData.weatherCondition) : '❓'}
                </div>
                <div className="condition-info text-white">
                  <div className="condition-name text-white">
                    {weatherData ? getWeatherDescription(weatherData.weatherCondition) : 'Weather Unavailable'}
                  </div>
                  <div className="condition-label text-white">Current Conditions</div>
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

          {/* Environmental Stress Summary */}
          <div className="card-enhanced p-6 mt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Stress gauge */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Environmental Stress</h4>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10"
                        className={
                          envMetrics.stressScore <= 30 ? 'text-green-500' :
                          envMetrics.stressScore <= 60 ? 'text-yellow-500' :
                          envMetrics.stressScore <= 80 ? 'text-orange-500' : 'text-red-500'
                        }
                        strokeDasharray={`${(Math.PI * 2 * 50) * (envMetrics.stressScore / 100)} ${(Math.PI * 2 * 50)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-extrabold text-gray-900">{envMetrics.stressScore}</div>
                        <div className={`text-xs font-semibold ${envMetrics.riskColor}`}>{String(envMetrics.risk).toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">WBGT</div>
                      <div className="text-gray-900 font-bold">{envMetrics.wbgt}°C</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">Heat Index</div>
                      <div className="text-gray-900 font-bold">{envMetrics.hi}°C</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">Humidex</div>
                      <div className="text-gray-900 font-bold">{envMetrics.humidex}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-500">Wind Chill</div>
                      <div className="text-gray-900 font-bold">{envMetrics.windChill}°C</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hydration & Sodium plan */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Hydration & Electrolytes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-sm">Recommended Fluid</div>
                    <div className="text-2xl font-bold text-blue-700">{envMetrics.hydrationMlPerHour} ml/h</div>
                    <div className="text-xs text-blue-600 mt-1">Adjust by body mass and session duration</div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-purple-600 text-sm">Sodium Target</div>
                    <div className="text-2xl font-bold text-purple-700">{envMetrics.sodiumMgPerHour} mg/h</div>
                    <div className="text-xs text-purple-600 mt-1">Increase if heavy sweater/genotype risk</div>
                  </div>
                </div>
                {envMetrics.recommendations.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">Immediate Actions</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {envMetrics.recommendations.slice(0,3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>)}

        {activeTab === 'genetics' && (
          <div className="genetics-tab">
            

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
              <>
                {potentialImpacts.length > 0 ? (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Sensitivity Watchlist (weather-triggered)</h4>
                    <div className="genetic-impacts-grid">
                      {potentialImpacts.map((impact, index) => (
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
                  </div>
                ) : (
                  <div className="no-genetic-impacts">
                    <Dna className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="no-impacts-title">No Genetic Data Parsed</h4>
                    <p className="no-impacts-text">We couldn’t match any weather-relevant genotypes. Ensure genetic summary includes gene and genotype fields.</p>
                  </div>
                )}
              </>
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