import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { AppError } from "../error/AppError.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Extract from Authorization header (Bearer <token>)
        const authHeader = req.headers.authorization;
        let token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : undefined;

        if (token === 'null' || token === 'undefined' || token === '') {
            token = undefined;
        }

        // 2. Fallback to cookies if not in header
        if (!token) {
            token = req.cookies?.access_token;
        }

        if (!token) {
            throw new AppError("Authentication required — no token provided", 401);
        }

        const payload = verifyAccessToken(token);
        req.user = payload;

        next();
    } catch (error) {
        // Surface JWT verification errors as 401 rather than 500
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError("Invalid or expired access token", 401));
    }
}
