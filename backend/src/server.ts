import express from 'express';
import http from 'http';
import { env } from './config/env.config.js';
import { checkDbConnection } from './config/db.config.js';
import { AppRoutes } from './app.js';
import { socketManager } from './sockets/socketManager.js';

const app = express();

// Trust Railway reverse proxy so Express recognizes HTTPS connections and sets secure cookies
app.set('trust proxy', 1);

// Mount all API routes under /api
app.use('/', AppRoutes.routes());

// Create HTTP server for both Express API & Socket.IO
const httpServer = http.createServer(app);

// Initialize Socket.IO connection manager (Railway Backend Deployment)
socketManager.init(httpServer);

// Bootstrap: verify DB is reachable before accepting traffic
async function bootstrap() {
    await checkDbConnection();

    httpServer.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
        console.log(`Socket.IO active on port ${env.PORT}`);
        console.log(`Swagger Docs: http://localhost:${env.PORT}/api-docs`);
        console.log(`Health check: http://localhost:${env.PORT}/health`);
    });
}

bootstrap();

export default app;
