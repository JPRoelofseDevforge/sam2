// Weather API configuration
export const WEATHER_CONFIG = {
  CITY: import.meta.env.VITE_CITY || 'Pretoria',
  STATE: import.meta.env.VITE_STATE || 'Gauteng',
  COUNTRY: import.meta.env.VITE_COUNTRY || 'South Africa',
  REFRESH_INTERVAL: 300000, // 5 minutes
};

// Date formatting
export const getFormattedDate = (): string => {
  const date = new Date();
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Alert types
export const ALERT_TYPES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  WARNING: 'warning',
  MEDIUM: 'medium',
  OPTIMAL: 'optimal',
  LOW: 'low',
  GREEN: 'green',
} as const;

// Status colors
export const STATUS_COLORS = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-red-600',
  WARNING: 'text-yellow-600',
  MEDIUM: 'text-yellow-600',
  OPTIMAL: 'text-green-600',
  LOW: 'text-green-600',
  UNKNOWN: 'text-gray-600',
} as const;

// Status classes
export const STATUS_CLASSES = {
  CRITICAL: 'status-critical',
  HIGH: 'status-critical',
  WARNING: 'status-warning',
  MEDIUM: 'status-warning',
  OPTIMAL: 'status-optimal',
  LOW: 'status-optimal',
  UNKNOWN: 'status-unknown',
} as const;