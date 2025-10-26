# OAuth 2.0 Implementation Examples

This document provides comprehensive OAuth 2.0 implementation examples demonstrating the concepts from the research documentation.

## Overview

OAuth 2.0 enables secure delegated access to resources without sharing credentials. The **Authorization Code Flow** is the most secure and commonly used OAuth flow for web applications.

## Node.js/Express Implementation

### Complete OAuth 2.0 Server Example

```javascript
// server.js - Complete OAuth 2.0 Express Server
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
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
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
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
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
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
    scope: ['profile', 'email'],
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
    scope: ['user:email', 'read:user']
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
    console.error('Google API Error:', error.response?.data || error.message);
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
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: req.user.refreshToken,
        grant_type: 'refresh_token'
      });

      newToken = response.data.access_token;

      // Update stored token (in production, update database)
      req.user.accessToken = newToken;
    }

    res.json({ accessToken: newToken });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.listen(PORT, () => {
  console.log(`OAuth 2.0 server running on port ${PORT}`);
  console.log('Environment variables needed:');
  console.log('- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.log('- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET');
  console.log('- SESSION_SECRET');
});
```

### Package Dependencies

```json
// package.json
{
  "name": "oauth-example",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-github2": "^0.1.12",
    "express-session": "^1.17.3",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

### Environment Configuration

```bash
# .env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

SESSION_SECRET=your_random_session_secret
NODE_ENV=development
PORT=3000
```

## Python/Flask Implementation

### OAuth 2.0 Flask Example

```python
# app.py - Flask OAuth 2.0 Implementation
from flask import Flask, redirect, url_for, session, request, jsonify
from flask_oauthlib.client import OAuth
import os
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# OAuth configuration
oauth = OAuth(app)

# Google OAuth
google = oauth.remote_app(
    'google',
    consumer_key=os.environ.get('GOOGLE_CLIENT_ID'),
    consumer_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    request_token_params={'scope': 'email profile'},
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

# GitHub OAuth
github = oauth.remote_app(
    'github',
    consumer_key=os.environ.get('GITHUB_CLIENT_ID'),
    consumer_secret=os.environ.get('GITHUB_CLIENT_SECRET'),
    request_token_params={'scope': 'user:email'},
    base_url='https://api.github.com/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
)

@app.route('/')
def index():
    if 'user' in session:
        user = session['user']
        return f'''
        <h1>Welcome {user['name']}!</h1>
        <p>Email: {user['email']}</p>
        <p>Provider: {user['provider']}</p>
        <a href="/logout">Logout</a>
        '''
    return '''
    <h1>OAuth 2.0 Flask Example</h1>
    <a href="/login/google">Login with Google</a><br>
    <a href="/login/github">Login with GitHub</a>
    '''

@app.route('/login/google')
def login_google():
    return google.authorize(callback=url_for('authorized_google', _external=True))

@app.route('/login/github')
def login_github():
    return github.authorize(callback=url_for('authorized_github', _external=True))

@app.route('/login/google/authorized')
def authorized_google():
    resp = google.authorized_response()
    if resp is None or resp.get('access_token') is None:
        return 'Access denied: error=%s' % request.args.get('error', 'unknown')

    session['google_token'] = (resp['access_token'], '')
    user_info = google.get('userinfo')

    session['user'] = {
        'id': user_info.data['id'],
        'name': user_info.data['name'],
        'email': user_info.data['email'],
        'provider': 'google'
    }

    return redirect(url_for('index'))

@app.route('/login/github/authorized')
def authorized_github():
    resp = github.authorized_response()
    if resp is None or resp.get('access_token') is None:
        return 'Access denied: error=%s' % request.args.get('error', 'unknown')

    session['github_token'] = (resp['access_token'], '')
    github_user = github.get('user')

    session['user'] = {
        'id': github_user.data['id'],
        'name': github_user.data['name'] or github_user.data['login'],
        'email': github_user.data.get('email'),
        'provider': 'github'
    }

    return redirect(url_for('index'))

@app.route('/api/user')
def api_user():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({'user': session['user']})

@app.route('/logout')
def logout():
    session.pop('user', None)
    session.pop('google_token', None)
    session.pop('github_token', None)
    return redirect(url_for('index'))

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

@github.tokengetter
def get_github_oauth_token():
    return session.get('github_token')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### Python Requirements

```txt
# requirements.txt
Flask==2.3.3
Flask-OAuthlib==0.9.6
requests==2.31.0
python-dotenv==1.0.0
```

## OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (Node.js)
   - `http://localhost:5000/login/google/authorized` (Python)

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Client Secret to your environment variables

## Security Best Practices

### 1. Token Storage
```javascript
// Secure token storage (Node.js)
const crypto = require('crypto');

// Encrypt tokens before storing in database
function encryptToken(token) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setIV(iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
}
```

### 2. Token Validation
```javascript
// Validate token format and expiration
function validateToken(token) {
  try {
    // Decode JWT without verification first
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return true;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return false;
  }
}
```

### 3. Rate Limiting
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/', authLimiter);
```

### 4. HTTPS Enforcement
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Error Handling Examples

### 1. OAuth Error Handling
```javascript
// Comprehensive OAuth error handling
app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('OAuth Error:', err);
      return res.status(500).json({
        error: 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Authentication denied',
        reason: info?.message || 'Unknown reason'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      res.redirect('/');
    });
  })(req, res, next);
});
```

### 2. API Error Handling
```javascript
// Centralized API error handler
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});
```

## Testing the Implementation

### 1. Manual Testing Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your OAuth credentials

# 3. Start the server
npm start

# 4. Test authentication flows:
# - Visit http://localhost:3000
# - Click "Login with Google" or "Login with GitHub"
# - Complete OAuth flow
# - Verify user data in /api/user
# - Test token refresh functionality
```

