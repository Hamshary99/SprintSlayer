import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError.js";

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("Authentication required", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied`,
                    403
                )
            );
        }

        next();
    };
}
