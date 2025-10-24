'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { createClientInvite } from '@/lib/profiles';

export async function createClientInviteAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'trainer') {
    throw new Error('Unauthorized');
  }

  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  if (!email) {
    return {
      success: false as const,
      error: 'Client email is required.',
    };
  }

  const result = await createClientInvite(session.user.id, email, name);

  if (result.success) {
    revalidatePath('/');
  }

  return result;
}
