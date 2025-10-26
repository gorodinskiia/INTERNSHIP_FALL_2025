// OAuth 2.0 Configuration
// Copy this file to config.js and fill in your actual values

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
  },

  // OAuth Provider Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret_here',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      scopes: (process.env.GOOGLE_SCOPES || 'profile email').split(' ')
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'your_github_client_id_here',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret_here',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scopes: (process.env.GITHUB_SCOPES || 'user:email read:user').split(' ')
    }
  }
};
