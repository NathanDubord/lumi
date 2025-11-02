import type { PoolClient } from '@neondatabase/serverless';

import { getPool } from './db';
import type { UserProfile, UserRole } from './profiles';

export type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string | null;
  createdAt: Date;
};

export type UserWithProfile = {
  user: UserRecord;
  profile: UserProfile | null;
};

export async function getUserWithProfileByEmail(email: string): Promise<UserWithProfile | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string | null;
    email: string;
    password_hash: string | null;
    created_at: Date;
    profile_role: UserRole | null;
    profile_invited_by: string | null;
    profile_created_at: Date | null;
    profile_phone: string | null;
    profile_address: string | null;
  }>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.password_hash,
       u.created_at,
       up.role AS profile_role,
       up.invited_by AS profile_invited_by,
       up.created_at AS profile_created_at,
       up.phone AS profile_phone,
       up.address AS profile_address
     FROM users u
     LEFT JOIN user_profiles up ON up."userId" = u.id
     WHERE lower(u.email) = lower($1)
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    },
    profile: row.profile_role
      ? {
          userId: row.id,
          role: row.profile_role,
          invitedBy: row.profile_invited_by,
          createdAt: row.profile_created_at ?? row.created_at,
          phone: row.profile_phone,
          address: row.profile_address,
        }
      : null,
  };
}

export async function getUserWithProfileById(userId: string): Promise<UserWithProfile | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string | null;
    email: string;
    password_hash: string | null;
    created_at: Date;
    profile_role: UserRole | null;
    profile_invited_by: string | null;
    profile_created_at: Date | null;
    profile_phone: string | null;
    profile_address: string | null;
  }>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.password_hash,
       u.created_at,
       up.role AS profile_role,
       up.invited_by AS profile_invited_by,
       up.created_at AS profile_created_at,
       up.phone AS profile_phone,
       up.address AS profile_address
     FROM users u
     LEFT JOIN user_profiles up ON up."userId" = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    },
    profile: row.profile_role
      ? {
          userId: row.id,
          role: row.profile_role,
          invitedBy: row.profile_invited_by,
          createdAt: row.profile_created_at ?? row.created_at,
          phone: row.profile_phone,
          address: row.profile_address,
        }
      : null,
  };
}

type ClientAccountParams = {
  email: string;
  name: string | null;
  passwordHash: string;
  trainerId: string;
  inviteId: string;
  phone: string;
  address: string;
  existingUserId?: string | null;
};

export async function createClientAccount(params: ClientAccountParams): Promise<UserWithProfile> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await upsertUser(
      client,
      params.email,
      params.name,
      params.passwordHash,
      params.existingUserId ?? null,
    );
    await upsertClientProfile(client, user.id, params.trainerId, params.phone, params.address);
    await client.query(
      `UPDATE client_invites
         SET status = 'accepted',
             accepted_at = NOW(),
             user_id = $1
       WHERE id = $2`,
      [user.id, params.inviteId],
    );

    await client.query('COMMIT');

    return {
      user,
      profile: {
        userId: user.id,
        role: 'client',
        invitedBy: params.trainerId,
        createdAt: user.createdAt,
        phone: params.phone,
        address: params.address,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function upsertUser(
  client: PoolClient,
  email: string,
  name: string | null,
  passwordHash: string,
  existingUserId: string | null,
) {
  if (existingUserId) {
    const result = await client.query<{
      id: string;
      name: string | null;
      email: string;
      password_hash: string | null;
      created_at: Date;
    }>(
      `UPDATE users
         SET name = COALESCE($2, name),
             password_hash = $3
       WHERE id = $1
       RETURNING id, name, email, password_hash, created_at`,
      [existingUserId, name, passwordHash],
    );

    if (result.rowCount === 0) {
      throw new Error('Unable to update existing user record.');
    }

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      passwordHash: result.rows[0].password_hash,
      createdAt: result.rows[0].created_at,
    };
  }

  const inserted = await client.query<{
    id: string;
    name: string | null;
    email: string;
    password_hash: string | null;
    created_at: Date;
  }>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, password_hash, created_at`,
    [email, name, passwordHash],
  );

  return {
    id: inserted.rows[0].id,
    name: inserted.rows[0].name,
    email: inserted.rows[0].email,
    passwordHash: inserted.rows[0].password_hash,
    createdAt: inserted.rows[0].created_at,
  };
}

async function upsertClientProfile(
  client: PoolClient,
  userId: string,
  trainerId: string,
  phone: string,
  address: string,
) {
  await client.query(
    `INSERT INTO user_profiles ("userId", role, invited_by, phone, address)
     VALUES ($1, 'client', $2, $3, $4)
     ON CONFLICT ("userId") DO UPDATE SET
       role = 'client',
       invited_by = EXCLUDED.invited_by,
       phone = EXCLUDED.phone,
       address = EXCLUDED.address`,
    [userId, trainerId, phone, address],
  );
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
}
