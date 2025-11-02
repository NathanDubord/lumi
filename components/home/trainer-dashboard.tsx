import { createClientInviteAction } from '@/app/_actions/create-client-invite';
import styles from '@/app/page.module.css';
import { InviteClientForm } from '@/components/invite-client-form';
import type { ClientInvite } from '@/lib/profiles';

type TrainerDashboardProps = {
  user: {
    name?: string | null;
    email?: string | null;
  } | null;
  invites: ClientInvite[];
};

export function TrainerDashboard({ user, invites }: TrainerDashboardProps) {
  const displayName = user?.name ? `, ${user.name}` : '';

  return (
    <div className={`${styles.container} ${styles.dashboard}`}>
      <section className={styles.dashboardHero}>
        <div>
          <h1>Welcome back{displayName}!</h1>
        </div>
      </section>
    </div>
  );
}
