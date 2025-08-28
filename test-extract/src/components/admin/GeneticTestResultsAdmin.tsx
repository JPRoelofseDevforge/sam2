import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';

interface GeneticTestResult {
  test_result_id: number;
  athlete_id: number;
  test_type_id: number;
  test_date: string;
  test_lab_id: string;
  test_status: string;
  notes: string;
  created_date: string;
}

export const GeneticTestResultsAdmin: React.FC<{ onNavigate?: (view: 'overview') => void }> = ({ onNavigate }) => {
  const [geneticTestResults, setGeneticTestResults] = useState<GeneticTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestResult, setEditingTestResult] = useState<GeneticTestResult | null>(null);
  const [formData, setFormData] = useState({
    athlete_id: 0,
    test_type_id: 0,
    test_date: '',
    test_lab_id: '',
    test_status: 'Completed',
    notes: ''
  });

  // Lookup data to display names instead of numeric FK IDs
  const [athletes, setAthletes] = useState<any[]>([]);
  const [testTypes, setTestTypes] = useState<any[]>([]);

  const fetchLookups = async () => {
    try {
      const [athList, typeList] = await Promise.all([
        apiGet<any[]>('/athletes'),
        apiGet<any[]>('/admin/genetic-test-types'),
      ]);
      setAthletes(athList || []);
      setTestTypes(typeList || []);
    } catch (e) {
      console.error('Error fetching lookup data:', e);
    }
  };

  const athleteNameById = React.useMemo(() => {
    const map: Record<number | string, string> = {};
    athletes.forEach((a: any) => {
      const fullName =
        a?.name ||
        [a?.first_name, a?.last_name].filter(Boolean).join(' ').trim();
      const code = a?.athlete_code ?? a?.athlete_id;
      const label = fullName ? `${fullName} (${code})` : String(code ?? a?.athlete_id);
      const key =
        typeof a?.athlete_id === 'number'
          ? a.athlete_id
          : parseInt(a?.athlete_id, 10) || a?.athlete_id;
      map[key] = label;
    });
    return map;
  }, [athletes]);

  const testTypeNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    testTypes.forEach((t: any) => {
      map[t.test_type_id] = t.test_name || String(t.test_type_id);
    });
    return map;
  }, [testTypes]);

  useEffect(() => {
    fetchGeneticTestResults();
    fetchLookups();
  }, []);

  const fetchGeneticTestResults = async () => {
    try {
      const data = await apiGet<GeneticTestResult[]>('/admin/genetic-test-results');
      setGeneticTestResults(data);
    } catch (error) {
      console.error('Error fetching genetic test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        athlete_id: formData.athlete_id,
        test_type_id: formData.test_type_id,
        test_date: formData.test_date,
        test_lab_id: formData.test_lab_id,
        test_status: formData.test_status,
        notes: formData.notes
      };

      if (editingTestResult) {
        await apiPut(`/admin/genetic-test-results/${editingTestResult.test_result_id}`, submitData);
      } else {
        await apiPost('/admin/genetic-test-results', submitData);
      }

      fetchGeneticTestResults();
      resetForm();
    } catch (error) {
      console.error('Error saving genetic test result:', error);
      alert('Error saving genetic test result');
    }
  };

  const handleDelete = async (testResultId: number) => {
    if (!confirm('Are you sure you want to delete this genetic test result?')) return;

    try {
      await apiDelete(`/admin/genetic-test-results/${testResultId}`);
      fetchGeneticTestResults();
    } catch (error) {
      console.error('Error deleting genetic test result:', error);
      alert('Error deleting genetic test result');
    }
  };

  const resetForm = () => {
    setFormData({
      athlete_id: 0,
      test_type_id: 0,
      test_date: '',
      test_lab_id: '',
      test_status: 'Completed',
      notes: ''
    });
    setEditingTestResult(null);
    setShowForm(false);
  };

  const startEdit = (testResult: GeneticTestResult) => {
    setFormData({
      athlete_id: testResult.athlete_id,
      test_type_id: testResult.test_type_id,
      test_date: testResult.test_date,
      test_lab_id: testResult.test_lab_id,
      test_status: testResult.test_status,
      notes: testResult.notes
    });
    setEditingTestResult(testResult);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-white">Loading genetic test results...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Genetic Test Results Management</h2>
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
          Add Test Result
        </button>
      </div>

      {showForm && (
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingTestResult ? 'Edit Test Result' : 'Add New Test Result'}
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
                <label className="block text-white mb-2">Test Type ID *</label>
                <input
                  type="number"
                  value={formData.test_type_id || ''}
                  onChange={(e) => setFormData({...formData, test_type_id: parseInt(e.target.value) || 0})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Test Date *</label>
                <input
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => setFormData({...formData, test_date: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Test Lab ID</label>
                <input
                  type="text"
                  value={formData.test_lab_id}
                  onChange={(e) => setFormData({...formData, test_lab_id: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Test Status *</label>
                <select
                  value={formData.test_status}
                  onChange={(e) => setFormData({...formData, test_status: e.target.value})}
                  className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
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
                {editingTestResult ? 'Update' : 'Create'}
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
              <th className="px-4 py-2 text-left">Test Type</th>
              <th className="px-4 py-2 text-left">Test Date</th>
              <th className="px-4 py-2 text-left">Lab ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {geneticTestResults.map((testResult) => (
              <tr key={testResult.test_result_id} className="border-t border-white/20">
                <td className="px-4 py-2">{testResult.test_result_id}</td>
                <td className="px-4 py-2">{athleteNameById[testResult.athlete_id] || testResult.athlete_id}</td>
                <td className="px-4 py-2">{testTypeNameById[testResult.test_type_id] || testResult.test_type_id}</td>
                <td className="px-4 py-2">{new Date(testResult.test_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{testResult.test_lab_id}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    testResult.test_status === 'Completed' ? 'bg-green-600' :
                    testResult.test_status === 'Pending' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {testResult.test_status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => startEdit(testResult)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testResult.test_result_id)}
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
