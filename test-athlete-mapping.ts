import { AthleteModel } from './src/db/models/athletes.ts';

async function testAthleteMapping() {
  try {
    console.log('🔍 Testing Athlete Mapping...');
    
    // Test a few specific athlete codes that should exist
    const testCodes = ['1', '2', '3', 'ATH001', 'ATH002'];
    
    for (const code of testCodes) {
      try {
        console.log(`\nTesting athlete code: ${code}`);
        const athleteId = await AthleteModel.getAthleteIdMapping(code);
        if (athleteId) {
          console.log(`✅ Found athlete ID: ${athleteId} for code: ${code}`);
        } else {
          console.log(`❌ No athlete found for code: ${code}`);
        }
      } catch (error) {
        console.error(`Error looking up athlete code ${code}:`, error);
      }
    }
    
    // Get all athletes to see what codes exist
    console.log('\n📋 All athletes in database:');
    const allAthletes = await AthleteModel.getAllAthletes();
    allAthletes.forEach(athlete => {
      console.log(`  - ID: ${athlete.athlete_id}, Name: ${athlete.name}`);
    });
    
    console.log('\n✅ Athlete mapping test completed');
    
  } catch (error) {
    console.error('❌ Error testing athlete mapping:', error);
  }
}

// Run the test
testAthleteMapping();