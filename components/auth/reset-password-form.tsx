'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import styles from './login-form.module.css';
import { resetPasswordAction } from '@/app/_actions/reset-password';

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = {
  success: false,
  error: undefined,
};

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await resetPasswordAction(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Unable to reset password. Please try again.',
      };
    }

    return {
      success: true,
    };
  }, initialState);

  useEffect(() => {
    if (state.success) {
      router.push('/login?reset=1');
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1>Choose a new password</h1>
        <p>Enter and confirm a new password to finish resetting your account.</p>
      </header>

      <form className={styles.form} action={formAction}>
        <input type="hidden" name="token" value={token} />

        <div className={styles.field}>
          <label htmlFor="reset-password">Password</label>
          <input id="reset-password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>

        <div className={styles.field}>
          <label htmlFor="reset-confirm">Confirm password</label>
          <input id="reset-confirm" name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" />
        </div>

        <button type="submit" className={styles.submit}>
          Save new password
        </button>
      </form>

      {state.error ? <p className={`${styles.message} ${styles.error}`}>{state.error}</p> : null}
    </div>
  );
}
