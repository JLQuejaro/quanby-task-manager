"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
async function sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    const msg = {
        to: email,
        from: process.env.SMTP_FROM,
        subject: 'Reset Your Quanby Password',
        html: `<!-- Same HTML template as before -->`,
    };
    await mail_1.default.send(msg);
}
//# sourceMappingURL=email-sendgrid.js.map