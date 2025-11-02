import { SignInButton } from '@/components/sign-in-button';
import { SignOutButton } from '@/components/sign-out-button';
import styles from '@/app/page.module.css';

type AppUser = {
  name?: string | null;
  email?: string | null;
} | null;

type NavItem = {
  href: string;
  label: string;
  isCurrent?: boolean;
};

type HomeHeaderProps = {
  user: AppUser;
  isAuthenticated: boolean;
  isTrainer: boolean;
  navItems?: readonly NavItem[];
};

export function HomeHeader({ user, isAuthenticated, isTrainer, navItems }: HomeHeaderProps) {
  const displayName = user?.name ?? user?.email ?? 'Signed in';
  const trainerNavItems = isTrainer ? navItems?.filter(Boolean) ?? [] : [];

  return (
    <header className={styles.nav}>
      <div className={`${styles.container} ${styles.navInner}`}>
        <span className={styles.logo}>lumi</span>
        {trainerNavItems.length > 0 ? (
          <nav className={styles.navLinks} aria-label="Primary">
            {trainerNavItems.map((item) => (
              <a
                key={`${item.href}-${item.label}`}
                href={item.href}
                aria-current={item.isCurrent ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className={styles.authControls}>
          {isAuthenticated ? (
            <>
              <span className={styles.userName}>{displayName}</span>
              <SignOutButton className={styles.signOutButton} />
            </>
          ) : (
            <SignInButton className={styles.signInButton} />
          )}
        </div>
      </div>
    </header>
  );
}
