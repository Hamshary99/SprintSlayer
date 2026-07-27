import authRoutes from './modules/auth/routes/auth.route.js';
import userRoutes from './modules/users/routes/user.route.js';
import { Router } from 'express';

export class Routes {
    static routes(): Router {
        const router = Router();

        // Auth routes  — /api/auth
        router.use('/auth', authRoutes);

        // User routes  — /api/users
        router.use('/user', userRoutes);

        return router;
    }
}