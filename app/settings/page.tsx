import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { HomeFooter } from '@/components/home/home-footer';
import { HomeHeader } from '@/components/home/home-header';
import { ClientSettingsForm } from '@/components/clients/client-settings-form';
import { getUserWithProfileById } from '@/lib/users';
import { updateClientSettingsAction } from '@/app/_actions/update-client-settings';

import homeStyles from '../page.module.css';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'client') {
    redirect('/');
  }

  const userRecord = await getUserWithProfileById(session.user.id);

  if (!userRecord?.profile) {
    redirect('/');
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className={homeStyles.page}>
      <HomeHeader user={session.user} isAuthenticated isTrainer={false} />

      <main className={homeStyles.main}>
        <div className={homeStyles.container}>
          <div className={homeStyles.clientDashboard}>
            <section className={homeStyles.clientCard}>
              <ClientSettingsForm
                action={updateClientSettingsAction}
                email={userRecord.user.email}
                initialName={userRecord.user.name}
                initialPhone={userRecord.profile.phone}
                initialAddress={userRecord.profile.address}
              />
            </section>
          </div>
        </div>
      </main>

      <HomeFooter currentYear={currentYear} />
    </div>
  );
}
