# JCRing API Documentation

This document provides a complete overview of all available APIs in the JCRing wearable health API project. It includes endpoints for user management, device binding, health data storage and retrieval, feedback, and specialized features like women health tracking. Each section corresponds to a controller, listing endpoints with method, path, description, parameters, request/response examples, and notes on functionality.

For dashboard creation and updates, focus on querying endpoints in QueryController for paginated data (e.g., totalSportData for daily summaries, heartRateData for trends). Aggregate data client-side or extend the API for custom queries (e.g., SUM(steps) over dates). Use women health and sport data for specialized charts. Authenticate with JWT for user-specific data. Base URL: assumed to be the API server root (e.g., https://api.jc-ring.com).

All endpoints return JSON responses with a standard structure: `{ "code": int, "info": string, "data": object }` where code 1 indicates success. Authentication uses JWT tokens in `Authorization: Bearer <token>` header for authorized endpoints.

## Database Entities and Models
Before diving into endpoints, understand the core data structures. These are defined in Entities/ and Models/.

### Key Entities (from Entities/)
- **User**: UserId (long PK), Account (string, phone/email), AccountType (int: 1=phone, 2=email), PasswordHash (string), IsActive (bool), VerificationCode (string), VerificationCodeExpiry (DateTime?), CreatedAt (DateTime), UpdatedAt (DateTime).
- **UserInfo**: UserId (long PK/FK to User.UserId), Nickname (string <=30 chars), Gender (string: "male" or "female"), Stature (int cm, >0), Weight (int kg, >0), Avatar (string nullable URL to Azure Blob), Birthday (DateTime), UpdatedAt (DateTime).
- **TotalSportData**: Id (long PK), UnionId (string FK to User.Account or token), Mac (string), DeviceType (string e.g. "2026"), Date (DateTime date only), Steps (int), ExerciseTimeSeconds (int), DistanceKm (decimal rounded to 3), CaloriesKcal (decimal rounded to 3), GoalCompletionRatePercent (int), IntensityExerciseTimeSeconds (int). Unique constraint on UnionId + Date.
- **DetailSportData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), WindowStart (DateTime), StepsPerMinuteJson (string: comma-separated integers for 10-min intervals), TotalSteps (int nullable), TotalCalories (int nullable), TotalDistanceKm (decimal nullable rounded to 3).
- **HeartRateData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), HeartRateBPM (int), Type (string: "Static" or "Dynamic").
- **TemperatureData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), TemperatureC (decimal rounded to 1), Type (string: "Manual" or "Auto").
- **Spo2Data**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), Spo2Percent (int), Type (string: "Manual" or "Auto").
- **HrvData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), HrvValue (int), VascularAgingDegree (int), HeartRateBPM (int), StressLevel (int), DiastolicBP (int), SystolicBP (int).
- **SleepData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), SessionStart (DateTime), RawStages (string: comma-separated sleep stage codes, starts with "999").
- **BatteryData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), LevelsJson (string: comma-separated battery percentages).
- **SportTypeData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), StartTime (DateTime), ExerciseType (string e.g. "running"), HeartRateBPM (int), DurationSeconds (int), Steps (int), Pace (decimal min/km), CaloriesKcal (int), DistanceKm (decimal rounded to 3).
- **BloodPressureData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), MeasuredAt (DateTime), Systolic (int), Diastolic (int nullable).
- **Spo2ProData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), StartTime (DateTime), Spo2ValuesJson (string: comma-separated SpO2 values), IsManual (bool default false).
- **EcgData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), StartTime (DateTime), EcgValuesJson (string: comma-separated ECG raw values).
- **GpsData**: Id (long PK), UnionId (string), Mac (string), DeviceType (string), PointTime (DateTime), Latitude (decimal rounded to 6), Longitude (decimal rounded to 6).
- **Goal**: UnionId (string PK), Step (int), Distance (int km), Calorie (int kcal), Sleep (int hours), Language (string default "en").
- **ApneaRecord**: Id (long PK), Mac (string), Device (string), Day (DateTime date only).
- **Feedback**: Id (long PK), Name (string <=50 nullable), Email (string <=50 nullable), Topic (string <=100 required), Content (string <=2000 required), AppName (string <=50 required), AppVersion (string nullable), DeviceType (string nullable), FwVersion (string nullable), OsType (string nullable), OsVersion (string nullable), LogFile (string Azure URL nullable), Account (string <=100 nullable), LogImages (string JSON array of URLs nullable).
- **PeriodInfo**: UserId (long PK/FK to User.UserId), periodStartTime (DateTime), periodTwoStartTime (DateTime), periodLength (int days), period (int cycle length), regularly (bool?), tracking (bool?).
- **WomenHealthRecord**: Id (long PK), UserId (long FK), day (DateTime date only), flowRate (int -1 to 4), colorRate (int -1 to 4), dysmenorrhea (int -1 to 4), symptoms (string JSON array of 10 ints for symptoms), leucorrhea (int -1 to 4), mood (int -1 to 4), ovulation (int -1/0/1), love (int -1/0/1), notes (string nullable).
- **DeviceBinding**: Id (long PK), Mac (string), Device (string uppercase), UnionId (string), State (string "bind" or "unbind"), Time (DateTime).

