import { auth } from '@/auth';
import { HomeFooter } from '@/components/home/home-footer';
import { HomeHeader } from '@/components/home/home-header';
import { TrainerDashboard } from '@/components/home/trainer-dashboard';
import { ClientDashboard } from '@/components/home/client-dashboard';
import { UnauthenticatedLanding } from '@/components/home/unauthenticated-landing';
import { getTrainerForClient, getProfileByUserId, listClientInvites } from '@/lib/profiles';
import styles from './page.module.css';

export default async function Page() {
  const session = await auth();
  const currentYear = new Date().getFullYear();
  const user = session?.user ?? null;
  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const isTrainer = isAuthenticated && role !== 'client';
  const isClient = role === 'client';

  const invites = isTrainer && user?.id ? await listClientInvites(user.id) : [];
  const trainerInfo = isClient && user?.id ? await getTrainerForClient(user.id) : null;
  const clientProfile = isClient && user?.id ? await getProfileByUserId(user.id) : null;
  const trainerNavItems = isTrainer
    ? ([
        { href: '/', label: 'Dashboard', isCurrent: true },
        { href: '/clients', label: 'Clients' },
      ] as const)
    : undefined;

  return (
    <div className={styles.page}>
      <HomeHeader
        user={user}
        isAuthenticated={isAuthenticated}
        isTrainer={isTrainer}
        navItems={trainerNavItems}
      />

      <main className={styles.main}>
        {isTrainer && user ? (
          <TrainerDashboard user={user} invites={invites} />
        ) : isClient && user ? (
          <ClientDashboard user={user} trainer={trainerInfo} profile={clientProfile} />
        ) : (
          <UnauthenticatedLanding />
        )}
      </main>

      <HomeFooter currentYear={currentYear} />
    </div>
  );
}
