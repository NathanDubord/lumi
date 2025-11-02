'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import styles from './invite-client-form.module.css';

type InviteAction = (formData: FormData) => Promise<{ success: boolean; error?: string }>;

type InviteClientFormProps = {
  action: InviteAction;
  className?: string;
};

type InviteFormState = {
  success: boolean;
  error?: string;
};

const initialState: InviteFormState = {
  success: false,
  error: undefined,
};

export function InviteClientForm({ action, className }: InviteClientFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState<InviteFormState, FormData>(async (_prev, formData) => {
    const result = await action(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Unable to send invite. Try again.',
      };
    }

    return {
      success: true,
    };
  }, initialState);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  const combinedClassName = className ? `${styles.form} ${className}` : styles.form;

  return (
    <form ref={formRef} action={formAction} className={combinedClassName}>
      <div className={styles.fields}>
        <div className={styles.inputGroup}>
          <label htmlFor="client-name">Client name</label>
          <input id="client-name" name="name" type="text" placeholder="Bella's owner" />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="client-email">Client email</label>
          <input
            id="client-email"
            name="email"
            type="email"
            placeholder="client@example.com"
            required
            autoComplete="email"
          />
        </div>

        <SubmitButton className={styles.submitButton} />
      </div>

      {state.error ? (
        <p className={`${styles.message} ${styles.error}`}>{state.error}</p>
      ) : state.success ? (
        <p className={`${styles.message} ${styles.success}`}>
          Invite sent! Your client will receive an email with their registration link.
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? 'Sending…' : 'Send invite'}
    </button>
  );
}
