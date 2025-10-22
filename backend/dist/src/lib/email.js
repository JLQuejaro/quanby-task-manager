"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer = __importStar(require("nodemailer"));
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
async function sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Reset Your Quanby Password',
        html: `
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
            .logo-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 12px;
            }
            .logo-box {
              width: 48px;
              height: 48px;
              background: white;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
            }
            .logo-text-container {
              text-align: left;
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
            .expiry {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              margin: 24px 0;
              border-radius: 4px;
              font-size: 14px;
              color: #92400e;
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
            .security-note strong {
              display: block;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <div style="width: 48px; height: 48px; background: #4169E1; border-radius: 12px; text-align: center; line-height: 48px;">
                            <span style="font-size: 28px; font-weight: bold; color: white;">☑</span>
                          </div>
                        </td>
                        <td style="text-align: left; vertical-align: middle;">
                          <div style="color: white; font-size: 28px; font-weight: 700; line-height: 1.2; margin: 0; padding: 0;">Quanby</div>
                          <div style="color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.2; margin: 0; padding: 0;">Task Manager</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            <div class="content">
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
              <div class="expiry">
                ⏱️ <strong>This link expires in ${process.env.PASSWORD_RESET_TOKEN_EXPIRY || 1} hour(s).</strong><br>
                For your security, make sure to use it soon.
              </div>
              <div class="security-note">
                <strong>🔒 Security Notice</strong>
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </div>
              <div class="footer">
                <p style="margin: 0 0 8px 0;">Need help? Contact our support team.</p>
                <p style="margin: 0; color: #9ca3af;">© ${new Date().getFullYear()} Quanby Task Manager. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    };
    await transporter.sendMail(mailOptions);
}
//# sourceMappingURL=email.js.map