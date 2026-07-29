import express from 'express';
import { env } from './config/env.config.js';
import { checkDbConnection } from './config/db.config.js';
import { AppRoutes } from './app.js';

const app = express();

// Trust Railway reverse proxy so Express recognizes HTTPS connections and sets secure cookies
app.set('trust proxy', 1);

// Mount all API routes under /api
app.use('/', AppRoutes.routes());

// Bootstrap: verify DB is reachable before accepting traffic
async function bootstrap() {
    await checkDbConnection();

    app.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
        console.log(`Swagger Docs: http://localhost:${env.PORT}/api-docs`);
        console.log(`Health check: http://localhost:${env.PORT}/health`);
    });
}

bootstrap();

export default app;
