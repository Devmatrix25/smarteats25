import { Driver, Delivery } from '../models/Driver.js';
import { DeliveryEvents } from '../queue/index.js';

// Driver Management
export const registerDriver = async (req, res) => {
    try {
        const userId = req.user.userId;
        const driverData = {
            ...req.body,
            userId,
            status: 'pending'
        };

        const driver = new Driver(driverData);
        await driver.save();

        res.status(201).json({
            message: 'Driver registration submitted. Pending verification.',
            driver
        });
    } catch (error) {
        console.error('Register driver error:', error);
        res.status(500).json({ error: 'Failed to register driver', message: error.message });
    }
};

export const getDrivers = async (req, res) => {
    try {
        const { status, isOnline, limit = 20, page = 1 } = req.query;

        let query = {};
        if (status) query.status = status;
        if (isOnline === 'true') query['availability.isOnline'] = true;

        const skip = (page - 1) * limit;

        const [drivers, total] = await Promise.all([
            Driver.find(query)
                .select('-documents -bankDetails')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip),
            Driver.countDocuments(query)
        ]);

        res.json({
            drivers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ error: 'Failed to get drivers', message: error.message });
    }
};

export const getDriverById = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Hide sensitive data unless owner or admin
        if (req.user.userId !== driver.userId.toString() && req.user.role !== 'admin') {
            driver.documents = undefined;
            driver.bankDetails = undefined;
        }

        res.json({ driver });
    } catch (error) {
        console.error('Get driver error:', error);
        res.status(500).json({ error: 'Failed to get driver', message: error.message });
    }
};

export const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.userId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(driver, req.body);
        await driver.save();

        res.json({
            message: 'Driver updated successfully',
            driver
        });
    } catch (error) {
        console.error('Update driver error:', error);
        res.status(500).json({ error: 'Failed to update driver', message: error.message });
    }
};

export const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        driver.status = status;
        await driver.save();

        res.json({
            message: 'Driver status updated',
            driver
        });
    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({ error: 'Failed to update status', message: error.message });
    }
};

export const toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        driver.availability.isOnline = !driver.availability.isOnline;
        driver.availability.isAvailable = driver.availability.isOnline;
        driver.availability.lastOnline = new Date();

        await driver.save();

        res.json({
            message: `Driver is now ${driver.availability.isOnline ? 'online' : 'offline'}`,
            driver
        });
    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({ error: 'Failed to toggle availability', message: error.message });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { longitude, latitude, address } = req.body;
        const userId = req.user.userId;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        driver.updateLocation(longitude, latitude, address);
        await driver.save();

        // Publish location update event
        await DeliveryEvents.locationUpdated({
            driverId: driver._id,
            location: { longitude, latitude },
            timestamp: new Date()
        });

        res.json({
            message: 'Location updated',
            location: driver.location
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location', message: error.message });
    }
};

// Delivery Management
export const getAvailableDeliveries = async (req, res) => {
    try {
        const userId = req.user.userId;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        if (!driver.availability.isOnline || !driver.availability.isAvailable) {
            return res.json({ deliveries: [] });
        }

        // Find unassigned or newly assigned deliveries
        const deliveries = await Delivery.find({
            status: 'assigned',
            driverId: driver._id
        }).limit(10);

        res.json({ deliveries });
    } catch (error) {
        console.error('Get available deliveries error:', error);
        res.status(500).json({ error: 'Failed to get deliveries', message: error.message });
    }
};

export const acceptDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const driver = await Driver.findOne({ userId });
        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        if (delivery.driverId.toString() !== driver._id.toString()) {
            return res.status(403).json({ error: 'This delivery is not assigned to you' });
        }

        delivery.status = 'accepted';
        delivery.timeline.accepted = new Date();
        await delivery.save();

        driver.availability.isAvailable = false;
        await driver.save();

        await DeliveryEvents.accepted({
            deliveryId: delivery._id,
            orderId: delivery.orderId,
            driverId: driver._id
        });

        res.json({
            message: 'Delivery accepted',
            delivery
        });
    } catch (error) {
        console.error('Accept delivery error:', error);
        res.status(500).json({ error: 'Failed to accept delivery', message: error.message });
    }
};

export const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        const driver = await Driver.findOne({ userId });
        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' });
        }

        if (delivery.driverId.toString() !== driver._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        delivery.status = status;

        if (status === 'picked_up') {
            delivery.timeline.pickedUp = new Date();
            await DeliveryEvents.pickedUp({
                deliveryId: delivery._id,
                orderId: delivery.orderId,
                driverId: driver._id
            });
        } else if (status === 'delivered') {
            delivery.timeline.delivered = new Date();
            delivery.actualDuration = Math.round((delivery.timeline.delivered - delivery.timeline.pickedUp) / 60000);
            delivery.calculateEarnings();

            driver.stats.completedDeliveries += 1;
            driver.stats.totalDeliveries += 1;
            driver.stats.totalEarnings += delivery.earnings.total;
            driver.availability.isAvailable = true;
            await driver.save();

            await DeliveryEvents.delivered({
                deliveryId: delivery._id,
                orderId: delivery.orderId,
                driverId: driver._id,
                earnings: delivery.earnings.total
            });
        }

        await delivery.save();

        res.json({
            message: 'Delivery status updated',
            delivery
        });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({ error: 'Failed to update delivery status', message: error.message });
    }
};

export const getDriverEarnings = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const userId = req.user.userId;

        const driver = await Driver.findById(id);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.userId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        let query = { driverId: driver._id, status: 'delivered' };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const deliveries = await Delivery.find(query);

        const earnings = {
            totalEarnings: deliveries.reduce((sum, d) => sum + d.earnings.total, 0),
            totalDeliveries: deliveries.length,
            totalDistance: deliveries.reduce((sum, d) => sum + d.distance, 0),
            averageEarningsPerDelivery: deliveries.length > 0
                ? deliveries.reduce((sum, d) => sum + d.earnings.total, 0) / deliveries.length
                : 0,
            breakdown: {
                baseFees: deliveries.reduce((sum, d) => sum + d.earnings.baseFee, 0),
                distanceFees: deliveries.reduce((sum, d) => sum + d.earnings.distanceFee, 0),
                tips: deliveries.reduce((sum, d) => sum + (d.earnings.tip || 0), 0)
            }
        };

        res.json({ earnings, deliveries });
    } catch (error) {
        console.error('Get driver earnings error:', error);
        res.status(500).json({ error: 'Failed to get earnings', message: error.message });
    }
};
