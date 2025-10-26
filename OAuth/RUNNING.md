# Running the OAuth 2.0 Example

## ✅ Server Status

The OAuth 2.0 server is currently **RUNNING** and accessible at:
- **URL**: http://localhost:3000
- **Status**: ✅ Active
- **Process ID**: 2620

## 🚀 Quick Start

The server is already running! You can:

1. **Visit the homepage**: http://localhost:3000
2. **Test OAuth flows**: Click the login buttons (requires OAuth credentials)
3. **Check API endpoints**: http://localhost:3000/api/user

## 📋 Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Homepage with login links |
| `/auth/google` | GET | Initiate Google OAuth |
| `/auth/github` | GET | Initiate GitHub OAuth |
| `/auth/google/callback` | GET | Google OAuth callback |
| `/auth/github/callback` | GET | GitHub OAuth callback |
| `/api/user` | GET | Get current user info (requires auth) |
| `/api/google/contacts` | GET | Access Google APIs (requires auth) |
| `/api/refresh-token` | POST | Refresh access tokens |
| `/logout` | GET | Logout current user |

## 🔧 Setup OAuth Credentials

To test the OAuth flows, you need to set up OAuth applications:

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Update `config.js` with your credentials

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Update `config.js` with your credentials

## 🛠️ Configuration

Edit `config.js` to set your OAuth credentials:

```javascript
oauth: {
  google: {
    clientId: 'your_google_client_id',
    clientSecret: 'your_google_client_secret',
    callbackUrl: 'http://localhost:3000/auth/google/callback',
    scopes: ['profile', 'email']
  },
  github: {
    clientId: 'your_github_client_id',
    clientSecret: 'your_github_client_secret',
    callbackUrl: 'http://localhost:3000/auth/github/callback',
    scopes: ['user:email', 'read:user']
  }
}
```

## 🔄 Restarting the Server

To restart the server:

```bash
# Stop current server (if needed)
pkill -f "node server.js"

# Start server again
cd /home/ivgo5040/INTERNSHIP_FALL_2025/OAuth
node server.js
```

## 🧪 Testing

### Manual Testing
1. Open http://localhost:3000 in your browser
2. Click "Login with Google" or "Login with GitHub"
3. Complete the OAuth flow
4. Verify user data appears on the homepage
5. Test API endpoints with authenticated requests

### API Testing
```bash
# Test homepage
curl http://localhost:3000

# Test API endpoint (should return error when not authenticated)
curl http://localhost:3000/api/user

# Test with authentication (after logging in via browser)
curl -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" http://localhost:3000/api/user
```

## 📊 Server Logs

Monitor server activity:
```bash
# View real-time logs
tail -f /dev/null  # Server logs appear in terminal where it's running

# Or check if server is still running
ps aux | grep "node server.js"
```

## 🚨 Troubleshooting

### Server Not Responding
```bash
# Check if server is running
ps aux | grep "node server.js"

# Check port 3000
netstat -tlnp | grep :3000

# Restart server
cd /home/ivgo5040/INTERNSHIP_FALL_2025/OAuth
node server.js
```

### OAuth Errors
- Verify OAuth credentials in `config.js`
- Check redirect URIs match exactly
- Ensure OAuth applications are published (if required)
- Check browser console for detailed error messages

### Port Already in Use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port in config.js
```

## 📚 Documentation

For detailed implementation details, see:
- `OAUTH_EXAMPLE.md` - Complete implementation guide
- `OAUTH_README.md` - Setup and deployment guide
- `config.example.js` - Configuration template

## 🎯 Next Steps

1. Set up your OAuth credentials in `config.js`
2. Test the authentication flows
3. Customize the implementation for your needs
4. Deploy to production using the Docker setup

The OAuth 2.0 server is ready for testing and development! 🚀



