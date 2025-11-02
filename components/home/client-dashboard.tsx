import Link from 'next/link';

import { completeClientProfileAction } from '@/app/_actions/complete-client-profile';
import styles from '@/app/page.module.css';
import { ClientOnboardingForm } from '@/components/clients/client-onboarding-form';

type ClientDashboardProps = {
  user: {
    name?: string | null;
  } | null;
  trainer: {
    name?: string | null;
    email?: string | null;
  } | null;
  profile: {
    phone: string | null;
    address: string | null;
  } | null;
};

export function ClientDashboard({ user, trainer, profile }: ClientDashboardProps) {
  const displayName = user?.name ? `, ${user.name}` : '';
  const trainerLabel = trainer?.name ?? trainer?.email ?? 'your trainer';
  const needsContactInfo = !profile?.phone || !profile?.address;

  return (
    <div className={styles.container}>
      <section className={styles.dashboardHero}>
        <div>
          <h1>Hi{displayName}! 👋</h1>
          <p>
            You&apos;re working with <strong>{trainerLabel}</strong>. Your trainer will share updates here soon—hang
            tight while we finish the client portal.
          </p>
        </div>
      </section>

      <section className={styles.clientCard}>
        {needsContactInfo ? (
          <ClientOnboardingForm
            action={completeClientProfileAction}
            initialPhone={profile?.phone ?? ''}
            initialAddress={profile?.address ?? ''}
          />
        ) : (
          <div>
            <h2>Your contact details</h2>
            <p>Everything looks good. Update them anytime.</p>
            <dl>
              <div>
                <dt>Phone</dt>
                <dd>{profile?.phone}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd className={styles.clientAddress}>{profile?.address}</dd>
              </div>
            </dl>
            <Link href="/settings" className={`${styles.secondaryCta} ${styles.clientManageLink}`}>
              Manage details
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
