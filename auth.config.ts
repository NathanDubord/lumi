import type { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import NeonAdapter from '@auth/neon-adapter';
import { Pool } from '@neondatabase/serverless';
import { ensureAuthTables } from './lib/ensure-auth-tables';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

await ensureAuthTables(pool);

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
};
