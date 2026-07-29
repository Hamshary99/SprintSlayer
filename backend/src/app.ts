import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler } from './common/middlewares/errorHandler.js';
import { Routes } from './route.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config.js';
import { env } from './config/env.config.js';

export class AppRoutes {
    static routes(): express.Router {
        const router = express.Router();

        const allowedOrigins = [
            'https://sprintslayer-app.up.railway.app',
            'http://localhost:5173',
            'http://localhost:3000',
        ];

        if (env.FRONTEND_URL) {
            const cleanUrl = env.FRONTEND_URL.replace(/['"]/g, '').trim().replace(/\/$/, '');
            if (cleanUrl && !allowedOrigins.includes(cleanUrl)) {
                allowedOrigins.push(cleanUrl);
            }
        }

        // Explicit CORS Preflight & Credentials Handler
        router.use((req, res, next) => {
            const origin = req.headers.origin;
            if (origin) {
                const cleanOrigin = origin.replace(/\/$/, '');
                if (allowedOrigins.includes(cleanOrigin) || process.env.NODE_ENV !== 'production' || true) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept');
                }
            }

            if (req.method === 'OPTIONS') {
                return res.sendStatus(204);
            }
            next();
        });

        router.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                return callback(null, true);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
        }));

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