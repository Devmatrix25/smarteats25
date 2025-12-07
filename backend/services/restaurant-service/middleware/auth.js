import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token && req.headers['x-user-id']) {
        req.user = {
            userId: req.headers['x-user-id'],
            role: req.headers['x-user-role'] || 'customer'
        };
        return next();
    }

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    } else if (req.headers['x-user-id']) {
        req.user = {
            userId: req.headers['x-user-id'],
            role: req.headers['x-user-role'] || 'customer'
        };
    }

    next();
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to access this resource'
            });
        }
        next();
    };
};
