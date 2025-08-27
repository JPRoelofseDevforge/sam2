import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface AthleteAlert {
  alert_id: number;
  athlete_id: number;
  alert_type_id: number;
  alert_title: string;
  alert_cause: string;
  recommendation: string;
  alert_date: string;
  is_resolved: boolean;
  resolved_date: string;
  resolved_by_user_id: number;
  notes: string;
}

export const AthleteAlertsAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [athleteAlerts, setAthleteAlerts] = useState<AthleteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AthleteAlert | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    alert_type_id: 0,
    alert_title: '',
    alert_cause: '',
    recommendation: '',
    alert_date: '',
    is_resolved: false,
    resolved_date: '',
    resolved_by_user_id: 0,
    notes: ''
  });

  // Lookup datasets for displaying FK names instead of IDs
  const [athletes, setAthletes] = useState<any[]>([]);
  const [alertTypes, setAlertTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const fetchLookups = async () => {
    try {
      const [athletesData, alertTypesData, usersData] = await Promise.all([
        apiGet<any[]>('/athletes'),
        apiGet<any[]>('/admin/alert-types'),
        apiGet<any[]>('/users'),
      ]);
      setAthletes(athletesData || []);
      setAlertTypes(alertTypesData || []);
      setUsers(usersData || []);
    } catch (e) {
      console.error('Error fetching lookup data:', e);
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

  const alertTypeNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    alertTypes.forEach((t: any) => {
      map[t.alert_type_id] = t.alert_type_name || String(t.alert_type_id);
    });
    return map;
  }, [alertTypes]);

  const userNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    users.forEach((u: any) => {
      const fullName = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
      map[u.user_id] = fullName || u?.username || String(u?.user_id);
    });
    return map;
  }, [users]);

  useEffect(() => {
    fetchAthleteAlerts();
    fetchLookups();
  }, []);

  const fetchAthleteAlerts = async () => {
    try {
      const data = await apiGet<AthleteAlert[]>('/admin/athlete-alerts');
      setAthleteAlerts(data);
    } catch (error) {
      console.error('Error fetching athlete alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        alert_type_id: formData.alert_type_id,
        alert_title: formData.alert_title,
        alert_cause: formData.alert_cause,
        recommendation: formData.recommendation,
        alert_date: formData.alert_date,
        is_resolved: formData.is_resolved,
        resolved_date: formData.resolved_date || null,
        resolved_by_user_id: formData.resolved_by_user_id || null,
        notes: formData.notes
      };

      if (editingAlert) {
        await apiPut(`/admin/athlete-alerts/${editingAlert.alert_id}`, submitData);
      } else {
        await apiPost('/admin/athlete-alerts', submitData);
      }

      fetchAthleteAlerts();
      resetForm();
    } catch (error) {
      console.error('Error saving athlete alert:', error);
      alert('Error saving athlete alert');
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this athlete alert?')) return;

    try {
      await apiDelete(`/admin/athlete-alerts/${alertId}`);
      fetchAthleteAlerts();
    } catch (error) {
      console.error('Error deleting athlete alert:', error);
      alert('Error deleting athlete alert');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      alert_type_id: 0,
      alert_title: '',
      alert_cause: '',
      recommendation: '',
      alert_date: '',
      is_resolved: false,
      resolved_date: '',
      resolved_by_user_id: 0,
      notes: ''
    });
    setEditingAlert(null);
    setShowForm(false);
  };

  const startEdit = (alert: AthleteAlert) => {
    setFormData({
      athlete_id: alert.athlete_id,
      alert_type_id: alert.alert_type_id,
      alert_title: alert.alert_title,
      alert_cause: alert.alert_cause,
      recommendation: alert.recommendation,
      alert_date: alert.alert_date,
      is_resolved: alert.is_resolved,
      resolved_date: alert.resolved_date,
      resolved_by_user_id: alert.resolved_by_user_id,
      notes: alert.notes
    });
    setEditingAlert(alert);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading athlete alerts...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Athlete Alerts Management</h2>
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
          Add Athlete Alert
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingAlert ? 'Edit Athlete Alert' : 'Add New Athlete Alert'}
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
                <label className="block text-white mb-2">Alert Type ID *</label>
                <input
                  type="number"
                  value={formData.alert_type_id || ''}
                  onChange={(e) => setFormData({...formData, alert_type_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Alert Title *</label>
                <input
                  type="text"
                  value={formData.alert_title}
                  onChange={(e) => setFormData({...formData, alert_title: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Alert Cause</label>
                <textarea
                  value={formData.alert_cause}
                  onChange={(e) => setFormData({...formData, alert_cause: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30 h-24"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Recommendation</label>
                <textarea
                  value={formData.recommendation}
                  onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30 h-24"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Alert Date *</label>
                <input
                  type="date"
                  value={formData.alert_date}
                  onChange={(e) => setFormData({...formData, alert_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_resolved"
                  checked={formData.is_resolved}
                  onChange={(e) => setFormData({...formData, is_resolved: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_resolved" className="text-white">Is Resolved</label>
              </div>
              {formData.is_resolved && (
                <>
                  <div>
                    <label className="block text-white mb-2">Resolved Date</label>
                    <input
                      type="date"
                      value={formData.resolved_date}
                      onChange={(e) => setFormData({...formData, resolved_date: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Resolved By User ID</label>
                    <input
                      type="number"
                      value={formData.resolved_by_user_id || ''}
                      onChange={(e) => setFormData({...formData, resolved_by_user_id: parseInt(e.target.value) || 0})}
                      className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    />
                  </div>
                </>
              )}
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
                {editingAlert ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {athleteAlerts.map((alert) => (
              <tr key={alert.alert_id} className="border-t border-white/20">
                <td className="px-4 py-2">{alert.alert_id}</td>
                <td className="px-4 py-2">{athleteNameById[alert.athlete_id] || alert.athlete_id}</td>
                <td className="px-4 py-2">{alert.alert_title}</td>
                <td className="px-4 py-2">{new Date(alert.alert_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    alert.is_resolved ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {alert.is_resolved ? 'Resolved' : 'Unresolved'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(alert)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(alert.alert_id)}
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
