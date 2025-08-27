import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface BiometricData {
  biometric_id: number;
  athlete_id: number;
  measurement_date: string;
  hrv_night: number;
  resting_hr: number;
  spo2_night: number;
  respiratory_rate_night: number;
  deep_sleep_percent: number;
  rem_sleep_percent: number;
  light_sleep_percent: number;
  sleep_duration_hours: number;
  body_temperature: number;
  training_load_percent: number;
  sleep_onset_time: string;
  wake_time: string;
  data_source: string;
  data_quality: string;
  notes: string;
  created_date: string;
  modified_date: string;
}

export const BiometricDataAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<BiometricData | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    measurement_date: '',
    hrv_night: 0,
    resting_hr: 0,
    spo2_night: 0,
    respiratory_rate_night: 0,
    deep_sleep_percent: 0,
    rem_sleep_percent: 0,
    light_sleep_percent: 0,
    sleep_duration_hours: 0,
    body_temperature: 0,
    training_load_percent: 0,
    sleep_onset_time: '',
    wake_time: '',
    data_source: '',
    data_quality: 'Good',
    notes: ''
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
    fetchBiometricData();
    fetchLookups();
  }, []);

  const fetchBiometricData = async () => {
    try {
      const data = await apiGet<BiometricData[]>('/admin/biometric-data');
      setBiometricData(data);
    } catch (error) {
      console.error('Error fetching biometric data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        measurement_date: formData.measurement_date,
        hrv_night: formData.hrv_night,
        resting_hr: formData.resting_hr,
        spo2_night: formData.spo2_night,
        respiratory_rate_night: formData.respiratory_rate_night,
        deep_sleep_percent: formData.deep_sleep_percent,
        rem_sleep_percent: formData.rem_sleep_percent,
        light_sleep_percent: formData.light_sleep_percent,
        sleep_duration_hours: formData.sleep_duration_hours,
        body_temperature: formData.body_temperature,
        training_load_percent: formData.training_load_percent,
        sleep_onset_time: formData.sleep_onset_time,
        wake_time: formData.wake_time,
        data_source: formData.data_source,
        data_quality: formData.data_quality,
        notes: formData.notes
      };

      if (editingData) {
        await apiPut(`/admin/biometric-data/${editingData.biometric_id}`, submitData);
      } else {
        await apiPost('/admin/biometric-data', submitData);
      }

      fetchBiometricData();
      resetForm();
    } catch (error) {
      console.error('Error saving biometric data:', error);
      alert('Error saving biometric data');
    }
  };

  const handleDelete = async (biometricId: number) => {
    if (!confirm('Are you sure you want to delete this biometric data record?')) return;

    try {
      await apiDelete(`/admin/biometric-data/${biometricId}`);
      fetchBiometricData();
    } catch (error) {
      console.error('Error deleting biometric data:', error);
      alert('Error deleting biometric data');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      measurement_date: '',
      hrv_night: 0,
      resting_hr: 0,
      spo2_night: 0,
      respiratory_rate_night: 0,
      deep_sleep_percent: 0,
      rem_sleep_percent: 0,
      light_sleep_percent: 0,
      sleep_duration_hours: 0,
      body_temperature: 0,
      training_load_percent: 0,
      sleep_onset_time: '',
      wake_time: '',
      data_source: '',
      data_quality: 'Good',
      notes: ''
    });
    setEditingData(null);
    setShowForm(false);
  };

  const startEdit = (data: BiometricData) => {
    setFormData({
      athlete_id: data.athlete_id,
      measurement_date: data.measurement_date,
      hrv_night: data.hrv_night,
      resting_hr: data.resting_hr,
      spo2_night: data.spo2_night,
      respiratory_rate_night: data.respiratory_rate_night,
      deep_sleep_percent: data.deep_sleep_percent,
      rem_sleep_percent: data.rem_sleep_percent,
      light_sleep_percent: data.light_sleep_percent,
      sleep_duration_hours: data.sleep_duration_hours,
      body_temperature: data.body_temperature,
      training_load_percent: data.training_load_percent,
      sleep_onset_time: data.sleep_onset_time,
      wake_time: data.wake_time,
      data_source: data.data_source,
      data_quality: data.data_quality,
      notes: data.notes
    });
    setEditingData(data);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading biometric data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Biometric Data Management</h2>
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
          Add Biometric Data
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingData ? 'Edit Biometric Data' : 'Add New Biometric Data'}
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
                <label className="block text-white mb-2">Measurement Date *</label>
                <input
                  type="date"
                  value={formData.measurement_date}
                  onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">HRV Night (ms)</label>
                <input
                  type="number"
                  value={formData.hrv_night || ''}
                  onChange={(e) => setFormData({...formData, hrv_night: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Resting HR (bpm)</label>
                <input
                  type="number"
                  value={formData.resting_hr || ''}
                  onChange={(e) => setFormData({...formData, resting_hr: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">SpO2 Night (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.spo2_night || ''}
                  onChange={(e) => setFormData({...formData, spo2_night: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Respiratory Rate Night</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.respiratory_rate_night || ''}
                  onChange={(e) => setFormData({...formData, respiratory_rate_night: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Deep Sleep (%)</label>
                <input
                  type="number"
                  value={formData.deep_sleep_percent || ''}
                  onChange={(e) => setFormData({...formData, deep_sleep_percent: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">REM Sleep (%)</label>
                <input
                  type="number"
                  value={formData.rem_sleep_percent || ''}
                  onChange={(e) => setFormData({...formData, rem_sleep_percent: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Light Sleep (%)</label>
                <input
                  type="number"
                  value={formData.light_sleep_percent || ''}
                  onChange={(e) => setFormData({...formData, light_sleep_percent: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sleep Duration (hours)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sleep_duration_hours || ''}
                  onChange={(e) => setFormData({...formData, sleep_duration_hours: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Body Temperature (°C)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.body_temperature || ''}
                  onChange={(e) => setFormData({...formData, body_temperature: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Training Load (%)</label>
                <input
                  type="number"
                  value={formData.training_load_percent || ''}
                  onChange={(e) => setFormData({...formData, training_load_percent: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sleep Onset Time</label>
                <input
                  type="time"
                  value={formData.sleep_onset_time}
                  onChange={(e) => setFormData({...formData, sleep_onset_time: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Wake Time</label>
                <input
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => setFormData({...formData, wake_time: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Data Source</label>
                <input
                  type="text"
                  value={formData.data_source}
                  onChange={(e) => setFormData({...formData, data_source: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Data Quality</label>
                <select
                  value={formData.data_quality}
                  onChange={(e) => setFormData({...formData, data_quality: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30 h-24"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingData ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">HRV</th>
              <th className="px-4 py-2 text-left">Resting HR</th>
              <th className="px-4 py-2 text-left">SpO2</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {biometricData.map((data) => (
              <tr key={data.biometric_id} className="border-t border-white/20">
                <td className="px-4 py-2">{data.biometric_id}</td>
                <td className="px-4 py-2">{athleteNameById[data.athlete_id] || data.athlete_id}</td>
                <td className="px-4 py-2">{new Date(data.measurement_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{data.hrv_night}</td>
                <td className="px-4 py-2">{data.resting_hr}</td>
                <td className="px-4 py-2">{data.spo2_night.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(data)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(data.biometric_id)}
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
