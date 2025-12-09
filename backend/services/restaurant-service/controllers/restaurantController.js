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
            is_featured,
            limit = 100,
            page = 1,
            sortBy = 'ratings.average',
            sortOrder = 'desc',
            status,
            owner_email,
            _sort,
            _limit
        } = req.query;

        // Build query - default to approved/active restaurants
        let query = {};

        // Handle status filter - accept both 'approved' and 'active'
        if (status) {
            query.status = status;
        } else {
            query.status = { $in: ['approved', 'active'] };
        }

        // Handle owner_email filter (for restaurant dashboard)
        if (owner_email) {
            query.owner_email = owner_email;
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by cuisine (support both 'cuisine' and 'cuisine_type')
        if (cuisine) {
            query.$or = query.$or || [];
            query.$or.push(
                { cuisine: { $in: cuisine.split(',') } },
                { cuisine_type: { $in: cuisine.split(',') } }
            );
        }

        // Filter by city
        if (city) {
            query.$or = query.$or || [];
            query.$or.push(
                { 'address.city': city },
                { city: city }
            );
        }

        // Filter by minimum rating
        if (minRating) {
            query.$or = query.$or || [];
            query.$or.push(
                { 'ratings.average': { $gte: parseFloat(minRating) } },
                { average_rating: { $gte: parseFloat(minRating) } }
            );
        }

        // Filter by open status
        if (isOpen === 'true') {
            query.$or = query.$or || [];
            query.$or.push({ isOpen: true }, { is_open: true });
        }

        // Filter by featured (handle both camelCase and snake_case)
        if (isFeatured === 'true' || is_featured === 'true') {
            query.$or = query.$or || [];
            query.$or.push({ isFeatured: true }, { is_featured: true });
        }

        const actualLimit = parseInt(_limit || limit);
        const skip = (page - 1) * actualLimit;
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .sort(sort)
                .limit(actualLimit)
                .skip(skip),
            Restaurant.countDocuments(query)
        ]);

        // Return in format frontend expects
        res.json({
            data: restaurants,
            restaurants,
            pagination: {
                total,
                page: parseInt(page),
                limit: actualLimit,
                pages: Math.ceil(total / actualLimit)
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
