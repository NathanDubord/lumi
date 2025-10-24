import { getPool } from './db';

export type UserRole = 'trainer' | 'client';

export type UserProfile = {
  userId: string;
  role: UserRole;
  invitedBy: string | null;
  createdAt: Date;
};

export type ClientInvite = {
  id: string;
  trainerId: string;
  email: string;
  name: string | null;
  status: 'pending' | 'accepted';
  token: string;
  createdAt: Date;
  acceptedAt: Date | null;
  userId: string | null;
};

const ROLE_TRAINER: UserRole = 'trainer';
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
  }>(`SELECT "userId", role, invited_by, created_at FROM user_profiles WHERE "userId" = $1`, [
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
  };
}

type MinimalUser = {
  id: string;
  email?: string | null;
};

export async function ensureProfileForUser(user: MinimalUser): Promise<UserProfile> {
  const existingProfile = await getProfileByUserId(user.id);
  if (existingProfile) {
    return existingProfile;
  }

  const pool = getPool();

  let role: UserRole = ROLE_TRAINER;
  let invitedBy: string | null = null;

  if (user.email) {
    const email = normaliseEmail(user.email);
    const pendingInvite = await pool.query<{
      trainer_id: string;
      id: string;
    }>(
      `SELECT trainer_id, id FROM client_invites 
         WHERE status = 'pending' AND lower(email) = $1
         ORDER BY created_at DESC
         LIMIT 1`,
      [email],
    );

    if ((pendingInvite?.rowCount ?? 0) > 0) {
      role = ROLE_CLIENT;
      invitedBy = pendingInvite.rows[0].trainer_id;

      await pool.query(
        `UPDATE client_invites
           SET status = 'accepted',
               accepted_at = NOW(),
               user_id = $1
         WHERE id = $2`,
        [user.id, pendingInvite.rows[0].id],
      );
    }
  }

  const created = await pool.query<{
    userId: string;
    role: UserRole;
    invited_by: string | null;
    created_at: Date;
  }>(
    `INSERT INTO user_profiles ("userId", role, invited_by)
     VALUES ($1, $2, $3)
     ON CONFLICT ("userId") DO UPDATE SET role = EXCLUDED.role
     RETURNING "userId", role, invited_by, created_at`,
    [user.id, role, invitedBy],
  );

  const profile = created.rows[0];

  return {
    userId: profile.userId,
    role: profile.role,
    invitedBy: profile.invited_by,
    createdAt: profile.created_at,
  };
}

export async function createClientInvite(
  trainerId: string,
  emailInput: string,
  nameInput: string,
) {
  const pool = getPool();
  const email = normaliseEmail(emailInput);
  const name = nameInput.trim() || null;

  const existingUser = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
    [email],
  );

  if ((existingUser?.rowCount ?? 0) > 0) {
    const profile = await getProfileByUserId(existingUser.rows[0].id);
    if (profile?.role === ROLE_CLIENT) {
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
  }>(
    `INSERT INTO client_invites (trainer_id, email, name)
     VALUES ($1, $2, $3)
     RETURNING id, trainer_id, email, name, status, token, created_at`,
    [trainerId, email, name],
  );

  return {
    success: true as const,
    invite: {
      id: invite.rows[0].id,
      trainerId: invite.rows[0].trainer_id,
      email: invite.rows[0].email,
      name: invite.rows[0].name,
      status: invite.rows[0].status,
      token: invite.rows[0].token,
      createdAt: invite.rows[0].created_at,
      acceptedAt: null,
      userId: null,
    } satisfies ClientInvite,
  };
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
  }>(
    `SELECT id, trainer_id, email, name, status, token, created_at, accepted_at, user_id
     FROM client_invites
     WHERE trainer_id = $1
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
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    userId: row.user_id,
  }));
}
