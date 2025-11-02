import { Resend } from 'resend';

type SendInviteParams = {
  to: string;
  trainerName?: string | null;
  inviteToken: string;
  clientName?: string | null;
  expiresAt?: Date | null;
};

type SendPasswordResetParams = {
  to: string;
  name?: string | null;
  resetToken: string;
  expiresAt: Date;
};

const resendApiKey = process.env.RESEND_API_KEY ?? null;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const resendFromAddress = process.env.RESEND_FROM ?? 'Resend Sandbox <onboarding@resend.dev>';
const resendSandboxRecipient = process.env.RESEND_SANDBOX_TO ?? null;

function resolveAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export async function sendClientInviteEmail(params: SendInviteParams) {
  const baseUrl = resolveAppBaseUrl();
  const registrationUrl = `${baseUrl}/register/${params.inviteToken}`;
  const trainerLabel = params.trainerName ?? 'your trainer';
  const expiresText = params.expiresAt ? `This link expires on ${params.expiresAt.toLocaleDateString()}.` : '';
  const recipient = resendSandboxRecipient ?? params.to;
  const sandboxNotice =
    resendSandboxRecipient && resendSandboxRecipient !== params.to
      ? `<p style="color:#64748b;font-size:0.9rem;">(Sent to sandbox inbox ${resendSandboxRecipient}. Original recipient: ${params.to})</p>`
      : '';

  const subject = `You're invited to Lumi by ${trainerLabel}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px;">
      <h1 style="font-size: 20px; color: #1f2937;">You're invited to Lumi</h1>
      <p>Hi ${params.clientName ?? 'there'},</p>
      <p>${trainerLabel} invited you to Lumi so you can keep track of training plans and updates.</p>
      <p>
        <a href="${registrationUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">
          Create your account
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${registrationUrl}">${registrationUrl}</a></p>
      <p>${expiresText}</p>
      ${sandboxNotice}
    </div>
  `;

  if (!resend) {
    console.info(
      `[email] RESEND_API_KEY not configured. Pretending to send invite email to ${params.to}: ${registrationUrl}`,
    );
    return;
  }

  await resend.emails.send({
    from: resendFromAddress,
    to: recipient,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(params: SendPasswordResetParams) {
  const baseUrl = resolveAppBaseUrl();
  const resetUrl = `${baseUrl}/reset-password/${params.resetToken}`;
  const recipient = resendSandboxRecipient ?? params.to;
  const sandboxNotice =
    resendSandboxRecipient && resendSandboxRecipient !== params.to
      ? `<p style="color:#64748b;font-size:0.9rem;">(Sent to sandbox inbox ${resendSandboxRecipient}. Original recipient: ${params.to})</p>`
      : '';

  const subject = 'Reset your Lumi password';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px;">
      <h1 style="font-size: 20px; color: #1f2937;">Reset your password</h1>
      <p>Hi ${params.name ?? 'there'},</p>
      <p>We received a request to reset your Lumi password. Click the button below to choose a new one.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">
          Reset password
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires on ${params.expiresAt.toLocaleString()}.</p>
      ${sandboxNotice}
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!resend) {
    console.info(
      `[email] RESEND_API_KEY not configured. Pretending to send password reset email to ${params.to}: ${resetUrl}`,
    );
    return;
  }

  await resend.emails.send({
    from: resendFromAddress,
    to: recipient,
    subject,
    html,
  });
}
