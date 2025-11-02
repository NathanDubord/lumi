'use client';

import { useActionState } from 'react';

import styles from './login-form.module.css';
import { requestPasswordResetAction } from '@/app/_actions/request-password-reset';

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = {
  success: false,
  error: undefined,
};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await requestPasswordResetAction(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Unable to send reset email. Please try again.',
      };
    }

    return {
      success: true,
    };
  }, initialState);

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1>Reset your password</h1>
        <p>Enter your email and we&apos;ll send a reset link if it matches an account.</p>
      </header>

      <form className={styles.form} action={formAction}>
        <div className={styles.field}>
          <label htmlFor="forgot-email">Email</label>
          <input id="forgot-email" name="email" type="email" autoComplete="email" required />
        </div>

        <button type="submit" className={styles.submit}>
          Send reset link
        </button>
      </form>

      {state.error ? <p className={`${styles.message} ${styles.error}`}>{state.error}</p> : null}
      {state.success ? (
        <p className={`${styles.message} ${styles.success}`}>
          If an account exists for that email, you&apos;ll receive reset instructions shortly.
        </p>
      ) : null}

      <p className={styles.footer}>
        Remembered it? <a href="/login">Back to sign in</a>.
      </p>
    </div>
  );
}
