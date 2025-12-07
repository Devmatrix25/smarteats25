import Restaurant from '../models/Restaurant.js';

export const createRestaurant = async (req, res) => {
    try {
        const ownerId = req.user.userId;
        const restaurantData = {
            ...req.body,
            ownerId,
            status: 'pending' // Requires admin approval
        };

        const restaurant = new Restaurant(restaurantData);
        await restaurant.save();

        res.status(201).json({
            message: 'Restaurant created successfully. Pending approval.',
            restaurant
        });
    } catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({ error: 'Failed to create restaurant', message: error.message });
    }
};

export const getRestaurants = async (req, res) => {
    try {
        const {
            search,
            cuisine,
            city,
            minRating,
            isOpen,
            isFeatured,
            limit = 20,
            page = 1,
            sortBy = 'ratings.average',
            sortOrder = 'desc'
        } = req.query;

        let query = { status: 'active' };

        // Search by name or description
        if (search) {
            query.$text = { $search: search };
        }

        // Filter by cuisine
        if (cuisine) {
            query.cuisine = { $in: cuisine.split(',') };
        }

        // Filter by city
        if (city) {
            query['address.city'] = city;
        }

        // Filter by minimum rating
        if (minRating) {
            query['ratings.average'] = { $gte: parseFloat(minRating) };
        }

        // Filter by open status
        if (isOpen === 'true') {
            query.isOpen = true;
        }

        // Filter by featured
        if (isFeatured === 'true') {
            query.isFeatured = true;
        }

        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .select('-documents -menu') // Exclude sensitive data and large arrays
                .sort(sort)
                .limit(parseInt(limit))
                .skip(skip),
            Restaurant.countDocuments(query)
        ]);

        res.json({
            restaurants,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ error: 'Failed to get restaurants', message: error.message });
    }
};

export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Check if user is owner or admin to show sensitive data
        const isOwnerOrAdmin =
            req.user &&
            (req.user.userId === restaurant.ownerId.toString() || req.user.role === 'admin');

        if (!isOwnerOrAdmin) {
            // Remove sensitive data for public view
            restaurant.documents = undefined;
        }

        res.json({ restaurant });
    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ error: 'Failed to get restaurant', message: error.message });
    }
};

export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Authorization check
        if (userRole !== 'admin' && restaurant.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update fields
        Object.assign(restaurant, req.body);
        await restaurant.save();

        res.json({
            message: 'Restaurant updated successfully',
            restaurant
        });
    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({ error: 'Failed to update restaurant', message: error.message });
    }
};

export const updateRestaurantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        restaurant.status = status;
        if (status === 'approved') {
            restaurant.status = 'active';
        }

        await restaurant.save();

        res.json({
            message: 'Restaurant status updated',
            restaurant
        });
    } catch (error) {
        console.error('Update restaurant status error:', error);
        res.status(500).json({ error: 'Failed to update status', message: error.message });
    }
};

export const toggleRestaurantOpen = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (restaurant.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        res.json({
            message: `Restaurant ${restaurant.isOpen ? 'opened' : 'closed'}`,
            restaurant
        });
    } catch (error) {
        console.error('Toggle restaurant error:', error);
        res.status(500).json({ error: 'Failed to toggle restaurant status', message: error.message });
    }
};

// Menu Management
export const getMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, available } = req.query;

        const restaurant = await Restaurant.findById(id).select('menu');

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        let menu = restaurant.menu;

        // Filter by category
        if (category) {
            menu = menu.filter(item => item.category === category);
        }

        // Filter by availability
        if (available === 'true') {
            menu = menu.filter(item => item.isAvailable);
        }

        res.json({ menu });
    } catch (error) {
        console.error('Get menu error:', error);
        res.status(500).json({ error: 'Failed to get menu', message: error.message });
    }
};

export const addMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (restaurant.ownerId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        restaurant.menu.push(req.body);
        await restaurant.save();

        const newItem = restaurant.menu[restaurant.menu.length - 1];

        res.status(201).json({
            message: 'Menu item added',
            item: newItem
        });
    } catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({ error: 'Failed to add menu item', message: error.message });
    }
};

export const updateMenuItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const userId = req.user.userId;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (restaurant.ownerId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const item = restaurant.menu.id(itemId);

        if (!item) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        Object.assign(item, req.body);
        await restaurant.save();

        res.json({
            message: 'Menu item updated',
            item
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: 'Failed to update menu item', message: error.message });
    }
};

export const deleteMenuItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const userId = req.user.userId;

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (restaurant.ownerId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        restaurant.menu.id(itemId).remove();
        await restaurant.save();

        res.json({
            message: 'Menu item deleted'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ error: 'Failed to delete menu item', message: error.message });
    }
};

export const getCategories = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id).select('menu');

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const categories = [...new Set(restaurant.menu.map(item => item.category))];

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories', message: error.message });
    }
};
