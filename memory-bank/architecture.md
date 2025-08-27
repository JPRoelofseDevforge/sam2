# Architecture Documentation: Sports Performance Monitoring System

## System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React + TS)  │◄──►│ (Node.js + Exp) │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│  • Components   │    │  • REST API     │    │  • 15+ Tables   │
│  • Hooks        │    │  • Auth System  │    │  • Relations    │
│  • Context      │    │  • Middleware   │    │  • Indexes      │
│  • Services     │    │  • Validation   │    │  • Constraints   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx        # Button component
│   │   ├── DataCard.tsx      # Data display card
│   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   └── StatusMessage.tsx  # Status/error messages
│   ├── admin/                # Admin-specific components
│   │   ├── AdminCrud.tsx     # Generic CRUD operations
│   │   ├── SportsAdmin.tsx   # Sports management
│   │   ├── AthletesAdmin.tsx # Athlete management
│   │   └── UserRolesAdmin.tsx # User role management
│   ├── AthleteProfile.tsx    # Athlete profile view
│   ├── BodyComposition.tsx   # Body composition display
│   ├── BiometricData.tsx     # Biometric data visualization
│   ├── UserManagement.tsx    # User management interface
│   └── AdminDashboard.tsx    # Main admin dashboard
├── auth/
│   ├── AuthContext.tsx       # Authentication context
│   ├── Login.tsx            # Login component
│   └── ProtectedRoute.tsx   # Route protection
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   ├── useAdminApi.ts      # Admin API operations
│   └── useApi.ts           # General API operations
├── services/
│   └── dataService.ts      # Data fetching services
├── types/
│   └── index.ts           # TypeScript type definitions
└── utils/
    ├── api.ts             # API utility functions
    ├── analytics.ts       # Data analysis utilities
    └── validation.ts      # Input validation
```

### State Management
- **Context API**: Used for global state management (authentication, user data)
- **Local State**: Component-level state using React hooks
- **Server State**: API calls managed through custom hooks

### Styling Architecture
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with breakpoints
- **Component Styling**: Scoped styles with Tailwind classes
- **Design System**: Consistent color palette and spacing

## Backend Architecture

### API Structure
```
API Routes Structure:
├── /api/auth/
│   ├── POST /login          # User authentication
│   ├── POST /verify         # Token verification
│   └── POST /logout         # User logout
├── /api/users/
│   ├── GET /                # List users
│   ├── POST /               # Create user
│   ├── PUT /:id             # Update user
│   └── DELETE /:id          # Delete user
├── /api/athletes/
│   ├── GET /                # List athletes
│   ├── POST /               # Create athlete
│   └── GET /:code          # Get athlete details
├── /api/biometric-data/
│   ├── GET /                # Get biometric data
│   ├── POST /               # Save biometric data
│   └── GET /latest         # Get latest data
└── /api/dashboard/
    └── GET /                # Dashboard data
```

### Middleware Stack
```javascript
// Request Processing Pipeline
Request → CORS → JSON Parser → Authentication → Authorization → Route Handler → Response
```

### Security Implementation
- **JWT Authentication**: Stateless token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Joi schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin request handling

## Database Architecture

### Schema Design
```sql
-- Core Tables
users (id, username, email, password_hash, role_id, is_active)
athletes (id, athlete_code, first_name, last_name, date_of_birth, is_active)
sports (id, sport_name, description)
organizations (id, organization_name, type)
user_roles (id, role_name, description)

-- Data Tables
biometric_data (id, athlete_id, measurement_date, hrv_night, resting_hr, spo2_night, ...)
body_composition (id, athlete_id, measurement_date, weight_kg, fat_mass_kg, muscle_mass_kg, ...)
genetic_profiles (id, test_result_id, gene_id, genotype, interpretation)
genetic_test_results (id, athlete_id, test_date, test_status, lab_name)

