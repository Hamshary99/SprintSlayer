import { AuthService, authService } from "../services/auth.service.js";
import { UserService, userService } from "../../users/services/user.service.js";
import { NextFunction, Request, Response } from "express";
import { clearTokensCookies, setAccessTokenCookie, setRefreshTokenCookie } from "../../../common/utils/jwt.util.js";
import { validateBody } from "../../../common/utils/validator.js";
import { CreateUserDto, UserLoginDto } from "../../users/dto/user.dto.js";
import { AppError } from "../../../common/error/AppError.js";

export interface userPayload {
    id: number;
    role: string;
    email: string;
}

export class AuthController {
    private userService: UserService;
    private authService: AuthService;

    constructor(authService: AuthService, userService: UserService) {
        this.authService = authService;
        this.userService = userService;

        // Bind methods so `this` is preserved when passed directly as Express handlers
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.refresh = this.refresh.bind(this);
        this.logout = this.logout.bind(this);
    }

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            // 1. Validate Request Body
            const data = await validateBody(CreateUserDto, req.body);

            // 2. Create user & generate tokens
            const result = await this.userService.create(data);

            // 3. Set HttpOnly cookies
            setAccessTokenCookie(res, result.accessToken);
            setRefreshTokenCookie(res, result.refreshToken);

            // 4. Return user data only (tokens already in cookies)
            res.status(201).json({ user: result.userData });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            // 1. Validate Request Body
            const data = await validateBody(UserLoginDto, req.body);

            // 2. Authenticate user & generate tokens
            const result = await this.userService.findByEmail(data);

            // 3. Set HttpOnly cookies
            setAccessTokenCookie(res, result.accessToken);
            setRefreshTokenCookie(res, result.refreshToken);

            // 4. Return user data only (tokens already in cookies)
            res.status(200).json({ user: result.userData });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            // Cookie name matches what jwt.util.ts sets: "refresh_token"
            const refreshToken = req.cookies.refresh_token;
            if (!refreshToken) {
                throw new AppError("Refresh token is required", 401);
            }

            // Verify token & rotate both tokens
            const result = await this.authService.refreshAccessToken(refreshToken);

            // Set new HttpOnly cookies
            setAccessTokenCookie(res, result.accessToken);
            setRefreshTokenCookie(res, result.refreshToken);

            res.status(200).json({ user: result.userData });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // Cookie name matches what jwt.util.ts sets: "refresh_token"
            const refreshToken = req.cookies.refresh_token;
            if (!refreshToken) {
                throw new AppError("No active session", 401);
            }

            // Revoke the refresh token in the DB so it can't be reused
            if (req.user) {
                await this.userService.revokeTokenFromUser(req.user.id, refreshToken);
            }

            // Clear both cookies (using the helper that matches the correct names)
            clearTokensCookies(res);

            res.status(200).json({ message: "Logout successful" });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController(authService, userService);
