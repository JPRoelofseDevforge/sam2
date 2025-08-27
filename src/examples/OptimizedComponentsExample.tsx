/**
 * Example demonstrating the optimized sports analytics application
 * with improved code reusability and efficiency
 */

import React, { useState, useEffect } from 'react';
import {
  // UI Components
  DataCard,
  Button,
  LoadingSpinner,
  StatusMessage,
  ChartContainer,
  SkeletonCard,
  ErrorBoundary,
} from '../components/ui';

import {
  // Hooks
  useApi,
  useCrud,
  useForm,
  useAuthState,
  usePermissions,
} from '../hooks';

import {
  // Utilities
  formatNumber,
  formatDate,
  calculatePercentageChange,
  formatPercentage,
  getStatusColor,
  getStatusDotColor,
  convertToChartData,
  sortByDate,
  debounce,
} from '../utils/dataFormatters';

import { validateForm } from '../utils/validation';

import {
  // Types
  ChartConfig,
  FormField,
  LoadingState,
} from '../types';

// Example: Enhanced Athlete Profile Component using new utilities
export const OptimizedAthleteProfile: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const { data: athlete, isLoading, error, refetch } = useApi(`/athletes/${athleteId}`);
  const { hasPermission } = usePermissions();

  if (isLoading) return <SkeletonCard />;
  if (error) return <StatusMessage type="error" message={error} action={{ label: 'Retry', onClick: refetch }} />;
  if (!athlete) return <StatusMessage type="info" message="Athlete not found" />;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <DataCard
          title={`${athlete.name} - ${athlete.sport}`}
          subtitle={`Age: ${athlete.age} | Team: ${athlete.team}`}
          icon="🏃‍♂️"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{athlete.age}</div>
              <div className="text-sm text-gray-600">Age</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{athlete.team}</div>
              <div className="text-sm text-gray-600">Team</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{athlete.sport}</div>
              <div className="text-sm text-gray-600">Sport</div>
            </div>
          </div>
        </DataCard>

        {hasPermission('view_athlete_details') && (
          <AthleteBiometricData athleteId={athleteId} />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Example: Biometric Data Component using new hooks and utilities
const AthleteBiometricData: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const { data: biometricData, isLoading, error, refetch } = useApi(`/athletes/${athleteId}/biometric-data`);
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');

  const processedData = biometricData ? sortByDate(biometricData, false) : [];
  const latestData = processedData[0] as any;
  const previousData = processedData[1] as any;

  const chartConfig: ChartConfig = {
    title: 'Heart Rate Trend',
    data: convertToChartData(processedData.slice(0, 10).map((item: any) => ({ date: item.date, value: item.resting_hr || 0 }))),
    color: '#ef4444',
    goalValue: 60,
    goalLabel: 'Target HR',
    teamAverage: 65,
  };

  if (isLoading) return <SkeletonCard />;
  if (error) return <StatusMessage type="error" message={error} action={{ label: 'Retry', onClick: refetch }} />;

  return (
    <div className="space-y-6">
      <DataCard title="Biometric Overview" icon="❤️">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricDisplay
            label="Resting HR"
            value={latestData?.resting_hr}
            unit="bpm"
            previousValue={previousData?.resting_hr}
            goal={60}
          />
          <MetricDisplay
            label="HRV"
            value={latestData?.hrv_night}
            unit="ms"
            previousValue={previousData?.hrv_night}
            goal={50}
          />
          <MetricDisplay
            label="SpO2"
            value={latestData?.spo2_night}
            unit="%"
            previousValue={previousData?.spo2_night}
            goal={95}
          />
          <MetricDisplay
            label="Sleep Duration"
            value={latestData?.sleep_duration_h}
            unit="h"
            previousValue={previousData?.sleep_duration_h}
            goal={8}
          />
        </div>
      </DataCard>

      <ChartContainer
        config={chartConfig}
        loading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
};

// Example: Reusable Metric Display Component
const MetricDisplay: React.FC<{
  label: string;
  value: number;
  unit: string;
  previousValue?: number;
  goal?: number;
}> = ({ label, value, unit, previousValue, goal }) => {
  const change = previousValue ? calculatePercentageChange(value, previousValue) : 0;
  const status = getStatusColor(value, goal || value, (goal || value) * 0.85);
  const dotColor = getStatusDotColor(status);

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center mb-2">
        <div className={`w-3 h-3 rounded-full mr-2 ${dotColor}`} />
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {formatNumber(value, 1)} <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {previousValue && (
        <div className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? '↗' : '↘'} {formatPercentage(change)}
        </div>
      )}
    </div>
  );
};

