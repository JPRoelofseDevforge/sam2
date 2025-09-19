import React, { useState, useEffect } from 'react';
import { bodyCompositionService } from '../services/dataService';
import { BodyComposition } from '../types';
import ScaleReportHeader from './ScaleReportHeader';
import BodyCompositionChart from './BodyCompositionChart';
import MuscleFatAnalysis from './MuscleFatAnalysis';
import ObesityAnalysis from './ObesityAnalysis';
import BodyCompositionTable from './BodyCompositionTable';
import BodyTypeAssessment from './BodyTypeAssessment';
import SegmentalAnalysis from './SegmentalAnalysis';
import BioelectricalImpedance from './BioelectricalImpedance';
import BodyScoreAnalysis from './BodyScoreAnalysis';
import WeightControlGoals from './WeightControlGoals';
import HealthIndicators from './HealthIndicators';
import BodyBalanceEvaluation from './BodyBalanceEvaluation';

interface ScaleReportProps {
  athleteId: string;
}

const ScaleReport: React.FC<ScaleReportProps> = ({ athleteId }) => {
  const [athleteBodyComp, setAthleteBodyComp] = useState<BodyComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBodyCompositionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert athleteId string to number for API call
        const athleteIdNum = parseInt(athleteId, 10);
        if (isNaN(athleteIdNum)) {
          throw new Error('Invalid athlete ID');
        }

        const bodyCompositionData = await bodyCompositionService.getBodyCompositionByAthlete(athleteIdNum);

        // Get the latest body composition data for this athlete
        const latestData = Array.isArray(bodyCompositionData)
          ? bodyCompositionData
              .filter(b => b.measurementDate)
              .sort((a, b) => new Date(b.measurementDate!).getTime() - new Date(a.measurementDate!).getTime())[0]
          : null;

        setAthleteBodyComp(latestData || null);
      } catch (err) {
        console.error('Failed to fetch body composition data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load body composition data');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchBodyCompositionData();
    }
  }, [athleteId]);

  return (
    <div className="space-y-8 text-gray-900">
      <ScaleReportHeader
        loading={loading}
        error={error}
        hasData={!!athleteBodyComp}
      />

      {athleteBodyComp && (
        <>
          <BodyCompositionChart athleteBodyComp={athleteBodyComp} />
          <MuscleFatAnalysis athleteBodyComp={athleteBodyComp} />
          <ObesityAnalysis athleteBodyComp={athleteBodyComp} />
          <BodyCompositionTable athleteBodyComp={athleteBodyComp} />
          <BodyTypeAssessment athleteBodyComp={athleteBodyComp} />
          <SegmentalAnalysis athleteBodyComp={athleteBodyComp} />          
          <BodyScoreAnalysis athleteBodyComp={athleteBodyComp} />
          <WeightControlGoals athleteBodyComp={athleteBodyComp} />
          <HealthIndicators athleteBodyComp={athleteBodyComp} />
          <BodyBalanceEvaluation athleteBodyComp={athleteBodyComp} />
        </>
      )}
    </div>
  );
};

export default ScaleReport;