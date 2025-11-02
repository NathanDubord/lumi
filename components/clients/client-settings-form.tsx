'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import styles from '@/components/clients/client-onboarding-form.module.css';

type UpdateAction = (formData: FormData) => Promise<{ success: boolean; error?: string }>;

type ClientSettingsFormProps = {
  action: UpdateAction;
  initialName?: string | null;
  email: string;
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

export function ClientSettingsForm({ action, initialName, email, initialPhone, initialAddress }: ClientSettingsFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await action(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Unable to save your details. Please try again.',
      };
    }

    return {
      success: true,
    };
  }, initialState);

  return (
    <div className={styles.card}>
      <div className={styles.intro}>
        <h2>Your details</h2>
        <p>Update the information your trainer sees when they manage your plan.</p>
      </div>

      <form className={styles.form} action={formAction}>
        <div className={styles.fields}>
          <div className={styles.inputGroup}>
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" name="email" type="email" value={email} readOnly />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              name="name"
              type="text"
              placeholder="Your name"
              defaultValue={initialName ?? ''}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="settings-phone">Phone number</label>
            <input
              id="settings-phone"
              name="phone"
              type="tel"
              defaultValue={initialPhone ?? ''}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="settings-address">Address</label>
            <textarea
              id="settings-address"
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
        <p className={`${styles.message} ${styles.success}`}>Your details were updated.</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
