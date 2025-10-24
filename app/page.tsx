import { auth } from '@/auth';
import { createClientInviteAction } from '@/app/_actions/create-client-invite';
import { SignInButton } from '@/components/sign-in-button';
import { SignOutButton } from '@/components/sign-out-button';
import { InviteClientForm } from '@/components/invite-client-form';
import { listClientInvites } from '@/lib/profiles';
import styles from './page.module.css';

export default async function Page() {
  const session = await auth();
  const currentYear = new Date().getFullYear();
  const user = session?.user;
  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const isTrainer = isAuthenticated && role !== 'client';
  const isClient = role === 'client';

  const invites = isTrainer && user?.id ? await listClientInvites(user.id) : [];

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={`${styles.container} ${styles.navInner}`}>
          <span className={styles.logo}>lumi</span>
          {isTrainer ? (
            <nav className={styles.navLinks} aria-label="Primary">
              <a href="#overview">Overview</a>
              <a href="#clients">Clients</a>
              <a href="#schedule">Schedule</a>
            </nav>
          ) : (
            <nav className={styles.navLinks} aria-label="Primary">
              <a href="#features">Features</a>
              <a href="#benefits">Benefits</a>
              <a href="#cta">Get started</a>
            </nav>
          )}
          <div className={styles.authControls}>
            {isTrainer && user ? (
              <>
                <span className={styles.userName}>
                  {user.name ?? user.email ?? 'Signed in'}
                </span>
                <SignOutButton className={styles.signOutButton} />
              </>
            ) : isClient && user ? (
              <>
                <span className={styles.userName}>
                  {user.name ?? user.email ?? 'Signed in'}
                </span>
                <SignOutButton className={styles.signOutButton} />
              </>
            ) : (
              <SignInButton className={styles.signInButton} />
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {isTrainer && user ? (
          <div className={`${styles.container} ${styles.dashboard}`}>
            <section id="overview" className={styles.dashboardHero}>
              <div>
                <h1>Welcome back{user.name ? `, ${user.name}` : ''}!</h1>
                <p>Here&apos;s a quick look at what&apos;s happening with your clients today.</p>
              </div>
              <div className={styles.dashboardActions}>
                <a href="#schedule" className={styles.primaryCta}>
                  Schedule session
                </a>
                <a href="#clients" className={styles.secondaryCta}>
                  Invite client
                </a>
              </div>
            </section>

            <section className={styles.metricGrid} aria-label="Key metrics">
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Sessions today</span>
                <strong className={styles.metricValue}>3</strong>
                <span className={styles.metricSubtext}>2 in person · 1 virtual</span>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Active dogs</span>
                <strong className={styles.metricValue}>18</strong>
                <span className={styles.metricSubtext}>4 new signups this week</span>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Outstanding invoices</span>
                <strong className={styles.metricValue}>$420</strong>
                <span className={styles.metricSubtext}>3 clients awaiting payment</span>
              </article>
            </section>

            <section id="schedule" className={styles.dashboardPanels}>
              <article className={styles.scheduleCard}>
                <h2>Today&apos;s schedule</h2>
                <ul className={styles.scheduleList}>
                  <li>
                    <div>
                      <strong>Max</strong>
                      <span>Obedience refresher</span>
                    </div>
                    <time dateTime="09:00">9:00 AM</time>
                  </li>
                  <li>
                    <div>
                      <strong>Luna</strong>
                      <span>Puppy socialization</span>
                    </div>
                    <time dateTime="11:30">11:30 AM</time>
                  </li>
                  <li>
                    <div>
                      <strong>Rex</strong>
                      <span>Agility training</span>
                    </div>
                    <time dateTime="15:00">3:00 PM</time>
                  </li>
                </ul>
              </article>

              <article id="clients" className={styles.clientsCard}>
                <h2>Client follow-ups</h2>
                <ul className={styles.clientsList}>
                  <li>
                    <div>
                      <strong>Olivia Hart</strong>
                      <span>Send progress recap for Luna</span>
                    </div>
                    <button type="button">Send update</button>
                  </li>
                  <li>
                    <div>
                      <strong>Jacob Rivera</strong>
                      <span>Confirm next session for Max</span>
                    </div>
                    <button type="button">Message</button>
                  </li>
                  <li>
                    <div>
                      <strong>Sophia Chen</strong>
                      <span>Invoice for agility program</span>
                    </div>
                    <button type="button">Review</button>
                  </li>
                </ul>
              </article>
            </section>

            <section className={styles.inviteSection}>
              <div className={styles.inviteHeader}>
                <div>
                  <h2>Invite a client</h2>
                  <p>Send an invite so clients can sign in with Google and track their plan.</p>
                </div>
              </div>
              <InviteClientForm action={createClientInviteAction} className={styles.inviteForm} />

              <div className={styles.inviteListWrapper}>
                <h3>Recent invites</h3>
                {invites.length === 0 ? (
                  <p className={styles.inviteEmpty}>No invites yet. Start by adding your first client.</p>
                ) : (
                  <ul className={styles.inviteList}>
                    {invites.map((invite) => (
                      <li key={invite.id}>
                        <div>
                          <strong>{invite.name ?? invite.email}</strong>
                          <span>{invite.email}</span>
                        </div>
                        <span
                          className={`${styles.inviteStatus} ${
                            invite.status === 'accepted' ? styles.inviteStatusAccepted : styles.inviteStatusPending
                          }`}
                        >
                          {invite.status === 'accepted' ? 'Accepted' : 'Pending'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        ) : isClient && user ? (
          <div className={`${styles.container} ${styles.clientDashboard}`}>
            <section className={styles.clientHero}>
              <div>
                <h1>Hi {user.name ?? 'there'}! 👋</h1>
                <p>Your trainer keeps this space updated so you can follow progress and next steps in one place.</p>
              </div>
            </section>

            <section className={styles.clientGrid}>
              <article className={styles.clientCard}>
                <h2>Next session</h2>
                <p className={styles.clientDate}>Monday, 3:00 PM</p>
                <p>Agility circuit with Rex. Bring treats and a long lead.</p>
                <button type="button" className={styles.secondaryCta}>
                  Confirm attendance
                </button>
              </article>

              <article className={styles.clientCard}>
                <h2>Training focus</h2>
                <ul className={styles.clientList}>
                  <li>
                    <strong>Impulse control</strong>
                    <span>Practice “leave it” during walks twice per day.</span>
                  </li>
                  <li>
                    <strong>Loose leash</strong>
                    <span>Repetition of structured heel for 10 minutes.</span>
                  </li>
                  <li>
                    <strong>Home update</strong>
                    <span>Share progress videos before Thursday.</span>
                  </li>
                </ul>
              </article>
            </section>

            <section className={styles.clientCardWide}>
              <h2>Recent notes</h2>
              <p>
                “Rex handled the agility sequence with much more confidence today—keep reinforcing the calm sit before
                each run. We’ll introduce weave poles next session.”
              </p>
              <button type="button" className={styles.primaryCta}>
                Message trainer
              </button>
            </section>
          </div>
        ) : (
          <div className={`${styles.container} ${styles.mainInner}`}>
            <section className={styles.hero}>
              <div className={styles.heroText}>
                <h1>Run your dog training business with confidence</h1>
                <p>
                  Lumi keeps your schedule organized, tracks every dog&apos;s progress, and
                  gives clients the updates they expect.
                </p>
                <div className={styles.heroActions}>
                  <a href="#cta" className={styles.primaryCta}>
                    Start free trial
                  </a>
                  <a href="#features" className={styles.secondaryCta}>
                    Explore features
                  </a>
                </div>
              </div>

              <div className={styles.heroCard} aria-labelledby="todays-sessions">
                <h2 id="todays-sessions">Today&apos;s sessions</h2>
                <ul>
                  <li>
                    <strong>Max</strong> · Obedience refresher at 9:00 AM
                  </li>
                  <li>
                    <strong>Luna</strong> · Puppy socialization at 11:30 AM
                  </li>
                  <li>
                    <strong>Rex</strong> · Agility training at 3:00 PM
                  </li>
                </ul>
              </div>
            </section>

            <section id="features" className={styles.features}>
              <h2>Why trainers choose Lumi</h2>
              <div className={styles.featureGrid}>
                <article>
                  <h3>Smart scheduling</h3>
                  <p>
                    Automated reminders keep every client prepared for their next session.
                  </p>
                </article>
                <article>
                  <h3>Progress tracking</h3>
                  <p>
                    Log milestones, share wins with pet parents, and adjust plans in seconds.
                  </p>
                </article>
                <article>
                  <h3>Integrated billing</h3>
                  <p>Send invoices, process payments, and stay ahead of renewals in one place.</p>
                </article>
              </div>
            </section>

            <section id="benefits" className={styles.benefits}>
              <h2>Focus on training, not paperwork</h2>
              <p>
                Lumi brings together the tools you need to grow your dog training practice—from
                session planning to client communication—so you can spend more time with the dogs
                that matter most.
              </p>
            </section>

            <section id="cta" className={styles.cta}>
              <h2>Build better habits for every dog</h2>
              <p>Join Lumi to deliver consistent training and delightful client experiences.</p>
              <a href="#" className={styles.primaryCta}>
                Get started
              </a>
            </section>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <p>© {currentYear} Lumi. Built for professional dog trainers.</p>
        </div>
      </footer>
    </div>
  );
}
