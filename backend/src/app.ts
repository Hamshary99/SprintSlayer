import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middlewares/errorHandler.js';
import { Routes } from './route.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config.js';

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
        
        // Swagger UI
        router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        
        // Global error handler (must be last)
        router.use(errorHandler as express.ErrorRequestHandler);

        return router;
    }
}