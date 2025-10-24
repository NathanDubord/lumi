'use client';

import { signIn } from 'next-auth/react';

type SignInButtonProps = {
  className?: string;
};

export function SignInButton({ className }: SignInButtonProps) {
  return (
    <button type="button" className={className} onClick={() => signIn('google')}>
      Sign in
    </button>
  );
}
