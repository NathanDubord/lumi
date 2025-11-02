'use client';

import { useFormStatus } from 'react-dom';

type RemoveClientButtonProps = {
  className?: string;
};

export function RemoveClientButton({ className }: RemoveClientButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Removing…' : 'Remove'}
    </button>
  );
}
