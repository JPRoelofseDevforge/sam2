import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface AthleteOrganizationHistory {
  athlete_org_history_id: number;
  athlete_id: number;
  organization_id: number;
  sport_id: number;
  position: string;
  jersey_number: number;
  start_date: string;
  end_date: string;
  contract_type: string;
  is_active: boolean;
  created_date: string;
}

export const AthleteOrganizationHistoryAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [athleteOrgHistory, setAthleteOrgHistory] = useState<AthleteOrganizationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<AthleteOrganizationHistory | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    organization_id: 0,
    sport_id: 0,
    position: '',
    jersey_number: 0,
    start_date: '',
    end_date: '',
    contract_type: '',
    is_active: true
  });

  // Lookup datasets for displaying FK names instead of IDs
  const [athletes, setAthletes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);

  const fetchLookups = async () => {
    try {
      const [athletesData, orgsData, sportsData] = await Promise.all([
        apiGet<any[]>('/athletes'),
        apiGet<any[]>('/organizations'),
        apiGet<any[]>('/sports'),
      ]);
      setAthletes(athletesData || []);
      setOrganizations(orgsData || []);
      setSports(sportsData || []);
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

  const orgNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    organizations.forEach((o: any) => {
      map[o.organization_id] = o.organization_name || String(o.organization_id);
    });
    return map;
  }, [organizations]);

  const sportNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    sports.forEach((s: any) => {
      map[s.sport_id] = s.sport_name || String(s.sport_id);
    });
    return map;
  }, [sports]);

  useEffect(() => {
    fetchAthleteOrgHistory();
    fetchLookups();
  }, []);

  const fetchAthleteOrgHistory = async () => {
    try {
      const data = await apiGet<AthleteOrganizationHistory[]>('/admin/athlete-organization-history');
      setAthleteOrgHistory(data);
    } catch (error) {
      console.error('Error fetching athlete organization history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        organization_id: formData.organization_id,
        sport_id: formData.sport_id,
        position: formData.position,
        jersey_number: formData.jersey_number,
        start_date: formData.start_date,
        end_date: formData.end_date,
        contract_type: formData.contract_type,
        is_active: formData.is_active
      };

      if (editingHistory) {
        await apiPut(`/admin/athlete-organization-history/${editingHistory.athlete_org_history_id}`, submitData);
      } else {
        await apiPost('/admin/athlete-organization-history', submitData);
      }

      fetchAthleteOrgHistory();
      resetForm();
    } catch (error) {
      console.error('Error saving athlete organization history:', error);
      alert('Error saving athlete organization history');
    }
  };

  const handleDelete = async (historyId: number) => {
    if (!confirm('Are you sure you want to delete this athlete organization history record?')) return;

    try {
      await apiDelete(`/admin/athlete-organization-history/${historyId}`);
      fetchAthleteOrgHistory();
    } catch (error) {
      console.error('Error deleting athlete organization history:', error);
      alert('Error deleting athlete organization history');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      organization_id: 0,
      sport_id: 0,
      position: '',
      jersey_number: 0,
      start_date: '',
      end_date: '',
      contract_type: '',
      is_active: true
    });
    setEditingHistory(null);
    setShowForm(false);
  };

  const startEdit = (history: AthleteOrganizationHistory) => {
    setFormData({
      athlete_id: history.athlete_id,
      organization_id: history.organization_id,
      sport_id: history.sport_id,
      position: history.position,
      jersey_number: history.jersey_number,
      start_date: history.start_date,
      end_date: history.end_date,
      contract_type: history.contract_type,
      is_active: history.is_active
    });
    setEditingHistory(history);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading athlete organization history...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Athlete Organization History Management</h2>
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
          Add History Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingHistory ? 'Edit History Record' : 'Add New History Record'}
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
                <label className="block text-white mb-2">Organization ID *</label>
                <input
                  type="number"
                  value={formData.organization_id || ''}
                  onChange={(e) => setFormData({...formData, organization_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sport ID *</label>
                <input
                  type="number"
                  value={formData.sport_id || ''}
                  onChange={(e) => setFormData({...formData, sport_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Jersey Number</label>
                <input
                  type="number"
                  value={formData.jersey_number || ''}
                  onChange={(e) => setFormData({...formData, jersey_number: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Contract Type</label>
                <input
                  type="text"
                  value={formData.contract_type}
                  onChange={(e) => setFormData({...formData, contract_type: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-white">Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingHistory ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Organization</th>
              <th className="px-4 py-2 text-left">Sport</th>
              <th className="px-4 py-2 text-left">Position</th>
              <th className="px-4 py-2 text-left">Start Date</th>
              <th className="px-4 py-2 text-left">End Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {athleteOrgHistory.map((history) => (
              <tr key={history.athlete_org_history_id} className="border-t border-white/20">
                <td className="px-4 py-2">{history.athlete_org_history_id}</td>
                <td className="px-4 py-2">{athleteNameById[history.athlete_id] || history.athlete_id}</td>
                <td className="px-4 py-2">{orgNameById[history.organization_id] || history.organization_id}</td>
                <td className="px-4 py-2">{sportNameById[history.sport_id] || history.sport_id}</td>
                <td className="px-4 py-2">{history.position}</td>
                <td className="px-4 py-2">{new Date(history.start_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{history.end_date ? new Date(history.end_date).toLocaleDateString() : 'Current'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${history.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {history.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(history)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(history.athlete_org_history_id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    disabled={!history.is_active}
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
