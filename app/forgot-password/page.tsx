import styles from '../login/page.module.css';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return (
    <div className={styles.page}>
      <ForgotPasswordForm />
    </div>
  );
}
