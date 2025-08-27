import { BloodResultsModel } from './src/db/models/bloodResults.ts';
import { AthleteModel } from './src/db/models/athletes.ts';

async function testBloodResults() {
  try {
    console.log('🔍 Testing Blood Results functionality...');

    // Get all athletes
    const athletes = await AthleteModel.getAllAthletes();
    console.log(`📊 Found ${athletes.length} athletes in database`);

    if (athletes.length > 0) {
      const athlete = athletes[0];
      console.log(`🏃 Testing with athlete: ${athlete.name} (ID: ${athlete.athlete_id})`);

      // Test getting blood results for this athlete
      const athleteIdNum = parseInt(athlete.athlete_id, 10);
      const bloodResults = await BloodResultsModel.getBloodResultsByAthlete(athleteIdNum);
      console.log(`🩸 Found ${bloodResults.length} blood results for this athlete`);

      if (bloodResults.length > 0) {
        console.log('✅ Blood results data structure:');
        console.log(JSON.stringify(bloodResults[0], null, 2));
      } else {
        console.log('⚠️ No blood results found for this athlete');
        console.log('💡 Consider importing blood results data using the import script');
      }

      // Test getting latest blood results
      const latestResults = await BloodResultsModel.getLatestBloodResults(athleteIdNum);
      if (latestResults) {
        console.log('✅ Latest blood results retrieved successfully');
      } else {
        console.log('⚠️ No latest blood results found');
      }

    } else {
      console.log('❌ No athletes found in database');
    }

    console.log('✅ Blood Results functionality test completed');

  } catch (error) {
    console.error('❌ Error testing blood results:', error);
  }
}

// Run the test
testBloodResults();