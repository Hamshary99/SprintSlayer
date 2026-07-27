import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError.js";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof AppError) {
        // Operational errors: validation failures, auth errors, not-found, etc.
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    // Unexpected / programmer errors — log them and send a generic 500
    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        status: "error",
        message: "An internal server error occurred",
    });
}
