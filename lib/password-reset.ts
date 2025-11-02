import { getPool } from './db';

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
};

export async function createPasswordResetTokenForUser(userId: string): Promise<{
  id: string;
  token: string;
  expiresAt: Date;
}> {
  const pool = getPool();

  await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);

  const result = await pool.query<{
    id: string;
    token: string;
    expires_at: Date;
  }>(
    `INSERT INTO password_reset_tokens (user_id)
     VALUES ($1)
     RETURNING id, token, expires_at`,
    [userId],
  );

  return {
    id: result.rows[0].id,
    token: result.rows[0].token,
    expiresAt: result.rows[0].expires_at,
  };
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetTokenRecord | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    user_id: string;
    token: string;
    created_at: Date;
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT id, user_id, token, created_at, expires_at, used_at
     FROM password_reset_tokens
     WHERE token = $1
     LIMIT 1`,
    [token],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
  };
}

export async function markPasswordResetTokenUsed(id: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE password_reset_tokens
       SET used_at = NOW()
     WHERE id = $1`,
    [id],
  );
}
