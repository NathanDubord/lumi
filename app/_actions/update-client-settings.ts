'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { updateClientContactInfo } from '@/lib/profiles';

type UpdateSettingsResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function updateClientSettingsAction(formData: FormData): Promise<UpdateSettingsResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'client') {
    throw new Error('Unauthorized');
  }

  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  if (!phone || !address) {
    return {
      success: false,
      error: 'Phone number and address are required.',
    };
  }

  try {
    await updateClientContactInfo(session.user.id, phone, address, name || null);
  } catch (error) {
    console.error('Failed to update client settings', error);
    return {
      success: false,
      error: 'Unable to save your details. Please try again.',
    };
  }

  revalidatePath('/');
  revalidatePath('/settings');

  return { success: true };
}
