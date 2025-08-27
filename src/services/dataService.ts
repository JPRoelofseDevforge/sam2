import axios from 'axios';
import { Athlete, BiometricData, GeneticProfile, BodyComposition, BloodResults } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// =====================================================
// ATHLETE SERVICES
// =====================================================

export const athleteService = {
  // Get all athletes
  async getAllAthletes(): Promise<Athlete[]> {
    const response = await api.get<Athlete[]>('/athletes');
    return response.data;
  },

  // Get single athlete by ID
  async getAthleteById(athleteCode: string): Promise<Athlete> {
    const response = await api.get<Athlete>(`/athletes/${athleteCode}`);
    return response.data;
  },

  // Get athletes by team
  async getAthletesByTeam(organizationId: number): Promise<Athlete[]> {
    const response = await api.get<Athlete[]>(`/teams/${organizationId}/athletes`);
    return response.data;
  },
};

// =====================================================
// BIOMETRIC DATA SERVICES
// =====================================================

export const biometricDataService = {
  // Get all biometric data
  async getAllBiometricData(startDate?: string, endDate?: string): Promise<BiometricData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<BiometricData[]>(`/biometric-data?${params.toString()}`);
    return response.data;
  },

  // Get biometric data for specific athlete
  async getBiometricDataByAthlete(
    athleteCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<BiometricData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<BiometricData[]>(
      `/athletes/${athleteCode}/biometric-data?${params.toString()}`
    );
    return response.data;
  },

  // Get latest biometric data for all athletes
  async getLatestBiometricData(): Promise<BiometricData[]> {
    const response = await api.get<BiometricData[]>('/biometric-data/latest');
    return response.data;
  },

  // Insert/Update biometric data
  async saveBiometricData(athleteCode: string, data: Omit<BiometricData, 'athlete_id'>): Promise<void> {
    await api.post(`/athletes/${athleteCode}/biometric-data`, data);
  },
};

// =====================================================
// GENETIC PROFILE SERVICES
// =====================================================

export const geneticProfileService = {
  // Get all genetic profiles
  async getAllGeneticProfiles(): Promise<GeneticProfile[]> {
    const response = await api.get<GeneticProfile[]>('/genetic-profiles');
    return response.data;
  },

  // Get genetic profile for specific athlete
  async getGeneticProfileByAthlete(athleteCode: string): Promise<GeneticProfile[]> {
    const response = await api.get<GeneticProfile[]>(`/athletes/${athleteCode}/genetic-profile`);
    return response.data;
  },

  // Get genetic profiles by category
  async getGeneticProfilesByCategory(category: string): Promise<GeneticProfile[]> {
    const response = await api.get<GeneticProfile[]>(`/genetic-profiles/category/${category}`);
    return response.data;
  },

  // Get specific genes for all athletes
  async getSpecificGenes(genes: string[]): Promise<GeneticProfile[]> {
    const response = await api.post<GeneticProfile[]>('/genetic-profiles/genes', { genes });
    return response.data;
  },

  // Get available genes list
  async getAvailableGenes(): Promise<{ gene_name: string; description: string; category: string }[]> {
    const response = await api.get<{ gene_name: string; description: string; category: string }[]>('/genes');
    return response.data;
  },
};

// =====================================================
// BODY COMPOSITION SERVICES
// =====================================================

