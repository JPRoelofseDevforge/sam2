import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface BodySymmetry {
  body_symmetry_id: number;
  body_composition_id: number;
  arm_mass_left_kg: number;
  arm_mass_right_kg: number;
  leg_mass_left_kg: number;
  leg_mass_right_kg: number;
  trunk_mass_kg: number;
  arm_imbalance_percent: number;
  leg_imbalance_percent: number;
  created_date: string;
}

interface BodyCompositionLookup {
  body_composition_id: number;
  athlete_id: number;
  athlete_code: string;
  first_name: string;
  last_name: string;
  measurement_date: string;
}

export const BodySymmetryAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [bodySymmetries, setBodySymmetries] = useState<BodySymmetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSymmetry, setEditingSymmetry] = useState<BodySymmetry | null>(null);

  // Lookup data to display body composition info instead of numeric ID
  const [bodyCompositions, setBodyCompositions] = useState<BodyCompositionLookup[]>([]);
  const [formData, setFormData] = useState({
    body_composition_id: 0,
    arm_mass_left_kg: 0,
    arm_mass_right_kg: 0,
    leg_mass_left_kg: 0,
    leg_mass_right_kg: 0,
    trunk_mass_kg: 0,
    arm_imbalance_percent: 0,
    leg_imbalance_percent: 0
  });

  const fetchLookups = async () => {
    try {
      const list = await apiGet<BodyCompositionLookup[]>('/admin/body-composition');
      setBodyCompositions(list || []);
    } catch (e) {
      console.error('Error fetching body composition lookup:', e);
    }
  };

  const bodyCompositionNameById = React.useMemo(() => {
    const map: Record<number | string, string> = {};
    bodyCompositions.forEach((bc: BodyCompositionLookup) => {
      const fullName =
        bc?.first_name && bc?.last_name
          ? `${bc.first_name} ${bc.last_name}`.trim()
          : bc?.athlete_code || String(bc?.athlete_id);
      const code = bc?.athlete_code ?? bc?.athlete_id;
      const athleteLabel = fullName && code ? `${fullName} (${code})` : String(code ?? bc?.athlete_id);
      const dateStr = bc?.measurement_date ? new Date(bc.measurement_date).toLocaleDateString() : 'Unknown Date';
      const label = `${athleteLabel} - ${dateStr}`;

      const key =
        typeof bc?.body_composition_id === 'number'
          ? bc.body_composition_id
          : parseInt(bc?.body_composition_id, 10) || bc?.body_composition_id;
      map[key] = label;
    });
    return map;
  }, [bodyCompositions]);

  useEffect(() => {
    fetchBodySymmetries();
    fetchLookups();
  }, []);

  const fetchBodySymmetries = async () => {
    try {
      const data = await apiGet<BodySymmetry[]>('/admin/body-symmetry');
      setBodySymmetries(data);
    } catch (error) {
      console.error('Error fetching body symmetries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        body_composition_id: formData.body_composition_id,
        arm_mass_left_kg: formData.arm_mass_left_kg,
        arm_mass_right_kg: formData.arm_mass_right_kg,
        leg_mass_left_kg: formData.leg_mass_left_kg,
        leg_mass_right_kg: formData.leg_mass_right_kg,
        trunk_mass_kg: formData.trunk_mass_kg,
        arm_imbalance_percent: formData.arm_imbalance_percent,
        leg_imbalance_percent: formData.leg_imbalance_percent
      };

      if (editingSymmetry) {
        await apiPut(`/admin/body-symmetry/${editingSymmetry.body_symmetry_id}`, submitData);
      } else {
        await apiPost('/admin/body-symmetry', submitData);
      }

      fetchBodySymmetries();
      resetForm();
    } catch (error) {
      console.error('Error saving body symmetry:', error);
      alert('Error saving body symmetry');
    }
  };

  const handleDelete = async (symmetryId: number) => {
    if (!confirm('Are you sure you want to delete this body symmetry record?')) return;

    try {
      await apiDelete(`/admin/body-symmetry/${symmetryId}`);
      fetchBodySymmetries();
    } catch (error) {
      console.error('Error deleting body symmetry:', error);
      alert('Error deleting body symmetry');
    }
  };

  const resetForm = () => {
    setFormData({
      body_composition_id: 0,
      arm_mass_left_kg: 0,
      arm_mass_right_kg: 0,
      leg_mass_left_kg: 0,
      leg_mass_right_kg: 0,
      trunk_mass_kg: 0,
      arm_imbalance_percent: 0,
      leg_imbalance_percent: 0
    });
    setEditingSymmetry(null);
    setShowForm(false);
  };

  const startEdit = (symmetry: BodySymmetry) => {
    setFormData({
      body_composition_id: symmetry.body_composition_id,
      arm_mass_left_kg: symmetry.arm_mass_left_kg,
      arm_mass_right_kg: symmetry.arm_mass_right_kg,
      leg_mass_left_kg: symmetry.leg_mass_left_kg,
      leg_mass_right_kg: symmetry.leg_mass_right_kg,
      trunk_mass_kg: symmetry.trunk_mass_kg,
      arm_imbalance_percent: symmetry.arm_imbalance_percent,
      leg_imbalance_percent: symmetry.leg_imbalance_percent
    });
    setEditingSymmetry(symmetry);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading body symmetries...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Body Symmetry Management</h2>
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
          Add Body Symmetry
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingSymmetry ? 'Edit Body Symmetry' : 'Add New Body Symmetry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Body Composition ID *</label>
                <input
                  type="number"
                  value={formData.body_composition_id || ''}
                  onChange={(e) => setFormData({...formData, body_composition_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Arm Mass Left (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.arm_mass_left_kg || ''}
                  onChange={(e) => setFormData({...formData, arm_mass_left_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Arm Mass Right (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.arm_mass_right_kg || ''}
                  onChange={(e) => setFormData({...formData, arm_mass_right_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Leg Mass Left (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.leg_mass_left_kg || ''}
                  onChange={(e) => setFormData({...formData, leg_mass_left_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Leg Mass Right (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.leg_mass_right_kg || ''}
                  onChange={(e) => setFormData({...formData, leg_mass_right_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Trunk Mass (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.trunk_mass_kg || ''}
                  onChange={(e) => setFormData({...formData, trunk_mass_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Arm Imbalance (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.arm_imbalance_percent || ''}
                  onChange={(e) => setFormData({...formData, arm_imbalance_percent: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Leg Imbalance (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.leg_imbalance_percent || ''}
                  onChange={(e) => setFormData({...formData, leg_imbalance_percent: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingSymmetry ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Body Composition</th>
              <th className="px-4 py-2 text-left">Arm Mass Left (kg)</th>
              <th className="px-4 py-2 text-left">Arm Mass Right (kg)</th>
              <th className="px-4 py-2 text-left">Leg Mass Left (kg)</th>
              <th className="px-4 py-2 text-left">Leg Mass Right (kg)</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bodySymmetries.map((symmetry) => (
              <tr key={symmetry.body_symmetry_id} className="border-t border-white/20">
                <td className="px-4 py-2">{symmetry.body_symmetry_id}</td>
                <td className="px-4 py-2">{bodyCompositionNameById[symmetry.body_composition_id] || `ID: ${symmetry.body_composition_id}`}</td>
                <td className="px-4 py-2">{symmetry.arm_mass_left_kg != null ? Number(symmetry.arm_mass_left_kg).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">{symmetry.arm_mass_right_kg != null ? Number(symmetry.arm_mass_right_kg).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">{symmetry.leg_mass_left_kg != null ? Number(symmetry.leg_mass_left_kg).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">{symmetry.leg_mass_right_kg != null ? Number(symmetry.leg_mass_right_kg).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(symmetry)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(symmetry.body_symmetry_id)}
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
