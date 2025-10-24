import type { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';

import { getPool } from './lib/db';
import { ensureAuthTables } from './lib/ensure-auth-tables';
import { ensureProfileForUser, getProfileByUserId } from './lib/profiles';

const pool = getPool();

await ensureAuthTables();

export const authConfig: NextAuthOptions = {
  adapter: NeonAdapter(pool),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: 'database',
  },
  secret: process.env.AUTH_SECRET,
  events: {
    async createUser({ user }) {
      await ensureProfileForUser(user);
    },
    async signIn({ user }) {
      await ensureProfileForUser(user);
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const profile = await getProfileByUserId(user.id);
        if (profile) {
          session.user.role = profile.role;
        }
      }
      return session;
    },
  },
};
