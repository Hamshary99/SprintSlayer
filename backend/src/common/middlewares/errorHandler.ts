import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError.js";
import { auditLogService } from "../../modules/audit/controllers/audit.controller.js";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (err instanceof AppError) {
        // Log HIGH priority audit event for security / access control errors
        if (err.statusCode === 401 || err.statusCode === 403) {
            auditLogService.log({
                priority: "HIGH",
                action: err.statusCode === 401 ? "AUTH_FAILURE" : "ACCESS_DENIED",
                userId: req.user?.id,
                userEmail: req.user?.email,
                ipAddress: req.ip || req.socket?.remoteAddress,
                path: req.originalUrl || req.url,
                method: req.method,
                statusCode: err.statusCode,
                details: JSON.stringify({ message: err.message, query: req.query, bodyParams: Object.keys(req.body || {}) }),
            });
        }

        // Operational errors: validation failures, auth errors, not-found, etc.
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    // HIGH priority audit for unexpected 500 errors
    auditLogService.log({
        priority: "HIGH",
        action: "UNHANDLED_ERROR",
        userId: req.user?.id,
        userEmail: req.user?.email,
        ipAddress: req.ip || req.socket?.remoteAddress,
        path: req.originalUrl || req.url,
        method: req.method,
        statusCode: 500,
        details: JSON.stringify({ message: err.message, stack: err.stack }),
    });

    // Unexpected / programmer errors — log them and send a generic 500
    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        status: "error",
        message: "An internal server error occurred",
    });
}
