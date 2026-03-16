const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * This checks the "Authorization" header for a valid token.
 */
const authMiddleware = (req, res, next) => {
    // Get token from header: "Bearer <token>"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: No token provided"
        });
    }

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Add the user ID to the request object so controllers can use it
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;