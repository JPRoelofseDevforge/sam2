# Technical Documentation: Sports Performance Monitoring System

## Technology Stack

### Frontend Technologies
```json
{
  "framework": "React 18.2.0",
  "language": "TypeScript 5.2.2",
  "build_tool": "Vite 5.1.0",
  "styling": "Tailwind CSS 3.4.0",
  "ui_components": "Custom component library",
  "state_management": "React Context API + Custom Hooks",
  "routing": "React Router 6.20.0",
  "http_client": "Axios 1.6.0",
  "icons": "Heroicons 2.0.18"
}
```

### Backend Technologies
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 4.18.0",
  "language": "JavaScript (ES6+)",
  "database": "PostgreSQL 12+",
  "authentication": "JWT (jsonwebtoken 9.0.0)",
  "password_hashing": "bcrypt 5.1.0",
  "validation": "Joi 17.9.0",
  "cors": "cors 2.8.5",
  "logging": "morgan 1.10.0"
}
```

### Development Tools
```json
{
  "ide": "Visual Studio Code",
  "version_control": "Git + GitHub",
  "package_manager": "npm 9.6.0",
  "testing": "Jest + React Testing Library",
  "linting": "ESLint 8.50.0",
  "formatting": "Prettier 3.0.0",
  "type_checking": "TypeScript Compiler"
}
```

## Project Structure

### Frontend Structure
```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── AthleteProfile.tsx
│   ├── BodyComposition.tsx
│   ├── UserManagement.tsx
│   └── AdminDashboard.tsx
├── auth/                # Authentication components
│   ├── AuthContext.tsx  # Authentication context
│   ├── Login.tsx        # Login component
│   └── ProtectedRoute.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useAdminApi.ts   # Admin API operations
│   └── useApi.ts        # General API operations
├── services/            # API service layer
│   └── dataService.ts   # Data fetching services
├── types/               # TypeScript type definitions
│   └── index.ts         # Global type definitions
├── utils/               # Utility functions
│   ├── api.ts           # API utility functions
│   ├── analytics.ts     # Data analysis utilities
│   └── validation.ts    # Input validation
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

### Backend Structure
```
server.js                # Main server file
src/
├── api/                 # API routes and controllers
│   ├── server.ts        # Server configuration
│   └── routes/          # Route definitions
├── auth/                # Authentication logic
├── db/                  # Database configuration
│   ├── connection.ts    # Database connection
│   └── models/          # Database models
├── middleware/          # Express middleware
├── utils/               # Utility functions
└── config/              # Configuration files
```

## Database Schema

### Core Tables
```sql
-- Users and Authentication
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Athlete Management
CREATE TABLE athletes (
    athlete_id SERIAL PRIMARY KEY,
    athlete_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sports and Organizations
CREATE TABLE sports (
    sport_id SERIAL PRIMARY KEY,
    sport_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE organizations (
    organization_id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    organization_type VARCHAR(50)
);

-- Athlete-Organization Relationships
CREATE TABLE athlete_organization_history (
    history_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id),
    organization_id INTEGER REFERENCES organizations(organization_id),
    sport_id INTEGER REFERENCES sports(sport_id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true
);

-- Biometric Data
CREATE TABLE biometric_data (
    biometric_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id),
    measurement_date DATE NOT NULL,
    hrv_night DECIMAL(5,2),
    resting_hr INTEGER,
    spo2_night DECIMAL(5,2),
    respiratory_rate_night DECIMAL(5,2),
    deep_sleep_percent DECIMAL(5,2),
    rem_sleep_percent DECIMAL(5,2),
    light_sleep_percent DECIMAL(5,2),
    sleep_duration_hours DECIMAL(4,2),
    body_temperature DECIMAL(4,2),
    training_load_percent DECIMAL(5,2),
    sleep_onset_time TIME,
    wake_time TIME,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body Composition
CREATE TABLE body_composition (
    body_composition_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id),
    measurement_date DATE NOT NULL,
    weight_kg DECIMAL(6,2),
    fat_mass_kg DECIMAL(6,2),
    muscle_mass_kg DECIMAL(6,2),
    bmi DECIMAL(5,2),
    body_fat_rate DECIMAL(5,2),
    visceral_fat_grade INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genetic Testing
CREATE TABLE genetic_test_results (
    test_result_id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(athlete_id),
    test_date DATE NOT NULL,
    lab_name VARCHAR(255),
    test_status VARCHAR(50) DEFAULT 'Pending',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE genes (
    gene_id SERIAL PRIMARY KEY,
    gene_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100)
);

CREATE TABLE genetic_profiles (
    profile_id SERIAL PRIMARY KEY,
    test_result_id INTEGER REFERENCES genetic_test_results(test_result_id),
    gene_id INTEGER REFERENCES genes(gene_id),
    genotype VARCHAR(50),
    interpretation TEXT
);
```

