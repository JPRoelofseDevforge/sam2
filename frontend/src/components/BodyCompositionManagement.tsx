import React, { useState } from 'react';
import { BodyComposition } from '../types';
import BodyCompositionList from './BodyCompositionList';
import BodyCompositionForm from './BodyCompositionForm';

type ViewMode = 'list' | 'create' | 'edit';

export const BodyCompositionManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRecord, setSelectedRecord] = useState<BodyComposition | undefined>();
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);

  const handleCreate = (athleteId: number) => {
    setSelectedAthleteId(athleteId);
    setViewMode('create');
  };

  const handleEdit = (record: BodyComposition) => {
    setSelectedRecord(record);
    setSelectedAthleteId(record.athleteId);
    setViewMode('edit');
  };

  const handleSave = () => {
    setViewMode('list');
    setSelectedRecord(undefined);
    setSelectedAthleteId(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedRecord(undefined);
    setSelectedAthleteId(null);
  };

  if (viewMode === 'create' && selectedAthleteId) {
    return (
      <BodyCompositionForm
        athleteId={selectedAthleteId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  if (viewMode === 'edit' && selectedRecord && selectedAthleteId) {
    return (
      <BodyCompositionForm
        athleteId={selectedAthleteId}
        record={selectedRecord}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <BodyCompositionList
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={() => {}} // Delete is handled internally in the list component
    />
  );
};

export default BodyCompositionManagement;