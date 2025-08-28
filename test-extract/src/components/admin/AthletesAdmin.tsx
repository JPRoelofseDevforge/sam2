import React, { useState, useEffect } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface Athlete {
  athlete_id: number;
  athlete_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  height?: number;
  nationality?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  is_active: boolean;
}

export const AthletesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState({
    athlete_code: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'M' as 'M' | 'F' | 'O',
    height: '',
    nationality: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    is_active: true
  });

  const { data: athletesData = [], loading, error, refetch: fetchAthletes } = useAdminApi<any[]>('/athletes');

  // Transform data to match our interface
  const athletes = athletesData ? athletesData.map((athlete: any) => ({
    athlete_id: parseInt(athlete.athlete_id),
    athlete_code: athlete.athlete_id,
    first_name: athlete.name ? athlete.name.split(' ')[0] || '' : '',
    last_name: athlete.name ? (athlete.name.split(' ').slice(1).join(' ') || '') : '',
    date_of_birth: athlete.date_of_birth,
    gender: 'M' as 'M' | 'F' | 'O',
    height: undefined,
    nationality: undefined,
    emergency_contact_name: undefined,
    emergency_contact_phone: undefined,
    medical_notes: undefined,
    is_active: true
  })) : [];

  useEffect(() => {
    if (error) {
      console.error('Error fetching athletes:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        height: formData.height ? parseFloat(formData.height) : undefined
      };

      if (editingAthlete) {
        await apiPut(`/admin/athletes/${editingAthlete.athlete_code}`, submitData);
      } else {
        await apiPost('/admin/athletes', submitData);
      }
      fetchAthletes();
      resetForm();
    } catch (error) {
      console.error('Error saving athlete:', error);
    }
  };

  const handleDelete = async (athleteCode: string) => {
    if (!confirm('Are you sure you want to delete this athlete?')) return;

    try {
      await apiDelete(`/admin/athletes/${athleteCode}`);
      fetchAthletes();
    } catch (error) {
      console.error('Error deleting athlete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_code: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'M',
      height: '',
      nationality: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_notes: '',
      is_active: true
    });
    setEditingAthlete(null);
    setShowForm(false);
  };

  const startEdit = (athlete: Athlete) => {
    setFormData({
      athlete_code: athlete.athlete_code,
      first_name: athlete.first_name,
      last_name: athlete.last_name,
      date_of_birth: athlete.date_of_birth,
      gender: athlete.gender,
      height: athlete.height?.toString() || '',
      nationality: athlete.nationality || '',
      emergency_contact_name: athlete.emergency_contact_name || '',
      emergency_contact_phone: athlete.emergency_contact_phone || '',
      medical_notes: athlete.medical_notes || '',
      is_active: athlete.is_active
    });
    setEditingAthlete(athlete);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading athletes...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Athletes Management</h2>
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
          Add Athlete
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingAthlete ? 'Edit Athlete' : 'Add New Athlete'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Athlete Code *</label>
                <input
                  type="text"
                  value={formData.athlete_code}
                  onChange={(e) => setFormData({...formData, athlete_code: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingAthlete ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Date of Birth</th>
              <th className="px-4 py-2 text-left">Gender</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {athletes && athletes.map((athlete) => (
              <tr key={athlete.athlete_id} className="border-t border-white/20">
                <td className="px-4 py-2">{athlete.athlete_code}</td>
                <td className="px-4 py-2">{athlete.first_name} {athlete.last_name}</td>
                <td className="px-4 py-2">{athlete.date_of_birth}</td>
                <td className="px-4 py-2">{athlete.gender}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(athlete)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(athlete.athlete_code)}
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
