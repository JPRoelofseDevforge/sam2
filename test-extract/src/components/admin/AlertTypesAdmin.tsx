import React, { useState, useEffect } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { apiPost, apiPut, apiDelete } from '../../utils/api';

interface AlertType {
  alert_type_id: number;
  alert_type_name: string;
  alert_category?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
  is_active: boolean;
}

export const AlertTypesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAlertType, setEditingAlertType] = useState<AlertType | null>(null);
  const [formData, setFormData] = useState({
    alert_type_name: '',
    alert_category: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    description: '',
    is_active: true
  });

  const { data: alertTypes = [], loading, error, refetch: fetchAlertTypes } = useAdminApi<AlertType[]>('/admin/alert-types');

  useEffect(() => {
    if (error) {
      console.error('Error fetching alert types:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAlertType) {
        await apiPut(`/admin/alert-types/${editingAlertType.alert_type_id}`, formData);
      } else {
        await apiPost('/admin/alert-types', formData);
      }
      fetchAlertTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving alert type:', error);
      alert('Error saving alert type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alert type?')) return;

    try {
      await apiDelete(`/admin/alert-types/${id}`);
      fetchAlertTypes();
    } catch (error) {
      console.error('Error deleting alert type:', error);
      alert('Error deleting alert type');
    }
  };

  const resetForm = () => {
    setFormData({
      alert_type_name: '',
      alert_category: '',
      severity: 'Medium',
      description: '',
      is_active: true
    });
    setEditingAlertType(null);
    setShowForm(false);
  };

  const startEdit = (alertType: AlertType) => {
    setFormData({
      alert_type_name: alertType.alert_type_name,
      alert_category: alertType.alert_category || '',
      severity: alertType.severity,
      description: alertType.description || '',
      is_active: alertType.is_active
    });
    setEditingAlertType(alertType);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading alert types...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Alert Types Management</h2>
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
          Add Alert Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingAlertType ? 'Edit Alert Type' : 'Add New Alert Type'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Alert Type Name *</label>
                <input
                  type="text"
                  value={formData.alert_type_name}
                  onChange={(e) => setFormData({...formData, alert_type_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Category</label>
                <input
                  type="text"
                  value={formData.alert_category}
                  onChange={(e) => setFormData({...formData, alert_category: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
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
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingAlertType ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Severity</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alertTypes && alertTypes.map((alertType) => (
              <tr key={alertType.alert_type_id} className="border-t border-white/20">
                <td className="px-4 py-2">{alertType.alert_type_name}</td>
                <td className="px-4 py-2">{alertType.alert_category || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    alertType.severity === 'Critical' ? 'bg-red-600' :
                    alertType.severity === 'High' ? 'bg-orange-600' :
                    alertType.severity === 'Medium' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}>
                    {alertType.severity}
                  </span>
                </td>
                <td className="px-4 py-2">{alertType.description || '-'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(alertType)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(alertType.alert_type_id)}
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
