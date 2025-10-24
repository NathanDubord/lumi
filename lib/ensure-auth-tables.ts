let initPromise: Promise<void> | null = null;

import { getPool } from './db';

async function createTableIfMissing(pool: ReturnType<typeof getPool>, tableName: string, sql: string) {
  const exists = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists`,
    [tableName],
  );

  if (!exists.rows[0]?.exists) {
    await pool.query(sql);
  }
}

export function ensureAuthTables() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const pool = getPool();

        await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        await createTableIfMissing(
          pool,
          'users',
          `CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            "emailVerified" TIMESTAMPTZ,
            image TEXT
          )`,
        );

        await createTableIfMissing(
          pool,
          'accounts',
          `CREATE TABLE accounts (
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
          )`,
        );

        await createTableIfMissing(
          pool,
          'sessions',
          `CREATE TABLE sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "sessionToken" TEXT UNIQUE NOT NULL,
            "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires TIMESTAMPTZ NOT NULL
          )`,
        );

        await createTableIfMissing(
          pool,
          'verification_token',
          `CREATE TABLE verification_token (
            identifier TEXT NOT NULL,
            token TEXT NOT NULL,
            expires TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (identifier, token)
          )`,
        );

        await createTableIfMissing(
          pool,
          'user_profiles',
          `CREATE TABLE user_profiles (
            "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('trainer', 'client')),
            invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`,
        );

        await createTableIfMissing(
          pool,
          'client_invites',
          `CREATE TABLE client_invites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            name TEXT,
            token UUID NOT NULL DEFAULT gen_random_uuid(),
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            accepted_at TIMESTAMPTZ,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL
          )`,
        );

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts ("userId")`,
        );
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions ("userId")`,
        );
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_client_invites_email ON client_invites ((lower(email)))`,
        );
        await pool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites (token)`,
        );
      } catch (error) {
        initPromise = null;
        throw error;
      }
    })();
  }

  return initPromise;
}
