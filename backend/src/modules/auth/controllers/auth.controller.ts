import { AuthService, authService } from "../services/auth.service.js";
import { UserService, userService } from "../../users/services/user.service.js";
import { NextFunction, Request, Response } from "express";
import { clearTokensCookies, setAccessTokenCookie, setRefreshTokenCookie } from "../../../common/utils/jwt.util.js";
import { validateBody } from "../../../common/utils/validator.js";
import { CreateUserDto, UserLoginDto } from "../../users/dto/user.dto.js";
import { ForgotPasswordDto, ResetPasswordDto } from "../dto/auth.dto.js";
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
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.renderResetPasswordForm = this.renderResetPasswordForm.bind(this);
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

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await validateBody(ForgotPasswordDto, req.body);
            const result = await this.authService.forgotPassword(data.email);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await validateBody(ResetPasswordDto, req.body);
            const result = await this.authService.resetPassword(data.token, data.newPassword);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    renderResetPasswordForm(req: Request, res: Response) {
        const rawToken = (req.query.token as string) || '';
        const token = rawToken
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        res.setHeader('Content-Type', 'text/html');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SprintSlayer - Reset Password</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); width: 100%; max-width: 400px; border: 1px solid #334155; }
                    h2 { margin-top: 0; color: #6366f1; font-size: 1.5rem; text-align: center; }
                    p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; text-align: center; }
                    label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem; font-weight: 500; }
                    input { width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; margin-bottom: 1.25rem; box-sizing: border-box; }
                    input:focus { outline: none; border-color: #6366f1; }
                    button { width: 100%; padding: 0.75rem; border-radius: 6px; border: none; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; transition: background 0.2s; }
                    button:hover { background: #4f46e5; }
                    .msg { margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; display: none; text-align: center; }
                    .success { background: #065f46; color: #a7f3d0; }
                    .error { background: #991b1b; color: #fecaca; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Reset Your Password</h2>
                    <p>Enter your new password below.</p>
                    <form id="resetForm">
                        <input type="hidden" id="token" value="${token}" />
                        <div>
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" placeholder="Minimum 6 characters" required minlength="6" />
                        </div>
                        <button type="submit" id="submitBtn">Set New Password</button>
                    </form>
                    <div id="message" class="msg"></div>
                </div>
                <script>
                    document.getElementById('resetForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const token = document.getElementById('token').value;
                        const newPassword = document.getElementById('newPassword').value;
                        const msgDiv = document.getElementById('message');
                        const btn = document.getElementById('submitBtn');
                        btn.disabled = true;
                        btn.innerText = 'Updating...';

                        try {
                            const res = await fetch('/api/auth/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token, newPassword })
                            });
                            const data = await res.json();
                            if (res.ok) {
                                msgDiv.className = 'msg success';
                                msgDiv.innerText = data.message || 'Password successfully updated!';
                                msgDiv.style.display = 'block';
                                document.getElementById('resetForm').style.display = 'none';
                            } else {
                                throw new Error(data.message || 'Failed to reset password.');
                            }
                        } catch (err) {
                            msgDiv.className = 'msg error';
                            msgDiv.innerText = err.message;
                            msgDiv.style.display = 'block';
                            btn.disabled = false;
                            btn.innerText = 'Set New Password';
                        }
                    });
                </script>
            </body>
            </html>
        `);
    }
}

export const authController = new AuthController(authService, userService);
