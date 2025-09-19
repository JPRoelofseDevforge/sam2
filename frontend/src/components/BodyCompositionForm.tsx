import React, { useState, useEffect } from 'react';
import { BodyComposition, Athlete } from '../types';
import dataService from '../services/dataService';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { StatusMessage } from './ui/StatusMessage';

interface BodyCompositionFormProps {
  athleteId: number;
  record?: BodyComposition;
  onSave: () => void;
  onCancel: () => void;
}

export const BodyCompositionForm: React.FC<BodyCompositionFormProps> = ({
  athleteId,
  record,
  onSave,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  const [formData, setFormData] = useState({
    measurementDate: record?.measurementDate || new Date().toISOString().split('T')[0],
    weight: record?.weight || 0,
    bodyFat: record?.bodyFat || 0,
    muscleMass: record?.muscleMass || 0,
    boneDensity: record?.boneDensity || 0,
    targetWeight: record?.targetWeight || undefined,
    weightRangeMin: record?.weightRangeMin || undefined,
    weightRangeMax: record?.weightRangeMax || undefined,
    bmi: record?.bmi || undefined,
    visceralFatGrade: record?.visceralFatGrade || undefined,
    basalMetabolicRate: record?.basalMetabolicRate || undefined,
    subcutaneousFatPercent: record?.subcutaneousFatPercent || undefined,
    bodyAge: record?.bodyAge || undefined,
    smi: record?.smi || undefined,
    armMassRightKg: record?.armMassRightKg || undefined,
    armMassLeftKg: record?.armMassLeftKg || undefined,
    legMassRightKg: record?.legMassRightKg || undefined,
    legMassLeftKg: record?.legMassLeftKg || undefined,
    trunkMassKg: record?.trunkMassKg || undefined,
    armMassRightFatKg: record?.ArmMassRightFatKg || undefined,
    armMassLeftFatKg: record?.ArmMassLeftFatKg || undefined,
    legMassRightFatKg: record?.LegMassRightFatKg || undefined,
    legMassLeftFatKg: record?.LegMassLeftFatKg || undefined,
    trunkMassFatKg: record?.TrunkMassFatKg || undefined,
  });

  useEffect(() => {
    loadAthlete();
  }, [athleteId]);

  // Update form data when record prop changes (for editing existing records)
  useEffect(() => {
    if (record) {
      // Format date for HTML date input (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch {
          return new Date().toISOString().split('T')[0];
        }
      };

      setFormData({
        measurementDate: record.measurementDate ? formatDateForInput(record.measurementDate) : new Date().toISOString().split('T')[0],
        weight: record.weight || 0,
        bodyFat: record.bodyFat || 0,
        muscleMass: record.muscleMass || 0,
        boneDensity: record.boneDensity || 0,
        targetWeight: record.targetWeight || undefined,
        weightRangeMin: record.weightRangeMin || undefined,
        weightRangeMax: record.weightRangeMax || undefined,
        bmi: record.bmi || undefined,
        visceralFatGrade: record.visceralFatGrade || undefined,
        basalMetabolicRate: record.basalMetabolicRate || undefined,
        subcutaneousFatPercent: record.subcutaneousFatPercent || undefined,
        bodyAge: record.bodyAge || undefined,
        smi: record.smi || undefined,
        armMassRightKg: record.armMassRightKg || undefined,
        armMassLeftKg: record.armMassLeftKg || undefined,
        legMassRightKg: record.legMassRightKg || undefined,
        legMassLeftKg: record.legMassLeftKg || undefined,
        trunkMassKg: record.trunkMassKg || undefined,
        armMassRightFatKg: record.ArmMassRightFatKg || undefined,
        armMassLeftFatKg: record.ArmMassLeftFatKg || undefined,
        legMassRightFatKg: record.LegMassRightFatKg || undefined,
        legMassLeftFatKg: record.LegMassLeftFatKg || undefined,
        trunkMassFatKg: record.TrunkMassFatKg || undefined,
      });
    }
  }, [record]);

  const loadAthlete = async () => {
    try {
      const athleteData = await dataService.getAthleteData(athleteId);
      setAthlete(athleteData.athlete || null);
    } catch (err) {
      console.error('Error loading athlete:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        ...formData,
        athleteId,
        measurementDate: new Date(formData.measurementDate).toISOString(),
      };

      if (record) {
        // For updates, we need to call the PUT endpoint directly
        // Since the dataService doesn't have an update method, we'll use the API directly
        const updateData = {
          ...dataToSave,
          id: record.id
        };
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5288/api'}/body-composition/${record.id}?athleteId=${athleteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      } else {
        // Create new record
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5288/api'}/body-composition?athleteId=${athleteId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
      }

      onSave();
    } catch (err) {
      setError('Failed to save body composition record');
      console.error('Error saving record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !athlete) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {record ? 'Edit' : 'Add'} Body Composition Record
        </h2>

        {athlete && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900">Athlete</h3>
            <p className="text-blue-700">{athlete.name}</p>
            <p className="text-sm text-blue-600">Sport: {athlete.sport} | Age: {athlete.age}</p>
          </div>
        )}

        {error && (
          <StatusMessage type="error" message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement Date *
              </label>
              <input
                type="date"
                value={formData.measurementDate}
                onChange={(e) => handleInputChange('measurementDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Fat (%) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFat}
                onChange={(e) => handleInputChange('bodyFat', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Muscle Mass (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.muscleMass}
                onChange={(e) => handleInputChange('muscleMass', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bone Density (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.boneDensity || ''}
                onChange={(e) => handleInputChange('boneDensity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BMI
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi || ''}
                onChange={(e) => handleInputChange('bmi', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>
          </div>

          {/* Target and Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.targetWeight || ''}
                onChange={(e) => handleInputChange('targetWeight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Range Min (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weightRangeMin || ''}
                onChange={(e) => handleInputChange('weightRangeMin', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Range Max (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weightRangeMax || ''}
                onChange={(e) => handleInputChange('weightRangeMax', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visceral Fat Grade
              </label>
              <input
                type="number"
                step="1"
                value={formData.visceralFatGrade || ''}
                onChange={(e) => handleInputChange('visceralFatGrade', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basal Metabolic Rate (kcal)
              </label>
              <input
                type="number"
                step="1"
                value={formData.basalMetabolicRate || ''}
                onChange={(e) => handleInputChange('basalMetabolicRate', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcutaneous Fat (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.subcutaneousFatPercent || ''}
                onChange={(e) => handleInputChange('subcutaneousFatPercent', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Age
              </label>
              <input
                type="number"
                step="1"
                value={formData.bodyAge || ''}
                onChange={(e) => handleInputChange('bodyAge', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skeletal Muscle Index (kg/m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.smi || ''}
                onChange={(e) => handleInputChange('smi', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
              />
            </div>
          </div>

          {/* Segmental Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Segmental Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Left Arm Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.armMassLeftKg || ''}
                  onChange={(e) => handleInputChange('armMassLeftKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Left Arm Fat Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.armMassLeftFatKg || ''}
                  onChange={(e) => handleInputChange('armMassLeftFatKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Right Arm Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.armMassRightKg || ''}
                  onChange={(e) => handleInputChange('armMassRightKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Right Arm Fat Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.armMassRightFatKg || ''}
                  onChange={(e) => handleInputChange('armMassRightFatKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Left Leg Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.legMassLeftKg || ''}
                  onChange={(e) => handleInputChange('legMassLeftKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Left Leg Fat Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.legMassLeftFatKg || ''}
                  onChange={(e) => handleInputChange('legMassLeftFatKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Right Leg Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.legMassRightKg || ''}
                  onChange={(e) => handleInputChange('legMassRightKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Right Leg Fat Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.legMassRightFatKg || ''}
                  onChange={(e) => handleInputChange('legMassRightFatKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trunk Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.trunkMassKg || ''}
                  onChange={(e) => handleInputChange('trunkMassKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trunk Fat Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.trunkMassFatKg || ''}
                  onChange={(e) => handleInputChange('trunkMassFatKg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? 'Saving...' : (record ? 'Update' : 'Create')} Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BodyCompositionForm;