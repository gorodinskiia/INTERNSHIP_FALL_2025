# OAuth 2.0 Implementation Guide

This directory contains comprehensive OAuth 2.0 implementation examples demonstrating secure third-party authentication integration.

## Quick Start

### Prerequisites
- Node.js 16+ or Python 3.8+
- OAuth applications configured with Google and GitHub
- SSL certificates (for production)

### 1. Clone and Setup

```bash
# Navigate to example directory
cd RESEARCH

# For Node.js implementation
npm install

# For Python implementation
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your OAuth credentials
nano .env
```

### 3. Run the Application

```bash
# Node.js
npm start

# Python
python app.py
```

Visit `http://localhost:3000` to test the OAuth flows.

## OAuth Flow Diagrams

### Authorization Code Flow (Recommended)

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│         │    │             │    │             │    │         │
│  User   │───▶│   Your App  │───▶│  OAuth      │───▶│  User   │
│         │    │             │    │  Provider   │    │         │
└─────────┘    └─────────────┘    └─────────────┘    └─────────┘
     │                │                   │                │
     │ 1. Redirect to │                   │ 3. Redirect    │
     │    auth URL    │                   │    back with    │
     │                │                   │    code         │
     │                │ 2. Request        │                │
     │                │    authorization   │                │
     │                │                   │                │
     │                │ 4. Exchange       │                │
     │                │    code for        │                │
     │                │    tokens          │                │
     │                │                   │                │
     │                │ 5. Use tokens     │                │
     │                │    to access       │                │
     │                │    resources       │                │
```

## Security Features Implemented

### ✅ Secure Token Storage
- Encrypted token storage in database
- Automatic token expiration handling
- Secure refresh token management

### ✅ Rate Limiting
- Authentication attempt limits
- API endpoint protection
- DDoS prevention measures

### ✅ HTTPS Enforcement
- Production HTTPS redirects
- Secure cookie configuration
- HSTS headers

### ✅ Input Validation
- OAuth state parameter validation
- Token format verification
- Error message sanitization

## Provider-Specific Features

### Google OAuth
- **Scopes**: `profile`, `email`, `https://www.googleapis.com/auth/contacts`
- **Token Types**: Access tokens, refresh tokens
- **APIs**: Google People API, Gmail API, Drive API

### GitHub OAuth
- **Scopes**: `user:email`, `read:user`, `repo` (for private repos)
- **Token Types**: Personal access tokens, OAuth tokens
- **APIs**: GitHub API v3/v4, GitHub Apps API

## Testing Checklist

- [ ] Google OAuth login flow works
- [ ] GitHub OAuth login flow works
- [ ] Token refresh functionality works
- [ ] User profile API returns correct data
- [ ] Logout clears session properly
- [ ] Error handling displays appropriate messages
- [ ] Rate limiting prevents abuse
- [ ] HTTPS redirect works in production

## Troubleshooting

### Common Issues

**"Invalid client" error**
- Verify OAuth client ID and secret
- Check redirect URI matches exactly
- Ensure OAuth app is published (if required)

**"Access denied" error**
- Check OAuth scopes are authorized
- Verify user has permissions for requested resources
- Check token expiration

**Token refresh fails**
- Verify refresh token is stored securely
- Check token hasn't been revoked
- Confirm refresh token endpoint URL

## Production Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker build -t oauth-example .
docker run -p 3000:3000 --env-file .env oauth-example
```

### Environment Variables
```bash
NODE_ENV=production
SESSION_SECRET=your-256-bit-secret
ENCRYPTION_KEY=your-32-bit-encryption-key
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
```

## Monitoring

The implementation includes structured logging for:
- Authentication attempts
- Token refresh events
- API access patterns
- Security violations
- Performance metrics

## Further Reading

- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

## License

This OAuth implementation example is provided for educational purposes. Modify and use according to your project requirements.
