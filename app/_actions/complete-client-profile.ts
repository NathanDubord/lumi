'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { updateClientContactInfo } from '@/lib/profiles';

type ClientProfileResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function completeClientProfileAction(formData: FormData): Promise<ClientProfileResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'client') {
    throw new Error('Unauthorized');
  }

  const phone = String(formData.get('phone') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  if (!phone || !address) {
    return {
      success: false,
      error: 'Phone number and address are required.',
    };
  }

  await updateClientContactInfo(session.user.id, phone, address);

  revalidatePath('/');

  return { success: true };
}
