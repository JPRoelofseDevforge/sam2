import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { WomenHealthRecord } from '../types/specializedData';
import { AuthComponent } from './AuthComponent';

const WomenHealthCalendar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState<WomenHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const startDay = '2025-01-01';
      const endDay = '2025-12-31';
      const data = await dataService.getWomenHealthRecords(startDay, endDay);
      setRecords(data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.name === 'AuthError') {
        try {
          await authService.refreshToken();
          // Retry
          const startDay = '2025-01-01';
          const endDay = '2025-12-31';
          const data = await dataService.getWomenHealthRecords(startDay, endDay);
          setRecords(data);
        } catch (refreshError) {
          toast.error('Authentication expired. Please log in again.');
          setError('Authentication failed. Please log in again.');
        }
      } else {
        console.error('Failed to fetch women health records:', error);
        toast.error('Failed to load women health records. Please try again.');
        setError('Failed to load women health records. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [isAuthenticated, fetchRecords]);

  // Polling every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(fetchRecords, 300000);
    return () => clearInterval(intervalId);
  }, [fetchRecords, isAuthenticated]);

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getColor = (flowRate: number) => {
    if (flowRate > 2) return 'red';
    if (flowRate > 1) return 'orange';
    return 'green';
  };

  const getTooltip = (record: WomenHealthRecord | undefined) => {
    if (!record) return '';
    return `Flow Rate: ${record.flowRate}\nSymptoms: ${record.symptoms.join(', ')}`;
  };

  return (
    <div className="women-health-calendar">
      <h2>Women Health Calendar</h2>
      {Array.from({ length: 12 }, (_, m) => (
        <div key={m} className="month">
          <h3>Month {m + 1}</h3>
          <div className="week-grid">
            {getMonthDays(2025, m).map((date) => {
              const dayStr = date.toISOString().split('T')[0];
              const record = records.find(r => r.day === dayStr);
              return (
                <div
                  key={dayStr}
                  className="day"
                  style={{ backgroundColor: record ? getColor(record.flowRate) : 'gray' }}
                  title={getTooltip(record)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WomenHealthCalendar;