## API Design

### RESTful API Endpoints

#### Authentication Endpoints
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "jwt_token",
  "user": {
    "user_id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role_name": "string",
    "is_admin": boolean
  }
}
```

#### User Management Endpoints
```javascript
GET /api/users                    # List all users
POST /api/users                   # Create new user
PUT /api/users/:id                # Update user
DELETE /api/users/:id             # Delete user
GET /api/users/:id                # Get user details
```

#### Athlete Endpoints
```javascript
GET /api/athletes                 # List all athletes
GET /api/athletes/:code           # Get athlete by code
POST /api/athletes                # Create new athlete
PUT /api/athletes/:id             # Update athlete
DELETE /api/athletes/:id          # Delete athlete
```

#### Biometric Data Endpoints
```javascript
GET /api/biometric-data           # Get all biometric data
GET /api/biometric-data/latest    # Get latest data for all athletes
GET /api/athletes/:code/biometric-data  # Get biometric data for specific athlete
POST /api/athletes/:code/biometric-data # Save biometric data
```

### API Response Format
```javascript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Environment Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=rxg.postgres.database.azure.com
DB_PORT=5432
DB_NAME=sports_performance_db
DB_USER=rx
DB_PASSWORD=qwe12345_

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Development Environment Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd sports-performance-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Set up PostgreSQL database
createdb sports_performance_db
psql sports_performance_db < database/schema.sql

# 5. Start development servers
npm run dev:all
```

## Security Implementation

### Authentication & Authorization
```javascript
// JWT Token Generation
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user.user_id, role: user.role_name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// Password Hashing
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Middleware for Protected Routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### Input Validation
```javascript
// Using Joi for validation
const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]{8,}$')).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required()
});

const { error, value } = userSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

## Performance Optimization

### Database Optimization
```sql
-- Indexes for Performance
CREATE INDEX idx_biometric_athlete_date ON biometric_data(athlete_id, measurement_date);
CREATE INDEX idx_bodycomp_athlete_date ON body_composition(athlete_id, measurement_date);
CREATE INDEX idx_genetic_athlete_status ON genetic_test_results(athlete_id, test_status);
CREATE INDEX idx_athletes_code ON athletes(athlete_code);
CREATE INDEX idx_users_email ON users(email);

-- Query Optimization Example
SELECT
  a.athlete_code,
  bd.measurement_date,
  bd.hrv_night,
  bd.resting_hr
FROM biometric_data bd
INNER JOIN athletes a ON bd.athlete_id = a.athlete_id
WHERE bd.athlete_id = $1
  AND bd.measurement_date >= $2
  AND bd.measurement_date <= $3
ORDER BY bd.measurement_date DESC;
```

### Frontend Optimization
```typescript
// React.memo for component optimization
const BiometricDataComponent = React.memo(({ data }: BiometricDataProps) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
});

// Custom hooks for data fetching
const useBiometricData = (athleteCode: string) => {
  const [data, setData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await biometricDataService.getBiometricDataByAthlete(athleteCode);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (athleteCode) {
      fetchData();
    }
  }, [athleteCode]);

  return { data, loading, error };
};
```

## Deployment Configuration

### Docker Configuration
```dockerfile
# Dockerfile for Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "server"]

# Dockerfile for Frontend
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=https://api.sports-performance.com/api

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=rxg.postgres.database.azure.com
      - DB_PORT=5432
      - DB_NAME=sports_performance_db
      - DB_USER=rx
      - DB_PASSWORD=qwe12345_
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sports_performance_db
      - POSTGRES_USER=rx
      - POSTGRES_PASSWORD=qwe12345_
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Monitoring & Logging

### Application Logging
```javascript
// Morgan for HTTP request logging
const morgan = require('morgan');
app.use(morgan('combined'));

// Custom error logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sports-performance-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Health Check Endpoints
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

// Database health check
app.get('/api/health/database', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

## Testing Strategy

### Unit Testing
```javascript
// Example test with Jest
const { calculateBMI } = require('../utils/calculations');

describe('BMI Calculation', () => {
  test('calculates BMI correctly', () => {
    const weight = 70; // kg
    const height = 1.75; // m
    const expectedBMI = 22.86;

    const result = calculateBMI(weight, height);

    expect(result).toBeCloseTo(expectedBMI, 1);
  });
});
```

### Integration Testing
```javascript
// API endpoint testing
const request = require('supertest');
const app = require('../app');

describe('Authentication API', () => {
  test('POST /api/auth/login - successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});
```

This technical documentation provides comprehensive information about the Sports Performance Monitoring System's implementation, architecture, and operational aspects. It serves as a reference for developers, system administrators, and stakeholders involved in the project's development and maintenance.