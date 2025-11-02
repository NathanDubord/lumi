import styles from '@/app/page.module.css';

type HomeFooterProps = {
  currentYear: number;
};

export function HomeFooter({ currentYear }: HomeFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <p>© {currentYear} Lumi. Built for professional dog trainers.</p>
      </div>
    </footer>
  );
}
