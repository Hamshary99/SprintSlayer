import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middlewares/errorHandler.js';
import { Routes } from './route.js';

export class AppRoutes {
    static routes(): express.Router {
        const router = express.Router();

        // Body parsing & cookies
        router.use(express.json());
        router.use(cookieParser());

        // Health check
        router.get('/health', (_req, res) => {
            res.json({ message: 'Server is running' });
        });

        // All other routes (auth, users, etc.)
        router.use('/api', Routes.routes());
        
        // Global error handler (must be last)
        router.use(errorHandler as express.ErrorRequestHandler);

        return router;
    }
}