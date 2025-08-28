import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface GeneticTestType {
  test_type_id: number;
  test_name: string;
  test_provider?: string;
  test_description?: string;
  test_version?: string;
  is_active: boolean;
}

export const GeneticTestTypesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [testTypes, setTestTypes] = useState<GeneticTestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestType, setEditingTestType] = useState<GeneticTestType | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    test_provider: '',
    test_description: '',
    test_version: '',
    is_active: true
  });

  useEffect(() => {
    fetchTestTypes();
  }, []);

  const fetchTestTypes = async () => {
    try {
      const data = await apiGet<GeneticTestType[]>('/admin/genetic-test-types');
      setTestTypes(data);
    } catch (error) {
      console.error('Error fetching genetic test types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestType) {
        await apiPut(`/admin/genetic-test-types/${editingTestType.test_type_id}`, formData);
      } else {
        await apiPost('/admin/genetic-test-types', formData);
      }
      fetchTestTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving genetic test type:', error);
      alert('Error saving genetic test type');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this genetic test type?')) return;

    try {
      await apiDelete(`/admin/genetic-test-types/${id}`);
      fetchTestTypes();
    } catch (error) {
      console.error('Error deleting genetic test type:', error);
      alert('Error deleting genetic test type');
    }
  };

  const resetForm = () => {
    setFormData({
      test_name: '',
      test_provider: '',
      test_description: '',
      test_version: '',
      is_active: true
    });
    setEditingTestType(null);
    setShowForm(false);
  };

  const startEdit = (testType: GeneticTestType) => {
    setFormData({
      test_name: testType.test_name,
      test_provider: testType.test_provider || '',
      test_description: testType.test_description || '',
      test_version: testType.test_version || '',
      is_active: testType.is_active
    });
    setEditingTestType(testType);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading genetic test types...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Genetic Test Types Management</h2>
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
          Add Test Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingTestType ? 'Edit Genetic Test Type' : 'Add New Genetic Test Type'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Test Name *</label>
                <input
                  type="text"
                  value={formData.test_name}
                  onChange={(e) => setFormData({...formData, test_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Test Provider</label>
                <input
                  type="text"
                  value={formData.test_provider}
                  onChange={(e) => setFormData({...formData, test_provider: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Test Version</label>
                <input
                  type="text"
                  value={formData.test_version}
                  onChange={(e) => setFormData({...formData, test_version: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Description</label>
                <textarea
                  value={formData.test_description}
                  onChange={(e) => setFormData({...formData, test_description: e.target.value})}
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
                {editingTestType ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Test Name</th>
              <th className="px-4 py-2 text-left">Provider</th>
              <th className="px-4 py-2 text-left">Version</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testTypes.map((testType) => (
              <tr key={testType.test_type_id} className="border-t border-white/20">
                <td className="px-4 py-2">{testType.test_name}</td>
                <td className="px-4 py-2">{testType.test_provider || '-'}</td>
                <td className="px-4 py-2">{testType.test_version || '-'}</td>
                <td className="px-4 py-2">{testType.test_description || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${testType.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {testType.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(testType)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testType.test_type_id)}
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
