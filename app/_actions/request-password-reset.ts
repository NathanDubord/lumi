'use server';

import { getUserWithProfileByEmail } from '@/lib/users';
import { createPasswordResetTokenForUser } from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/email';

type RequestPasswordResetResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function requestPasswordResetAction(formData: FormData): Promise<RequestPasswordResetResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      error: 'Email is required.',
    };
  }

  const record = await getUserWithProfileByEmail(email);

  if (!record?.user?.id || !record.user.passwordHash) {
    // Avoid leaking which emails exist.
    return { success: true };
  }

  try {
    const resetToken = await createPasswordResetTokenForUser(record.user.id);
    await sendPasswordResetEmail({
      to: record.user.email,
      name: record.user.name,
      resetToken: resetToken.token,
      expiresAt: resetToken.expiresAt,
    });
  } catch (error) {
    console.error('Failed to send password reset email', error);
    return {
      success: false,
      error: 'Unable to send reset email right now. Try again soon.',
    };
  }

  return { success: true };
}