### Key Models (from Models/)
- **DataUploadRequest**: mac (string), unionId (string), deviceType (string nullable), dataType (string), dataTotal (array of { time: string, dataDetail: array of object|string }).
- **GpsUploadRequest**: mac (string), unionId (string), deviceType (string nullable), dataTotal (array of { time: string, dataDetail: array of GpsPoint { gpsDate: string, latitude: string, longitude: string } }).
- **UserRegisterRequest**: phone (string nullable), userEmail (string nullable), userpwd (string), smsCode (string), appkey (string).
- **UserLoginRequest**: phone (string nullable), userEmail (string nullable), userpwd (string), appkey (string).
- **PasswordResetRequest**: phone (string nullable), userEmail (string nullable), userpwd (string), smsCode (string), appkey (string).
- **SmsSendRequest**: phone (string), appkey (string), reqType (string), sign (string).
- **EmailSendRequest**: userEmail (string), appkey (string), reqType (string), sign (string).
- **UserInfoSaveRequest**: nickname (string required), gender (string required), stature (int required), weight (int required), birthday (string "yyyy-MM-dd" required), avatar (string nullable).
- **UserInfoResponse**: nickname (string), gender (string), stature (int), weight (int), avatar (string), birthday (string "yyyy-MM-dd").
- **UserInfoAllResponse**: userId (long), account (string), accountType (int), nickname (string), gender (string), stature (int), weight (int), avatar (string), birthday (string).
- **TokenRefreshResponse**: token (string), tokenExpire (string).
- **FeedbackSubmissionRequest** (form): topic (string), content (string), appName (string), account (string nullable), name (string nullable), email (string nullable), appVersion (string nullable), deviceType (string nullable), fwVersion (string nullable), osType (string nullable), osVersion (string nullable), logFile (IFormFile nullable), logImgs (List<IFormFile> nullable).
- **BindRequest**: mac (string), device (string), unionId (string), state (string "bind" or "unbind").
- **ApneaRequest**: mac (string), device (string), day (string "yyyy-MM-dd").
- **SavePeriodInfoRequest**: PeriodStartTime (string "yyyy-MM-dd"), PeriodTwoStartTime (string), PeriodLength (int), Period (int), Regularly (bool?), Tracking (bool?).
- **PeriodInfoResponse**: PeriodStartTime (string), PeriodTwoStartTime (string), PeriodLength (int), Period (int), Regularly (bool), Tracking (bool).
- **SaveRecordRequest**: Day (string "yyyy-MM-dd"), FlowRate (int), ColorRate (int), Dysmenorrhea (int), Symptoms (array<int> exactly 10), Leucorrhea (int), Mood (int), Ovulation (int), Love (int), Notes (string nullable).
- **WomenHealthRecordResponse**: Day (string), FlowRate (int), ColorRate (int), Dysmenorrhea (int), Symptoms (array<int>), Leucorrhea (int), Mood (int), Ovulation (int), Love (int), Notes (string).
- **QueryRecordRequest**: StartDay (string "yyyy-MM-dd"), EndDay (string "yyyy-MM-dd").
- **UserLoginResponse**: token (string), tokenExpire (string "yyyy-MM-dd HH:mm:ss"), unionId (string empty), userId (string).
- **ApiResponse<T>**: code (int), info (string), data (T).
- **ApiResult**: Static methods for Success(data), ParameterError(msg), Failed(msg).

For dashboards: Query multiple dataTypes sequentially or batch requests. Aggregate e.g., average HeartRateBPM over weeks using client-side JS (e.g., Chart.js). For updates, poll query endpoints or implement WebSockets (not present; extend if needed).

## DataController
Handles saving and querying various health and fitness data from wearables.

