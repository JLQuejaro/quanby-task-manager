import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      color: #333; 
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4169E1 0%, #3558CC 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo-text {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin: 0;
      line-height: 1.2;
    }
    .content { padding: 40px 32px; }
    .greeting { 
      font-size: 18px; 
      font-weight: 600; 
      color: #111827; 
      margin-bottom: 16px; 
    }
    .message { 
      color: #4b5563; 
      margin-bottom: 32px; 
      line-height: 1.6; 
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background-color: #4169E1; 
      color: white !important; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
    }
    .link-container {
      margin: 24px 0;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .link-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .link-text { 
      word-break: break-all; 
      color: #4169E1; 
      font-size: 13px;
      text-decoration: none;
    }
    .footer { 
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px; 
      color: #6b7280;
      text-align: center;
    }
    .security-note {
      margin-top: 24px;
      padding: 16px;
      background-color: #eff6ff;
      border-radius: 8px;
      font-size: 13px;
      color: #1e40af;
      border-left: 4px solid #4169E1;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Quanby</div>
      <div class="tagline">Task Manager</div>
    </div>
    <div class="content">
      ${content}
      <div class="footer">
        <p style="margin: 0 0 8px 0;">Need help? Contact our support team.</p>
        <p style="margin: 0; color: #9ca3af;">© ${new Date().getFullYear()} Quanby Task Manager. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendEmailVerificationEmail(
  email: string,
  token: string,
  userName?: string,
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const content = `
    <div class="greeting">Hi${userName ? ` ${userName}` : ''},</div>
    <div class="message">
      Welcome to Quanby Task Manager! Please verify your email address to activate your account:
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    <div class="link-container">
      <div class="link-label">Or copy and paste this link in your browser:</div>
      <a href="${verificationUrl}" class="link-text">${verificationUrl}</a>
    </div>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 24px 0; border-radius: 4px;">
      ⏱️ <strong>This link expires in 1 hour.</strong>
    </div>
    <div class="security-note">
      <strong>🔒 Security Notice</strong><br>
      If you didn't create an account, you can safely ignore this email.
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify Your Email - Quanby Task Manager',
    html: emailTemplate(content),
  });
}

export async function sendPasswordChangedEmail(
  email: string,
  userName?: string,
): Promise<void> {
  const content = `
    <div class="greeting">Hi${userName ? ` ${userName}` : ''},</div>
    <div class="message">
      This is a confirmation that the password for your Quanby Task Manager account has been changed.
    </div>
    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <strong style="color: #065f46;">✅ Password Changed Successfully</strong><br>
      <span style="color: #047857; font-size: 14px;">
        Your password was changed at ${new Date().toLocaleString()}. All other active sessions have been logged out for security.
      </span>
    </div>
    <div class="security-note" style="background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b;">
      <strong>⚠️ Didn't change your password?</strong><br>
      If you didn't make this change, please contact our support team immediately and consider:
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Resetting your password immediately</li>
        <li>Checking your account for suspicious activity</li>
        <li>Enabling additional security measures</li>
      </ul>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Password Changed - Quanby Task Manager',
    html: emailTemplate(content),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string,
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const content = `
    <div class="greeting">Hi${userName ? ` ${userName}` : ''},</div>
    <div class="message">
      We received a request to reset your password for your Quanby Task Manager account. 
      Click the button below to create a new password:
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="button">Reset My Password</a>
    </div>
    <div class="link-container">
      <div class="link-label">Or copy and paste this link in your browser:</div>
      <a href="${resetUrl}" class="link-text">${resetUrl}</a>
    </div>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 24px 0; border-radius: 4px;">
      ⏱️ <strong>This link expires in ${process.env.PASSWORD_RESET_TOKEN_EXPIRY || 1} hour(s).</strong>
    </div>
    <div class="security-note">
      <strong>🔒 Security Notice</strong><br>
      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset Your Password - Quanby Task Manager',
    html: emailTemplate(content),
  });
}