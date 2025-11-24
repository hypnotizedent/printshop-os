/**
 * Database connection utilities for PostgreSQL
 */

import { Pool, QueryResult } from 'pg';

// Validate required environment variables
if (!process.env.DATABASE_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_PASSWORD environment variable is required in production');
}

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'printshop',
  user: process.env.DATABASE_USERNAME || 'strapi',
  password: process.env.DATABASE_PASSWORD || (process.env.NODE_ENV === 'test' ? 'test_password' : undefined),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = () => pool.connect();

export default pool;
