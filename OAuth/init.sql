-- PostgreSQL initialization script for OAuth example
-- This script runs when the PostgreSQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS oauth_example;

-- Connect to the database
\c oauth_example;

-- Enable UUID extension for secure user IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for storing OAuth user data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    username VARCHAR(255),
    avatar_url TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

-- Create sessions table for session storage (if not using Redis)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Create OAuth applications table (for future multi-tenant support)
CREATE TABLE IF NOT EXISTS oauth_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    redirect_uris TEXT[] NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_applications_updated_at BEFORE UPDATE ON oauth_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample OAuth application (for development)
INSERT INTO oauth_applications (name, client_id, client_secret_encrypted, redirect_uris, scopes)
VALUES (
    'Development OAuth App',
    'dev-client-id',
    'dev-client-secret-encrypted',
    ARRAY['http://localhost:3000/auth/google/callback', 'http://localhost:3000/auth/github/callback'],
    ARRAY['profile', 'email']
) ON CONFLICT (client_id) DO NOTHING;
