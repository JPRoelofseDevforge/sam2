import React, { useState, useMemo } from 'react';
import { biometricData, athletes } from '../data/mockData';

interface HeatmapData {
  date: string;
  athleteId: string;
  athleteName: string;
  trainingLoad: number;
}

interface CalendarDay {
  date: string;
  value: number | null;
  athleteId: string;
  athleteName: string;
}

export const TrainingLoadHeatmap: React.FC = () => {
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([athletes[0].athlete_id]);
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');

  // Prepare heatmap data
  const heatmapData = useMemo<HeatmapData[]>(() => {
    return biometricData.map(data => {
      const athlete = athletes.find(a => a.athlete_id === data.athlete_id);
      return {
        date: data.date,
        athleteId: data.athlete_id,
        athleteName: athlete?.name || 'Unknown',
        trainingLoad: data.training_load_pct
      };
    });
  }, []);

  // Get data for selected athletes
  const athleteData = useMemo<HeatmapData[]>(() => {
    return heatmapData.filter(data => selectedAthletes.includes(data.athleteId));
  }, [heatmapData, selectedAthletes]);

  // Generate calendar data organized by athlete (28 days)
  const athleteCalendarData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 27); // 28 days including today

    const athleteCalendars: { [athleteId: string]: { athleteName: string; days: CalendarDay[] } } = {};

    // Initialize calendars for each selected athlete
    selectedAthletes.forEach(athleteId => {
      const athlete = athletes.find(a => a.athlete_id === athleteId);
      if (athlete) {
        athleteCalendars[athleteId] = {
          athleteName: athlete.name,
          days: []
        };
      }
    });

    // Fill in data for each athlete
    selectedAthletes.forEach(athleteId => {
      const athleteDataForId = athleteData.filter(d => d.athleteId === athleteId);
      const dataMap = new Map<string, number>();
      athleteDataForId.forEach(d => dataMap.set(d.date, d.trainingLoad));

      const calendar: CalendarDay[] = [];
      for (let i = 0; i < 28; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        calendar.push({
          date: dateStr,
          value: dataMap.has(dateStr) ? dataMap.get(dateStr)! : null,
          athleteId: athleteId,
          athleteName: athleteCalendars[athleteId].athleteName
        });
      }

      athleteCalendars[athleteId].days = calendar;
    });

    return athleteCalendars;
  }, [athleteData, selectedAthletes, athletes]);

  // Get color based on training load value
  const getColor = (value: number | null) => {
    if (value === null) return 'bg-gray-100';
    if (value >= 90) return 'bg-red-500';
    if (value >= 80) return 'bg-orange-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  // Group calendar data by weeks for each athlete
  const athleteWeeks = useMemo(() => {
    const athleteWeeksMap: { [athleteId: string]: { athleteName: string; weeks: CalendarDay[][] } } = {};

    Object.entries(athleteCalendarData).forEach(([athleteId, athleteData]) => {
      const weeksArray: CalendarDay[][] = [];
      for (let i = 0; i < athleteData.days.length; i += 7) {
        weeksArray.push(athleteData.days.slice(i, i + 7));
      }
      athleteWeeksMap[athleteId] = {
        athleteName: athleteData.athleteName,
        weeks: weeksArray
      };
    });

    return athleteWeeksMap;
  }, [athleteCalendarData]);

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Load Heatmap</h2>
        <p className="text-gray-600 mb-6">Visualize training intensity distribution over time</p>
        
        {/* Athlete Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Athletes</h3>
          <div className="flex flex-wrap gap-2">
            {athletes.map(athlete => {
              const isSelected = selectedAthletes.includes(athlete.athlete_id);
              return (
                <button
                  key={athlete.athlete_id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      // Remove athlete if already selected (but keep at least one)
                      if (selectedAthletes.length > 1) {
                        setSelectedAthletes(selectedAthletes.filter(id => id !== athlete.athlete_id));
                      }
                    } else {
                      // Add athlete if not selected
                      setSelectedAthletes([...selectedAthletes, athlete.athlete_id]);
                    }
                  }}
                >
                  {athlete.name}
                  {isSelected && <span className="ml-1">✓</span>}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {selectedAthletes.length} athlete{selectedAthletes.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'calendar'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar View
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'grid'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
          </div>
        </div>
        
        {/* Calendar Heatmap - 28-Day Timeline */}
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly Training Load</h3>
              <p className="text-sm text-gray-600">Last 28 days • Each square represents one day</p>
            </div>

            {/* Month Labels */}
            <div className="flex justify-center mb-4 relative">
              <div className="flex text-xs text-gray-500 font-medium w-full">
                {(() => {
                  const months: Array<{ month: string; position: number }> = [];
                  const today = new Date();
                  for (let i = 27; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const month = date.toLocaleDateString('en-US', { month: 'short' });
                    if (i === 27 || (i < 27 && months[months.length - 1]?.month !== month)) {
                      months.push({ month, position: 27 - i });
                    }
                  }
                  return months.map(({ month, position }) => (
                    <div
                      key={month + position}
                      className="absolute text-xs text-gray-500 font-medium"
                      style={{ left: `${(position / 27) * 100}%` }}
                    >
                      {month}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Athlete Labels (left side) */}
                  <div className="flex">
                    <div className="w-24 flex flex-col justify-around pr-4">
                      {selectedAthletes.map(athleteId => {
                        const athlete = athletes.find(a => a.athlete_id === athleteId);
                        return (
                          <div key={athleteId} className="h-6 flex items-center">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {athlete?.name.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline Grid */}
                    <div className="flex flex-col space-y-2">
                      {selectedAthletes.map(athleteId => {
                        const athlete = athletes.find(a => a.athlete_id === athleteId);
                        const athleteData = athleteCalendarData[athleteId];

                        return (
                          <div key={athleteId} className="flex items-center space-x-1">
                            {athleteData.days.map((day, index) => (
                              <div
                                key={`${athleteId}-${index}`}
                                className={`w-5 h-5 rounded-sm border border-gray-200 transition-all hover:ring-2 hover:ring-blue-300 hover:scale-125 ${
                                  day.value !== null
                                    ? getColor(day.value) + ' shadow-sm'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                title={`${athlete?.name} - ${day.date}: ${
                                  day.value !== null ? `${day.value}% training load` : 'No data'
                                }`}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm mr-2"></div>
                <span className="text-gray-600">No data</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                <span className="text-gray-600">Low (0-49%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                <span className="text-gray-600">Moderate (50-69%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div>
                <span className="text-gray-600">High (70-79%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></div>
                <span className="text-gray-600">Very High (80-100%)</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Grid View - Compact Cards */}
        {viewMode === 'grid' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Training Sessions</h3>
              <p className="text-sm text-gray-600">Latest training load data for selected athletes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedAthletes.map(athleteId => {
                const athlete = athletes.find(a => a.athlete_id === athleteId);
                const athleteSpecificData = athleteData
                  .filter(data => data.athleteId === athleteId)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 6);

                return (
                  <div key={athleteId} className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* Athlete Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <h3 className="text-lg font-semibold text-gray-900">{athlete?.name}</h3>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {athleteSpecificData.length} sessions
                      </span>
                    </div>

                    {/* Training Load Mini Chart */}
                    <div className="mb-4">
                      <div className="flex items-end space-x-1 h-16">
                        {athleteSpecificData.slice(0, 14).reverse().map((data, index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                              data.trainingLoad >= 90 ? 'bg-red-500' :
                              data.trainingLoad >= 80 ? 'bg-orange-500' :
                              data.trainingLoad >= 70 ? 'bg-yellow-500' :
                              data.trainingLoad >= 60 ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}
                            style={{ height: `${Math.max(20, (data.trainingLoad / 100) * 100)}%` }}
                            title={`${data.date}: ${data.trainingLoad}%`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">Last 2 weeks</div>
                    </div>

                    {/* Recent Sessions */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {athleteSpecificData.slice(0, 14).map((data, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <div className="text-sm text-gray-700">
                            {new Date(data.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            data.trainingLoad >= 90 ? 'bg-red-100 text-red-800' :
                            data.trainingLoad >= 80 ? 'bg-orange-100 text-orange-800' :
                            data.trainingLoad >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            data.trainingLoad >= 60 ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {data.trainingLoad}%
                          </div>
                        </div>
                      ))}
                    </div>

                    {athleteSpecificData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No training data available</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Load Intensity</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">0-49% Low</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">50-59% Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">60-69% Moderate-High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">70-79% High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">80-100% Very High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span className="text-sm text-gray-600">No Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};