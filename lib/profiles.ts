import { getPool } from './db';
import { sendClientInviteEmail } from './email';

export type UserRole = 'trainer' | 'client';

export type UserProfile = {
  userId: string;
  role: UserRole;
  invitedBy: string | null;
  createdAt: Date;
  phone: string | null;
  address: string | null;
};

export type ClientInviteStatus = 'pending' | 'accepted' | 'removed';

export type ClientInvite = {
  id: string;
  trainerId: string;
  email: string;
  name: string | null;
  status: ClientInviteStatus;
  token: string;
  createdAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  userId: string | null;
};

const ROLE_CLIENT: UserRole = 'client';

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query<{
    userId: string;
    role: UserRole;
    invited_by: string | null;
    created_at: Date;
    phone: string | null;
    address: string | null;
  }>(`SELECT "userId", role, invited_by, created_at, phone, address FROM user_profiles WHERE "userId" = $1`, [
    userId,
  ]);

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    userId: row.userId,
    role: row.role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    phone: row.phone,
    address: row.address,
  };
}

export class MissingInviteError extends Error {
  constructor(message = 'A trainer invite is required to access Lumi.') {
    super(message);
    this.name = 'MissingInviteError';
  }
}

export async function createClientInvite(
  trainerId: string,
  emailInput: string,
  nameInput: string,
) {
  const pool = getPool();
  const email = normaliseEmail(emailInput);
  const name = nameInput.trim() || null;

  const trainer = await pool.query<{ name: string | null; email: string | null }>(
    `SELECT name, email FROM users WHERE id = $1 LIMIT 1`,
    [trainerId],
  );

  if (trainer.rowCount === 0) {
    throw new Error('Trainer not found.');
  }

  const existingInvite = await pool.query<{ id: string }>(
    `SELECT id
     FROM client_invites
     WHERE trainer_id = $1
       AND lower(email) = $2
       AND status <> 'removed'
     LIMIT 1`,
    [trainerId, email],
  );

  if ((existingInvite?.rowCount ?? 0) > 0) {
    return {
      success: false as const,
      error: 'You already invited that client.',
    };
  }

  const existingUser = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
    [email],
  );

  if ((existingUser?.rowCount ?? 0) > 0) {
    const profile = await getProfileByUserId(existingUser.rows[0].id);
    if (profile?.role === ROLE_CLIENT && profile.invitedBy && profile.invitedBy !== trainerId) {
      return {
        success: false as const,
        error: 'That client already has access.',
      };
    }
  }

  const invite = await pool.query<{
    id: string;
    trainer_id: string;
    email: string;
    name: string | null;
    status: 'pending' | 'accepted';
    token: string;
    created_at: Date;
    expires_at: Date | null;
  }>(
    `INSERT INTO client_invites (trainer_id, email, name, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
     RETURNING id, trainer_id, email, name, status, token, created_at, expires_at`,
    [trainerId, email, name],
  );

  const inviteData = {
    success: true as const,
    invite: {
      id: invite.rows[0].id,
      trainerId: invite.rows[0].trainer_id,
      email: invite.rows[0].email,
      name: invite.rows[0].name,
      status: invite.rows[0].status,
      token: invite.rows[0].token,
      createdAt: new Date(invite.rows[0].created_at),
      expiresAt: invite.rows[0].expires_at ? new Date(invite.rows[0].expires_at) : null,
      acceptedAt: null,
      userId: null,
    } satisfies ClientInvite,
  };

  const trainerRow = trainer.rows[0] ?? { name: null, email: null };

  try {
    await sendClientInviteEmail({
      to: emailInput,
      trainerName: trainerRow.name ?? trainerRow.email,
      clientName: name,
      inviteToken: inviteData.invite.token,
      expiresAt: inviteData.invite.expiresAt ?? null,
    });
  } catch (error) {
    console.error('Failed to send invite email', error);
  }

  return inviteData;
}

export async function listClientInvites(trainerId: string): Promise<ClientInvite[]> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    trainer_id: string;
    email: string;
    name: string | null;
    status: 'pending' | 'accepted';
    token: string;
    created_at: Date;
    accepted_at: Date | null;
    user_id: string | null;
    expires_at: Date | null;
  }>(
    `SELECT id, trainer_id, email, name, status, token, created_at, accepted_at, user_id, expires_at
     FROM client_invites
     WHERE trainer_id = $1
       AND status <> 'removed'
     ORDER BY created_at DESC
     LIMIT 10`,
    [trainerId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    trainerId: row.trainer_id,
    email: row.email,
    name: row.name,
    status: row.status,
    token: row.token,
    createdAt: new Date(row.created_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    userId: row.user_id,
  }));
}

