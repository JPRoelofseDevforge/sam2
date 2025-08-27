import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface BodyComposition {
  body_composition_id: number;
  athlete_id: number;
  measurement_date: string;
  weight_kg: number;
  weight_range_min: number;
  weight_range_max: number;
  target_weight_kg: number;
  weight_control_kg: number;
  fat_mass_kg: number;
  fat_mass_range_min: number;
  fat_mass_range_max: number;
  body_fat_rate: number;
  fat_control_kg: number;
  subcutaneous_fat_percent: number;
  visceral_fat_grade: number;
  muscle_mass_kg: number;
  muscle_mass_range_min: number;
  muscle_mass_range_max: number;
  skeletal_muscle_kg: number;
  muscle_control_kg: number;
  bmi: number;
  basal_metabolic_rate_kcal: number;
  fat_free_body_weight_kg: number;
  smi_kg_m2: number;
  body_age: number;
  measurement_method: string;
  measurement_device: string;
  technician_id: number;
  notes: string;
  created_date: string;
}

export const BodyCompositionAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [bodyCompositions, setBodyCompositions] = useState<BodyComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComposition, setEditingComposition] = useState<BodyComposition | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    measurement_date: '',
    weight_kg: 0,
    weight_range_min: 0,
    weight_range_max: 0,
    target_weight_kg: 0,
    weight_control_kg: 0,
    fat_mass_kg: 0,
    fat_mass_range_min: 0,
    fat_mass_range_max: 0,
    body_fat_rate: 0,
    fat_control_kg: 0,
    subcutaneous_fat_percent: 0,
    visceral_fat_grade: 0,
    muscle_mass_kg: 0,
    muscle_mass_range_min: 0,
    muscle_mass_range_max: 0,
    skeletal_muscle_kg: 0,
    muscle_control_kg: 0,
    bmi: 0,
    basal_metabolic_rate_kcal: 0,
    fat_free_body_weight_kg: 0,
    smi_kg_m2: 0,
    body_age: 0,
    measurement_method: '',
    measurement_device: '',
    technician_id: 0,
    notes: ''
  });

  // Create athlete name mapping from body composition data (which already includes athlete info)
  const athleteNameById = React.useMemo(() => {
    const map: Record<number | string, string> = {};
    bodyCompositions.forEach((bc: any) => {
      if (bc.athlete_id && (bc.first_name || bc.last_name || bc.athlete_code)) {
        const fullName =
          bc?.first_name && bc?.last_name
            ? `${bc.first_name} ${bc.last_name}`.trim()
            : bc?.athlete_code || String(bc?.athlete_id);
        const code = bc?.athlete_code ?? bc?.athlete_id;
        const label = fullName && code ? `${fullName} (${code})` : String(code ?? bc?.athlete_id);
        const key =
          typeof bc?.athlete_id === 'number'
            ? bc.athlete_id
            : parseInt(bc?.athlete_id, 10) || bc?.athlete_id;
        map[key] = label;
      }
    });
    return map;
  }, [bodyCompositions]);

  useEffect(() => {
    fetchBodyCompositions();
  }, []);

  const fetchBodyCompositions = async () => {
    try {
      const data = await apiGet<BodyComposition[]>('/admin/body-composition');
      setBodyCompositions(data);
    } catch (error) {
      console.error('Error fetching body compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        measurement_date: formData.measurement_date,
        weight_kg: formData.weight_kg,
        weight_range_min: formData.weight_range_min,
        weight_range_max: formData.weight_range_max,
        target_weight_kg: formData.target_weight_kg,
        weight_control_kg: formData.weight_control_kg,
        fat_mass_kg: formData.fat_mass_kg,
        fat_mass_range_min: formData.fat_mass_range_min,
        fat_mass_range_max: formData.fat_mass_range_max,
        body_fat_rate: formData.body_fat_rate,
        fat_control_kg: formData.fat_control_kg,
        subcutaneous_fat_percent: formData.subcutaneous_fat_percent,
        visceral_fat_grade: formData.visceral_fat_grade,
        muscle_mass_kg: formData.muscle_mass_kg,
        muscle_mass_range_min: formData.muscle_mass_range_min,
        muscle_mass_range_max: formData.muscle_mass_range_max,
        skeletal_muscle_kg: formData.skeletal_muscle_kg,
        muscle_control_kg: formData.muscle_control_kg,
        bmi: formData.bmi,
        basal_metabolic_rate_kcal: formData.basal_metabolic_rate_kcal,
        fat_free_body_weight_kg: formData.fat_free_body_weight_kg,
        smi_kg_m2: formData.smi_kg_m2,
        body_age: formData.body_age,
        measurement_method: formData.measurement_method,
        measurement_device: formData.measurement_device,
        technician_id: formData.technician_id || null,
        notes: formData.notes
      };

      if (editingComposition) {
        await apiPut(`/admin/body-composition/${editingComposition.body_composition_id}`, submitData);
      } else {
        await apiPost('/admin/body-composition', submitData);
      }

      fetchBodyCompositions();
      resetForm();
    } catch (error) {
      console.error('Error saving body composition:', error);
      alert('Error saving body composition');
    }
  };

  const handleDelete = async (compositionId: number) => {
    if (!confirm('Are you sure you want to delete this body composition record?')) return;

    try {
      await apiDelete(`/admin/body-composition/${compositionId}`);
      fetchBodyCompositions();
    } catch (error) {
      console.error('Error deleting body composition:', error);
      alert('Error deleting body composition');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      measurement_date: '',
      weight_kg: 0,
      weight_range_min: 0,
      weight_range_max: 0,
      target_weight_kg: 0,
      weight_control_kg: 0,
      fat_mass_kg: 0,
      fat_mass_range_min: 0,
      fat_mass_range_max: 0,
      body_fat_rate: 0,
      fat_control_kg: 0,
      subcutaneous_fat_percent: 0,
      visceral_fat_grade: 0,
      muscle_mass_kg: 0,
      muscle_mass_range_min: 0,
      muscle_mass_range_max: 0,
      skeletal_muscle_kg: 0,
      muscle_control_kg: 0,
      bmi: 0,
      basal_metabolic_rate_kcal: 0,
      fat_free_body_weight_kg: 0,
      smi_kg_m2: 0,
      body_age: 0,
      measurement_method: '',
      measurement_device: '',
      technician_id: 0,
      notes: ''
    });
    setEditingComposition(null);
    setShowForm(false);
  };

  const startEdit = (composition: BodyComposition) => {
    setFormData({
      athlete_id: composition.athlete_id,
      measurement_date: composition.measurement_date,
      weight_kg: composition.weight_kg,
      weight_range_min: composition.weight_range_min,
      weight_range_max: composition.weight_range_max,
      target_weight_kg: composition.target_weight_kg,
      weight_control_kg: composition.weight_control_kg,
      fat_mass_kg: composition.fat_mass_kg,
      fat_mass_range_min: composition.fat_mass_range_min,
      fat_mass_range_max: composition.fat_mass_range_max,
      body_fat_rate: composition.body_fat_rate,
      fat_control_kg: composition.fat_control_kg,
      subcutaneous_fat_percent: composition.subcutaneous_fat_percent,
      visceral_fat_grade: composition.visceral_fat_grade,
      muscle_mass_kg: composition.muscle_mass_kg,
      muscle_mass_range_min: composition.muscle_mass_range_min,
      muscle_mass_range_max: composition.muscle_mass_range_max,
      skeletal_muscle_kg: composition.skeletal_muscle_kg,
      muscle_control_kg: composition.muscle_control_kg,
      bmi: composition.bmi,
      basal_metabolic_rate_kcal: composition.basal_metabolic_rate_kcal,
      fat_free_body_weight_kg: composition.fat_free_body_weight_kg,
      smi_kg_m2: composition.smi_kg_m2,
      body_age: composition.body_age,
      measurement_method: composition.measurement_method,
      measurement_device: composition.measurement_device,
      technician_id: composition.technician_id,
      notes: composition.notes
    });
    setEditingComposition(composition);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading body compositions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Body Composition Management</h2>
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
          Add Body Composition
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingComposition ? 'Edit Body Composition' : 'Add New Body Composition'}
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
                <label className="block text-white mb-2">Measurement Date *</label>
                <input
                  type="date"
                  value={formData.measurement_date}
                  onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight_kg || ''}
                  onChange={(e) => setFormData({...formData, weight_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Weight Range Min (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight_range_min || ''}
                  onChange={(e) => setFormData({...formData, weight_range_min: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Weight Range Max (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight_range_max || ''}
                  onChange={(e) => setFormData({...formData, weight_range_max: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_weight_kg || ''}
                  onChange={(e) => setFormData({...formData, target_weight_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Weight Control (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight_control_kg || ''}
                  onChange={(e) => setFormData({...formData, weight_control_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fat Mass (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fat_mass_kg || ''}
                  onChange={(e) => setFormData({...formData, fat_mass_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fat Mass Range Min (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fat_mass_range_min || ''}
                  onChange={(e) => setFormData({...formData, fat_mass_range_min: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fat Mass Range Max (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fat_mass_range_max || ''}
                  onChange={(e) => setFormData({...formData, fat_mass_range_max: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Body Fat Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.body_fat_rate || ''}
                  onChange={(e) => setFormData({...formData, body_fat_rate: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fat Control (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fat_control_kg || ''}
                  onChange={(e) => setFormData({...formData, fat_control_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Subcutaneous Fat (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.subcutaneous_fat_percent || ''}
                  onChange={(e) => setFormData({...formData, subcutaneous_fat_percent: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Visceral Fat Grade</label>
                <input
                  type="number"
                  value={formData.visceral_fat_grade || ''}
                  onChange={(e) => setFormData({...formData, visceral_fat_grade: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Muscle Mass (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.muscle_mass_kg || ''}
                  onChange={(e) => setFormData({...formData, muscle_mass_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Muscle Mass Range Min (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.muscle_mass_range_min || ''}
                  onChange={(e) => setFormData({...formData, muscle_mass_range_min: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Muscle Mass Range Max (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.muscle_mass_range_max || ''}
                  onChange={(e) => setFormData({...formData, muscle_mass_range_max: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Skeletal Muscle (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.skeletal_muscle_kg || ''}
                  onChange={(e) => setFormData({...formData, skeletal_muscle_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Muscle Control (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.muscle_control_kg || ''}
                  onChange={(e) => setFormData({...formData, muscle_control_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">BMI</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bmi || ''}
                  onChange={(e) => setFormData({...formData, bmi: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Basal Metabolic Rate (kcal)</label>
                <input
                  type="number"
                  value={formData.basal_metabolic_rate_kcal || ''}
                  onChange={(e) => setFormData({...formData, basal_metabolic_rate_kcal: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Fat Free Body Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fat_free_body_weight_kg || ''}
                  onChange={(e) => setFormData({...formData, fat_free_body_weight_kg: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">SMI (kg/m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.smi_kg_m2 || ''}
                  onChange={(e) => setFormData({...formData, smi_kg_m2: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Body Age</label>
                <input
                  type="number"
                  value={formData.body_age || ''}
                  onChange={(e) => setFormData({...formData, body_age: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Measurement Method</label>
                <input
                  type="text"
                  value={formData.measurement_method}
                  onChange={(e) => setFormData({...formData, measurement_method: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Measurement Device</label>
                <input
                  type="text"
                  value={formData.measurement_device}
                  onChange={(e) => setFormData({...formData, measurement_device: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Technician ID</label>
                <input
                  type="number"
                  value={formData.technician_id || ''}
                  onChange={(e) => setFormData({...formData, technician_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
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
                {editingComposition ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Weight (kg)</th>
              <th className="px-4 py-2 text-left">BMI</th>
              <th className="px-4 py-2 text-left">Body Fat (%)</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bodyCompositions.map((composition) => (
              <tr key={composition.body_composition_id} className="border-t border-white/20">
                <td className="px-4 py-2">{composition.body_composition_id}</td>
                <td className="px-4 py-2">{athleteNameById[composition.athlete_id] || composition.athlete_id}</td>
                <td className="px-4 py-2">{new Date(composition.measurement_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{composition.weight_kg != null ? Number(composition.weight_kg).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">{composition.bmi != null ? Number(composition.bmi).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">{composition.body_fat_rate != null ? Number(composition.body_fat_rate).toFixed(2) : 'N/A'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(composition)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(composition.body_composition_id)}
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