### 2. Automated Testing

```javascript
// test/oauth.test.js
const request = require('supertest');
const app = require('../server');

describe('OAuth Authentication', () => {
  test('should redirect to Google OAuth', async () => {
    const response = await request(app)
      .get('/auth/google')
      .expect(302);

    expect(response.headers.location).toMatch(/accounts\.google\.com/);
  });

  test('should handle authenticated user', async () => {
    // Mock authenticated session
    const agent = request.agent(app);

    // This would require mocking the OAuth callback
    // In real tests, you'd mock the passport authentication
  });
});
```

## Production Deployment Considerations

### 1. Environment Variables
```yaml
# docker-compose.yml
version: '3.8'
services:
  oauth-app:
    build: .
    environment:
      - NODE_ENV=production
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
```

### 2. Database Integration
```javascript
// Database user storage (PostgreSQL example)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function saveUser(userData) {
  const query = `
    INSERT INTO users (id, email, name, provider, access_token, refresh_token, profile_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      access_token = $5,
      refresh_token = $6,
      profile_data = $7,
      updated_at = NOW()
    RETURNING *`;

  const values = [
    userData.id,
    userData.email,
    userData.name,
    userData.provider,
    encryptToken(userData.accessToken),
    encryptToken(userData.refreshToken),
    JSON.stringify(userData.profile)
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}
```

## Monitoring and Logging

### 1. Structured Logging
```javascript
// Winston logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'oauth-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage in OAuth callbacks
passport.use(new GoogleStrategy({...}, (accessToken, refreshToken, profile, done) => {
  logger.info('Google OAuth successful', {
    userId: profile.id,
    email: profile.emails[0].value,
    provider: 'google'
  });

  // ... rest of implementation
}));
```

This comprehensive OAuth 2.0 implementation demonstrates:
- **Authorization Code Flow** with Google and GitHub
- **Secure token management** and refresh
- **Error handling** and security best practices
- **Production deployment** considerations
- **Testing strategies** and monitoring

The implementation follows OAuth 2.0 security best practices and includes comprehensive error handling for production use.
