const jwt = require('jsonwebtoken');
const db = require('../db/index.js');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { rows } = await db.query(
            `SELECT u.*, array_agg(r.name) as roles 
             FROM "User" u 
             LEFT JOIN "UserRole" ur ON u.id = ur.user_id 
             LEFT JOIN "Role" r ON ur.role_id = r.id 
             WHERE u.id = $1 
             GROUP BY u.id`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!rows[0].is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const userRoles = req.user.roles.filter(r => r !== null);

        // ADMIN has permission for everything
        if (userRoles.includes('ADMIN')) {
            return next();
        }

        const hasRole = userRoles.some(role => roles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};

module.exports = { protect, requireRole };
