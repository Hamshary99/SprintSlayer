import { Resend } from 'resend';
import { env } from '../../config/env.config.js';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_key_for_dev');

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendResetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const devDirectUrl = `http://localhost:${env.PORT}/api/auth/reset-password?token=${resetToken}`;

    if (!env.RESEND_API_KEY) {
        console.log(`\n==================================================`);
        console.log(`[DEV MODE - NO RESEND API KEY SET]`);
        console.log(`Password Reset Requested for: ${to}`);
        console.log(`Token: ${resetToken}`);
        console.log(`Frontend Link: ${frontendResetUrl}`);
        console.log(`Direct Browser Dev Form: ${devDirectUrl}`);
        console.log(`==================================================\n`);
        return;
    }

    try {
        await resend.emails.send({
            from: env.EMAIL_FROM,
            to,
            subject: 'SprintSlayer - Reset Your Password',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">SprintSlayer Password Reset</h2>
                    <p>You requested a password reset for your account. Click the button below to set a new password:</p>
                    <div style="margin: 25px 0;">
                        <a href="${frontendResetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset My Password</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="font-size: 13px; word-break: break-all; color: #4f46e5;">${frontendResetUrl}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px;">This link will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Failed to send email via Resend:', error);
        throw error;
    }
}
