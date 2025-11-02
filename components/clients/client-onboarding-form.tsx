'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './client-onboarding-form.module.css';

type CompleteProfileAction = (formData: FormData) => Promise<{ success: boolean; error?: string }>;

type ClientOnboardingFormProps = {
  action: CompleteProfileAction;
  initialPhone?: string | null;
  initialAddress?: string | null;
};

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = {
  success: false,
  error: undefined,
};

export function ClientOnboardingForm({ action, initialPhone, initialAddress }: ClientOnboardingFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await action(formData);
    if (!result.success) {
      return { success: false, error: result.error ?? 'Something went wrong. Please try again.' };
    }

    return { success: true };
  }, initialState);

  return (
    <div className={styles.card}>
      <div className={styles.intro}>
        <h2>Complete your details</h2>
        <p>We just need a phone number and address so your trainer can stay in touch.</p>
      </div>

      <form className={styles.form} action={formAction}>
        <div className={styles.fields}>
          <div className={styles.inputGroup}>
            <label htmlFor="client-phone">Phone number</label>
            <input
              id="client-phone"
              name="phone"
              type="tel"
              defaultValue={initialPhone ?? ''}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="client-address">Address</label>
            <textarea
              id="client-address"
              name="address"
              placeholder="123 Training Lane, Suite 200, Austin, TX"
              defaultValue={initialAddress ?? ''}
              required
            />
          </div>
        </div>

        <SubmitButton />
      </form>

      {state.error ? (
        <p className={`${styles.message} ${styles.error}`}>{state.error}</p>
      ) : state.success ? (
        <p className={`${styles.message} ${styles.success}`}>Thanks! Your details are saved.</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Saving…' : 'Save details'}
    </button>
  );
}
