import { ChartDataPoint } from '../types';

/**
 * Format a number to a specific decimal places
 */
export const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
};

/**
 * Format a date for chart display
 */
export const formatChartDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage with optional sign
 */
export const formatPercentage = (value: number, includeSign: boolean = true): string => {
  const formatted = formatNumber(Math.abs(value), 1);
  if (!includeSign) return `${formatted}%`;

  return value > 0 ? `+${formatted}%` : `-${formatted}%`;
};

/**
 * Get status color based on value and thresholds
 */
export const getStatusColor = (value: number, goodThreshold: number, warningThreshold: number): 'green' | 'yellow' | 'red' => {
  if (value >= goodThreshold) return 'green';
  if (value >= warningThreshold) return 'yellow';
  return 'red';
};

/**
 * Get status dot color class
 */
export const getStatusDotColor = (status: 'green' | 'yellow' | 'red'): string => {
  switch (status) {
    case 'green': return 'bg-green-500';
    case 'yellow': return 'bg-yellow-500';
    case 'red': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

/**
 * Convert data points to chart format
 */
export const convertToChartData = (data: Array<{ date: string; value: number }>): ChartDataPoint[] => {
  return data.map(item => ({
    date: item.date,
    value: item.value,
    label: formatChartDate(item.date)
  }));
};

/**
 * Sort data by date
 */
export const sortByDate = <T extends { date: string }>(data: T[], ascending: boolean = true): T[] => {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Get latest data point from array
 */
export const getLatestDataPoint = <T extends { date: string }>(data: T[]): T | null => {
  if (data.length === 0) return null;
  return sortByDate(data, false)[0];
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/**
 * Calculate trend direction
 */
export const getTrendDirection = (data: Array<{ value: number }>): 'up' | 'down' | 'neutral' => {
  if (data.length < 2) return 'neutral';

  const recent = data.slice(-3); // Last 3 points
  const older = data.slice(-6, -3); // Previous 3 points

  if (older.length === 0) return 'neutral';

  const recentAvg = calculateAverage(recent.map(d => d.value));
  const olderAvg = calculateAverage(older.map(d => d.value));

  const change = calculatePercentageChange(recentAvg, olderAvg);

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'neutral';
};

/**
 * Format large numbers with K/M suffixes
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${formatNumber(value / 1000000, 1)}M`;
  }
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 1)}K`;
  }
  return value.toString();
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;

  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};