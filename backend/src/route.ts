import authRoutes from './modules/auth/routes/auth.route.js';
import userRoutes from './modules/users/routes/user.route.js';
import projectRoutes from './modules/projects/routes/project.route.js'
import { Router } from 'express';

export class Routes {
    static routes(): Router {
        const router = Router();

        // Auth routes  — /api/auth
        router.use('/auth', authRoutes);

        // User routes  — /api/user
        router.use('/user', userRoutes);

        // Project routes  — /api/project
        router.use('/project', projectRoutes);

        return router;
    }
}