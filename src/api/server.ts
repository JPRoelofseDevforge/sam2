import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AthleteModel } from '../db/models/athletes';
import { BiometricDataModel } from '../db/models/biometricData';
import { GeneticProfileModel } from '../db/models/geneticProfiles';
import { BodyCompositionModel } from '../db/models/bodyComposition';
import { BloodResultsModel } from '../db/models/bloodResults';
import { UserModel } from '../db/models/users';
import { OrganizationModel } from '../db/models/organizations';
import { SportModel } from '../db/models/sports';
import { GeneModel } from '../db/models/genes';
import { AlertTypeModel } from '../db/models/alertTypes';
import { GeneticTestTypeModel } from '../db/models/geneticTestTypes';
import { UserRoleModel } from '../db/models/userRoles';
import { UserOrganizationRoleModel } from '../db/models/userOrganizationRoles';
import { AthleteOrganizationHistoryModel } from '../db/models/athleteOrganizationHistory';
import { GeneticTestResultModel } from '../db/models/geneticTestResults';
import { GeneticProfileAdminModel } from '../db/models/geneticProfilesAdmin';
import { BodySymmetryModel } from '../db/models/bodySymmetry';
import { AthleteAlertModel } from '../db/models/athleteAlerts';
import { ReadinessScoreModel } from '../db/models/readinessScores';
import { TrainingLoadTrendModel } from '../db/models/trainingLoadTrends';
import { BiometricDataAdminModel } from '../db/models/biometricDataAdmin';
import { BodyCompositionAdminModel } from '../db/models/bodyCompositionAdmin';

// Load environment variables
dotenv.config();

