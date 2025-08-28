import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface GeneticProfile {
  genetic_profile_id: number;
  test_result_id: number;
  gene_id: number;
  genotype: string;
  confidence: number;
  raw_data: string;
  created_date: string;
}

export const GeneticProfilesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GeneticProfile | null>(null);
  const [formData, setFormData] = useState({
    test_result_id: 0,
    gene_id: 0,
    genotype: '',
    confidence: 0,
    raw_data: ''
  });

  // Lookup data to display gene name instead of numeric gene_id
  const [genes, setGenes] = useState<any[]>([]);
  const fetchLookups = async () => {
    try {
      const list = await apiGet<any[]>('/admin/genes');
      setGenes(list || []);
    } catch (e) {
      console.error('Error fetching genes lookup:', e);
    }
  };

  const geneNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    genes.forEach((g: any) => {
      map[g.gene_id] = g.gene_name || String(g.gene_id);
    });
    return map;
  }, [genes]);

  useEffect(() => {
    fetchGeneticProfiles();
    fetchLookups();
  }, []);

  const fetchGeneticProfiles = async () => {
    try {
      const data = await apiGet<GeneticProfile[]>('/admin/genetic-profiles');
      setGeneticProfiles(data);
    } catch (error) {
      console.error('Error fetching genetic profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        test_result_id: formData.test_result_id,
        gene_id: formData.gene_id,
        genotype: formData.genotype,
        confidence: formData.confidence,
        raw_data: formData.raw_data
      };

      if (editingProfile) {
        await apiPut(`/admin/genetic-profiles/${editingProfile.genetic_profile_id}`, submitData);
      } else {
        await apiPost('/admin/genetic-profiles', submitData);
      }

      fetchGeneticProfiles();
      resetForm();
    } catch (error) {
      console.error('Error saving genetic profile:', error);
      alert('Error saving genetic profile');
    }
  };

  const handleDelete = async (profileId: number) => {
    if (!confirm('Are you sure you want to delete this genetic profile?')) return;

    try {
      await apiDelete(`/admin/genetic-profiles/${profileId}`);
      fetchGeneticProfiles();
    } catch (error) {
      console.error('Error deleting genetic profile:', error);
      alert('Error deleting genetic profile');
    }
  };

  const resetForm = () => {
    setFormData({
      test_result_id: 0,
      gene_id: 0,
      genotype: '',
      confidence: 0,
      raw_data: ''
    });
    setEditingProfile(null);
    setShowForm(false);
  };

  const startEdit = (profile: GeneticProfile) => {
    setFormData({
      test_result_id: profile.test_result_id,
      gene_id: profile.gene_id,
      genotype: profile.genotype,
      confidence: profile.confidence,
      raw_data: profile.raw_data
    });
    setEditingProfile(profile);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading genetic profiles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Genetic Profiles Management</h2>
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
          Add Genetic Profile
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingProfile ? 'Edit Genetic Profile' : 'Add New Genetic Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Test Result ID *</label>
                <input
                  type="number"
                  value={formData.test_result_id || ''}
                  onChange={(e) => setFormData({...formData, test_result_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Gene ID *</label>
                <input
                  type="number"
                  value={formData.gene_id || ''}
                  onChange={(e) => setFormData({...formData, gene_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Genotype *</label>
                <input
                  type="text"
                  value={formData.genotype}
                  onChange={(e) => setFormData({...formData, genotype: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Confidence (0-100)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.confidence || ''}
                  onChange={(e) => setFormData({...formData, confidence: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Raw Data</label>
                <textarea
                  value={formData.raw_data}
                  onChange={(e) => setFormData({...formData, raw_data: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30 h-24"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingProfile ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Test Result ID</th>
              <th className="px-4 py-2 text-left">Gene</th>
              <th className="px-4 py-2 text-left">Genotype</th>
              <th className="px-4 py-2 text-left">Confidence</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {geneticProfiles.map((profile) => (
              <tr key={profile.genetic_profile_id} className="border-t border-white/20">
                <td className="px-4 py-2">{profile.genetic_profile_id}</td>
                <td className="px-4 py-2">{profile.test_result_id}</td>
                <td className="px-4 py-2">{geneNameById[profile.gene_id] || profile.gene_id}</td>
                <td className="px-4 py-2">{profile.genotype}</td>
                <td className="px-4 py-2">{profile.confidence}%</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(profile)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.genetic_profile_id)}
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
