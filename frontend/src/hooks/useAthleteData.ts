import { useState, useEffect } from 'react';
import { Athlete, BiometricData, GeneticProfile } from '../types';
import dataService from '../services/dataService';

interface UseAthleteDataResult {
  athlete: Athlete | undefined;
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAthleteData = (athleteId: number, useDatabase: boolean = true): UseAthleteDataResult => {
  const [athlete, setAthlete] = useState<Athlete | undefined>(undefined);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dataService.getData(useDatabase);
      setAthlete(data.athletes?.find(a => parseInt(a.athlete_id) === athleteId));
      setBiometricData(data.biometricData || []);
      setGeneticProfiles(data.geneticProfiles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch athlete data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [athleteId, useDatabase]);

  return {
    athlete,
    biometricData,
    geneticProfiles,
    loading,
    error,
    refetch: fetchData,
  };
};

interface UseTeamDataResult {
  athletes: Athlete[];
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTeamData = (useDatabase: boolean = true): UseTeamDataResult => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dataService.getData(useDatabase);
      setAthletes(data.athletes || []);
      setBiometricData(data.biometricData || []);
      setGeneticProfiles(data.geneticProfiles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [useDatabase]);

  return {
    athletes,
    biometricData,
    geneticProfiles,
    loading,
    error,
    refetch: fetchData,
  };
};

interface UseIndividualAthleteDataResult {
  athlete: Athlete | undefined;
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useIndividualAthleteData = (athleteId: number, useDatabase: boolean = true): UseIndividualAthleteDataResult => {
  const [athlete, setAthlete] = useState<Athlete | undefined>(undefined);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dataService.getAthleteData(athleteId, useDatabase);
      setAthlete(data.athlete);
      setBiometricData(data.biometricData || []);
      setGeneticProfiles(data.geneticProfile || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch athlete data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [athleteId, useDatabase]);

  return {
    athlete,
    biometricData,
    geneticProfiles,
    loading,
    error,
    refetch: fetchData,
  };
};