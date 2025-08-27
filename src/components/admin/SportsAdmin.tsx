import React, { useState, useEffect } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface Sport {
  sport_id: number;
  sport_name: string;
  sport_category?: string;
  description?: string;
  is_active: boolean;
}

export const SportsAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [formData, setFormData] = useState({
    sport_name: '',
    sport_category: '',
    description: '',
    is_active: true
  });

  const { data: sports = [], loading, error, refetch: fetchSports } = useAdminApi<Sport[]>('/admin/sports');

  useEffect(() => {
    if (error) {
      console.error('Error fetching sports:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSport) {
        await apiPut(`/admin/sports/${editingSport.sport_id}`, formData);
      } else {
        await apiPost('/admin/sports', formData);
      }
      fetchSports(); // This now calls the refetch function from the hook
      resetForm();
    } catch (error) {
      console.error('Error saving sport:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sport?')) return;

    try {
      await apiDelete(`/admin/sports/${id}`);
      fetchSports(); // This now calls the refetch function from the hook
    } catch (error) {
      console.error('Error deleting sport:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      sport_name: '',
      sport_category: '',
      description: '',
      is_active: true
    });
    setEditingSport(null);
    setShowForm(false);
  };

  const startEdit = (sport: Sport) => {
    setFormData({
      sport_name: sport.sport_name,
      sport_category: sport.sport_category || '',
      description: sport.description || '',
      is_active: sport.is_active
    });
    setEditingSport(sport);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading sports...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Sports Management</h2>
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
          Add Sport
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingSport ? 'Edit Sport' : 'Add New Sport'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Sport Name *</label>
                <input
                  type="text"
                  value={formData.sport_name}
                  onChange={(e) => setFormData({...formData, sport_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Category</label>
                <input
                  type="text"
                  value={formData.sport_category}
                  onChange={(e) => setFormData({...formData, sport_category: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  rows={3}
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
                {editingSport ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sports?.map((sport) => (
              <tr key={sport.sport_id} className="border-t border-white/20">
                <td className="px-4 py-2">{sport.sport_name}</td>
                <td className="px-4 py-2">{sport.sport_category || '-'}</td>
                <td className="px-4 py-2">{sport.description || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${sport.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {sport.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(sport)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sport.sport_id)}
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
