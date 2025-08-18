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
}

export const TrainingLoadHeatmap: React.FC = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<string>(athletes[0].athlete_id);
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

  // Get data for selected athlete
  const athleteData = useMemo<HeatmapData[]>(() => {
    return heatmapData.filter(data => data.athleteId === selectedAthlete);
  }, [heatmapData, selectedAthlete]);

  // Generate calendar data for the last 90 days
  const calendarData = useMemo<CalendarDay[]>(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 89); // 90 days including today
    
    const dataMap = new Map<string, number>();
    athleteData.forEach(d => {
      dataMap.set(d.date, d.trainingLoad);
    });
    
    const calendar: CalendarDay[] = [];
    for (let i = 0; i < 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      calendar.push({
        date: dateStr,
        value: dataMap.has(dateStr) ? dataMap.get(dateStr)! : null,
        athleteId: selectedAthlete
      });
    }
    
    return calendar;
  }, [athleteData, selectedAthlete]);

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

  // Group calendar data by weeks
  const weeks = useMemo(() => {
    const weeksArray: CalendarDay[][] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      weeksArray.push(calendarData.slice(i, i + 7));
    }
    return weeksArray;
  }, [calendarData]);

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Load Heatmap</h2>
        <p className="text-gray-600 mb-6">Visualize training intensity distribution over time</p>
        
        {/* Athlete Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Athlete</h3>
          <div className="flex flex-wrap gap-2">
            {athletes.map(athlete => (
              <button
                key={athlete.athlete_id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedAthlete === athlete.athlete_id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedAthlete(athlete.athlete_id)}
              >
                {athlete.name}
              </button>
            ))}
          </div>
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
        
        {/* Calendar Heatmap */}
        {viewMode === 'calendar' && (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex items-center mb-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-12 h-6 text-xs text-gray-500 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                  </div>
                ))}
              </div>
              
              <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-12 h-12 flex items-center justify-center text-xs border border-white ${
                          day.value !== null 
                            ? getColor(day.value) + ' text-white font-medium' 
                            : 'bg-gray-100'
                        }`}
                        title={`${day.date}: ${day.value !== null ? day.value + '%' : 'No data'}`}
                      >
                        {new Date(day.date).getDate()}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athleteData
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 12)
              .map((data, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(data.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <p className="text-sm text-gray-500">{data.athleteName}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.trainingLoad >= 90 ? 'bg-red-100 text-red-800' :
                      data.trainingLoad >= 80 ? 'bg-orange-100 text-orange-800' :
                      data.trainingLoad >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      data.trainingLoad >= 60 ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {data.trainingLoad}%
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          data.trainingLoad >= 90 ? 'bg-red-500' :
                          data.trainingLoad >= 80 ? 'bg-orange-500' :
                          data.trainingLoad >= 70 ? 'bg-yellow-500' :
                          data.trainingLoad >= 60 ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${data.trainingLoad}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {data.trainingLoad >= 90 ? 'Very High Load' :
                     data.trainingLoad >= 80 ? 'High Load' :
                     data.trainingLoad >= 70 ? 'Moderate-High Load' :
                     data.trainingLoad >= 60 ? 'Moderate Load' :
                     'Low Load'}
                  </div>
                </div>
              ))}
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