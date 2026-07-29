import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const socketService = {
    connect: () => {
        if (!socket) {
            socket = io('http://localhost:5000', { withCredentials: true });
        }
        return socket;
    },

    disconnect: () => {
        socket?.disconnect();
        socket = null;
    },

    getSocket: () => socket,
};
