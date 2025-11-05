import dotenv from 'dotenv';
import { DatabaseConfig } from '../types/common.types';

dotenv.config();

export const databaseConfig: DatabaseConfig = {
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'db',
  database: process.env.DATABASE_NAME || 'fortuna',
  password: process.env.DATABASE_PASSWORD || '',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
};
