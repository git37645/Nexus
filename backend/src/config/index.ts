import dotenv from 'dotenv'

dotenv.config()

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  env: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',
  port: parseInt(optional('PORT', '4000'), 10),
  appUrl: process.env['BACKEND_URL'] ?? optional('APP_URL', 'http://localhost:4000'),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),

  db: {
    url: required('DATABASE_URL'),
  },

  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev_access_secret_change_in_production'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_in_production'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  email: {
    host: optional('SMTP_HOST', 'localhost'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('EMAIL_FROM', 'noreply@nexus.university'),
    fromName: optional('EMAIL_FROM_NAME', 'Nexus University Platform'),
  },

  storage: {
    path: optional('STORAGE_PATH', './storage'),
    maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '25'), 10),
  },

  security: {
    loginAttemptLimit: parseInt(optional('LOGIN_ATTEMPT_LIMIT', '5'), 10),
    loginLockoutMinutes: parseInt(optional('LOGIN_LOCKOUT_MINUTES', '15'), 10),
    rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMax: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  totp: {
    issuer: optional('TOTP_ISSUER', 'Nexus University'),
  },
}
