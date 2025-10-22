import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const msg = {
    to: email,
    from: process.env.SMTP_FROM!,
    subject: 'Reset Your Quanby Password',
    html: `<!-- Same HTML template as before -->`,
  };

  await sgMail.send(msg);
}