### POST /wearableblev3/data/save
- **Description**: Saves multiple types of health data (e.g., total sport data, detailed sport data, heart rate, temperature, SpO2, HRV, sleep, battery, sport types, blood pressure, ECG, apnea) from a wearable device. Processes dataTotal array items based on dataType. Upserts totalSportData if date exists; adds new records for others. Supports parsing times in "yyyy.MM.dd" or "yyyy.MM.dd HH:mm:ss" formats. Handles decimal parsing with comma/dot replacement.
- **Parameters** (JSON body - DataUploadRequest):
  - mac: string (device MAC address without :, lowercase, required)
  - unionId: string (user identifier, required for all records)
  - deviceType: string (e.g., "2026", uppercase with _ , optional but normalized)
  - dataType: string (required, one of: "totalSportData", "detailSportData", "staticHeartRateData", "dynamicHeartRateData", "temperatureData", "temperatureDataAuto", "spo2hData", "spo2hDataAuto", "hrvData", "hrvDataAuto", "detailSleepData", "batteryData", "sportTypeData", "bloodPressure", "spo2ProData", "spo2ProManual", "ecgAllData")
  - dataTotal: array of { time: string (required, "yyyy.MM.dd" or "yyyy.MM.dd HH:mm:ss"), dataDetail: array of object or primitive (varies by dataType, required) }
