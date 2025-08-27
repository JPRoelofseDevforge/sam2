import { BloodResultsModel } from './src/db/models/bloodResults.ts';
import { AthleteModel } from './src/db/models/athletes.ts';

async function testBloodData() {
  try {
    console.log('🔍 Testing Blood Results Data...');
    
    // Get all blood results
    const allBloodResults = await BloodResultsModel.getAllBloodResults();
    console.log(`📊 Total blood results in database: ${allBloodResults.length}`);
    
    if (allBloodResults.length > 0) {
      console.log('✅ Blood results data exists in the database');
      
      // Get the first few results
      const firstResults = allBloodResults.slice(0, 3);
      console.log('📋 Sample blood results:');
      firstResults.forEach((result, index) => {
        console.log(`  ${index + 1}. Athlete ID: ${result.AthleteId}, Date: ${result.date}`);
      });
      
      // Try to get results for the first athlete
      const firstAthleteResults = await BloodResultsModel.getBloodResultsByAthleteId(allBloodResults[0].AthleteId);
      console.log(`🩸 Blood results for athlete ${allBloodResults[0].AthleteId}: ${firstAthleteResults.length} records`);
    } else {
      console.log('❌ No blood results found in database');
      console.log('💡 Run the import script: npx tsx src/scripts/importBloodResults.ts');
    }
    
    console.log('✅ Blood Results data check completed');
    
  } catch (error) {
    console.error('❌ Error testing blood results data:', error);
  }
}

// Run the test
testBloodData();