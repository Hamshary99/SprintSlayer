import authRoutes from './modules/auth/routes/auth.route.js';
import userRoutes from './modules/users/routes/user.route.js';
import projectRoutes from './modules/projects/routes/project.route.js';
import taskRoutes from './modules/tasks/routes/task.route.js';
import auditRoutes from './modules/audit/routes/audit.route.js';
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

        // Task routes  — /api/task
        router.use('/task', taskRoutes);

        // Audit log routes — /api/audit-logs
        router.use('/audit-logs', auditRoutes);

        return router;
    }
}