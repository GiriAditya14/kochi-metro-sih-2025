# Environment Variables Guide

Complete list of environment variables required for Backend (Node.js) and AI Agent Service (Python).

## Backend Service (Node.js)

### Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# ============================================
# Server Configuration
# ============================================
NODE_ENV=development                    # Environment: development, production, test
PORT=3000                               # Server port (default: 3000)

# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/kmrl_db
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
# Example: postgresql://postgres:mypassword@localhost:5432/kmrl_db

# ============================================
# Groq LLM API Configuration
# ============================================
GROQ_API_KEY=your_groq_api_key_here
# Get your API key from: https://console.groq.com/

# ============================================
# Authentication & Security
# ============================================
JWT_SECRET=your_jwt_secret_key_here
# Generate a strong random secret for JWT token signing
# Example: openssl rand -base64 32

# ============================================
# CORS Configuration
# ============================================
CORS_ORIGIN=http://localhost:5173
# Frontend URL for CORS (adjust for your frontend port)
# Production: https://yourdomain.com

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info                          # Logging level: error, warn, info, debug

# ============================================
# Optional: Redis Configuration (for caching)
# ============================================
REDIS_URL=redis://localhost:6379        # Optional - for caching support
# Format: redis://[host]:[port]
# Leave empty or remove if not using Redis
```

### Backend Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `GROQ_API_KEY` | Yes | - | Groq API key for LLM |
| `JWT_SECRET` | Yes | - | Secret for JWT tokens |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | No | `info` | Logging level |
| `REDIS_URL` | No | - | Redis connection (optional) |

---

## AI Agent Service (Python)

### Required Environment Variables

Create a `.env` file in the `agents/` directory with the following variables:

```bash
# ============================================
# Groq LLM API Configuration
# ============================================
GROQ_API_KEY=your_groq_api_key_here
# Get your API key from: https://console.groq.com/
# Same key can be used as backend, or use different key

# ============================================
# Backend API Configuration
# ============================================
BACKEND_API_URL=http://localhost:3000
# URL of the Node.js backend service
# Production: https://api.yourdomain.com

# ============================================
# Agent Service Configuration
# ============================================
AGENT_SERVICE_PORT=8000                 # Port for agent service
AGENT_SERVICE_HOST=0.0.0.0              # Host to bind to (0.0.0.0 for all interfaces)

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info                          # Logging level: error, warn, info, debug

# ============================================
# Timeout Configuration
# ============================================
AGENT_TIMEOUT_SECONDS=60                # Timeout for normal agent execution (seconds)
EMERGENCY_TIMEOUT_SECONDS=300           # Timeout for emergency mode (5 minutes)

# ============================================
# Environment
# ============================================
NODE_ENV=development                    # Environment: development, production
```

### Agent Service Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | - | Groq API key for LLM |
| `BACKEND_API_URL` | No | `http://localhost:3000` | Backend API URL |
| `AGENT_SERVICE_PORT` | No | `8000` | Agent service port |
| `AGENT_SERVICE_HOST` | No | `0.0.0.0` | Host to bind to |
| `LOG_LEVEL` | No | `info` | Logging level |
| `AGENT_TIMEOUT_SECONDS` | No | `60` | Normal mode timeout |
| `EMERGENCY_TIMEOUT_SECONDS` | No | `300` | Emergency mode timeout |
| `NODE_ENV` | No | `development` | Environment mode |

---

## Quick Setup Guide

### 1. Backend Setup

```bash
cd backend

# Copy template
cp env.template .env

# Edit .env with your values
# - Set DATABASE_URL with your PostgreSQL credentials
# - Set GROQ_API_KEY from https://console.groq.com/
# - Generate JWT_SECRET: openssl rand -base64 32
# - Adjust PORT, CORS_ORIGIN, LOG_LEVEL as needed
```

### 2. Agent Service Setup

```bash
cd agents

# Create .env file
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
BACKEND_API_URL=http://localhost:3000
AGENT_SERVICE_PORT=8000
AGENT_SERVICE_HOST=0.0.0.0
LOG_LEVEL=info
AGENT_TIMEOUT_SECONDS=60
EMERGENCY_TIMEOUT_SECONDS=300
NODE_ENV=development
EOF

# Edit .env with your values
# - Set GROQ_API_KEY (can be same as backend)
# - Adjust BACKEND_API_URL if backend is on different host/port
```

---

## Production Configuration

### Backend Production Example

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db-host:5432/kmrl_db
GROQ_API_KEY=your_production_groq_key
JWT_SECRET=your_strong_production_secret
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
REDIS_URL=redis://redis-host:6379
```

### Agent Service Production Example

```bash
GROQ_API_KEY=your_production_groq_key
BACKEND_API_URL=https://api.yourdomain.com
AGENT_SERVICE_PORT=8000
AGENT_SERVICE_HOST=0.0.0.0
LOG_LEVEL=warn
AGENT_TIMEOUT_SECONDS=60
EMERGENCY_TIMEOUT_SECONDS=300
NODE_ENV=production
```

---

## Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use strong secrets** - Generate JWT_SECRET with: `openssl rand -base64 32`
3. **Rotate API keys** - Regularly rotate GROQ_API_KEY
4. **Use environment-specific values** - Different values for dev/staging/prod
5. **Restrict CORS_ORIGIN** - Only allow your frontend domain in production
6. **Use secure database credentials** - Strong passwords for PostgreSQL
7. **Enable SSL/TLS** - Use HTTPS in production

---

## Environment Variable Validation

### Backend Validation

The backend will fail to start if these are missing:
- `DATABASE_URL` - Required for database connection
- `GROQ_API_KEY` - Required for LLM functionality
- `JWT_SECRET` - Required for authentication

### Agent Service Validation

The agent service will fail to start if this is missing:
- `GROQ_API_KEY` - Required for LLM functionality

Other variables have defaults and will use those if not provided.

---

## Troubleshooting

### Backend Issues

**Database Connection Error:**
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Check database credentials

**LLM API Error:**
- Verify `GROQ_API_KEY` is correct
- Check API key is active at https://console.groq.com/
- Verify network connectivity

**CORS Errors:**
- Ensure `CORS_ORIGIN` matches your frontend URL
- Check for trailing slashes

### Agent Service Issues

**Backend Connection Error:**
- Verify `BACKEND_API_URL` is correct
- Ensure backend service is running
- Check network connectivity

**LLM API Error:**
- Verify `GROQ_API_KEY` is correct
- Check API key is active
- Verify network connectivity

**Port Already in Use:**
- Change `AGENT_SERVICE_PORT` to different port
- Check if another service is using port 8000

---

## Example .env Files

### Backend .env (Development)

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kmrl_db
GROQ_API_KEY=gsk_your_key_here
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
```

### Agents .env (Development)

```bash
GROQ_API_KEY=gsk_your_key_here
BACKEND_API_URL=http://localhost:3000
AGENT_SERVICE_PORT=8000
AGENT_SERVICE_HOST=0.0.0.0
LOG_LEVEL=info
AGENT_TIMEOUT_SECONDS=60
EMERGENCY_TIMEOUT_SECONDS=300
NODE_ENV=development
```

---

## Notes

- Both services can share the same `GROQ_API_KEY` or use different keys
- `BACKEND_API_URL` in agent service must point to the running backend
- Ports can be changed if there are conflicts
- All optional variables have sensible defaults
- Environment variables are case-insensitive in Python (Pydantic settings)
- Environment variables are case-sensitive in Node.js

