import Link from 'next/link';

import styles from './page.module.css';

type ErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

const errorCopy: Record<string, { title: string; message: string }> = {
  'no-account': {
    title: 'No account found',
    message:
      'This email address is not associated with a Lumi account. Please contact your trainer to request an invite.',
  },
  NO_ACCOUNT: {
    title: 'No account found',
    message:
      'This email address is not associated with a Lumi account. Please contact your trainer to request an invite.',
  },
  INVALID_CREDENTIALS: {
    title: 'Invalid credentials',
    message: 'The email or password you entered is incorrect. Please try again.',
  },
  CredentialsSignin: {
    title: 'Invalid credentials',
    message: 'The email or password you entered is incorrect. Please try again.',
  },
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const { reason } = params;
  const copy =
    (reason && errorCopy[reason]) ??
    errorCopy['no-account'] ?? {
      title: 'Unable to sign in',
      message: 'Something went wrong while signing you in. Please try again or contact support.',
    };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.message}>{copy.message}</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.button}>
            Back to Lumi
          </Link>
        </div>
      </div>
    </div>
  );
}
