import pg from 'pg';
import { config } from './config.js';

// Local databases do not use SSL. Supabase does.
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 3, // serverless functions should hold few connections
  idleTimeoutMillis: 10_000,
});

pool.on('error', (err) => console.error('Database pool error:', err.message));

// Always pass user input in `params` ($1, $2, ...). Never paste it into the SQL text.
export function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}