-- Relationship Tables
athlete_organization_history (id, athlete_id, organization_id, sport_id, start_date, end_date)
user_organization_roles (id, user_id, organization_id, role_id, is_active)
```

### Database Relationships
- **One-to-Many**: Users → Organizations, Athletes → Biometric Data
- **Many-to-Many**: Athletes ↔ Organizations (via history table)
- **Self-Referencing**: Users can have multiple roles in different organizations
- **Time-Series**: Biometric and body composition data with temporal relationships

### Indexing Strategy
```sql
-- Performance Indexes
CREATE INDEX idx_biometric_athlete_date ON biometric_data(athlete_id, measurement_date);
CREATE INDEX idx_bodycomp_athlete_date ON body_composition(athlete_id, measurement_date);
CREATE INDEX idx_genetic_athlete_status ON genetic_test_results(athlete_id, test_status);
CREATE INDEX idx_athletes_code ON athletes(athlete_code);
CREATE INDEX idx_users_email ON users(email);
```

## Data Flow Architecture

### Authentication Flow
```
1. User Login Request
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Token
   ↓
4. Store Token in localStorage
   ↓
5. Attach Token to API Requests
   ↓
6. Verify Token on Each Request
   ↓
7. Return User Data or Error
```

### Data Fetching Flow
```
1. Component Mounts
   ↓
2. Custom Hook Called
   ↓
3. API Service Request
   ↓
4. Authentication Check
   ↓
5. Database Query
   ↓
6. Data Processing
   ↓
7. State Update
   ↓
8. Component Re-render
```

## Deployment Architecture

### Environment Configuration
```bash
# Development Environment
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
DB_HOST=rxg.postgres.database.azure.com
DB_PORT=5432

# Production Environment
NODE_ENV=production
VITE_API_URL=https://api.sports-performance.com/api
DB_HOST=rxg.postgres.database.azure.com
DB_PORT=5432
```

### Docker Configuration
```dockerfile
# Frontend Container
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm", "start"]

# Backend Container
FROM node:18-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "server"]
```

### Production Deployment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Frontend      │    │   Backend API   │
│   (nginx)       │◄──►│   (React)       │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Cache/Queue   │
                       │  (PostgreSQL)   │    │    (Redis)      │
                       └─────────────────┘    └─────────────────┘
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Optimization
- **Connection Pooling**: PostgreSQL connection reuse
- **Query Optimization**: EXPLAIN ANALYZE for slow queries
- **Caching Strategy**: Redis for frequently accessed data
- **Rate Limiting**: API request throttling

### Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Partitioning**: Time-series data partitioning by date
- **Query Optimization**: Avoiding N+1 queries
- **Connection Management**: Proper connection pooling

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with expiration
- **Role-Based Access**: Hierarchical permission system
- **Password Policies**: Complexity requirements and history
- **Session Management**: Secure token storage and refresh

### Data Security
- **Encryption**: Data at rest and in transit
- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Content Security Policy headers

### API Security
- **CORS Configuration**: Proper origin validation
- **Rate Limiting**: Request throttling per user/IP
- **Input Validation**: Joi schemas for all endpoints
- **Error Handling**: Generic error messages to prevent information leakage

## Monitoring & Logging

### Application Monitoring
- **Performance Metrics**: Response times and error rates
- **Health Checks**: Database connectivity and API availability
- **User Analytics**: Usage patterns and feature adoption
- **Error Tracking**: Comprehensive error logging and alerting

### Database Monitoring
- **Query Performance**: Slow query identification
- **Connection Pool**: Connection usage and leaks
- **Storage Usage**: Database size and growth trends
- **Backup Status**: Automated backup verification

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side session storage
- **Database Replication**: Read replicas for query load distribution
- **Caching Layer**: Redis for session and data caching
- **Load Balancing**: Nginx for request distribution

### Vertical Scaling
- **Resource Optimization**: Memory and CPU usage monitoring
- **Query Optimization**: Index and query performance tuning
- **Code Optimization**: Bundle size and runtime performance
- **Asset Optimization**: CDN for static assets

## Development Workflow

### Code Organization
- **Feature-based Structure**: Related files grouped together
- **Separation of Concerns**: Clear boundaries between layers
- **Reusable Components**: Shared UI and utility components
- **Type Safety**: Comprehensive TypeScript definitions

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: User journey testing
- **Performance Tests**: Load and stress testing

### CI/CD Pipeline
```yaml
# GitHub Actions Workflow
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test
      - run: npm run build
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          # Deployment commands
```

This architecture provides a solid foundation for a scalable, maintainable, and secure sports performance monitoring system that can grow with the needs of the organization.