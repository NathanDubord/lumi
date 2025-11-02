import { LoginForm } from '@/components/auth/login-form';

import styles from './page.module.css';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    registered?: string;
    reset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const successMessage = params.registered === '1'
    ? 'Account created! Sign in with your new password.'
    : params.reset === '1'
      ? 'Password updated! Sign in with your new password.'
      : null;
  return (
    <div className={styles.page}>
      <LoginForm initialError={params.error ?? null} successMessage={successMessage} />
    </div>
  );
}
