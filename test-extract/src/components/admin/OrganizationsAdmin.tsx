import React, { useState, useEffect } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface Organization {
  organization_id: number;
  organization_name: string;
  organization_type: 'Team' | 'Club' | 'Academy' | 'Federation';
  country?: string;
  city?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  is_active: boolean;
  created_date: string;
  modified_date: string;
}

export const OrganizationsAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'Team' as 'Team' | 'Club' | 'Academy' | 'Federation',
    country: '',
    city: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    is_active: true
  });

  const { data: organizations = [], loading, error, refetch: fetchOrganizations } = useAdminApi<Organization[]>('/admin/organizations');

  useEffect(() => {
    if (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await apiPut(`/admin/organizations/${editingOrg.organization_id}`, formData);
      } else {
        await apiPost('/admin/organizations', formData);
      }
      fetchOrganizations(); // This now calls the refetch function from the hook
      resetForm();
    } catch (error) {
      console.error('Error saving organization:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;

    try {
      await apiDelete(`/admin/organizations/${id}`);
      fetchOrganizations(); // This now calls the refetch function from the hook
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      organization_name: '',
      organization_type: 'Team',
      country: '',
      city: '',
      address: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      is_active: true
    });
    setEditingOrg(null);
    setShowForm(false);
  };

  const startEdit = (org: Organization) => {
    setFormData({
      organization_name: org.organization_name,
      organization_type: org.organization_type,
      country: org.country || '',
      city: org.city || '',
      address: org.address || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      website: org.website || '',
      is_active: org.is_active
    });
    setEditingOrg(org);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading organizations...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Organizations Management</h2>
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
          Add Organization
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingOrg ? 'Edit Organization' : 'Add New Organization'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Organization Name *</label>
                <input
                  type="text"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Type *</label>
                <select
                  value={formData.organization_type}
                  onChange={(e) => setFormData({...formData, organization_type: e.target.value as any})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                >
                  <option value="Team">Team</option>
                  <option value="Club">Club</option>
                  <option value="Academy">Academy</option>
                  <option value="Federation">Federation</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
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
                {editingOrg ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations?.map((org) => (
              <tr key={org.organization_id} className="border-t border-white/20">
                <td className="px-4 py-2">{org.organization_name}</td>
                <td className="px-4 py-2">{org.organization_type}</td>
                <td className="px-4 py-2">{org.city && org.country ? `${org.city}, ${org.country}` : org.city || org.country || '-'}</td>
                <td className="px-4 py-2">{org.contact_email || org.contact_phone || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${org.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {org.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(org)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(org.organization_id)}
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