// Add diagnostic logging at startup
console.log('=== SERVER DIAGNOSTIC STARTUP ===');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT from env: ${process.env.PORT}`);
console.log(`JWT_SECRET loaded: ${!!process.env.JWT_SECRET}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`VITE_API_URL: ${process.env.VITE_API_URL}`);
console.log('=== SERVER DIAGNOSTIC END ===');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS middleware - allow multiple origins for production
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://app.samhealth.co.za',
    'https://samapigene.azurewebsites.net',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative dev port
    'http://127.0.0.1:5173', // Alternative localhost
    'http://127.0.0.1:3000'  // Alternative localhost
  ];
  const origin = req.headers.origin;

  console.log(`[CORS] Request from origin: ${origin}, method: ${req.method}, path: ${req.path}, user-agent: ${req.headers['user-agent']?.substring(0, 50)}...`);

  // Allow the specific origins or if no origin header (for same-origin requests)
  if ((origin && allowedOrigins.includes(origin)) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    console.log(`[CORS] ✅ Allowed origin: ${origin || allowedOrigins[0]}`);
  } else {
    console.log(`[CORS] ❌ Blocked origin: ${origin} - not in allowed list: ${allowedOrigins.join(', ')}`);
    return res.status(403).json({ error: 'CORS policy violation', allowedOrigins });
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Kuma-Revision');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Handling OPTIONS preflight for: ${req.path}`);
    res.status(200).send();
    return;
  }

  next();
});
app.use(express.json({
  strict: false,
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api."],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Serve static files from the React app build directory
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Extended Request interface to include user
interface AuthRequest extends Request {
  user?: any;
}

// Authentication middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(`[AUTH] ${req.method} ${req.path} - Auth header present: ${!!authHeader}, Token present: ${!!token}`);
  console.log(`[AUTH] Origin: ${req.headers.origin}, User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);

  if (!token) {
    console.log(`[AUTH] ❌ No token provided for: ${req.path}`);
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    console.log(`[AUTH] ✅ Token verified for user: ${(user as any).user_id}, role: ${(user as any).role_name}`);
    next();
  } catch (err) {
    console.log(`[AUTH] ❌ Invalid token for: ${req.path} - ${err}`);
    console.log(`[AUTH] JWT_SECRET length: ${JWT_SECRET.length}, first 10 chars: ${JWT_SECRET.substring(0, 10)}...`);
    return res.status(403).json({ error: 'Invalid or expired token', details: err instanceof Error ? err.message : String(err) });
  }
};

// Admin authorization middleware
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = await UserModel.isUserAdmin(req.user.user_id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
};

// =====================================================
// ATHLETE ENDPOINTS
// =====================================================

// Get all athletes
app.get('/api/athletes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const athletes = await AthleteModel.getAllAthletes();
    res.json(athletes);
  } catch (error) {
    next(error);
  }
});

// Get single athlete by ID
app.get('/api/athletes/:athleteCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const athlete = await AthleteModel.getAthleteById(athleteCode);

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    res.json(athlete);
  } catch (error) {
    next(error);
  }
});

// Get athlete ID mapping (athlete_code to athlete_id)
app.get('/api/athletes/:athleteCode/id-mapping', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);

    if (!athleteId) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    res.json({
      success: true,
      data: {
        athlete_id: athleteId,
        athlete_code: athleteCode
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get athletes by team
app.get('/api/teams/:organizationId/athletes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = req.params;
    const athletes = await AthleteModel.getAthletesByTeam(parseInt(organizationId));
    res.json(athletes);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// BIOMETRIC DATA ENDPOINTS
// =====================================================

// Get all biometric data (with optional date range)
app.get('/api/biometric-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await BiometricDataModel.getAllBiometricData(
      startDate as string,
      endDate as string
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get biometric data for specific athlete
app.get('/api/athletes/:athleteCode/biometric-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const { startDate, endDate } = req.query;
    
    const data = await BiometricDataModel.getBiometricDataByAthlete(
      athleteCode,
      startDate as string,
      endDate as string
    );
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get latest biometric data for all athletes
app.get('/api/biometric-data/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await BiometricDataModel.getLatestBiometricData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Insert/Update biometric data
app.post('/api/athletes/:athleteCode/biometric-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const biometricData = {
      ...req.body,
      athlete_id: athleteCode
    };
    
    await BiometricDataModel.insertBiometricData(biometricData);
    res.status(201).json({ message: 'Biometric data saved successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GENETIC PROFILE ENDPOINTS
// =====================================================

// Get all genetic profiles
app.get('/api/genetic-profiles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await GeneticProfileModel.getAllGeneticProfiles();
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

// Get genetic profile for specific athlete
app.get('/api/athletes/:athleteCode/genetic-profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const profile = await GeneticProfileModel.getGeneticProfileByAthlete(athleteCode);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// Get genetic profiles by category
app.get('/api/genetic-profiles/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const profiles = await GeneticProfileModel.getGeneticProfilesByCategory(category);
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

// Get specific genes for all athletes
app.post('/api/genetic-profiles/genes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { genes } = req.body;
    
    if (!Array.isArray(genes)) {
      return res.status(400).json({ error: 'Genes must be an array' });
    }
    
    const profiles = await GeneticProfileModel.getSpecificGenes(genes);
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

// Get available genes list
app.get('/api/genes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genes = await GeneticProfileModel.getAvailableGenes();
    res.json(genes);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// BODY COMPOSITION ENDPOINTS
// =====================================================

// Get all body composition data
app.get('/api/body-composition', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await BodyCompositionModel.getAllBodyComposition(
      startDate as string,
      endDate as string
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get body composition for specific athlete
app.get('/api/athletes/:athleteCode/body-composition', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const { startDate, endDate } = req.query;
    
    const data = await BodyCompositionModel.getBodyCompositionByAthlete(
      athleteCode,
      startDate as string,
      endDate as string
    );
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get latest body composition for all athletes
app.get('/api/body-composition/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await BodyCompositionModel.getLatestBodyComposition();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Insert/Update body composition data
app.post('/api/athletes/:athleteCode/body-composition', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const bodyCompositionData = {
      ...req.body,
      athlete_id: athleteCode
    };
    
    await BodyCompositionModel.insertBodyComposition(bodyCompositionData);
    res.status(201).json({ message: 'Body composition data saved successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// BLOOD RESULTS ENDPOINTS
// =====================================================

// Get all blood results
app.get('/api/blood-results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodResults = await BloodResultsModel.getAllBloodResults();
    res.json(bloodResults);
  } catch (error) {
    next(error);
  }
});

// Get blood results for specific athlete by athlete code
app.get('/api/athletes/:athleteCode/blood-results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;

    const bloodResults = await BloodResultsModel.getBloodResultsByAthleteCode(athleteCode);
    res.json(bloodResults);
  } catch (error) {
    next(error);
  }
});

// Get blood results for specific athlete by numeric AthleteId
app.get('/api/blood-results/athlete/:athleteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteId } = req.params;
    const numericAthleteId = parseInt(athleteId);

    if (isNaN(numericAthleteId)) {
      return res.status(400).json({ error: 'Invalid athlete ID format' });
    }

    const bloodResults = await BloodResultsModel.getBloodResultsByAthleteId(numericAthleteId);
    res.json(bloodResults);
  } catch (error) {
    next(error);
  }
});

// Get latest blood results for all athletes
app.get('/api/blood-results/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const athletes = await AthleteModel.getAllAthletes();
    const latestResults = await Promise.all(
      athletes.map(async (athlete) => {
        const athleteId = typeof athlete.athlete_id === 'string' ? parseInt(athlete.athlete_id, 10) : athlete.athlete_id;
        const result = await BloodResultsModel.getLatestBloodResults(athleteId);
        return result ? { athlete_id: athlete.athlete_id, ...result } : null;
      })
    );

    const filteredResults = latestResults.filter(result => result !== null);
    res.json(filteredResults);
  } catch (error) {
    next(error);
  }
});

// Insert/Update blood results
app.post('/api/athletes/:athleteCode/blood-results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;

    // First get the athlete ID from the athlete code
    const athleteId = await AthleteModel.getAthleteIdMapping(athleteCode);
    if (!athleteId) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const bloodData = {
      ...req.body,
      AthleteId: athleteId
    };

    const result = await BloodResultsModel.createBloodResults(bloodData);
    res.status(201).json({
      message: 'Blood results saved successfully',
      bloodResult: result
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// COMBINED DATA ENDPOINTS (for dashboard views)
// =====================================================

// Get all data for a specific athlete
app.get('/api/athletes/:athleteCode/all-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const { startDate, endDate } = req.query;
    
    const [athlete, biometricData, geneticProfile, bodyComposition] = await Promise.all([
      AthleteModel.getAthleteById(athleteCode),
      BiometricDataModel.getBiometricDataByAthlete(athleteCode, startDate as string, endDate as string),
      GeneticProfileModel.getGeneticProfileByAthlete(athleteCode),
      BodyCompositionModel.getBodyCompositionByAthlete(athleteCode, startDate as string, endDate as string)
    ]);
    
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    res.json({
      athlete,
      biometricData,
      geneticProfile,
      bodyComposition
    });
  } catch (error) {
    next(error);
  }
});

// Get dashboard data (latest data for all athletes)
app.get('/api/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [athletes, biometricData, geneticProfiles, bodyComposition] = await Promise.all([
      AthleteModel.getAllAthletes(),
      BiometricDataModel.getLatestBiometricData(),
      GeneticProfileModel.getAllGeneticProfiles(),
      BodyCompositionModel.getLatestBodyComposition()
    ]);
    
    res.json({
      athletes,
      biometricData,
      geneticProfiles,
      bodyComposition
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await UserModel.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_name: user.role_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_name: user.role_name,
        is_admin: user.role_name === 'SuperAdmin' || user.role_name === 'OrgAdmin'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.getUserById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdmin = await UserModel.isUserAdmin(req.user.user_id);

    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_name: user.role_name,
        is_admin: isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// USER MANAGEMENT ENDPOINTS (Admin only)
// =====================================================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get single user (Admin only)
app.get('/api/users/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.getUserById(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Create new user (Admin only)
app.post('/api/users', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password ||
        !userData.first_name || !userData.last_name || !userData.role_id) {
      return res.status(400).json({
        error: 'Missing required fields: username, email, password, first_name, last_name, role_id'
      });
    }
    
    const result = await UserModel.createUser(userData);
    res.status(201).json({
      message: 'User created successfully',
      user_id: result.user_id
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(error);
  }
});

// Update user (Admin only)
app.put('/api/users/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    
    const success = await UserModel.updateUser(parseInt(userId), userData);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(error);
  }
});

// Delete user (Admin only)
app.delete('/api/users/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion
    if (parseInt(userId) === (req as AuthRequest).user.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const success = await UserModel.deleteUser(parseInt(userId));
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all roles (Admin only)
app.get('/api/roles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const roles = await UserModel.getAllRoles();
     res.json(roles);
   } catch (error) {
     next(error);
   }
 });

// =====================================================
// ORGANIZATIONS ENDPOINTS
// =====================================================

// Get all organizations
app.get('/api/organizations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await OrganizationModel.getAllOrganizations();
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

// Get single organization
app.get('/api/organizations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organization = await OrganizationModel.getOrganizationById(parseInt(id));

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// SPORTS ENDPOINTS
// =====================================================

// Get all sports
app.get('/api/sports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sports = await SportModel.getAllSports();
    res.json(sports);
  } catch (error) {
    next(error);
  }
});

// Get single sport
app.get('/api/sports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sport = await SportModel.getSportById(parseInt(id));

    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    res.json(sport);
  } catch (error) {
    next(error);
  }
});


// =====================================================
// ADMIN ENDPOINTS - ORGANIZATIONS
// =====================================================

// Get all organizations (Admin only)
app.get('/api/admin/organizations', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizations = await OrganizationModel.getAllOrganizations();
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

// Get single organization (Admin only)
app.get('/api/admin/organizations/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organization = await OrganizationModel.getOrganizationById(parseInt(id));

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    next(error);
  }
});

// Create organization (Admin only)
app.post('/api/admin/organizations', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationData = req.body;

    // Validate required fields
    if (!organizationData.organization_name || !organizationData.organization_type) {
      return res.status(400).json({
        error: 'Missing required fields: organization_name, organization_type'
      });
    }

    const result = await OrganizationModel.createOrganization(organizationData);
    res.status(201).json({
      message: 'Organization created successfully',
      organization: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    next(error);
  }
});

// Update organization (Admin only)
app.put('/api/admin/organizations/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organizationData = req.body;

    const success = await OrganizationModel.updateOrganization(parseInt(id), organizationData);

    if (!success) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ message: 'Organization updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    next(error);
  }
});

// Delete organization (Admin only)
app.delete('/api/admin/organizations/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await OrganizationModel.deleteOrganization(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - SPORTS
// =====================================================

// Get all sports (Admin only)
app.get('/api/admin/sports', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sports = await SportModel.getAllSports();
    res.json(sports);
  } catch (error) {
    next(error);
  }
});

// Get single sport (Admin only)
app.get('/api/admin/sports/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sport = await SportModel.getSportById(parseInt(id));

    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    res.json(sport);
  } catch (error) {
    next(error);
  }
});

// Create sport (Admin only)
app.post('/api/admin/sports', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sportData = req.body;

    // Validate required fields
    if (!sportData.sport_name) {
      return res.status(400).json({
        error: 'Missing required field: sport_name'
      });
    }

    const result = await SportModel.createSport(sportData);
    res.status(201).json({
      message: 'Sport created successfully',
      sport: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Sport name already exists' });
    }
    next(error);
  }
});

// Update sport (Admin only)
app.put('/api/admin/sports/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sportData = req.body;

    const success = await SportModel.updateSport(parseInt(id), sportData);

    if (!success) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    res.json({ message: 'Sport updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Sport name already exists' });
    }
    next(error);
  }
});

// Delete sport (Admin only)
app.delete('/api/admin/sports/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await SportModel.deleteSport(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    res.json({ message: 'Sport deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - GENES
// =====================================================

// Get all genes (Admin only)
app.get('/api/admin/genes', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genes = await GeneModel.getAllGenes();
    res.json(genes);
  } catch (error) {
    next(error);
  }
});

// Get single gene (Admin only)
app.get('/api/admin/genes/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const gene = await GeneModel.getGeneById(parseInt(id));

    if (!gene) {
      return res.status(404).json({ error: 'Gene not found' });
    }

    res.json(gene);
  } catch (error) {
    next(error);
  }
});

// Create gene (Admin only)
app.post('/api/admin/genes', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const geneData = req.body;

    // Validate required fields
    if (!geneData.gene_name) {
      return res.status(400).json({
        error: 'Missing required field: gene_name'
      });
    }

    const result = await GeneModel.createGene(geneData);
    res.status(201).json({
      message: 'Gene created successfully',
      gene: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Gene name already exists' });
    }
    next(error);
  }
});

// Update gene (Admin only)
app.put('/api/admin/genes/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const geneData = req.body;

    const success = await GeneModel.updateGene(parseInt(id), geneData);

    if (!success) {
      return res.status(404).json({ error: 'Gene not found' });
    }

    res.json({ message: 'Gene updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Gene name already exists' });
    }
    next(error);
  }
});

// Delete gene (Admin only)
app.delete('/api/admin/genes/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await GeneModel.deleteGene(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Gene not found' });
    }

    res.json({ message: 'Gene deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - ALERT TYPES
// =====================================================

// Get all alert types (Admin only)
app.get('/api/admin/alert-types', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertTypes = await AlertTypeModel.getAllAlertTypes();
    res.json(alertTypes);
  } catch (error) {
    next(error);
  }
});

// Get single alert type (Admin only)
app.get('/api/admin/alert-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alertType = await AlertTypeModel.getAlertTypeById(parseInt(id));

    if (!alertType) {
      return res.status(404).json({ error: 'Alert type not found' });
    }

    res.json(alertType);
  } catch (error) {
    next(error);
  }
});

// Create alert type (Admin only)
app.post('/api/admin/alert-types', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertTypeData = req.body;

    // Validate required fields
    if (!alertTypeData.alert_type_name || !alertTypeData.severity) {
      return res.status(400).json({
        error: 'Missing required fields: alert_type_name, severity'
      });
    }

    const result = await AlertTypeModel.createAlertType(alertTypeData);
    res.status(201).json({
      message: 'Alert type created successfully',
      alertType: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Alert type name already exists' });
    }
    next(error);
  }
});

// Update alert type (Admin only)
app.put('/api/admin/alert-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alertTypeData = req.body;

    const success = await AlertTypeModel.updateAlertType(parseInt(id), alertTypeData);

    if (!success) {
      return res.status(404).json({ error: 'Alert type not found' });
    }

    res.json({ message: 'Alert type updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Alert type name already exists' });
    }
    next(error);
  }
});

// Delete alert type (Admin only)
app.delete('/api/admin/alert-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await AlertTypeModel.deleteAlertType(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Alert type not found' });
    }

    res.json({ message: 'Alert type deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - GENETIC TEST TYPES
// =====================================================

// Get all genetic test types (Admin only)
app.get('/api/admin/genetic-test-types', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testTypes = await GeneticTestTypeModel.getAllGeneticTestTypes();
    res.json(testTypes);
  } catch (error) {
    next(error);
  }
});

// Get single genetic test type (Admin only)
app.get('/api/admin/genetic-test-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const testType = await GeneticTestTypeModel.getGeneticTestTypeById(parseInt(id));

    if (!testType) {
      return res.status(404).json({ error: 'Genetic test type not found' });
    }

    res.json(testType);
  } catch (error) {
    next(error);
  }
});

// Create genetic test type (Admin only)
app.post('/api/admin/genetic-test-types', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testTypeData = req.body;

    // Validate required fields
    if (!testTypeData.test_name) {
      return res.status(400).json({
        error: 'Missing required field: test_name'
      });
    }

    const result = await GeneticTestTypeModel.createGeneticTestType(testTypeData);
    res.status(201).json({
      message: 'Genetic test type created successfully',
      testType: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Test name already exists' });
    }
    next(error);
  }
});

// Update genetic test type (Admin only)
app.put('/api/admin/genetic-test-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const testTypeData = req.body;

    const success = await GeneticTestTypeModel.updateGeneticTestType(parseInt(id), testTypeData);

    if (!success) {
      return res.status(404).json({ error: 'Genetic test type not found' });
    }

    res.json({ message: 'Genetic test type updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Test name already exists' });
    }
    next(error);
  }
});

// Delete genetic test type (Admin only)
app.delete('/api/admin/genetic-test-types/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await GeneticTestTypeModel.deleteGeneticTestType(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Genetic test type not found' });
    }

    res.json({ message: 'Genetic test type deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - ATHLETES
// =====================================================

// Create athlete (Admin only)
app.post('/api/admin/athletes', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const athleteData = req.body;

    // Validate required fields
    if (!athleteData.athlete_code || !athleteData.first_name ||
        !athleteData.last_name || !athleteData.date_of_birth || !athleteData.gender) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_code, first_name, last_name, date_of_birth, gender'
      });
    }

    const result = await AthleteModel.createAthlete(athleteData);
    res.status(201).json({
      message: 'Athlete created successfully',
      athlete: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Athlete code already exists' });
    }
    next(error);
  }
});

// Update athlete (Admin only)
app.put('/api/admin/athletes/:athleteCode', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;
    const athleteData = req.body;

    const success = await AthleteModel.updateAthlete(athleteCode, athleteData);

    if (!success) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    res.json({ message: 'Athlete updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Athlete code already exists' });
    }
    next(error);
  }
});

// Delete athlete (Admin only)
app.delete('/api/admin/athletes/:athleteCode', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { athleteCode } = req.params;

    const success = await AthleteModel.deleteAthlete(athleteCode);

    if (!success) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - USER ROLES
// =====================================================

// Get all user roles (Admin only)
app.get('/api/admin/user-roles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRoles = await UserRoleModel.getAllRoles();
    res.json(userRoles);
  } catch (error) {
    next(error);
  }
});

// Get single user role (Admin only)
app.get('/api/admin/user-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userRole = await UserRoleModel.getRoleById(parseInt(id));

    if (!userRole) {
      return res.status(404).json({ error: 'User role not found' });
    }

    res.json(userRole);
  } catch (error) {
    next(error);
  }
});

// Create user role (Admin only)
app.post('/api/admin/user-roles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRoleData = req.body;

    // Validate required fields
    if (!userRoleData.role_name) {
      return res.status(400).json({
        error: 'Missing required field: role_name'
      });
    }

    const result = await UserRoleModel.createRole(userRoleData);
    res.status(201).json({
      message: 'User role created successfully',
      userRole: result
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'User role name already exists' });
    }
    next(error);
  }
});

// Update user role (Admin only)
app.put('/api/admin/user-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userRoleData = req.body;

    const success = await UserRoleModel.updateRole(parseInt(id), userRoleData);

    if (!success) {
      return res.status(404).json({ error: 'User role not found' });
    }

    res.json({ message: 'User role updated successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'User role name already exists' });
    }
    next(error);
  }
});

// Delete user role (Admin only)
app.delete('/api/admin/user-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await UserRoleModel.deleteRole(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'User role not found' });
    }

    res.json({ message: 'User role deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - USER ORGANIZATION ROLES
// =====================================================

// Get all user organization roles (Admin only)
app.get('/api/admin/user-organization-roles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgRoles = await UserOrganizationRoleModel.getAllUserOrganizationRoles();
    res.json(userOrgRoles);
  } catch (error) {
    next(error);
  }
});

// Get single user organization role (Admin only)
app.get('/api/admin/user-organization-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userOrgRole = await UserOrganizationRoleModel.getUserOrganizationRoleById(parseInt(id));

    if (!userOrgRole) {
      return res.status(404).json({ error: 'User organization role not found' });
    }

    res.json(userOrgRole);
  } catch (error) {
    next(error);
  }
});

// Create user organization role (Admin only)
app.post('/api/admin/user-organization-roles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgRoleData = req.body;

    // Validate required fields
    if (!userOrgRoleData.user_id || !userOrgRoleData.organization_id || !userOrgRoleData.role_id) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, organization_id, role_id'
      });
    }

    const result = await UserOrganizationRoleModel.createUserOrganizationRole(userOrgRoleData);
    res.status(201).json({
      message: 'User organization role created successfully',
      userOrgRole: result
    });
  } catch (error) {
    next(error);
  }
});

// Update user organization role (Admin only)
app.put('/api/admin/user-organization-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userOrgRoleData = req.body;

    const success = await UserOrganizationRoleModel.updateUserOrganizationRole(parseInt(id), userOrgRoleData);

    if (!success) {
      return res.status(404).json({ error: 'User organization role not found' });
    }

    res.json({ message: 'User organization role updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete user organization role (Admin only)
app.delete('/api/admin/user-organization-roles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await UserOrganizationRoleModel.deleteUserOrganizationRole(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'User organization role not found' });
    }

    res.json({ message: 'User organization role deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - ATHLETE ORGANIZATION HISTORY
// =====================================================

// Get all athlete organization history (Admin only)
app.get('/api/admin/athlete-organization-history', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await AthleteOrganizationHistoryModel.getAllAthleteOrganizationHistory();
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Get single athlete organization history (Admin only)
app.get('/api/admin/athlete-organization-history/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const history = await AthleteOrganizationHistoryModel.getAthleteOrganizationHistoryById(parseInt(id));

    if (!history) {
      return res.status(404).json({ error: 'Athlete organization history not found' });
    }

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Create athlete organization history (Admin only)
app.post('/api/admin/athlete-organization-history', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const historyData = req.body;

    // Validate required fields
    if (!historyData.athlete_id || !historyData.organization_id || !historyData.sport_id || !historyData.start_date) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_id, organization_id, sport_id, start_date'
      });
    }

    const result = await AthleteOrganizationHistoryModel.createAthleteOrganizationHistory(historyData);
    res.status(201).json({
      message: 'Athlete organization history created successfully',
      history: result
    });
  } catch (error) {
    next(error);
  }
});

// Update athlete organization history (Admin only)
app.put('/api/admin/athlete-organization-history/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const historyData = req.body;

    const success = await AthleteOrganizationHistoryModel.updateAthleteOrganizationHistory(parseInt(id), historyData);

    if (!success) {
      return res.status(404).json({ error: 'Athlete organization history not found' });
    }

    res.json({ message: 'Athlete organization history updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete athlete organization history (Admin only)
app.delete('/api/admin/athlete-organization-history/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await AthleteOrganizationHistoryModel.deleteAthleteOrganizationHistory(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Athlete organization history not found' });
    }

    res.json({ message: 'Athlete organization history deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - GENETIC TEST RESULTS
// =====================================================

// Get all genetic test results (Admin only)
app.get('/api/admin/genetic-test-results', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testResults = await GeneticTestResultModel.getAllGeneticTestResults();
    res.json(testResults);
  } catch (error) {
    next(error);
  }
});

// Get single genetic test result (Admin only)
app.get('/api/admin/genetic-test-results/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const testResult = await GeneticTestResultModel.getGeneticTestResultById(parseInt(id));

    if (!testResult) {
      return res.status(404).json({ error: 'Genetic test result not found' });
    }

    res.json(testResult);
  } catch (error) {
    next(error);
  }
});

// Create genetic test result (Admin only)
app.post('/api/admin/genetic-test-results', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testResultData = req.body;

    // Validate required fields
    if (!testResultData.athlete_id || !testResultData.test_type_id || !testResultData.test_date) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_id, test_type_id, test_date'
      });
    }

    const result = await GeneticTestResultModel.createGeneticTestResult(testResultData);
    res.status(201).json({
      message: 'Genetic test result created successfully',
      testResult: result
    });
  } catch (error) {
    next(error);
  }
});

// Update genetic test result (Admin only)
app.put('/api/admin/genetic-test-results/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const testResultData = req.body;

    const success = await GeneticTestResultModel.updateGeneticTestResult(parseInt(id), testResultData);

    if (!success) {
      return res.status(404).json({ error: 'Genetic test result not found' });
    }

    res.json({ message: 'Genetic test result updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete genetic test result (Admin only)
app.delete('/api/admin/genetic-test-results/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await GeneticTestResultModel.deleteGeneticTestResult(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Genetic test result not found' });
    }

    res.json({ message: 'Genetic test result deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - GENETIC PROFILES
// =====================================================

// Get all genetic profiles (Admin only)
app.get('/api/admin/genetic-profiles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const geneticProfiles = await GeneticProfileAdminModel.getAllGeneticProfiles();
    res.json(geneticProfiles);
  } catch (error) {
    next(error);
  }
});

// Get single genetic profile (Admin only)
app.get('/api/admin/genetic-profiles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const geneticProfile = await GeneticProfileAdminModel.getGeneticProfileById(parseInt(id));

    if (!geneticProfile) {
      return res.status(404).json({ error: 'Genetic profile not found' });
    }

    res.json(geneticProfile);
  } catch (error) {
    next(error);
  }
});

// Create genetic profile (Admin only)
app.post('/api/admin/genetic-profiles', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const geneticProfileData = req.body;

    // Validate required fields
    if (!geneticProfileData.test_result_id || !geneticProfileData.gene_id || !geneticProfileData.genotype) {
      return res.status(400).json({
        error: 'Missing required fields: test_result_id, gene_id, genotype'
      });
    }

    const result = await GeneticProfileAdminModel.createGeneticProfile(geneticProfileData);
    res.status(201).json({
      message: 'Genetic profile created successfully',
      geneticProfile: result
    });
  } catch (error) {
    next(error);
  }
});

// Update genetic profile (Admin only)
app.put('/api/admin/genetic-profiles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const geneticProfileData = req.body;

    const success = await GeneticProfileAdminModel.updateGeneticProfile(parseInt(id), geneticProfileData);

    if (!success) {
      return res.status(404).json({ error: 'Genetic profile not found' });
    }

    res.json({ message: 'Genetic profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete genetic profile (Admin only)
app.delete('/api/admin/genetic-profiles/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await GeneticProfileAdminModel.deleteGeneticProfile(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Genetic profile not found' });
    }

    res.json({ message: 'Genetic profile deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - BODY SYMMETRY
// =====================================================

// Get all body symmetry records (Admin only)
app.get('/api/admin/body-symmetry', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodySymmetry = await BodySymmetryModel.getAllBodySymmetry();
    res.json(bodySymmetry);
  } catch (error) {
    next(error);
  }
});

// Get single body symmetry record (Admin only)
app.get('/api/admin/body-symmetry/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const bodySymmetry = await BodySymmetryModel.getBodySymmetryById(parseInt(id));

    if (!bodySymmetry) {
      return res.status(404).json({ error: 'Body symmetry record not found' });
    }

    res.json(bodySymmetry);
  } catch (error) {
    next(error);
  }
});

// Create body symmetry record (Admin only)
app.post('/api/admin/body-symmetry', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodySymmetryData = req.body;

    // Validate required fields
    if (!bodySymmetryData.body_composition_id) {
      return res.status(400).json({
        error: 'Missing required field: body_composition_id'
      });
    }

    const result = await BodySymmetryModel.createBodySymmetry(bodySymmetryData);
    res.status(201).json({
      message: 'Body symmetry record created successfully',
      bodySymmetry: result
    });
  } catch (error) {
    next(error);
  }
});

// Update body symmetry record (Admin only)
app.put('/api/admin/body-symmetry/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const bodySymmetryData = req.body;

    const success = await BodySymmetryModel.updateBodySymmetry(parseInt(id), bodySymmetryData);

    if (!success) {
      return res.status(404).json({ error: 'Body symmetry record not found' });
    }

    res.json({ message: 'Body symmetry record updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete body symmetry record (Admin only)
app.delete('/api/admin/body-symmetry/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await BodySymmetryModel.deleteBodySymmetry(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Body symmetry record not found' });
    }

    res.json({ message: 'Body symmetry record deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - ATHLETE ALERTS
// =====================================================

// Get all athlete alerts (Admin only)
app.get('/api/admin/athlete-alerts', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const athleteAlerts = await AthleteAlertModel.getAllAthleteAlerts();
    res.json(athleteAlerts);
  } catch (error) {
    next(error);
  }
});

// Get single athlete alert (Admin only)
app.get('/api/admin/athlete-alerts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const athleteAlert = await AthleteAlertModel.getAthleteAlertById(parseInt(id));

    if (!athleteAlert) {
      return res.status(404).json({ error: 'Athlete alert not found' });
    }

    res.json(athleteAlert);
  } catch (error) {
    next(error);
  }
});

// Create athlete alert (Admin only)
app.post('/api/admin/athlete-alerts', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const athleteAlertData = req.body;

    // Validate required fields
    if (!athleteAlertData.athlete_id || !athleteAlertData.alert_type_id || !athleteAlertData.alert_title) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_id, alert_type_id, alert_title'
      });
    }

    const result = await AthleteAlertModel.createAthleteAlert(athleteAlertData);
    res.status(201).json({
      message: 'Athlete alert created successfully',
      athleteAlert: result
    });
  } catch (error) {
    next(error);
  }
});

// Update athlete alert (Admin only)
app.put('/api/admin/athlete-alerts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const athleteAlertData = req.body;

    const success = await AthleteAlertModel.updateAthleteAlert(parseInt(id), athleteAlertData);

    if (!success) {
      return res.status(404).json({ error: 'Athlete alert not found' });
    }

    res.json({ message: 'Athlete alert updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete athlete alert (Admin only)
app.delete('/api/admin/athlete-alerts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await AthleteAlertModel.deleteAthleteAlert(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Athlete alert not found' });
    }

    res.json({ message: 'Athlete alert deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - READINESS SCORES
// =====================================================

// Get all readiness scores (Admin only)
app.get('/api/admin/readiness-scores', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const readinessScores = await ReadinessScoreModel.getAllReadinessScores();
    res.json(readinessScores);
  } catch (error) {
    next(error);
  }
});

// Get single readiness score (Admin only)
app.get('/api/admin/readiness-scores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const readinessScore = await ReadinessScoreModel.getReadinessScoreById(parseInt(id));

    if (!readinessScore) {
      return res.status(404).json({ error: 'Readiness score not found' });
    }

    res.json(readinessScore);
  } catch (error) {
    next(error);
  }
});

// Create readiness score (Admin only)
app.post('/api/admin/readiness-scores', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const readinessScoreData = req.body;

    // Validate required fields
    if (!readinessScoreData.athlete_id || !readinessScoreData.score_date || !readinessScoreData.readiness_score) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_id, score_date, readiness_score'
      });
    }

    const result = await ReadinessScoreModel.createReadinessScore(readinessScoreData);
    res.status(201).json({
      message: 'Readiness score created successfully',
      readinessScore: result
    });
  } catch (error) {
    next(error);
  }
});

// Update readiness score (Admin only)
app.put('/api/admin/readiness-scores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const readinessScoreData = req.body;

    const success = await ReadinessScoreModel.updateReadinessScore(parseInt(id), readinessScoreData);

    if (!success) {
      return res.status(404).json({ error: 'Readiness score not found' });
    }

    res.json({ message: 'Readiness score updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete readiness score (Admin only)
app.delete('/api/admin/readiness-scores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await ReadinessScoreModel.deleteReadinessScore(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Readiness score not found' });
    }

    res.json({ message: 'Readiness score deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// ADMIN ENDPOINTS - BIOMETRIC DATA
// =====================================================

// Get all biometric data (Admin only)
app.get('/api/admin/biometric-data', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const biometricData = await BiometricDataModel.getAllBiometricDataAdmin();
     res.json(biometricData);
   } catch (error) {
     next(error);
   }
 });

// Get single biometric data record (Admin only)
app.get('/api/admin/biometric-data/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;
     const biometricData = await BiometricDataModel.getBiometricDataById(parseInt(id));

     if (!biometricData) {
       return res.status(404).json({ error: 'Biometric data record not found' });
     }

     res.json(biometricData);
   } catch (error) {
     next(error);
   }
 });

// Create biometric data record (Admin only)
app.post('/api/admin/biometric-data', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const biometricData = req.body;

     // Validate required fields
     if (!biometricData.athlete_id || !biometricData.measurement_date) {
       return res.status(400).json({
         error: 'Missing required fields: athlete_id, measurement_date'
       });
     }

     const result = await BiometricDataModel.createBiometricData(biometricData);
     res.status(201).json({
       message: 'Biometric data record created successfully',
       biometricData: result
     });
   } catch (error: any) {
     if (error.message.includes('not found')) {
       return res.status(404).json({ error: error.message });
     }
     next(error);
   }
 });

// Update biometric data record (Admin only)
app.put('/api/admin/biometric-data/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;
     const biometricData = req.body;

     const success = await BiometricDataModel.updateBiometricData(parseInt(id), biometricData);

     if (!success) {
       return res.status(404).json({ error: 'Biometric data record not found' });
     }

     res.json({ message: 'Biometric data record updated successfully' });
   } catch (error) {
     next(error);
   }
 });

// Delete biometric data record (Admin only)
app.delete('/api/admin/biometric-data/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;

     const success = await BiometricDataModel.deleteBiometricData(parseInt(id));

     if (!success) {
       return res.status(404).json({ error: 'Biometric data record not found' });
     }

     res.json({ message: 'Biometric data record deleted successfully' });
   } catch (error) {
     next(error);
   }
 });

// =====================================================
// ADMIN ENDPOINTS - BODY COMPOSITION
// =====================================================

// Get all body composition data (Admin only)
app.get('/api/admin/body-composition', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const bodyComposition = await BodyCompositionModel.getAllBodyCompositionAdmin();
     res.json(bodyComposition);
   } catch (error) {
     next(error);
   }
 });

// Get single body composition record (Admin only)
app.get('/api/admin/body-composition/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;
     const bodyComposition = await BodyCompositionModel.getBodyCompositionById(parseInt(id));

     if (!bodyComposition) {
       return res.status(404).json({ error: 'Body composition record not found' });
     }

     res.json(bodyComposition);
   } catch (error) {
     next(error);
   }
 });

// Create body composition record (Admin only)
app.post('/api/admin/body-composition', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const bodyCompositionData = req.body;

     // Validate required fields
     if (!bodyCompositionData.athlete_id || !bodyCompositionData.measurement_date) {
       return res.status(400).json({
         error: 'Missing required fields: athlete_id, measurement_date'
       });
     }

     const result = await BodyCompositionModel.createBodyComposition(bodyCompositionData);
     res.status(201).json({
       message: 'Body composition record created successfully',
       bodyComposition: result
     });
   } catch (error: any) {
     if (error.message.includes('not found')) {
       return res.status(404).json({ error: error.message });
     }
     next(error);
   }
 });

// Update body composition record (Admin only)
app.put('/api/admin/body-composition/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;
     const bodyCompositionData = req.body;

     const success = await BodyCompositionModel.updateBodyComposition(parseInt(id), bodyCompositionData);

     if (!success) {
       return res.status(404).json({ error: 'Body composition record not found' });
     }

     res.json({ message: 'Body composition record updated successfully' });
   } catch (error) {
     next(error);
   }
 });

// Delete body composition record (Admin only)
app.delete('/api/admin/body-composition/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { id } = req.params;

     const success = await BodyCompositionModel.deleteBodyComposition(parseInt(id));

     if (!success) {
       return res.status(404).json({ error: 'Body composition record not found' });
     }

     res.json({ message: 'Body composition record deleted successfully' });
   } catch (error) {
     next(error);
   }
 });

// =====================================================
// ADMIN ENDPOINTS - TRAINING LOAD TRENDS
// =====================================================

// Get all training load trends (Admin only)
app.get('/api/admin/training-load-trends', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
   try {
     const trainingLoadTrends = await TrainingLoadTrendModel.getAllTrainingLoadTrends();
     res.json(trainingLoadTrends);
   } catch (error) {
     next(error);
   }
 });

// Get single training load trend (Admin only)
app.get('/api/admin/training-load-trends/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trainingLoadTrend = await TrainingLoadTrendModel.getTrainingLoadTrendById(parseInt(id));

    if (!trainingLoadTrend) {
      return res.status(404).json({ error: 'Training load trend not found' });
    }

    res.json(trainingLoadTrend);
  } catch (error) {
    next(error);
  }
});

// Create training load trend (Admin only)
app.post('/api/admin/training-load-trends', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trainingLoadTrendData = req.body;

    // Validate required fields
    if (!trainingLoadTrendData.athlete_id || !trainingLoadTrendData.week_start_date) {
      return res.status(400).json({
        error: 'Missing required fields: athlete_id, week_start_date'
      });
    }

    const result = await TrainingLoadTrendModel.createTrainingLoadTrend(trainingLoadTrendData);
    res.status(201).json({
      message: 'Training load trend created successfully',
      trainingLoadTrend: result
    });
  } catch (error) {
    next(error);
  }
});

// Update training load trend (Admin only)
app.put('/api/admin/training-load-trends/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trainingLoadTrendData = req.body;

    const success = await TrainingLoadTrendModel.updateTrainingLoadTrend(parseInt(id), trainingLoadTrendData);

    if (!success) {
      return res.status(404).json({ error: 'Training load trend not found' });
    }

    res.json({ message: 'Training load trend updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete training load trend (Admin only)
app.delete('/api/admin/training-load-trends/:id', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await TrainingLoadTrendModel.deleteTrainingLoadTrend(parseInt(id));

    if (!success) {
      return res.status(404).json({ error: 'Training load trend not found' });
    }

    res.json({ message: 'Training load trend deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Add a simple test endpoint to verify CORS is working
app.get('/api/test-cors', (req: Request, res: Response) => {
  console.log(`[TEST] CORS test endpoint called from origin: ${req.headers.origin}`);
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    server: 'running'
  });
});

// Add a health check endpoint
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    status: 'debugging',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    server_file: 'src/api/server.ts (TypeScript Express)',
    cors_origins: [
      'https://app.samhealth.co.za',
      'https://samapigene.azurewebsites.net',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ],
    request_origin: req.headers.origin,
    server_running: true,
    jwt_secret_loaded: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET?.length || 0,
    database_config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      user: process.env.DB_USER ? 'configured' : 'missing'
    }
  });
});

export default app;

// Execution guard for CommonJS
if (require.main === module) {
  // Start server with error handling
  const server = app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`CORS Origins: https://app.samhealth.co.za, https://samapigene.azurewebsites.net`);
  });

  // Handle server startup errors
  server.on('error', (error: any) => {
    console.error('Server failed to start:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else if (error.code === 'EACCES') {
      console.error(`Permission denied to bind to port ${PORT}`);
    }
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
      process.exit(1);
    });
  });
}