import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:4100';

export function useWebSocket() {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            return;
        }

        // Initialize socket connection
        const socket = io(WS_URL, {
            auth: {
                token,
            },
        });

        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, []);

    const joinOrderRoom = (orderId) => {
        if (socketRef.current) {
            socketRef.current.emit('join:order', orderId);
        }
    };

    const leaveOrderRoom = (orderId) => {
        if (socketRef.current) {
            socketRef.current.emit('leave:order', orderId);
        }
    };

    const onOrderStatusUpdate = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('order:status_updated', callback);
            return () => socketRef.current.off('order:status_updated', callback);
        }
    };

    const onDriverLocationUpdate = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('driver:location_updated', callback);
            return () => socketRef.current.off('driver:location_updated', callback);
        }
    };

    const onNotification = (callback) => {
        if (socketRef.current) {
            socketRef.current.on('notification:new', callback);
            return () => socketRef.current.off('notification:new', callback);
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        onOrderStatusUpdate,
        onDriverLocationUpdate,
        onNotification,
    };
}
