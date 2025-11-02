'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { removeTrainerClient } from '@/lib/profiles';

export async function removeClientAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'trainer') {
    throw new Error('Unauthorized');
  }

  const clientId = String(formData.get('clientId') ?? '').trim();

  if (!clientId) {
    return {
      success: false as const,
      error: 'Client not found.',
    };
  }

  const result = await removeTrainerClient(session.user.id, clientId);

  if (!result.success) {
    return result;
  }

  revalidatePath('/');
  revalidatePath('/clients');

  return { success: true as const };
}
