// OAuth 2.0 Configuration Example
// Copy this file to config.js and fill in your actual values

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
  },

  // Database Configuration (Optional)
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/oauth_example'
  },

  // OAuth Provider Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scopes: (process.env.GOOGLE_SCOPES || 'profile email').split(' ')
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scopes: (process.env.GITHUB_SCOPES || 'user:email read:user').split(' ')
    },

    // Optional: Microsoft OAuth
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/auth/microsoft/callback',
      scopes: ['user.read', 'email']
    },

    // Optional: Facebook OAuth
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
      scopes: ['email', 'public_profile']
    }
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
    tokenExpiry: parseInt(process.env.TOKEN_EXPIRY) || 3600, // 1 hour
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 5 // requests per window
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },

  // CORS Configuration
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  }
};

// Setup Instructions for Each Provider
/*
  GOOGLE OAUTH SETUP:
  1. Go to https://console.cloud.google.com/
  2. Create a new project or select existing
  3. Enable Google+ API and Google OAuth2 API
  4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
  5. Set application type to "Web application"
  6. Add authorized redirect URIs (e.g., http://localhost:3000/auth/google/callback)

  GITHUB OAUTH SETUP:
  1. Go to https://github.com/settings/applications/new
  2. Fill in application details
  3. Set Authorization callback URL (e.g., http://localhost:3000/auth/github/callback)
  4. Copy Client ID and Client Secret

  MICROSOFT OAUTH SETUP:
  1. Go to https://portal.azure.com/
  2. Navigate to Azure Active Directory > App registrations
  3. Register new application
  4. Add redirect URI and copy credentials

  FACEBOOK OAUTH SETUP:
  1. Go to https://developers.facebook.com/
  2. Create new app or use existing
  3. Add Facebook Login product
  4. Configure OAuth redirect URIs
*/
