// server.js - Complete OAuth 2.0 Express Server
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
require('dotenv').config();

const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(session({
  secret: config.server.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: config.server.environment === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    callbackURL: config.oauth.google.callbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Store tokens securely (in production, use encrypted database)
      const user = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        provider: 'google',
        accessToken,
        refreshToken,
        profile: profile._json
      };

      // Here you would typically save to database
      console.log('Google user authenticated:', user.email);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: config.oauth.github.clientId,
    clientSecret: config.oauth.github.clientSecret,
    callbackURL: config.oauth.github.callbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        id: profile.id,
        username: profile.username,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        name: profile.displayName,
        provider: 'github',
        accessToken,
        refreshToken,
        profile: profile._json
      };

      console.log('GitHub user authenticated:', user.username);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>OAuth 2.0 Example</h1>
    <p><a href="/auth/google">Login with Google</a></p>
    <p><a href="/auth/github">Login with GitHub</a></p>
    ${req.user ? `<p>Welcome ${req.user.name}! <a href="/logout">Logout</a></p>` : ''}
  `);
});

// Google Authentication Routes
app.get('/auth/google',
  passport.authenticate('google', {
    scope: config.oauth.google.scopes,
    prompt: 'select_account'
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

// GitHub Authentication Routes
app.get('/auth/github',
  passport.authenticate('github', {
    scope: config.oauth.github.scopes
  })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

// API Routes with OAuth
app.get('/api/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Example: Accessing Google APIs with stored token
app.get('/api/google/contacts', async (req, res) => {
  if (!req.user || req.user.provider !== 'google') {
    return res.status(401).json({ error: 'Google authentication required' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Google API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch Google data' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// Token refresh example
app.post('/api/refresh-token', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    let newToken;

    if (req.user.provider === 'google') {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        refresh_token: req.user.refreshToken,
        grant_type: 'refresh_token'
      });

      newToken = response.data.access_token;

      // Update stored token (in production, update database)
      req.user.accessToken = newToken;
    }

    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('Token refresh error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 OAuth 2.0 server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.server.environment}`);
  console.log('');
  console.log('📋 Required environment variables:');
  console.log(`   GOOGLE_CLIENT_ID: ${config.oauth.google.clientId !== 'your_google_client_id_here' ? '✅ Set' : '❌ Not set'}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${config.oauth.google.clientSecret !== 'your_google_client_secret_here' ? '✅ Set' : '❌ Not set'}`);
  console.log(`   GITHUB_CLIENT_ID: ${config.oauth.github.clientId !== 'your_github_client_id_here' ? '✅ Set' : '❌ Not set'}`);
  console.log(`   GITHUB_CLIENT_SECRET: ${config.oauth.github.clientSecret !== 'your_github_client_secret_here' ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SESSION_SECRET: ${config.server.sessionSecret !== 'your-secret-key-change-this-in-production' ? '✅ Set' : '❌ Not set'}`);
  console.log('');
  console.log('🌐 Open your browser to: http://localhost:' + PORT);
  console.log('📖 Check OAUTH_README.md for setup instructions');
});
