import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface TrainingLoadTrend {
  trend_id: number;
  athlete_id: number;
  week_start_date: string;
  average_load: number;
  load_trend: string;
  trend_value: number;
  created_date: string;
}

export const TrainingLoadTrendsAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [trainingLoadTrends, setTrainingLoadTrends] = useState<TrainingLoadTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<TrainingLoadTrend | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    week_start_date: '',
    average_load: 0,
    load_trend: 'stable',
    trend_value: 0
  });

  // Lookup data to display athlete name/code instead of numeric ID
  const [athletes, setAthletes] = useState<any[]>([]);
  const fetchLookups = async () => {
    try {
      const list = await apiGet<any[]>('/athletes');
      setAthletes(list || []);
    } catch (e) {
      console.error('Error fetching athletes lookup:', e);
    }
  };

  const athleteNameById = React.useMemo(() => {
    const map: Record<number | string, string> = {};
    athletes.forEach((a: any) => {
      const fullName =
        a?.name ||
        [a?.first_name, a?.last_name].filter(Boolean).join(' ').trim();
      const code = a?.athlete_code ?? a?.athlete_id;
      const label = fullName ? `${fullName} (${code})` : String(code ?? a?.athlete_id);
      const key =
        typeof a?.athlete_id === 'number'
          ? a.athlete_id
          : parseInt(a?.athlete_id, 10) || a?.athlete_id;
      map[key] = label;
    });
    return map;
  }, [athletes]);

  useEffect(() => {
    fetchTrainingLoadTrends();
    fetchLookups();
  }, []);

  const fetchTrainingLoadTrends = async () => {
    try {
      const data = await apiGet<TrainingLoadTrend[]>('/admin/training-load-trends');
      setTrainingLoadTrends(data);
    } catch (error) {
      console.error('Error fetching training load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        week_start_date: formData.week_start_date,
        average_load: formData.average_load,
        load_trend: formData.load_trend,
        trend_value: formData.trend_value
      };

      if (editingTrend) {
        await apiPut(`/admin/training-load-trends/${editingTrend.trend_id}`, submitData);
      } else {
        await apiPost('/admin/training-load-trends', submitData);
      }

      fetchTrainingLoadTrends();
      resetForm();
    } catch (error) {
      console.error('Error saving training load trend:', error);
      alert('Error saving training load trend');
    }
  };

  const handleDelete = async (trendId: number) => {
    if (!confirm('Are you sure you want to delete this training load trend?')) return;

    try {
      await apiDelete(`/admin/training-load-trends/${trendId}`);
      fetchTrainingLoadTrends();
    } catch (error) {
      console.error('Error deleting training load trend:', error);
      alert('Error deleting training load trend');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      week_start_date: '',
      average_load: 0,
      load_trend: 'stable',
      trend_value: 0
    });
    setEditingTrend(null);
    setShowForm(false);
  };

  const startEdit = (trend: TrainingLoadTrend) => {
    setFormData({
      athlete_id: trend.athlete_id,
      week_start_date: trend.week_start_date,
      average_load: trend.average_load,
      load_trend: trend.load_trend,
      trend_value: trend.trend_value
    });
    setEditingTrend(trend);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading training load trends...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Training Load Trends Management</h2>
          {onNavigate && (
            <button
              onClick={() => onNavigate('overview')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Back to Overview
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add Training Load Trend
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingTrend ? 'Edit Training Load Trend' : 'Add New Training Load Trend'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Athlete ID *</label>
                <input
                  type="number"
                  value={formData.athlete_id || ''}
                  onChange={(e) => setFormData({...formData, athlete_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Week Start Date *</label>
                <input
                  type="date"
                  value={formData.week_start_date}
                  onChange={(e) => setFormData({...formData, week_start_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Average Load *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.average_load || ''}
                  onChange={(e) => setFormData({...formData, average_load: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Load Trend *</label>
                <select
                  value={formData.load_trend}
                  onChange={(e) => setFormData({...formData, load_trend: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                >
                  <option value="increasing">Increasing</option>
                  <option value="decreasing">Decreasing</option>
                  <option value="stable">Stable</option>
                  <option value="new">New</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Trend Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.trend_value || ''}
                  onChange={(e) => setFormData({...formData, trend_value: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingTrend ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/20 rounded-lg overflow-hidden">
        <table className="w-full text-white">
          <thead className="bg-white/30">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Athlete</th>
              <th className="px-4 py-2 text-left">Week Start</th>
              <th className="px-4 py-2 text-left">Average Load</th>
              <th className="px-4 py-2 text-left">Load Trend</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainingLoadTrends.map((trend) => (
              <tr key={trend.trend_id} className="border-t border-white/20">
                <td className="px-4 py-2">{trend.trend_id}</td>
                <td className="px-4 py-2">{athleteNameById[trend.athlete_id] || trend.athlete_id}</td>
                <td className="px-4 py-2">{new Date(trend.week_start_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{trend.average_load.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    trend.load_trend === 'increasing' ? 'bg-green-600' :
                    trend.load_trend === 'decreasing' ? 'bg-red-600' :
                    trend.load_trend === 'stable' ? 'bg-blue-600' : 'bg-yellow-600'
                  }`}>
                    {trend.load_trend}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(trend)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(trend.trend_id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
