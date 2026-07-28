import { db } from '../../../config/db.config.js';
import { passwordResetTokens } from '../schemas/passwordReset.schema.js';
import { eq, and, isNull, gte } from 'drizzle-orm';

export class PasswordResetRepository {
    async createToken(userId: number, tokenHash: string, expiresAt: Date) {
        return db.insert(passwordResetTokens).values({
            userId,
            tokenHash,
            expiresAt
        }).returning();
    }

    async findValidToken(tokenHash: string) {
        return db.select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.tokenHash, tokenHash),
                    isNull(passwordResetTokens.usedAt),
                    gte(passwordResetTokens.expiresAt, new Date())
                )
            );
    }

    async markAsUsed(id: number) {
        return db.update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, id))
            .returning();
    }
}
