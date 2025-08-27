import React, { useState, useEffect } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { apiPost, apiPut, apiDelete } from '../../utils/api';

interface Gene {
  gene_id: number;
  gene_name: string;
  gene_description?: string;
  chromosome?: string;
  function?: string;
  category?: string;
}

export const GenesAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGene, setEditingGene] = useState<Gene | null>(null);
  const [formData, setFormData] = useState({
    gene_name: '',
    gene_description: '',
    chromosome: '',
    function: '',
    category: ''
  });

  const { data: genes = [], loading, error, refetch: fetchGenes } = useAdminApi<Gene[]>('/admin/genes');

  useEffect(() => {
    if (error) {
      console.error('Error fetching genes:', error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGene) {
        await apiPut(`/admin/genes/${editingGene.gene_id}`, formData);
      } else {
        await apiPost('/admin/genes', formData);
      }
      fetchGenes();
      resetForm();
    } catch (error) {
      console.error('Error saving gene:', error);
      alert('Error saving gene');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gene?')) return;

    try {
      await apiDelete(`/admin/genes/${id}`);
      fetchGenes();
    } catch (error) {
      console.error('Error deleting gene:', error);
      alert('Error deleting gene');
    }
  };

  const resetForm = () => {
    setFormData({
      gene_name: '',
      gene_description: '',
      chromosome: '',
      function: '',
      category: ''
    });
    setEditingGene(null);
    setShowForm(false);
  };

  const startEdit = (gene: Gene) => {
    setFormData({
      gene_name: gene.gene_name,
      gene_description: gene.gene_description || '',
      chromosome: gene.chromosome || '',
      function: gene.function || '',
      category: gene.category || ''
    });
    setEditingGene(gene);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading genes...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Genes Management</h2>
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
          Add Gene
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingGene ? 'Edit Gene' : 'Add New Gene'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Gene Name *</label>
                <input
                  type="text"
                  value={formData.gene_name}
                  onChange={(e) => setFormData({...formData, gene_name: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Chromosome</label>
                <input
                  type="text"
                  value={formData.chromosome}
                  onChange={(e) => setFormData({...formData, chromosome: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Description</label>
                <textarea
                  value={formData.gene_description}
                  onChange={(e) => setFormData({...formData, gene_description: e.target.value})}
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
                {editingGene ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Chromosome</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {genes && genes.map((gene) => (
              <tr key={gene.gene_id} className="border-t border-white/20">
                <td className="px-4 py-2">{gene.gene_name}</td>
                <td className="px-4 py-2">{gene.category || '-'}</td>
                <td className="px-4 py-2">{gene.chromosome || '-'}</td>
                <td className="px-4 py-2">{gene.gene_description || '-'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(gene)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(gene.gene_id)}
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
