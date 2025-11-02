'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import styles from './login-form.module.css';

type LoginFormProps = {
  initialError?: string | null;
  successMessage?: string | null;
};

function mapError(error?: string | null) {
  if (!error) {
    return null;
  }

  if (error === 'CredentialsSignin' || error === 'INVALID_CREDENTIALS') {
    return 'Invalid email or password, or this address has not been invited yet.';
  }

  if (error === 'NO_ACCOUNT' || error === 'MissingInvite') {
    return 'This email is not associated with a Lumi account.';
  }

  return 'Unable to sign in. Please try again.';
}

export function LoginForm({ initialError, successMessage }: LoginFormProps) {
  const [error, setError] = useState<string | null>(mapError(initialError));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(mapError(result.error));
      setIsSubmitting(false);
      return;
    }

    setError(null);
    router.push('/');
    router.refresh();
  }

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h1>Sign in</h1>
        <p>Access your Lumi dashboard.</p>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        onFocus={() => {
          if (error) {
            setError(null);
          }
        }}
      >
        <div className={styles.field}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
      {!error && successMessage ? <p className={`${styles.message} ${styles.success}`}>{successMessage}</p> : null}

      <p className={styles.footer}>
        <a href="/forgot-password">Forgot your password?</a>
      </p>
      <p className={styles.footer}>
        Need access? Ask your trainer to <strong>send you an invite email</strong>.
      </p>
    </div>
  );
}
