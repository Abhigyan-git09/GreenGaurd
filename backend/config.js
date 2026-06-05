import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret_change_me',
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Returns true when a real PostgreSQL connection string is provided
  get usePostgres() {
    return this.databaseUrl.startsWith('postgresql://') || this.databaseUrl.startsWith('postgres://');
  }
};

export default config;
