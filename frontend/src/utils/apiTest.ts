import { dataService } from '../services/dataService';

/**
 * Test utility to verify API integrations for Phase 3 components
 */
export const testApiIntegrations = {
  async testDigitalTwinApi(athleteId: string | number) {
    try {
      const data = await dataService.getAthleteData(typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId);
      return true;
    } catch (error) {
      return false;
    }
  },

  async testTrainingLoadHeatmapApi() {
    console.log('📊 Testing TrainingLoadHeatmap API integration...');
    try {
      const data = await dataService.getData();
      console.log('✅ TrainingLoadHeatmap API test passed:', {
        athletes: data.athletes.length,
        biometricRecords: data.biometricData.length
      });
      return true;
    } catch (error) {
      console.error('❌ TrainingLoadHeatmap API test failed:', error);
      return false;
    }
  },

  async testTeamComparisonDashboardApi() {
    console.log('👥 Testing TeamComparisonDashboard API integration...');
    try {
      const data = await dataService.getData();
      console.log('✅ TeamComparisonDashboard API test passed:', {
        athletes: data.athletes.length,
        biometricRecords: data.biometricData.length,
        geneticProfiles: data.geneticProfiles.length
      });
      return true;
    } catch (error) {
      console.error('❌ TeamComparisonDashboard API test failed:', error);
      return false;
    }
  },

  async testStressManagementApi(athleteId: string | number) {
    console.log('🧘 Testing StressManagement API integration...');
    try {
      const data = await dataService.getAthleteData(typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId);
      console.log('✅ StressManagement API test passed:', {
        athlete: data.athlete?.name,
        biometricRecords: data.biometricData.length
      });
      return true;
    } catch (error) {
      console.error('❌ StressManagement API test failed:', error);
      return false;
    }
  },

  async runAllTests(athleteId?: string | number) {
    console.log('🚀 Running all Phase 3 API integration tests...\n');

    const results = {
      digitalTwin: await this.testDigitalTwinApi(athleteId || 1),
      trainingLoadHeatmap: await this.testTrainingLoadHeatmapApi(),
      teamComparisonDashboard: await this.testTeamComparisonDashboardApi(),
      stressManagement: await this.testStressManagementApi(athleteId || 1)
    };

    console.log('\n📋 Test Results Summary:');
    Object.entries(results).forEach(([component, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${component}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed. Check the logs above.'}`);

    return results;
  }
};

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after a short delay to ensure the app is ready
  setTimeout(() => {
    testApiIntegrations.runAllTests();
  }, 2000);
}