- **Example Request** (totalSportData):
  ```
  {
    "mac": "aabbccddeeff",
    "unionId": "user123",
    "deviceType": "2026",
    "dataType": "totalSportData",
    "dataTotal": [
      {
        "time": "2025.09.10",
        "dataDetail": [10000, 3600, "5.2", 500.0, 80, 1200]
      }
    ]
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: For totalSportData: dataDetail[0]=steps (int), [1]=exerciseTimeSeconds (int), [2]=distanceKm (decimal), [3]=caloriesKcal (decimal), [4]=goalCompletionRatePercent (int), [5]=intensityExerciseTimeSeconds (int); upserts on unionId+date. For detailSportData: first 10 = stepsPerMinute (ints), 10-12=totalSteps/calories/distance (optional). For dynamicHeartRateData: each dataDetail = bpm (int). Similar for others (e.g., hrvData expects 6 ints: hrv, vascular, hr, stress, diastolic, systolic). Ignores invalid items. For dashboards: Ingest raw data here; use for historical backfill. Error on DB save: 500 with inner exception.

### POST /wearableblev3/jcring/saveGps
- **Description**: Saves GPS location data points from wearable. Parses timestamps and coordinates, rounds lat/lon to 6 decimals. Adds to GpsData table. Filters invalid parses.
- **Parameters** (JSON body - GpsUploadRequest):
  - mac: string (required, normalized to lowercase no :)
  - unionId: string (required)
  - deviceType: string (optional, normalized)
  - dataTotal: array of { time: string ("yyyy.MM.dd HH:mm:ss" window start, required), dataDetail: array of { gpsDate: string ("yyyy.MM.dd HH:mm:ss" required), latitude: string (required), longitude: string (required) } }
- **Example Request**:
  ```
  {
    "mac": "aabbccddeeff",
    "unionId": "user123",
    "deviceType": "2026",
    "dataTotal": [
      {
        "time": "2025.09.10 10:00:00",
        "dataDetail": [
          {
            "gpsDate": "2025.09.10 10:01:00",
            "latitude": "28.123456",
            "longitude": "1.234567"
          }
        ]
      }
    ]
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: Parses lat/lon with comma replacement for decimal. Uses AssumeLocal DateTimeStyle. For dashboards: Visualize routes on maps (e.g., polyline with Leaflet.js). Group by session for activity tracking. Error on parse: skips points.

### POST /wearableblev3/data/saveGoal
- **Description**: Saves or replaces user daily goals for steps, distance, calories, sleep. Form data; requires userToken header for unionId. Validates non-negative.
- **Parameters** (multipart/form-data):
  - step: int (required, >=0)
  - distance: int (required, >=0 km)
  - calorie: int (required, >=0 kcal)
  - sleep: int (required, >=0 hours)
  - language: string (optional, default "en")
- **Example Request** (cURL equivalent): POST with form step=10000&distance=10&calorie=500&sleep=8&language=en; Header: userToken: <jwt>
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: Upserts: removes existing Goal for unionId, adds new. For dashboards: Fetch with queryGoal to show progress bars (e.g., steps / goal * 100). Update on user preference change.

### GET /wearableblev3/data/queryGoal
- **Description**: Retrieves user's current goals. Requires userToken header to extract unionId.
- **Parameters**: None.
- **Example Request**: GET /wearableblev3/data/queryGoal Header: userToken: <jwt>
- **Example Response**: `{ "code": 1, "info": "", "data": { "unionId": "user123", "step": 10000, "distance": 10, "calorie": 500, "sleep": 8, "language": "en" } }` or `{ "code": 1, "info": "", "data": null }` if none.
- **Notes**: Single record. For dashboards: Use for goal widgets, compare with TotalSportData for completion rates.

## UserController (Base path: userv3)
Manages user authentication, registration, login, and basic queries. Uses Twilio for SMS, SendGrid for email. All require appkey/sign for validation.

### GET userv3/sms/send
- **Description**: Sends SMS verification code for registration (_reg) or reset (_reset). Validates phone format (0086- or 0- for SA +27). Generates 6-digit code, stores in User with 10-min expiry. For reg: checks if already registered (error 1015); for reset: checks existence (error 1012 if not).
- **Parameters** (Query):
  - phone: string (required, e.g. "0086-1234567890" or "0-1234567890")
  - appkey: string (required, app identifier)
  - reqType: string (required, "sms_reg" or "sms_reset")
  - sign: string (required, signature for security)
- **Example Request**: GET /userv3/sms/send?phone=0086-1234567890&appkey=myapp&reqType=sms_reg&sign=abc123
- **Example Response** (success): `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1015, "info": "Phone number already registered", "data": null }`
- **Notes**: Converts "0086-" to "+86", "0" to "+27". Uses Twilio SID/token/fromNumber from config. Logs send SID. For dashboards: Not directly used; supports user registration flow.

### GET userv3/sms/sendEmail
- **Description**: Sends email verification code for registration (_reg) or reset (_reset). Validates email regex. Generates 6-digit code, stores in User. For reg: if existing, resends new code without error.
- **Parameters** (Query):
  - userEmail: string (required, valid email)
  - appkey: string (required)
  - reqType: string (required, "email_reg" or "email_reset")
  - sign: string (required)
- **Example Request**: GET /userv3/sms/sendEmail?userEmail=user@example.com&appkey=myapp&reqType=email_reg&sign=abc123
- **Example Response** (success): `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1221, "info": "Email address format error", "data": null }`
- **Notes**: Uses SendGrid API key from config. Email from "support@grit.studio". HTML/plain text with code. AccountType=2 for email. For reg existing: updates code. For dashboards: Supports email-based login.

### POST userv3/user/register
- **Description**: Registers new user after verification. Hashes password SHA256 base64. Activates IsActive=true, clears code. Validates one account type (phone or email), code match/expiry.
- **Parameters** (JSON - UserRegisterRequest):
  - phone: string (nullable, if present use this)
  - userEmail: string (nullable, if present use this; not both)
  - userpwd: string (required, hashed)
  - smsCode: string (required, 6-digit)
  - appkey: string (required)
- **Example Request**:
  ```
  {
    "phone": "0086-1234567890",
    "userpwd": "securepass123",
    "smsCode": "123456",
    "appkey": "myapp"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1368, "info": "Verification code error", "data": null }`
- **Notes**: If no user from send, error 1368. For phone AccountType=1, email=2. For dashboards: Call after user signup in app.

### POST userv3/user/login
- **Description**: Authenticates user, verifies hash, generates JWT (24h, claims userId/account/Jti). Returns token/expiry/userId.
- **Parameters** (JSON - UserLoginRequest):
  - phone: string (nullable)
  - userEmail: string (nullable, one required)
  - userpwd: string (required)
  - appkey: string (required)
- **Example Request**:
  ```
  {
    "phone": "0086-1234567890",
    "userpwd": "securepass123",
    "appkey": "myapp"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "tokenExpire": "2025-09-11 06:00:00", "unionId": "", "userId": "123" } }` (error): `{ "code": 1013, "info": "Account or password error", "data": null }`
- **Notes**: Finds active user by account. JWT key/issuer/audience from config. unionId empty per spec. For dashboards: Use token for subsequent authenticated calls.

### POST userv3/user/retrieve
- **Description**: Resets password after verification. Hashes new pwd, clears code. Validates active user and code.
- **Parameters** (JSON - PasswordResetRequest):
  - phone: string (nullable)
  - userEmail: string (nullable, one required)
  - userpwd: string (new password required)
  - smsCode: string (required)
  - appkey: string (required)
- **Example Request**:
  ```
  {
    "phone": "0086-1234567890",
    "userpwd": "newpass456",
    "smsCode": "654321",
    "appkey": "myapp"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1368, "info": "Verification code error", "data": null }`
- **Notes**: Updates UpdatedAt. For dashboards: Allow password reset in user settings.

### GET userv3/user/refreshUserToken
- **Description**: Refreshes JWT for valid token (extracts userId from claims). Generates new 24h token.
- **Parameters**: None (uses Authorization header).
- **Example Request**: GET /userv3/user/refreshUserToken Authorization: Bearer <old_token>
- **Example Response**: `{ "code": 1, "info": "", "data": { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "tokenExpire": "2025-09-11 06:00:00" } }` (error): `{ "code": 1500, "info": "Invalid userToken", "data": null }`
- **Notes**: Verifies active user. For dashboards: Auto-refresh on expiry to maintain session.

### POST userv3/user/logout
- **Description**: Stateless logout; client discards token. Server does nothing.
- **Parameters**: None (uses token).
- **Example Request**: POST /userv3/user/logout Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: For dashboards: Clear local storage on logout.

### POST userv3/user/cancel
- **Description**: Soft-deletes user (IsActive=false). Requires valid token.
- **Parameters**: None.
- **Example Request**: POST /userv3/user/cancel Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1500, "info": "Invalid userToken", "data": null }`
- **Notes**: Updates UpdatedAt. For dashboards: Handle account deletion gracefully.

### GET userv3/userInfo/queryAll
- **Description**: Queries full user profile (User + UserInfo). Defaults if UserInfo null.
- **Parameters**: None (from token).
- **Example Request**: GET /userv3/userInfo/queryAll Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": { "userId": 123, "account": "0086-1234567890", "accountType": 1, "nickname": "John Doe", "gender": "male", "stature": 175, "weight": 70, "avatar": "https://...", "birthday": "1990-01-01" } }` (error): `{ "code": 1012, "info": "User info not found", "data": null }`
- **Notes**: Includes UserInfo; defaults to "SAM User" etc. if missing. For dashboards: Display profile in sidebar.

