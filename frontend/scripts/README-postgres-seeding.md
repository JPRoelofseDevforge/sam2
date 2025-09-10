# PostgreSQL Athlete Biometric Data Seeding Scripts

This directory contains individual PostgreSQL scripts to seed biometric data for all 23 athletes in the system.

## Available SQL Scripts

Each script seeds 7 days of biometric data (2025-08-31 to 2025-09-06) for a specific athlete:

- `athlete-1-biometric.sql` - Bowen Bezuidenhoudt
- `athlete-2-biometric.sql` - Aldrich Wichman
- `athlete-3-biometric.sql` - Steffan De Jongh
- `athlete-4-biometric.sql` - Juanre De Klerk
- `athlete-5-biometric.sql` - Francois Rossouw
- `athlete-6-biometric.sql` - Marco Nel
- `athlete-7-biometric.sql` - Wian Van Der Merwe
- `athlete-8-biometric.sql` - Heinrich Smit
- `athlete-9-biometric.sql` - Danie Van Zyl
- `athlete-10-biometric.sql` - Jaco Pretorius
- `athlete-11-biometric.sql` - Andre Van Der Westhuizen
- `athlete-12-biometric.sql` - Pieter Van Wyk
- `athlete-13-biometric.sql` - Ruan Botha
- `athlete-14-biometric.sql` - Jacques Du Plessis
- `athlete-15-biometric.sql` - Hennie Van Niekerk
- `athlete-16-biometric.sql` - Kobus Van Der Walt
- `athlete-17-biometric.sql` - Tiaan Van Rensburg
- `athlete-18-biometric.sql` - Lourens De Villiers
- `athlete-19-biometric.sql` - Gerrit Van Der Linde
- `athlete-20-biometric.sql` - Sarel Pretorius
- `athlete-21-biometric.sql` - Frik Fourie
- `athlete-22-biometric.sql` - Jan-Hendrik Van Der Berg
- `athlete-23-biometric.sql` - Christiaan Van Zyl

## Data Included

Each athlete's script inserts the following biometric metrics for 7 consecutive days:

- **RestingHeartRate** (bpm) - Resting heart rate
- **HeartRateVariability** (decimal) - HRV measurement
- **SleepQuality** (decimal) - Hours of sleep
- **RecoveryScore** (decimal) - Recovery score 0-10
- **FatigueLevel** (decimal) - Fatigue level 0-10
- **DeepSleep** (%) - Deep sleep percentage
- **RemSleep** (%) - REM sleep percentage
- **SpO2** (%) - Blood oxygen saturation
- **RespiratoryRate** (breaths/min) - Respiratory rate
- **BodyTemperature** (°C) - Body temperature

## How to Run

### Individual Athlete
```bash
psql -d your_database_name -f scripts/athlete-X-biometric.sql
```

Replace `X` with the athlete number (1-23).

### Multiple Athletes
You can run multiple scripts in sequence:
```bash
psql -d your_database_name -f scripts/athlete-1-biometric.sql
psql -d your_database_name -f scripts/athlete-2-biometric.sql
psql -d your_database_name -f scripts/athlete-3-biometric.sql
```

### All Athletes at Once
Create a batch script:
```bash
#!/bin/bash
for i in {1..23}
do
  echo "Seeding athlete $i..."
  psql -d your_database_name -f "scripts/athlete-$i-biometric.sql"
done
```

## Prerequisites

1. **PostgreSQL must be running**
2. **Database must exist** and be accessible
3. **Athletes must exist** in the database with IDs 1-23
4. **BiometricDaily table must exist** with all required columns:
   - Id (integer, primary key)
   - AthleteId (integer, foreign key)
   - Date (date)
   - RestingHeartRate (integer)
   - HeartRateVariability (decimal)
   - SleepQuality (decimal)
   - RecoveryScore (decimal)
   - FatigueLevel (decimal)
   - DeepSleep (decimal)
   - RemSleep (decimal)
   - SpO2 (decimal)
   - RespiratoryRate (decimal)
   - BodyTemperature (decimal)

## Script Features

- **Conflict Resolution**: Uses `ON CONFLICT ("AthleteId", "Date") DO NOTHING` to avoid duplicates
- **Verification Query**: Each script includes a SELECT query to verify the data was inserted correctly
- **Realistic Data**: Generated with natural variations and realistic biometric ranges
- **Date Range**: All scripts use the same date range (2025-08-31 to 2025-09-06)

## Example Output

After running a script, you'll see verification output like:
```
 biometric_records | earliest_date | latest_date | avg_rhr | avg_hrv_display | avg_deep_sleep | avg_rem_sleep | avg_spo2
-------------------|---------------|-------------|---------|-----------------|----------------|--------------|---------
                 7 | 2025-08-31    | 2025-09-06  |    54.3 |            62.1 |           17.8 |         21.2 |    96.9
```

## Troubleshooting

- **Permission Errors**: Ensure your PostgreSQL user has INSERT permissions
- **Table Not Found**: Verify the BiometricDaily table exists and has the correct structure
- **Foreign Key Errors**: Ensure athletes with IDs 1-23 exist in the Athletes table
- **Connection Issues**: Check your database connection string and credentials

## After Running Scripts

Once you've seeded the data for an athlete:
- **Multiple data points** will appear in all charts
- **Complete trend lines** instead of single points
- **All biometric metrics populated** with real data
- **No more empty/zero values** for seeded athletes

The athlete profile charts will display comprehensive biometric data with proper trend visualization across all metrics!