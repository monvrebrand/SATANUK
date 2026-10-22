const { Pool } = require('pg');
require('dotenv').config();

// Dedicated IPv4-compatible Supabase Connection Pooler
const DEFAULT_SUPABASE_POOLER = 'postgresql://postgres.nrjycqriyqhrfytnxxqt:8DV3A90w5Me9XOVA@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

let rawConnectionString = (process.env.DATABASE_URL || '').trim();
if (!rawConnectionString) {
  console.warn('[Database] DATABASE_URL not set in environment variables. Using Supabase Connection Pooler fallback.');
  rawConnectionString = DEFAULT_SUPABASE_POOLER;
}

// Automatically convert direct IPv6 Supabase hostnames (db.<ref>.supabase.co:5432)
// to IPv4-compatible connection poolers (aws-0-eu-west-1.pooler.supabase.com:5432).
// Vercel and AWS Lambda serverless functions operate in an IPv4 environment and cannot
// reach direct Supabase IPv6-only addresses.
let connectionString = rawConnectionString;
if (connectionString.includes('db.nrjycqriyqhrfytnxxqt.supabase.co')) {
  connectionString = connectionString.replace(
    'postgres:8DV3A90w5Me9XOVA@db.nrjycqriyqhrfytnxxqt.supabase.co:5432/postgres',
    'postgres.nrjycqriyqhrfytnxxqt:8DV3A90w5Me9XOVA@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
  );
  console.log('[Database] Converted direct IPv6 Supabase connection to IPv4 Connection Pooler for Vercel compatibility.');
}

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

// Global pool caching for serverless environments (prevents connection exhaustion on Vercel)
let pool;
if (!global._pgPool) {
  pool = new Pool({
    connectionString: connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client:', err.message);
  });

  global._pgPool = pool;
} else {
  pool = global._pgPool;
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};