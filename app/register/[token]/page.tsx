import Link from 'next/link';

import { RegisterForm } from '@/components/auth/register-form';
import { getInviteForToken } from '@/lib/profiles';
import { getUserWithProfileByEmail } from '@/lib/users';

import styles from './page.module.css';

type RegisterPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { token } = await params;
  const invite = await getInviteForToken(token);

  if (!invite) {
    return (
      <div className={styles.page}>
        <div className={styles.messageCard}>
          <h1>Invalid invite link</h1>
          <p>This link doesn&apos;t match any Lumi invites. Check with your trainer and try again.</p>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  if (invite.status !== 'pending') {
    return (
      <div className={styles.page}>
        <div className={styles.messageCard}>
          <h1>Invite already used</h1>
          <p>This invite link has already been used. Try signing in with your email and password.</p>
          <Link href="/login">Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return (
      <div className={styles.page}>
        <div className={styles.messageCard}>
          <h1>Invite expired</h1>
          <p>This invite expired. Ask your trainer to send a new one.</p>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  const existingAccount = await getUserWithProfileByEmail(invite.clientEmail);
  if (existingAccount?.user.passwordHash) {
    return (
      <div className={styles.page}>
        <div className={styles.messageCard}>
          <h1>Account already exists</h1>
          <p>We found an account for this email. Try signing in or requesting a password reset.</p>
          <Link href="/login">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <RegisterForm
        token={token}
        clientEmail={invite.clientEmail}
        clientName={invite.clientName}
        trainerName={invite.trainerName}
      />
    </div>
  );
}
