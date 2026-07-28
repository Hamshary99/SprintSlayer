import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../../common/utils/jwt.util.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { PasswordResetRepository } from "../repositories/passwordReset.repository.js";
import { AppError } from "../../../common/error/AppError.js";
import { sendPasswordResetEmail } from "../../../common/utils/email.util.js";
import { hashPassword } from "../../users/utils/password.hash.util.js";
import crypto from 'crypto';

export class AuthService {
    private userRepository: UserRepository;
    private passwordResetRepository: PasswordResetRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.passwordResetRepository = new PasswordResetRepository();
    }

    async refreshAccessToken(refreshToken: string) {
        // 1. Verify the token signature & expiry first (throws JsonWebTokenError if invalid)
        const payload = verifyRefreshToken(refreshToken);

        // 2. Check it exists in DB (ensures logout/revocation is respected)
        const result = await this.userRepository.findUserByToken(refreshToken);
        if (result.length === 0) {
            throw new AppError("Refresh token is invalid or has been revoked", 401);
        }

        const user = result[0];

        // 3. Remove old timestamps so the JWT library can generate new ones
        delete (payload as any).exp;
        delete (payload as any).iat;
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        // 4. Persist the new refresh token
        await this.userRepository.update(user.id, { refreshToken: newRefreshToken });

        // 5. Return user data without sensitive fields
        const { passwordHash, refreshToken: _rt, ...userData } = user;

        return { userData, accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    async forgotPassword(email: string) {
        const users = await this.userRepository.findByEmail(email);
        if (users.length === 0) {
            // For security reasons, do not reveal if the email exists or not
            return { message: "If an account with that email exists, a password reset link has been sent." };
        }

        const user = users[0];

        // Generate unhashed random token to send to user
        const rawToken = crypto.randomBytes(32).toString("hex");

        // Hash token for storing in database
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // 10 minutes expiration from now
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.passwordResetRepository.createToken(user.id, tokenHash, expiresAt);

        // Send email via Resend
        await sendPasswordResetEmail(user.email, rawToken);

        return { message: "If an account with that email exists, a password reset link has been sent." };
    }

    async resetPassword(rawToken: string, newPassword: string) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const tokens = await this.passwordResetRepository.findValidToken(tokenHash);
        if (tokens.length === 0) {
            throw new AppError("Invalid or expired password reset token", 400);
        }

        const resetRecord = tokens[0];

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user's password and revoke refresh tokens for security
        await this.userRepository.update(resetRecord.userId, {
            passwordHash: hashedPassword,
            refreshToken: null
        });

        // Mark token as used
        await this.passwordResetRepository.markAsUsed(resetRecord.id);

        return { message: "Password has been successfully reset. Please log in with your new password." };
    }
}

export const authService = new AuthService();