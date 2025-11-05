/**
 * Database connection setup
 */

import { Pool } from 'pg';
import { databaseConfig } from '../config/database';

let pool: Pool | null = null;

/**
 * Get database pool instance (singleton)
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(databaseConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
  }
  
  return pool;
}

/**
 * Close database connection
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
