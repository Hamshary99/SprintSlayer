import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.config.js';

export class SocketManager {
    private static instance: SocketManager;
    private io: SocketIOServer | null = null;

    private constructor() {}

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public init(server: HttpServer): SocketIOServer {
        const allowedOrigin = (env.FRONTEND_URL || 'http://localhost:5173')
            .replace(/['"]/g, '')
            .trim()
            .replace(/\/$/, '');

        this.io = new SocketIOServer(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    const cleanOrigin = origin.replace(/\/$/, '');
                    if (!allowedOrigin || cleanOrigin === allowedOrigin || process.env.NODE_ENV !== 'production') {
                        return callback(null, origin);
                    }
                    return callback(null, origin);
                },
                credentials: true,
                methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
            },
            transports: ['websocket', 'polling'],
        });

        this.io.on('connection', (socket: Socket) => {
            console.log(`[Socket.IO] Client connected: ${socket.id}`);

            socket.on('join_project', (projectId: number | string) => {
                const room = `project:${projectId}`;
                socket.join(room);
                console.log(`[Socket.IO] Socket ${socket.id} joined room ${room}`);
            });

            socket.on('leave_project', (projectId: number | string) => {
                const room = `project:${projectId}`;
                socket.leave(room);
                console.log(`[Socket.IO] Socket ${socket.id} left room ${room}`);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
            });
        });

        return this.io;
    }

    public getIO(): SocketIOServer | null {
        return this.io;
    }

    public emitTaskCreated(projectId: number, task: any) {
        if (!this.io) return;
        this.io.to(`project:${projectId}`).emit('task:created', task);
        this.io.emit('task:created', task); // Broadcast globally as well for live dashboard updates
    }

    public emitTaskUpdated(projectId: number, task: any) {
        if (!this.io) return;
        this.io.to(`project:${projectId}`).emit('task:updated', task);
        this.io.emit('task:updated', task);
    }

    public emitTaskDeleted(projectId: number, taskId: number) {
        if (!this.io) return;
        this.io.to(`project:${projectId}`).emit('task:deleted', { id: taskId, projectId });
        this.io.emit('task:deleted', { id: taskId, projectId });
    }
}

export const socketManager = SocketManager.getInstance();
