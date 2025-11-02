import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { createClientInviteAction } from '@/app/_actions/create-client-invite';
import { removeClientAction } from '@/app/_actions/remove-client';
import { HomeFooter } from '@/components/home/home-footer';
import { HomeHeader } from '@/components/home/home-header';
import { RemoveClientButton } from '@/components/clients/remove-client-button';
import { InviteClientForm } from '@/components/invite-client-form';
import { listTrainerClients } from '@/lib/profiles';

import homeStyles from '../page.module.css';
import styles from './page.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default async function ClientsPage() {
  const session = await auth();
  const user = session?.user ?? null;

  if (!user || user.role !== 'trainer') {
    redirect('/');
  }

  const clients = await listTrainerClients(user.id);
  const currentYear = new Date().getFullYear();
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/clients', label: 'Clients', isCurrent: true },
  ] as const;

  return (
    <div className={homeStyles.page}>
      <HomeHeader user={user} isAuthenticated isTrainer navItems={navItems} />

      <main className={homeStyles.main}>
        <div className={homeStyles.container}>
          <div className={styles.content}>
            <header className={styles.header}>
              <div>
                <h1>Clients</h1>
                <p className={styles.description}>
                  Manage your active clients and track pending invites from one place.
                </p>
              </div>
            </header>

            <section className={styles.invitePanel}>
              <div>
                <h2>Invite a new client</h2>
                <p>Send an email invite so clients can sign in and stay aligned on training.</p>
              </div>
              <InviteClientForm action={createClientInviteAction} />
            </section>

            <section className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Client roster</h2>
              </div>
              {clients.length === 0 ? (
                <p className={styles.emptyMessage}>
                  No clients yet. Send your first invite to get started.
                </p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Client</th>
                        <th scope="col">Email</th>
                        <th scope="col">Status</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Address</th>
                        <th scope="col">Invited</th>
                        <th scope="col">Accepted</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => {
                        const invitedLabel = dateFormatter.format(client.invitedAt);
                        const acceptedLabel = client.acceptedAt
                          ? dateFormatter.format(client.acceptedAt)
                          : '—';

                        return (
                          <tr key={client.id}>
                            <td data-label="Client">
                              <span className={styles.clientName}>{client.name ?? '—'}</span>
                            </td>
                            <td data-label="Email">
                              <span className={styles.clientEmail}>{client.email}</span>
                            </td>
                            <td data-label="Status">
                              <span
                                className={`${homeStyles.inviteStatus} ${
                                  client.status === 'active'
                                    ? homeStyles.inviteStatusAccepted
                                    : homeStyles.inviteStatusPending
                                }`}
                              >
                                {client.status === 'active' ? 'Active' : 'Pending invite'}
                              </span>
                            </td>
                            <td data-label="Phone" className={styles.phoneCell}>
                              {client.phone ?? '—'}
                            </td>
                            <td data-label="Address" className={styles.addressCell}>
                              {client.address ?? '—'}
                            </td>
                            <td data-label="Invited">{invitedLabel}</td>
                            <td data-label="Accepted">{acceptedLabel}</td>
                            <td data-label="Actions" className={styles.actionCell}>
                              <form action={removeClientAction} className={styles.actionForm}>
                                <input type="hidden" name="clientId" value={client.id} />
                                <RemoveClientButton className={styles.removeButton} />
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <HomeFooter currentYear={currentYear} />
    </div>
  );
}
