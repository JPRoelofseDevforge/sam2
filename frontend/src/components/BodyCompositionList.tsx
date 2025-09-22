import React, { useState, useEffect } from 'react';
import { BodyComposition, Athlete } from '../types';
import dataService, { bodyCompositionService } from '../services/dataService';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { StatusMessage } from './ui/StatusMessage';

interface BodyCompositionListProps {
  onCreate?: (athleteId: number) => void;
  onEdit?: (record: BodyComposition) => void;
  onDelete?: (record: BodyComposition) => void;
}

export const BodyCompositionList: React.FC<BodyCompositionListProps> = ({
  onCreate,
  onEdit,
  onDelete
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [records, setRecords] = useState<BodyComposition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load athletes on component mount
  useEffect(() => {
    loadAthletes();
  }, []);

  // Load body composition records when athlete is selected
  useEffect(() => {
    if (selectedAthleteId) {
      loadBodyCompositionRecords(selectedAthleteId);
    } else {
      setRecords([]);
    }
  }, [selectedAthleteId]);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const athleteData = await bodyCompositionService.getAllAthletes();
      setAthletes(athleteData);
      setError(null);
    } catch (err) {
      setError('Failed to load athletes');
      console.error('Error loading athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBodyCompositionRecords = async (athleteId: number) => {
    try {
      setLoading(true);
      const bodyCompData = await bodyCompositionService.getBodyCompositionByAthlete(athleteId);
      setRecords(bodyCompData);
      setError(null);
    } catch (err) {
      setError('Failed to load body composition records');
      console.error('Error loading body composition records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: BodyComposition) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      setLoading(true);
      await bodyCompositionService.deleteBodyComposition(record.id, record.athleteId);
      // Reload records after deletion
      if (selectedAthleteId) {
        await loadBodyCompositionRecords(selectedAthleteId);
      }
      setError(null);
    } catch (err) {
      setError('Failed to delete record');
      console.error('Error deleting record:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Body Composition Management</h1>
        {selectedAthleteId && (
          <Button
            onClick={() => onCreate?.(selectedAthleteId)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add New Record
          </Button>
        )}
      </div>

      {/* Athlete Selector */}
      <div className="card-enhanced p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Athlete</h2>
        <div className="max-w-md">
          <select
            value={selectedAthleteId || ''}
            onChange={(e) => setSelectedAthleteId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">Choose an athlete...</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name} - {athlete.sport}
              </option>
            ))}
          </select>
        </div>
        {selectedAthlete && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900">Selected Athlete</h3>
            <p className="text-blue-700">{selectedAthlete.name}</p>
            <p className="text-sm text-blue-600">Sport: {selectedAthlete.sport} | Age: {selectedAthlete.age}</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <StatusMessage type="error" message={error} />
      )}

      {/* Records Table */}
      {selectedAthleteId && (
        <div className="card-enhanced p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Body Composition Records ({records.length})
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No body composition records found for this athlete.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Weight (kg)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Body Fat (%)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Muscle Mass (kg)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">BMI</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {formatDate(record.measurementDate)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {record.weight.toFixed(1)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {record.bodyFat.toFixed(1)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {record.muscleMass.toFixed(1)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        {record.bmi?.toFixed(1) || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-900">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => onEdit?.(record)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(record)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BodyCompositionList;