// Example: Form Component using new form utilities
export const AthleteForm: React.FC = () => {
  const { data: sports } = useApi('/sports');
  const { data: organizations } = useApi('/organizations');
  const { create, loading } = useCrud('athletes');

  const formFields: FormField[] = [
    {
      name: 'athlete_code',
      label: 'Athlete Code',
      type: 'text',
      required: true,
      validation: { pattern: /^[A-Za-z0-9]{3,10}$/ }
    },
    {
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true
    },
    {
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true
    },
    {
      name: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
        { value: 'O', label: 'Other' }
      ]
    },
    {
      name: 'sport_id',
      label: 'Sport',
      type: 'select',
      required: true,
      options: sports?.map(sport => ({ value: sport.id, label: sport.name })) || []
    },
    {
      name: 'organization_id',
      label: 'Organization',
      type: 'select',
      required: true,
      options: organizations?.map(org => ({ value: org.id, label: org.name })) || []
    }
  ];

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  } = useForm(
    {
      athlete_code: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      sport_id: '',
      organization_id: ''
    },
    async (formData) => {
      const result = await create(formData);
      if (result) {
        reset();
        // Show success message or redirect
      }
    }
  );

  const formErrors = validateForm(values, formFields);
  const isValid = Object.keys(formErrors).length === 0;

  return (
    <DataCard title="Add New Athlete" icon="➕">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={(values as any)[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onBlur={() => handleBlur(field.name)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={(values as any)[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onBlur={() => handleBlur(field.name)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {(errors[field.name] || (touched[field.name] && formErrors[field.name])) && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.name] || formErrors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={reset}>
            Reset
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isValid}
          >
            Create Athlete
          </Button>
        </div>
      </form>
    </DataCard>
  );
};

// Example: Search Component with debouncing
export const AthleteSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await fetch(`/api/athletes/search?q=${encodeURIComponent(term)}`);
      const data = await results.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return (
    <DataCard title="Search Athletes" icon="🔍">
      <div className="space-y-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, code, or team..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {isSearching && <LoadingSpinner text="Searching..." />}

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((athlete: any) => (
              <div key={athlete.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{athlete.name}</div>
                <div className="text-sm text-gray-600">
                  {athlete.athlete_code} • {athlete.sport} • {athlete.team}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataCard>
  );
};

// Example: Dashboard using all new components
export const OptimizedDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuthState();
  const { hasPermission } = usePermissions();

  if (!isAuthenticated) {
    return <StatusMessage type="warning" message="Please log in to access the dashboard" />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <DataCard
          title={`Welcome back, ${user?.first_name || 'User'}!`}
          subtitle="Here's your sports analytics overview"
          icon="📊"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-blue-600">Active Athletes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-sm text-green-600">Data Points Today</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-purple-600">System Health</div>
            </div>
          </div>
        </DataCard>

        {hasPermission('view_athletes') && <AthleteSearch />}
        {hasPermission('create_athletes') && <AthleteForm />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataCard title="Quick Actions" icon="⚡">
            <div className="space-y-2">
              <Button variant="primary" fullWidth>
                📊 Generate Report
              </Button>
              <Button variant="secondary" fullWidth>
                📈 View Analytics
              </Button>
              <Button variant="success" fullWidth>
                ➕ Add Data Point
              </Button>
            </div>
          </DataCard>

          <DataCard title="Recent Activity" icon="🕐">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">New athlete registered</span>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Biometric data synced</span>
                <span className="text-xs text-gray-500">5 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Report generated</span>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
            </div>
          </DataCard>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OptimizedDashboard;