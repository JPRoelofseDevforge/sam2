import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface UserRole {
  role_id: number;
  role_name: string;
  description: string;
  permissions: any;
  is_active: boolean;
}

export const UserRolesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    permissions: '{}',
    is_active: true
  });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const data = await apiGet<UserRole[]>('/admin/user-roles');
      setUserRoles(data);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate JSON format for permissions
      let permissions;
      try {
        permissions = JSON.parse(formData.permissions);
      } catch (err) {
        alert('Permissions must be valid JSON');
        return;
      }

      const submitData = {
        role_name: formData.role_name,
        description: formData.description,
        permissions: permissions,
        is_active: formData.is_active
      };

      if (editingRole) {
        await apiPut(`/admin/user-roles/${editingRole.role_id}`, submitData);
      } else {
        await apiPost('/admin/user-roles', submitData);
      }

      fetchUserRoles();
      resetForm();
    } catch (error: any) {
      console.error('Error saving user role:', error);
      alert('Error saving user role');
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this user role?')) return;

    try {
      await apiDelete(`/admin/user-roles/${roleId}`);
      fetchUserRoles();
    } catch (error: any) {
      console.error('Error deleting user role:', error);
      alert('Error deleting user role');
    }
  };

  const resetForm = () => {
    setFormData({
      role_name: '',
      description: '',
      permissions: '{}',
      is_active: true
    });
    setEditingRole(null);
    setShowForm(false);
  };

  const startEdit = (role: UserRole) => {
    setFormData({
      role_name: role.role_name,
      description: role.description,
      permissions: JSON.stringify(role.permissions, null, 2),
      is_active: role.is_active
    });
    setEditingRole(role);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading user roles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">User Roles Management</h2>
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
          Add User Role
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-black mb-4">
            {editingRole ? 'Edit User Role' : 'Add New User Role'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-black mb-2">Role Name *</label>
                <input
                  type="text"
                  value={formData.role_name}
                  onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-black border border-white/30"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-black mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-black border border-white/30 h-24"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-black mb-2">Permissions (JSON) *</label>
                <textarea
                  value={formData.permissions}
                  onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-black border border-white/30 h-32 font-mono text-sm"
                  required
                />
                <p className="text-gray-700 text-sm mt-1">
                  Enter valid JSON for permissions. Example: {"{"}"all": true{"}"}
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-black">Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingRole ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Role Name</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userRoles.map((role) => (
              <tr key={role.role_id} className="border-t border-white/20">
                <td className="px-4 py-2">{role.role_id}</td>
                <td className="px-4 py-2">{role.role_name}</td>
                <td className="px-4 py-2">{role.description}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${role.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(role)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.role_id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    disabled={!role.is_active}
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
