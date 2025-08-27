module.exports = {
  apps: [{
    name: 'sam-api',
    script: 'src/api/server.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 8080
    }
  }]
};