import styles from '@/app/page.module.css';

export function UnauthenticatedLanding() {
  return (
    <div className={styles.container}>
      <section className={styles.dashboardHero}>
        <div>
          <h1>Run your dog training business with Lumi</h1>
          <p>Sign in with Google to invite clients and keep every training plan in sync.</p>
        </div>
      </section>
    </div>
  );
}
