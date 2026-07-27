import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../../common/utils/jwt.util.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { AppError } from "../../../common/error/AppError.js";

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
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
}

export const authService = new AuthService();