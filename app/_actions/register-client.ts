'use server';

import { hash } from 'bcryptjs';

import { getInviteForToken } from '@/lib/profiles';
import { createClientAccount, getUserWithProfileByEmail } from '@/lib/users';

type RegistrationResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function registerClientAction(formData: FormData): Promise<RegistrationResult> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  if (!token) {
    return {
      success: false,
      error: 'Registration link is missing.',
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

  if (!phone || !address) {
    return {
      success: false,
      error: 'Phone number and address are required.',
    };
  }

  const invite = await getInviteForToken(token);

  if (!invite || invite.status !== 'pending') {
    return {
      success: false,
      error: 'This invite is no longer valid.',
    };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return {
      success: false,
      error: 'This invite has expired. Ask your trainer to send a new one.',
    };
  }

  const existingAccount = await getUserWithProfileByEmail(invite.clientEmail);
  if (existingAccount?.user.passwordHash) {
    return {
      success: false,
      error: 'An account already exists for this email.',
    };
  }

  const passwordHash = await hash(password, 12);

  try {
    await createClientAccount({
      email: invite.clientEmail,
      name: name || invite.clientName,
      passwordHash,
      trainerId: invite.trainerId,
      inviteId: invite.id,
      phone,
      address,
      existingUserId: existingAccount?.user.id ?? null,
    });
  } catch (error) {
    console.error('Failed to create client account', error);
    return {
      success: false,
      error: 'Unable to create the account. Please try again.',
    };
  }

  return { success: true };
}
