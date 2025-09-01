# Sports Performance Monitoring System

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   DB_HOST=rxg.postgres.database.azure.com
   DB_PORT=5432
   DB_NAME=sports_performance_db
   DB_USER=rx
   DB_PASSWORD=qwe12345_

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # API Configuration for frontend
   VITE_API_URL=http://localhost:5288/api
   ```

### Running the Application

#### Development Mode
To run both the API server and frontend development server simultaneously:
```bash
npm run dev:all
```

This command starts:
- API server on port 3001
- Frontend development server on port 5173

#### Running Services Separately
To run only the API server:
```bash
npm run server:watch
```

To run only the frontend development server:
```bash
npm run dev
```

### Accessing the Application
Once both servers are running:
- Frontend: http://localhost:5173
- API: http://localhost:5288/api

### Admin Dashboard
To access the admin dashboard:
1. Log in with admin credentials
2. Navigate to the Admin Dashboard section
3. Click on any entity (Sports, Organizations, etc.) to manage data

### Troubleshooting
If you encounter the error "SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON":
1. Ensure the API server is running on port 5288
2. Check that the VITE_API_URL in your .env file is correctly set to http://localhost:5288/api
3. Verify that you can access http://localhost:5288/api/health in your browser