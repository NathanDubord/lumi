import type { Pool } from '@neondatabase/serverless';

let initPromise: Promise<void> | null = null;

export function ensureAuthTables(pool: Pool) {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            "emailVerified" TIMESTAMPTZ,
            image TEXT
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            provider TEXT NOT NULL,
            "providerAccountId" TEXT NOT NULL,
            refresh_token TEXT,
            access_token TEXT,
            expires_at BIGINT,
            token_type TEXT,
            scope TEXT,
            id_token TEXT,
            session_state TEXT,
            oauth_token_secret TEXT,
            oauth_token TEXT,
            UNIQUE (provider, "providerAccountId")
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "sessionToken" TEXT UNIQUE NOT NULL,
            "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires TIMESTAMPTZ NOT NULL
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS verification_token (
            identifier TEXT NOT NULL,
            token TEXT NOT NULL,
            expires TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (identifier, token)
          )
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts ("userId")`,
        );
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions ("userId")`,
        );
      } catch (error) {
        initPromise = null;
        throw error;
      }
    })();
  }

  return initPromise;
}
