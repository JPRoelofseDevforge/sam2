import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { dataService } from '../services/dataService';
import { ApneaRecord } from '../types/specializedData';
import { AuthComponent } from './AuthComponent';

const ApneaList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState<ApneaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <AuthComponent />;
  }

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getApneaRecords();
      setRecords(data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.name === 'AuthError') {
        try {
          await authService.refreshToken();
          // Retry
          const data = await dataService.getApneaRecords();
          setRecords(data);
        } catch (refreshError) {
          toast.error('Authentication expired. Please log in again.');
          setError('Authentication failed. Please log in again.');
        }
      } else {
        console.error('Failed to fetch apnea records:', error);
        toast.error('Failed to load apnea records. Please try again.');
        setError('Failed to load apnea records. Please try again.');
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
    return <div>Loading apnea list...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="apnea-list">
      <h2>Apnea Events</h2>
      <table className="w-full border-collapse border border-slate-400">
        <thead>
          <tr>
            <th className="border border-slate-400 px-4 py-2">ID</th>
            <th className="border border-slate-400 px-4 py-2">MAC</th>
            <th className="border border-slate-400 px-4 py-2">Day</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="border border-slate-400 px-4 py-2">{record.id}</td>
              <td className="border border-slate-400 px-4 py-2">{record.mac}</td>
              <td className="border border-slate-400 px-4 py-2">{record.day}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApneaList;