import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

import { ensureAuthTables } from './lib/ensure-auth-tables';
import { MissingInviteError, getProfileByUserId } from './lib/profiles';
import { getUserWithProfileByEmail } from './lib/users';

await ensureAuthTables();

export const authConfig: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString() ?? '';

        if (!email || !password) {
          throw new Error('Missing email or password.');
        }

        try {
          const record = await getUserWithProfileByEmail(email);

          if (!record?.user.passwordHash) {
            throw new Error('INVALID_CREDENTIALS');
          }

          const passwordMatches = await compare(password, record.user.passwordHash);
          if (!passwordMatches) {
            throw new Error('INVALID_CREDENTIALS');
          }

          if (!record.profile) {
            throw new MissingInviteError();
          }

          if (record.profile.role === 'client' && !record.profile.invitedBy) {
            throw new MissingInviteError();
          }

          return {
            id: record.user.id,
            name: record.user.name,
            email: record.user.email,
            role: record.profile.role,
          };
        } catch (error) {
          if (error instanceof MissingInviteError) {
            throw new Error('NO_ACCOUNT');
          }
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? token.role;
      } else if (token.sub && !token.role) {
        const profile = await getProfileByUserId(token.sub);
        if (profile) {
          token.role = profile.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.role) {
          session.user.role = token.role as 'trainer' | 'client';
        } else {
          const profile = await getProfileByUserId(token.sub);
          if (profile) {
            session.user.role = profile.role;
          }
        }
      }

      return session;
    },
  },
};
