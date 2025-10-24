import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string;
      role?: 'trainer' | 'client';
    };
  }

  interface User {
    role?: 'trainer' | 'client';
  }
}
