import Link from 'next/link';

import pageStyles from '../../login/page.module.css';
import cardStyles from '@/components/auth/login-form.module.css';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { getPasswordResetToken } from '@/lib/password-reset';

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  const tokenRecord = await getPasswordResetToken(token);

  if (!tokenRecord) {
    return (
      <div className={pageStyles.page}>
        <div className={cardStyles.card}>
          <header className={cardStyles.header}>
            <h1>Invalid link</h1>
            <p>This reset link is not valid. Request a new one below.</p>
          </header>
          <Link href="/forgot-password" className={cardStyles.submit}>
            Request reset link
          </Link>
        </div>
      </div>
    );
  }

  if (tokenRecord.usedAt) {
    return (
      <div className={pageStyles.page}>
        <div className={cardStyles.card}>
          <header className={cardStyles.header}>
            <h1>Link already used</h1>
            <p>This link has already been used. Request a new one to reset your password.</p>
          </header>
          <Link href="/forgot-password" className={cardStyles.submit}>
            Request reset link
          </Link>
        </div>
      </div>
    );
  }

  if (tokenRecord.expiresAt < new Date()) {
    return (
      <div className={pageStyles.page}>
        <div className={cardStyles.card}>
          <header className={cardStyles.header}>
            <h1>Link expired</h1>
            <p>This reset link has expired. Request a new one to continue.</p>
          </header>
          <Link href="/forgot-password" className={cardStyles.submit}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <ResetPasswordForm token={tokenRecord.token} />
    </div>
  );
}
