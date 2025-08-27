import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface UserOrganizationRole {
  user_org_role_id: number;
  user_id: number;
  organization_id: number;
  role_id: number;
  is_active: boolean;
  assigned_date: string;
  assigned_by_user_id: number;
}

export const UserOrganizationRolesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [userOrganizationRoles, setUserOrganizationRoles] = useState<UserOrganizationRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<UserOrganizationRole | null>(null);
  const [formData, setFormData] = useState({
    user_id: 0,
    organization_id: 0,
    role_id: 0,
    is_active: true,
    assigned_by_user_id: 0
  });

  // Lookup datasets for displaying FK names instead of IDs
  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const fetchLookups = async () => {
    try {
      const [usersData, orgsData, rolesData] = await Promise.all([
        apiGet<any[]>('/users'),
        apiGet<any[]>('/organizations'),
        apiGet<any[]>('/admin/user-roles'),
      ]);
      setUsers(usersData || []);
      setOrganizations(orgsData || []);
      setRoles(rolesData || []);
    } catch (e) {
      console.error('Error fetching lookup data:', e);
    }
  };

  const userNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    users.forEach((u: any) => {
      const fullName = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
      map[u.user_id] = fullName || u?.username || String(u?.user_id);
    });
    return map;
  }, [users]);

  const orgNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    organizations.forEach((o: any) => {
      map[o.organization_id] = o.organization_name || String(o.organization_id);
    });
    return map;
  }, [organizations]);

  const roleNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    roles.forEach((r: any) => {
      map[r.role_id] = r.role_name || String(r.role_id);
    });
    return map;
  }, [roles]);

  useEffect(() => {
    fetchUserOrganizationRoles();
    fetchLookups();
  }, []);

  const fetchUserOrganizationRoles = async () => {
    try {
      const data = await apiGet<UserOrganizationRole[]>('/admin/user-organization-roles');
      setUserOrganizationRoles(data);
    } catch (error) {
      console.error('Error fetching user organization roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        user_id: formData.user_id,
        organization_id: formData.organization_id,
        role_id: formData.role_id,
        is_active: formData.is_active,
        assigned_by_user_id: formData.assigned_by_user_id
      };

      if (editingRole) {
        await apiPut(`/admin/user-organization-roles/${editingRole.user_org_role_id}`, submitData);
      } else {
        await apiPost('/admin/user-organization-roles', submitData);
      }

      fetchUserOrganizationRoles();
      resetForm();
    } catch (error) {
      console.error('Error saving user organization role:', error);
      alert('Error saving user organization role');
    }
  };

  const handleDelete = async (role_id: number) => {
    if (!confirm('Are you sure you want to delete this user organization role?')) return;

    try {
      await apiDelete(`/admin/user-organization-roles/${role_id}`);
      fetchUserOrganizationRoles();
    } catch (error) {
      console.error('Error deleting user organization role:', error);
      alert('Error deleting user organization role');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: 0,
      organization_id: 0,
      role_id: 0,
      is_active: true,
      assigned_by_user_id: 0
    });
    setEditingRole(null);
    setShowForm(false);
  };

  const startEdit = (role: UserOrganizationRole) => {
    setFormData({
      user_id: role.user_id,
      organization_id: role.organization_id,
      role_id: role.role_id,
      is_active: role.is_active,
      assigned_by_user_id: role.assigned_by_user_id
    });
    setEditingRole(role);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading user organization roles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">User Organization Roles Management</h2>
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
          Add User Organization Role
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingRole ? 'Edit User Organization Role' : 'Add New User Organization Role'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">User ID *</label>
                <input
                  type="number"
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({...formData, user_id: parseInt(e.target.value) || 0})}
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
                <label className="block text-white mb-2">Role ID *</label>
                <input
                  type="number"
                  value={formData.role_id || ''}
                  onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Assigned By User ID *</label>
                <input
                  type="number"
                  value={formData.assigned_by_user_id || ''}
                  onChange={(e) => setFormData({...formData, assigned_by_user_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
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
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Organization</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Assigned By</th>
              <th className="px-4 py-2 text-left">Assigned Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userOrganizationRoles.map((role) => (
              <tr key={role.user_org_role_id} className="border-t border-white/20">
                <td className="px-4 py-2">{role.user_org_role_id}</td>
                <td className="px-4 py-2">{userNameById[role.user_id] || role.user_id}</td>
                <td className="px-4 py-2">{orgNameById[role.organization_id] || role.organization_id}</td>
                <td className="px-4 py-2">{roleNameById[role.role_id] || role.role_id}</td>
                <td className="px-4 py-2">{userNameById[role.assigned_by_user_id] || role.assigned_by_user_id}</td>
                <td className="px-4 py-2">{new Date(role.assigned_date).toLocaleDateString()}</td>
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
                    onClick={() => handleDelete(role.user_org_role_id)}
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
