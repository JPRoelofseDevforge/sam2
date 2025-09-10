# Athlete Biometric Data Seeding Scripts

This directory contains individual scripts to seed biometric data for all 23 athletes in the system.

## Available Scripts

Each script seeds 7 days of biometric data (2025-08-31 to 2025-09-06) for a specific athlete:

- `seed-athlete-1.js` - Bowen Bezuidenhoudt
- `seed-athlete-2.js` - Aldrich Wichman
- `seed-athlete-3.js` - Steffan De Jongh
- `seed-athlete-4.js` - Juanre De Klerk
- `seed-athlete-5.js` - Francois Rossouw
- `seed-athlete-6.js` - Marco Nel
- `seed-athlete-7.js` - Wian Van Der Merwe
- `seed-athlete-8.js` - Heinrich Smit
- `seed-athlete-9.js` - Danie Van Zyl
- `seed-athlete-10.js` - Jaco Pretorius
- `seed-athlete-11.js` - Andre Van Der Westhuizen
- `seed-athlete-12.js` - Pieter Van Wyk
- `seed-athlete-13.js` - Ruan Botha
- `seed-athlete-14.js` - Jacques Du Plessis
- `seed-athlete-15.js` - Hennie Van Niekerk
- `seed-athlete-16.js` - Kobus Van Der Walt
- `seed-athlete-17.js` - Tiaan Van Rensburg
- `seed-athlete-18.js` - Lourens De Villiers
- `seed-athlete-19.js` - Gerrit Van Der Linde
- `seed-athlete-20.js` - Sarel Pretorius
- `seed-athlete-21.js` - Frik Fourie
- `seed-athlete-22.js` - Jan-Hendrik Van Der Berg
- `seed-athlete-23.js` - Christiaan Van Zyl

## Data Included

Each athlete's script inserts the following biometric metrics for 7 consecutive days:

- **Resting Heart Rate** (bpm)
- **Heart Rate Variability** (ms)
- **Sleep Duration** (hours)
- **Training Load** (%)
- **Deep Sleep** (%)
- **REM Sleep** (%)
- **SpO2** (%)
- **Respiratory Rate** (breaths/min)
- **Body Temperature** (°C)

## How to Run

### Individual Athlete
```bash
cd scripts
node seed-athlete-X.js
```

Replace `X` with the athlete number (1-23).

### Multiple Athletes
You can run multiple scripts sequentially:
```bash
cd scripts
node seed-athlete-1.js && node seed-athlete-2.js && node seed-athlete-3.js
```

### All Athletes at Once
Create a batch script or run them in sequence.

## Prerequisites

1. **Backend API must be running** on `http://localhost:5288`
2. **Database must be accessible** to the API
3. **Athletes must exist** in the database with IDs 1-23

## Troubleshooting

- If you get 405 errors, the API endpoint may not support POST for biometric data
- If you get connection errors, ensure the backend is running
- Each script includes error handling and will log success/failure for each record

## Notes

- Each script generates realistic biometric data with natural variations
- Data is inserted with conflict resolution (ON CONFLICT DO NOTHING)
- Scripts include 500ms delays between requests to avoid overwhelming the API
- All data uses the date range: 2025-08-31 to 2025-09-06

## After Running Scripts

Once you've seeded the data for an athlete, refresh their profile page to see:
- Multiple data points in all charts
- Complete trend lines instead of single points
- All biometric metrics populated with real data