export type TrainerClient = {
  id: string;
  name: string | null;
  email: string;
  status: 'active' | 'pending';
  invitedAt: Date;
  acceptedAt: Date | null;
  phone: string | null;
  address: string | null;
};

export async function listTrainerClients(trainerId: string): Promise<TrainerClient[]> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string | null;
    email: string;
    status: 'pending' | 'accepted' | 'removed';
    created_at: string | Date;
    accepted_at: string | Date | null;
    phone: string | null;
    address: string | null;
  }>(
    `SELECT
       ci.id,
       COALESCE(u.name, ci.name) AS name,
       COALESCE(u.email, ci.email) AS email,
       ci.status,
       ci.created_at,
       ci.accepted_at,
       up.phone,
       up.address
     FROM client_invites ci
     LEFT JOIN users u ON u.id = ci.user_id
     LEFT JOIN user_profiles up ON up."userId" = ci.user_id
     WHERE ci.trainer_id = $1
       AND ci.status <> 'removed'
     ORDER BY ci.created_at DESC`,
    [trainerId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status === 'accepted' ? 'active' : 'pending',
    invitedAt: new Date(row.created_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    phone: row.phone ?? null,
    address: row.address ?? null,
  }));
}

export async function updateClientContactInfo(
  userId: string,
  phone: string | null,
  address: string | null,
  name?: string | null,
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (name !== undefined) {
      await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [name || null, userId]);
    }

    await client.query(
      `UPDATE user_profiles
         SET phone = $1,
             address = $2
       WHERE "userId" = $3
         AND role = 'client'`,
      [phone, address, userId],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeTrainerClient(
  trainerId: string,
  clientInviteId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const invite = await client.query<{
      user_id: string | null;
    }>(
      `SELECT user_id
         FROM client_invites
        WHERE id = $1
          AND trainer_id = $2
        LIMIT 1`,
      [clientInviteId, trainerId],
    );

    if ((invite?.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return {
        success: false as const,
        error: 'Client not found.',
      };
    }

    const userId = invite.rows[0].user_id;

    if (userId) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }

    await client.query(`DELETE FROM client_invites WHERE id = $1`, [clientInviteId]);

    await client.query('COMMIT');

    return { success: true as const };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to remove client', error);
    return {
      success: false as const,
      error: 'Unable to remove client. Please try again.',
    };
  } finally {
    client.release();
  }
}

export async function getTrainerForClient(clientUserId: string): Promise<{
  id: string;
  name: string | null;
  email: string | null;
} | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string | null;
    email: string | null;
  }>(
    `SELECT u.id, u.name, u.email
     FROM user_profiles up
     JOIN users u ON u.id = up.invited_by
     WHERE up."userId" = $1
       AND up.invited_by IS NOT NULL
     LIMIT 1`,
    [clientUserId],
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    email: result.rows[0].email,
  };
}

export type InviteForRegistration = {
  id: string;
  trainerId: string;
  trainerName: string | null;
  trainerEmail: string | null;
  clientEmail: string;
  clientName: string | null;
  status: ClientInviteStatus;
  expiresAt: Date | null;
  acceptedAt: Date | null;
};

export async function getInviteForToken(token: string): Promise<InviteForRegistration | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    trainer_id: string;
    trainer_name: string | null;
    trainer_email: string | null;
    email: string;
    name: string | null;
    status: ClientInviteStatus;
    expires_at: Date | null;
    accepted_at: Date | null;
  }>(
    `SELECT
       ci.id,
       ci.trainer_id,
       t.name AS trainer_name,
       t.email AS trainer_email,
       ci.email,
       ci.name,
       ci.status,
       ci.expires_at,
       ci.accepted_at
     FROM client_invites ci
     JOIN users t ON t.id = ci.trainer_id
     WHERE ci.token = $1`,
    [token],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    trainerId: row.trainer_id,
    trainerName: row.trainer_name,
    trainerEmail: row.trainer_email,
    clientEmail: row.email,
    clientName: row.name,
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
  };
}
