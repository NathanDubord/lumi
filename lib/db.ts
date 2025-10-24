import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL is not set');
    }
    pool = new Pool({
      connectionString,
    });
  }

  return pool;
}