export const bodyCompositionService = {
  // Get all body composition data
  async getAllBodyComposition(startDate?: string, endDate?: string): Promise<BodyComposition[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<BodyComposition[]>(`/body-composition?${params.toString()}`);
    return response.data;
  },

  // Get body composition for specific athlete
  async getBodyCompositionByAthlete(
    athleteCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<BodyComposition[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<BodyComposition[]>(
      `/athletes/${athleteCode}/body-composition?${params.toString()}`
    );
    return response.data;
  },

  // Get latest body composition for all athletes
  async getLatestBodyComposition(): Promise<BodyComposition[]> {
    const response = await api.get<BodyComposition[]>('/body-composition/latest');
    return response.data;
  },

  // Insert/Update body composition data
  async saveBodyComposition(athleteCode: string, data: Omit<BodyComposition, 'athlete_id'>): Promise<void> {
    await api.post(`/athletes/${athleteCode}/body-composition`, data);
  },
};

// =====================================================
// BLOOD RESULTS SERVICES
// =====================================================

export const bloodResultsService = {
  // Get all blood results
  async getAllBloodResults(): Promise<BloodResults[]> {
    const response = await api.get<BloodResults[]>('/blood-results');
    return response.data;
  },

  // Get blood results for specific athlete
  async getBloodResultsByAthlete(athleteCode: string): Promise<BloodResults[]> {
    const response = await api.get<BloodResults[]>(`/athletes/${athleteCode}/blood-results`);
    return response.data;
  },

  // Get latest blood results for all athletes
  async getLatestBloodResults(): Promise<BloodResults[]> {
    const response = await api.get<BloodResults[]>('/blood-results/latest');
    return response.data;
  },

  // Insert/Update blood results
  async saveBloodResults(athleteCode: string, data: Omit<BloodResults, 'id' | 'AthleteId'>): Promise<void> {
    await api.post(`/athletes/${athleteCode}/blood-results`, data);
  },
};

// =====================================================
// COMBINED DATA SERVICES
// =====================================================

export const dashboardService = {
  // Get all data for a specific athlete
  async getAthleteAllData(athleteCode: string, startDate?: string, endDate?: string): Promise<{
    athlete: Athlete;
    biometricData: BiometricData[];
    geneticProfile: GeneticProfile[];
    bodyComposition: BodyComposition[];
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/athletes/${athleteCode}/all-data?${params.toString()}`);
    return response.data;
  },

  // Get dashboard data (latest data for all athletes)
  async getDashboardData(): Promise<{
    athletes: Athlete[];
    biometricData: BiometricData[];
    geneticProfiles: GeneticProfile[];
    bodyComposition: BodyComposition[];
  }> {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

// =====================================================
// FALLBACK TO MOCK DATA (for gradual migration)
// =====================================================

import { athletes as mockAthletes, biometricData as mockBiometricData, geneticProfiles as mockGeneticProfiles, bodyCompositionData as mockBodyComposition } from '../data/mockData';

export const dataService = {
  // Main function to get data with fallback to mock data
  async getData(useDatabase: boolean = true): Promise<{
    athletes: Athlete[];
    biometricData: BiometricData[];
    geneticProfiles: GeneticProfile[];
    bodyComposition: BodyComposition[];
  }> {
    if (useDatabase) {
      try {
        // Try to get data from database
        const data = await dashboardService.getDashboardData();
        console.log('Using database data');
        return data;
      } catch (error) {
        console.error('Failed to fetch from database, falling back to mock data:', error);
        // Fall back to mock data if database fails
        return {
          athletes: mockAthletes,
          biometricData: mockBiometricData,
          geneticProfiles: mockGeneticProfiles,
          bodyComposition: mockBodyComposition,
        };
      }
    } else {
      // Use mock data directly
      console.log('Using mock data');
      return {
        athletes: mockAthletes,
        biometricData: mockBiometricData,
        geneticProfiles: mockGeneticProfiles,
        bodyComposition: mockBodyComposition,
      };
    }
  },

  // Get data for specific athlete with fallback
  async getAthleteData(
    athleteCode: string,
    useDatabase: boolean = true
  ): Promise<{
    athlete: Athlete | undefined;
    biometricData: BiometricData[];
    geneticProfile: GeneticProfile[];
    bodyComposition: BodyComposition[];
  }> {
    if (useDatabase) {
      try {
        const data = await dashboardService.getAthleteAllData(athleteCode);
        console.log(`Using database data for athlete ${athleteCode}`);
        return data;
      } catch (error) {
        console.error(`Failed to fetch athlete ${athleteCode} from database, falling back to mock data:`, error);
        // Fall back to mock data
        return {
          athlete: mockAthletes.find(a => a.athlete_id === athleteCode),
          biometricData: mockBiometricData.filter(d => d.athlete_id === athleteCode),
          geneticProfile: mockGeneticProfiles.filter(p => p.athlete_id === athleteCode),
          bodyComposition: mockBodyComposition.filter(c => c.athlete_id === athleteCode),
        };
      }
    } else {
      // Use mock data directly
      console.log(`Using mock data for athlete ${athleteCode}`);
      return {
        athlete: mockAthletes.find(a => a.athlete_id === athleteCode),
        biometricData: mockBiometricData.filter(d => d.athlete_id === athleteCode),
        geneticProfile: mockGeneticProfiles.filter(p => p.athlete_id === athleteCode),
        bodyComposition: mockBodyComposition.filter(c => c.athlete_id === athleteCode),
      };
    }
  },
};

// Export default service
export default dataService;