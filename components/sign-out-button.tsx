'use client';

import { signOut } from 'next-auth/react';

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button type="button" className={className} onClick={() => signOut()}>
      Sign out
    </button>
  );
}
