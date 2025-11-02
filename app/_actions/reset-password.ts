'use server';

import { hash } from 'bcryptjs';

import { getPasswordResetToken, markPasswordResetTokenUsed } from '@/lib/password-reset';
import { updateUserPassword } from '@/lib/users';

type ResetPasswordResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function resetPasswordAction(formData: FormData): Promise<ResetPasswordResult> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) {
    return {
      success: false,
      error: 'Reset link is missing.',
    };
  }

  if (!password || !confirmPassword) {
    return {
      success: false,
      error: 'Password is required.',
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match.',
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters.',
    };
  }

  const tokenRecord = await getPasswordResetToken(token);

  if (!tokenRecord || tokenRecord.usedAt) {
    return {
      success: false,
      error: 'This reset link is no longer valid.',
    };
  }

  if (tokenRecord.expiresAt < new Date()) {
    return {
      success: false,
      error: 'This reset link has expired. Request a new one.',
    };
  }

  const passwordHash = await hash(password, 12);

  try {
    await updateUserPassword(tokenRecord.userId, passwordHash);
    await markPasswordResetTokenUsed(tokenRecord.id);
  } catch (error) {
    console.error('Failed to reset password', error);
    return {
      success: false,
      error: 'Unable to reset password. Try again soon.',
    };
  }

  return { success: true };
}
