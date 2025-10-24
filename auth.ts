import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth';
import { authConfig } from './auth.config';

const handler = NextAuth(authConfig);

export const auth = () => getServerSession(authConfig);
export { handler as GET, handler as POST };
