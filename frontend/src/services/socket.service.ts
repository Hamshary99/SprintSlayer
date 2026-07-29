import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const socketService = {
    connect: () => {
        if (!socket) {
            const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const serverUrl = rawUrl.replace(/\/api\/?$/, '');
            socket = io(serverUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });
        }
        return socket;
    },

    disconnect: () => {
        socket?.disconnect();
        socket = null;
    },

    getSocket: () => socket,
};
