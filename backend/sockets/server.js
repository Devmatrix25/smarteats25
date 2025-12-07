import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const PORT = process.env.WS_PORT || 4100;

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Redis client (optional, for caching driver locations)
let redisClient = null;

async function initRedis() {
    try {
        if (process.env.REDIS_URL) {
            redisClient = createClient({ url: process.env.REDIS_URL });
            await redisClient.connect();
            console.log('✅ Redis connected');
        }
    } catch (error) {
        console.log('⚠️ Redis not available, continuing without cache');
    }
}

// JWT Authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        // Allow connection without auth for demo purposes
        socket.userId = 'anonymous';
        socket.userRole = 'guest';
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
    } catch (error) {
        // Allow connection but mark as guest
        socket.userId = 'anonymous';
        socket.userRole = 'guest';
        next();
    }
});

// Connection handler
io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

    // Join user-specific room
    if (socket.userId !== 'anonymous') {
        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);
    }

    // Handle joining order room
    socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`User ${socket.userId} joined order room: ${orderId}`);
    });

    // Handle leaving order room
    socket.on('leave:order', (orderId) => {
        socket.leave(`order:${orderId}`);
        console.log(`User ${socket.userId} left order room: ${orderId}`);
    });

    // Handle joining restaurant room (for restaurant owners)
    socket.on('join:restaurant', (restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`User ${socket.userId} joined restaurant room: ${restaurantId}`);
    });

    // Handle joining driver room
    socket.on('join:driver', (driverId) => {
        socket.join(`driver:${driverId}`);
        console.log(`User ${socket.userId} joined driver room: ${driverId}`);
    });

    // Handle driver location updates (SIMULATION)
    socket.on('driver:location', async (data) => {
        const { orderId, latitude, longitude, driverId } = data;

        // Broadcast to order room - Customer and Restaurant see this
        io.to(`order:${orderId}`).emit('driver:location_updated', {
            orderId,
            driverId: driverId || socket.userId,
            location: { latitude, longitude },
            timestamp: new Date()
        });

        // Also notify restaurant
        if (data.restaurantId) {
            io.to(`restaurant:${data.restaurantId}`).emit('driver:location_updated', {
                orderId,
                driverId: driverId || socket.userId,
                location: { latitude, longitude },
                timestamp: new Date()
            });
        }

        // Store in Redis for quick access (if available)
        if (redisClient) {
            try {
                await redisClient.set(
                    `driver:location:${driverId || socket.userId}`,
                    JSON.stringify({ latitude, longitude, timestamp: new Date() }),
                    { EX: 300 }
                );
            } catch (e) {
                // Ignore Redis errors
            }
        }
    });

    // Handle order status updates
    socket.on('order:status_update', (data) => {
        const { orderId, status, customerId, restaurantId, driverId } = data;

        // Broadcast to all interested parties
        io.to(`order:${orderId}`).emit('order:status_updated', data);

        if (customerId) {
            io.to(`user:${customerId}`).emit('order:status_updated', data);
        }
        if (restaurantId) {
            io.to(`restaurant:${restaurantId}`).emit('order:status_updated', data);
        }
        if (driverId) {
            io.to(`driver:${driverId}`).emit('order:status_updated', data);
        }

        console.log(`📦 Order ${orderId} status updated to: ${status}`);
    });

    // Handle new order notification to restaurant
    socket.on('order:new', (data) => {
        const { restaurantId } = data;
        if (restaurantId) {
            io.to(`restaurant:${restaurantId}`).emit('order:new', data);
            console.log(`📋 New order notification sent to restaurant: ${restaurantId}`);
        }
    });

    // Handle delivery assignment
    socket.on('delivery:assigned', (data) => {
        const { driverId, orderId } = data;
        if (driverId) {
            io.to(`driver:${driverId}`).emit('delivery:assigned', data);
            console.log(`🚗 Delivery assigned to driver: ${driverId}`);
        }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Initialize and start server
async function startServer() {
    await initRedis();

    httpServer.listen(PORT, () => {
        console.log(`🔌 WebSocket Server running on port ${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (redisClient) await redisClient.quit();
    httpServer.close();
    process.exit(0);
});

export { io };
