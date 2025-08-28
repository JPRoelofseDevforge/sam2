import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware - allow specific origin for production
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigin = 'https://app.samhealth.co.za';
  const origin = req.headers.origin;

  // Allow the specific origin or if no origin header (for same-origin requests)
  if (origin === allowedOrigin || !origin) {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Kuma-Revision');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
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

// Serve static files from the React app build directory
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/[a-zA-Z]:\//, '/'));
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Simple health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Minimal server is running successfully'
  });
});

// Simple CORS test endpoint
app.get('/api/test-cors', (req: Request, res: Response) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint for testing
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple mock authentication for testing
  if (username && password) {
    res.json({
      token: 'mock-jwt-token-for-testing',
      user: {
        user_id: 1,
        username: username,
        email: `${username}@test.com`,
        first_name: 'Test',
        last_name: 'User',
        role_name: 'TestUser',
        is_admin: false
      }
    });
  } else {
    res.status(400).json({ error: 'Username and password required' });
  }
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
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
};

app.use(errorHandler);

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Minimal API Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS: Allow all origins (*) for testing`);
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

export default app;