## DeviceController
Manages device binding to users.

### POST /wearableblev3/ring/bind
- **Description**: Binds device MAC to unionId (state=bind) or unbinds (state=unbind). Normalizes mac lowercase no :, device uppercase _. Prevents duplicate binds (errors 2210/2211 with details).
- **Parameters** (JSON - BindRequest):
  - mac: string (required)
  - device: string (required)
  - unionId: string (required)
  - state: string (required, "bind" or "unbind")
- **Example Request** (bind):
  ```
  {
    "mac": "AA:BB:CC:DD:EE:FF",
    "device": "2026",
    "unionId": "user123",
    "state": "bind"
  }
  ```
- **Example Response** (success): `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 2210, "info": "The current device has been bound to another user", "data": { "time": "2025-09-10 06:00:00", "account": "otheruser" } }`
- **Notes**: Adds Time=now for bind. For unbind: removes by unionId. For dashboards: Show bound device in profile; use for data filtering.

### GET /wearableblev3/ring/queryBind
- **Description**: Queries current binding for unionId. Returns empty strings if unbound.
- **Parameters** (Query):
  - unionId: string (required)
- **Example Request**: GET /wearableblev3/ring/queryBind?unionId=user123
- **Example Response**: `{ "code": 1, "info": "", "data": { "mac": "aabbccddeeff", "device": "2026", "state": "bind", "time": "2025-09-10 06:00:00", "unionId": "user123" } }` or empties for unbind.
- **Notes**: Single record. For dashboards: Display bound device status.

## ApneaController
Manages sleep apnea (breath pause) records.

### POST /wearableblev3/data/saveSleepBreathPause
- **Description**: Saves apnea event for a day. Normalizes mac/device.
- **Parameters** (JSON - ApneaRequest):
  - mac: string (required)
  - device: string (required)
  - day: string (required "yyyy-MM-dd", parsed to DateTime)
