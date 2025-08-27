import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface ReadinessScore {
  readiness_score_id: number;
  athlete_id: number;
  score_date: string;
  readiness_score: number;
  hrv_score: number;
  resting_hr_score: number;
  sleep_score: number;
  spo2_score: number;
  calculation_method: string;
  created_date: string;
}

export const ReadinessScoresAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [readinessScores, setReadinessScores] = useState<ReadinessScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScore, setEditingScore] = useState<ReadinessScore | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    score_date: '',
    readiness_score: 0,
    hrv_score: 0,
    resting_hr_score: 0,
    sleep_score: 0,
    spo2_score: 0,
    calculation_method: ''
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
    fetchReadinessScores();
    fetchLookups();
  }, []);

  const fetchReadinessScores = async () => {
    try {
      const data = await apiGet<ReadinessScore[]>('/admin/readiness-scores');
      setReadinessScores(data);
    } catch (error) {
      console.error('Error fetching readiness scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        score_date: formData.score_date,
        readiness_score: formData.readiness_score,
        hrv_score: formData.hrv_score,
        resting_hr_score: formData.resting_hr_score,
        sleep_score: formData.sleep_score,
        spo2_score: formData.spo2_score,
        calculation_method: formData.calculation_method
      };

      if (editingScore) {
        await apiPut(`/admin/readiness-scores/${editingScore.readiness_score_id}`, submitData);
      } else {
        await apiPost('/admin/readiness-scores', submitData);
      }

      fetchReadinessScores();
      resetForm();
    } catch (error) {
      console.error('Error saving readiness score:', error);
      alert('Error saving readiness score');
    }
  };

  const handleDelete = async (scoreId: number) => {
    if (!confirm('Are you sure you want to delete this readiness score?')) return;

    try {
      await apiDelete(`/admin/readiness-scores/${scoreId}`);
      fetchReadinessScores();
    } catch (error) {
      console.error('Error deleting readiness score:', error);
      alert('Error deleting readiness score');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      score_date: '',
      readiness_score: 0,
      hrv_score: 0,
      resting_hr_score: 0,
      sleep_score: 0,
      spo2_score: 0,
      calculation_method: ''
    });
    setEditingScore(null);
    setShowForm(false);
  };

  const startEdit = (score: ReadinessScore) => {
    setFormData({
      athlete_id: score.athlete_id,
      score_date: score.score_date,
      readiness_score: score.readiness_score,
      hrv_score: score.hrv_score,
      resting_hr_score: score.resting_hr_score,
      sleep_score: score.sleep_score,
      spo2_score: score.spo2_score,
      calculation_method: score.calculation_method
    });
    setEditingScore(score);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading readiness scores...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Readiness Scores Management</h2>
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
          Add Readiness Score
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingScore ? 'Edit Readiness Score' : 'Add New Readiness Score'}
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
                <label className="block text-white mb-2">Score Date *</label>
                <input
                  type="date"
                  value={formData.score_date}
                  onChange={(e) => setFormData({...formData, score_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Readiness Score *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.readiness_score || ''}
                  onChange={(e) => setFormData({...formData, readiness_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">HRV Score</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hrv_score || ''}
                  onChange={(e) => setFormData({...formData, hrv_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Resting HR Score</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resting_hr_score || ''}
                  onChange={(e) => setFormData({...formData, resting_hr_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sleep Score</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sleep_score || ''}
                  onChange={(e) => setFormData({...formData, sleep_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">SpO2 Score</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.spo2_score || ''}
                  onChange={(e) => setFormData({...formData, spo2_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Calculation Method</label>
                <input
                  type="text"
                  value={formData.calculation_method}
                  onChange={(e) => setFormData({...formData, calculation_method: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingScore ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Readiness Score</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {readinessScores.map((score) => (
              <tr key={score.readiness_score_id} className="border-t border-white/20">
                <td className="px-4 py-2">{score.readiness_score_id}</td>
                <td className="px-4 py-2">{athleteNameById[score.athlete_id] || score.athlete_id}</td>
                <td className="px-4 py-2">{new Date(score.score_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{score.readiness_score.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(score)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(score.readiness_score_id)}
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
