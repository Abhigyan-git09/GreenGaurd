import dotenv from 'dotenv';
dotenv.config();

const isProd = (process.env.NODE_ENV || 'development') === 'production';
const jwtSecret = process.env.JWT_SECRET || 'fallback_dev_secret_change_me';

if (!process.env.JWT_SECRET && isProd) {
  console.error('[CONFIG] FATAL: JWT_SECRET is not set in production. Refusing to start with default secret.');
  process.exit(1);
} else if (!process.env.JWT_SECRET) {
  console.warn('[CONFIG] WARNING: JWT_SECRET is using the development fallback. Set a strong secret before deploying.');
}

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  databaseUrl: process.env.DATABASE_URL || '',

  // Returns true when a real PostgreSQL connection string is provided
  get usePostgres() {
    return this.databaseUrl.startsWith('postgresql://') || this.databaseUrl.startsWith('postgres://');
  }
};

export default config;
