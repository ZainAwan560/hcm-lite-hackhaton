const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect Middleware: Check karega ke user ke paas valid Token hai ya nahi
const protect = async (req, res, next) => {
    let token = req.header('Authorization');
    
    if (!token) {
        return res.status(401).json({ message: "Access denied. Token nahi mila." });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: "Galat ya expire token." });
    }

    try {
        const user = await User.findById(decoded.userId).select('role status');
        if (!user) {
            return res.status(401).json({ message: "Account nahi mila." });
        }
        if (user.status === 'Suspended') {
            return res.status(403).json({ message: "Aapka account suspend kar diya gaya hai." });
        }

        req.user = { ...decoded, role: user.role };
        next();
    } catch (error) {
        console.error("Authentication lookup failed:", error);
        res.status(500).json({ message: "Authentication check mein server error aa gaya." });
    }
};

// 2. Authorize Middleware: Check karega ke user ki role allowed hai ya nahi
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Aapko is action ki ijazat nahi hai." });
        }
        next();
    };
};

module.exports = { protect, authorize };