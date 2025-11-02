'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import { registerClientAction } from '@/app/_actions/register-client';

import styles from './register-form.module.css';

type RegisterFormProps = {
  token: string;
  clientEmail: string;
  clientName?: string | null;
  trainerName?: string | null;
};

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = {
  success: false,
  error: undefined,
};

export function RegisterForm({ token, clientEmail, clientName, trainerName }: RegisterFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(async (_, formData) => {
    const result = await registerClientAction(formData);
    if (!result?.success) {
      return {
        success: false,
        error: result?.error ?? 'Unable to complete registration. Please try again.',
      };
    }

    return {
      success: true,
    };
  }, initialState);

  useEffect(() => {
    if (state.success) {
      router.push('/login?registered=1');
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1>Join Lumi</h1>
        <p>
          {trainerName ?? 'Your trainer'} invited you to stay in sync on training progress. Finish setting up your
          account below.
        </p>
      </header>

      <form className={styles.form} action={formAction}>
        <input type="hidden" name="token" value={token} />

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" value={clientEmail} readOnly />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-name">Your name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              placeholder="Alex Johnson"
              defaultValue={clientName ?? ''}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-phone">Phone number</label>
            <input id="register-phone" name="phone" type="tel" placeholder="(555) 123-4567" required />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-address">Address</label>
            <textarea
              id="register-address"
              name="address"
              placeholder="123 Training Lane, Suite 200, Austin, TX"
              required
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="register-confirm">Confirm password</label>
            <input
              id="register-confirm"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <SubmitButton />
      </form>

      {state.error ? <p className={`${styles.message} ${styles.error}`}>{state.error}</p> : null}

      <p className={styles.footer}>Already set up? <a href="/login">Sign in here</a>.</p>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  );
}