- **Example Request**:
  ```
  {
    "mac": "aabbccddeeff",
    "device": "2026",
    "day": "2025-09-10"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: Adds new record; no upsert. For dashboards: Mark days with apnea events on calendar.

### POST /wearableblev3/data/getSleepBreathPause
- **Description**: Paginates apnea records for mac, ordered by Day desc.
- **Parameters** (form-data):
  - mac: string (required)
  - page: int (default 1)
  - limit: int (default 500)
- **Example Request** (form): mac=aabbccddeeff&page=1&limit=10
- **Example Response**: `{ "code": 1, "info": "", "data": { "pageData": [ { "id": 1, "mac": "aabbccddeeff", "device": "2026", "day": "2025-09-10T00:00:00" } ], "total": 5, "page": 1, "maxPage": 1 } }`
- **Notes**: Normalizes mac. For dashboards: List historical apnea events; use for sleep quality metrics.

### POST /wearableblev3/data/getLastSleepBreathPause
- **Description**: Gets most recent apnea record for mac.
- **Parameters** (form-data):
  - mac: string (required)
- **Example Request** (form): mac=aabbccddeeff
- **Example Response**: `{ "code": 1, "info": "", "data": { "id": 1, "mac": "aabbccddeeff", "device": "2026", "day": "2025-09-10T00:00:00" } }` or null.
- **Notes**: Latest by Day desc. For dashboards: Show recent apnea alert.

### POST /wearableblev3/data/deleteSleepBreathPause
- **Description**: Deletes apnea record by Id.
- **Parameters** (form-data):
  - id: int (required)
- **Example Request** (form): id=1
- **Example Response**: `{ "code": 1, "info": "", "data": null }`
- **Notes**: No error if not found. For dashboards: Allow user to remove erroneous entries.

## OpinionController (Base path: userv3/opinion, requires Authorization)
Handles user feedback submission with file uploads to Azure Blob Storage.

### POST userv3/opinion/v2/save
- **Description**: Submits feedback form with optional log file (.log/.txt <=10MB) and images (jpg/png etc. <=5MB each). Validates lengths, uploads to Azure with SAS, serializes image URLs as JSON, saves to Feedback. Requires token for userId (logged but not stored).
- **Parameters** (multipart/form-data - FeedbackSubmissionRequest):
  - topic: string (required <=100)
  - content: string (required <=2000)
  - appName: string (required <=50)
  - account: string (nullable <=100)
  - name: string (nullable <=50)
  - email: string (nullable <=50)
  - appVersion: string (nullable)
  - deviceType: string (nullable)
  - fwVersion: string (nullable)
  - osType: string (nullable)
  - osVersion: string (nullable)
  - logFile: IFormFile (nullable, validated)
  - logImgs: List<IFormFile> (nullable, multiple images validated)
- **Example Request** (cURL multipart): -F "topic=Bug Report" -F "content=App crashes on login" -F "appName=SAM App" -F "logFile=@crash.log" -F "logImgs=@screenshot.jpg"; Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1119, "info": "Parameter error", "data": "Topic too long" }`
- **Notes**: Uses fixed SAS URL (update expiry: https://samapiimages.blob.core.windows.net/sam/...). Unique filename with GUID. For dashboards: Not directly used; admin can query Feedback for user issues.

## QueryController (Base path: wearablequeryv3)
Paginates and queries stored health data, formatting to match save structure.

### GET /wearablequeryv3/appDataV2/queryByPage
- **Description**: Paginates data by type, ordered desc by time/date. Reconstructs dataTotal/dataDetail from stored JSON/strings. Supports start filter (before timestamp). dataType determines entity/query.
- **Parameters** (Query):
  - unionId: string (required)
  - dataType: string (required, one of: "detailSleepData", "detailSportData", "dynamicHeartRateData", "staticHeartRateData", "temperatureData", "temperatureDataAuto", "hrvData", "sportTypeData", "totalSportData", "spo2hData", "spo2hDataAuto")
  - start: string (optional, timestamp filter < this)
  - page: int (default 1)
  - limit: int (default 50)
- **Example Request** (totalSportData): GET /wearablequeryv3/appDataV2/queryByPage?unionId=user123&dataType=totalSportData&page=1&limit=7
- **Example Response**:
  ```
  {
    "code": 1,
    "info": "",
    "data": {
      "pageData": [
        {
          "dataTotal": [
            {
              "dataDetail": ["10000", "3600", "5.2", "500.0", "80", "1200"],
              "time": "2025.09.10",
              "mac": "aabbccddeeff",
              "deviceType": "2026"
            }
          ],
          "dataType": "totalSportData",
          "mac": "000000000000",
          "unionId": "user123",
          "deviceType": "2026"
        }
      ],
      "total": 30,
      "page": 1,
      "maxPage": 5
    }
  }
  ```
- **Notes**: For totalSportData: time as date only, dataDetail strings. For detailSleepData: prepend "999" to stages split. For heartRate: single bpm per item. Filters Type where applicable. For dashboards: Core for charts; e.g., fetch totalSportData for weekly steps line chart, aggregate AVG(steps).

### GET /wearablequeryv3/ring/queryByPage
- **Description**: Paginates GPS data for unionId/mac, filters by start time if provided (< start). Groups by exact PointTime, limits 500 max. Formats as dataTotal with dataDetail points.
- **Parameters** (Query):
  - unionId: string (required)
  - mac: string (required, normalized)
  - dataType: string (required, typically "gpsData")
  - deviceType: string (required)
  - start: string (optional timestamp)
  - page: int (default 1)
  - limit: int (default 50, clamped 1-500)
- **Example Request**: GET /wearablequeryv3/ring/queryByPage?unionId=user123&mac=aabbccddeeff&dataType=gpsData&deviceType=2026&page=1&limit=10
- **Example Response**:
  ```
  {
    "code": 1,
    "info": "",
    "data": {
      "pageData": [
        {
          "dataTotal": [
            {
              "dataDetail": [
                {
                  "gpsDate": "2025.09.10 10:01:00",
                  "longitude": "1.234567",
                  "latitude": "28.123456",
                  "mac": "aabbccddeeff",
                  "deviceType": "2026"
                }
              ],
              "time": "2025.09.10 10:01:00"
            }
          ],
          "dataType": "gpsData",
          "mac": "000000000000",
          "unionId": "user123",
          "deviceType": "1755"
        }
      ],
      "total": 100,
      "page": 1,
      "maxPage": 10
    }
  }
  ```
- **Notes**: Groups by timestamp string; mac/deviceType fixed in response. For dashboards: Feed to map components for route visualization; aggregate distance from points.

## UserInfoController (Base path: userv3/userInfo, requires Authorization)
Manages user profile info and avatar upload.

### POST userv3/userInfo/save
- **Description**: Saves or updates UserInfo. Validates nickname <=30, gender male/female, stature/weight >0, birthday yyyy-MM-dd. Upserts by UserId from token.
- **Parameters** (JSON - UserInfoSaveRequest):
  - nickname: string (required <=30)
  - gender: string (required "male" or "female")
  - stature: int (required >0)
  - weight: int (required >0)
  - birthday: string (required "yyyy-MM-dd")
  - avatar: string (nullable URL)
- **Example Request**:
  ```
  {
    "nickname": "John Doe",
    "gender": "male",
    "stature": 175,
    "weight": 70,
    "birthday": "1990-01-01",
    "avatar": "https://samapiimages.blob.core.windows.net/sam/avatar.jpg"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1119, "info": "Parameter error", "data": "Invalid gender" }`
- **Notes**: Creates if null, updates UpdatedAt. For dashboards: Update profile on edit, refresh display.

### GET userv3/userInfo/query
- **Description**: Queries UserInfo for token's userId. Defaults if null: nickname="SAM User", gender="Male", stature=175, weight=85, avatar=default PNG, birthday="1990-01-01".
- **Parameters**: None.
- **Example Request**: GET /userv3/userInfo/query Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": { "nickname": "John Doe", "gender": "male", "stature": 175, "weight": 70, "avatar": "https://...", "birthday": "1990-01-01" } }`
- **Notes**: From UserInfo; defaults for new users. For dashboards: Load initial profile data.

### POST userv3/userInfo/avatar
- **Description**: Uploads avatar image, validates extension (jpg/jpeg/png/gif/bmp/webp/svg) <=5MB, uploads to Azure Blob with SAS, updates UserInfo.Avatar with full SAS URL, updates UpdatedAt.
- **Parameters** (multipart/form-data): avatar: IFormFile (required)
- **Example Request** (cURL): POST /userv3/userInfo/avatar -F "avatar=@profile.jpg"; Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": "https://samapiimages.blob.core.windows.net/sam/guid.jpg?sp=...&sig=..." }` (error): `{ "code": 1119, "info": "Parameter error", "data": "Illegal image type" }`
- **Notes**: Uses fixed SAS (update expiry). GUID filename. For dashboards: Upload button for profile pic, refresh avatar display.

## WomenHealthController (Base path: wearableblev3/womenHealth, requires Authorization)
Manages women's health tracking (period info and daily records).

### GET wearableblev3/womenHealth/queryPeriodInfo
- **Description**: Queries PeriodInfo for userId from token. Error if null.
- **Parameters**: None.
- **Example Request**: GET /wearableblev3/womenHealth/queryPeriodInfo Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": { "PeriodStartTime": "2025-01-01", "PeriodTwoStartTime": "2025-02-01", "PeriodLength": 28, "Period": 5, "Regularly": true, "Tracking": true } }` (error): `{ "code": 1012, "info": "Period info not found", "data": null }`
- **Notes**: Formats dates yyyy-MM-dd. For dashboards: Display cycle calendar, predict next period.

### POST wearableblev3/womenHealth/savePeriodInfo
- **Description**: Saves or updates PeriodInfo. Validates dates yyyy-MM-dd, lengths >0.
- **Parameters** (JSON - SavePeriodInfoRequest):
  - PeriodStartTime: string (required "yyyy-MM-dd")
  - PeriodTwoStartTime: string (required)
  - PeriodLength: int (required >0 days)
  - Period: int (required >0 cycle days)
  - Regularly: bool (optional)
  - Tracking: bool (optional)
- **Example Request**:
  ```
  {
    "PeriodStartTime": "2025-01-01",
    "PeriodTwoStartTime": "2025-02-01",
    "PeriodLength": 28,
    "Period": 5,
    "Regularly": true,
    "Tracking": true
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1119, "info": "Parameter error", "data": "Invalid periodStartTime format" }`
- **Notes**: Upserts by UserId. For dashboards: Settings form for cycle input.

### POST wearableblev3/womenHealth/saveRecord
- **Description**: Saves or updates daily WomenHealthRecord. Validates ranges (-1..4 for rates, -1/0/1 for ovu/love), symptoms exactly 10 ints, day yyyy-MM-dd. Upserts by UserId+day.
- **Parameters** (JSON - SaveRecordRequest):
  - Day: string (required "yyyy-MM-dd")
  - FlowRate: int (required -1 to 4)
  - ColorRate: int (required -1 to 4)
  - Dysmenorrhea: int (required -1 to 4)
  - Symptoms: array<int> (required, exactly 10)
  - Leucorrhea: int (required -1 to 4)
  - Mood: int (required -1 to 4)
  - Ovulation: int (required -1/0/1)
  - Love: int (required -1/0/1)
  - Notes: string (nullable)
- **Example Request**:
  ```
  {
    "Day": "2025-09-10",
    "FlowRate": 2,
    "ColorRate": 1,
    "Dysmenorrhea": 0,
    "Symptoms": [0,1,0,0,0,0,0,0,0,0],
    "Leucorrhea": 1,
    "Mood": 3,
    "Ovulation": 0,
    "Love": 0,
    "Notes": "Felt good"
  }
  ```
- **Example Response**: `{ "code": 1, "info": "", "data": null }` (error): `{ "code": 1119, "info": "Parameter error", "data": "Symptoms array must contain exactly 10 elements" }`
- **Notes**: Serializes symptoms JSON. For dashboards: Daily entry form, heatmap by flowRate.

### GET wearableblev3/womenHealth/queryRecord
- **Description**: Queries records in range, ordered by day asc. Deserializes symptoms. Validates start <= end.
- **Parameters** (Query - QueryRecordRequest):
  - StartDay: string (required "yyyy-MM-dd")
  - EndDay: string (required "yyyy-MM-dd")
- **Example Request**: GET /wearableblev3/womenHealth/queryRecord?StartDay=2025-09-01&EndDay=2025-09-30 Authorization: Bearer <token>
- **Example Response**: `{ "code": 1, "info": "", "data": [ { "Day": "2025-09-10", "FlowRate": 2, "ColorRate": 1, "Dysmenorrhea": 0, "Symptoms": [0,1,0,0,0,0,0,0,0,0], "Leucorrhea": 1, "Mood": 3, "Ovulation": 0, "Love": 0, "Notes": "Felt good" } ] }`
- **Notes**: Filters UserId + day range. For dashboards: Calendar view with icons/colors for symptoms/mood; trend lines for mood over month.

## Dashboard Integration Guide
- **Data Fetching**: Use /wearablequeryv3/appDataV2/queryByPage for historical data by type (e.g., &dataType=totalSportData for daily metrics). Paginate with page/limit; use start for incremental loads. For GPS, use ring/queryByPage.
- **Aggregation Examples** (Client-side with JS):
  - Daily Steps Trend: Fetch totalSportData (limit=365), map Date to Steps, use Chart.js line chart: new Chart(ctx, { type: 'line', data: { labels: dates, datasets: [{ label: 'Steps', data: steps }] } }).
  - Heart Rate Averages: Fetch dynamicHeartRateData, group by day (e.g., lodash groupBy(MeasuredAt.split(' ')[0])), avg = reduce(sum/count), bar chart for daily avg BPM.
  - Goal Progress: Fetch queryGoal, fetch totalSportData last day, compute percentage = GoalCompletionRatePercent, pie chart slices.
  - GPS Routes: Fetch gpsData, plot points as polyline on map (Leaflet: L.polyline(coords).addTo(map)), calculate total distance with turf.js length.
  - Women Health Calendar: Fetch queryRecord (month range), render FullCalendar with day colors by FlowRate (e.g., red for 3-4), tooltips with symptoms/notes.
  - Sleep Quality: Fetch detailSleepData, parse RawStages, count deep/light stages, donut chart percentages.
- **Updates/Real-time**: Poll query endpoints every 5-10min for new data (use setInterval). For live: Extend API with SignalR/WebSockets for push on save. Handle token refresh on 401.
- **Performance**: Cache fetches in localStorage/Redux (expire 1h). For large limits, use virtual scrolling in lists/charts. Add API for aggregates (e.g., new endpoint /query/summary?unionId=...&type=steps&from=2025-01-01&to=2025-09-10 returning { avg: 8000, total: 292000, max: 15000 }).
- **Charts/UI**: Chart.js for trends/bars/pies; D3.js for complex viz; React/Vue for components (e.g., <StepsChart data={stepsData} />). Use Material-UI for responsive dashboard layout.
- **Security**: Include Bearer token in all auth calls; never expose raw data cross-user. Sanitize user inputs in notes. HTTPS only.
- **Error Handling**: On code !=1, show toast (e.g., "Failed to load data"); retry on network errors.
- **Testing**: Use Postman collections (JCRing_UserCenter_V3.postman_collection.json) for API tests; mock data for dashboard dev.

This covers all endpoints with full details. For implementation, reference the models in Models/ and entities in Entities/. Extend as needed for advanced dashboard features.