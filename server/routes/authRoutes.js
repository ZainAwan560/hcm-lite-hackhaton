const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User'); // User model import kar liya
const router = express.Router();

// First-run Setup: Admin Account banana
router.post('/setup', async (req, res) => {
    try {
        // Check karte hain ke kya pehle se koi Admin majood hai
        const adminExists = await User.findOne({ role: 'Admin' });
        if (adminExists) {
            return res.status(400).json({ message: "Admin account pehle se majood hai!" });
        }

        const { name, email, password } = req.body;

        // Password ko encrypt (hash) karna zaroori hai
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Naya Admin create karna
        const admin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'Admin'
        });

        await admin.save();
        res.status(201).json({ message: "Admin account successfully ban gaya!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

const requireAdminForPrivilegedRegistration = (req, res, next) => {
    if (req.body.role === 'Employee') {
        return next();
    }

    protect(req, res, () => authorize('Admin')(req, res, next));
};

// Employee self-registration is open; only admins can create HR or Admin accounts.
router.post('/register', requireAdminForPrivilegedRegistration, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!['Admin', 'HR', 'Employee'].includes(role)) {
            return res.status(400).json({ message: 'Invalid account role.' });
        }

        // 1. Check karo ke user is email se pehle se toh nahi bana hua
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Yeh email pehle se registered hai!" });
        }

        // 2. Password ko encrypt (hash) karo
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Naya user create karo (Admin, HR, ya Employee)
        user = new User({
            name,
            email,
            password: hashedPassword,
            role // Frontend se aayega (Admin, HR, ya Employee)
        });

        await user.save();

        // 4. JWT Token banao taake signup ke foran baad auto-login ho jaye
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } 
        );

        // 5. Token aur user ka data frontend ko wapas bhejo
        res.status(201).json({
            message: "Account successfully create ho gaya!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration mein server error aa gaya" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check karo ke user is email se exist karta hai ya nahi
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Galat email ya password" });
        }

        if (user.status === 'Suspended') {
            return res.status(403).json({ message: 'This account has been suspended. Contact an administrator.' });
        }

        // 2. Password match karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Galat email ya password" });
        }

        // 3. JWT Token banao (is mein user ki ID aur Role chhupa hoga)
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token 1 din tak chalega
        );

        // 4. Token aur user ka data wapas bhejo
        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Test Protected Route (Sirf Admin ke liye)
router.post('/admin-dashboard', protect, authorize('Admin'), (req, res) => {
    res.json({ message: "Welcome Admin! Yeh secure data hai." });
});
// GET ALL USERS (For Admin Dashboard)
router.get('/users', protect, authorize('Admin', 'HR'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Users fetch karne mein error aa gaya" });
    }
});

router.put('/users/:id/status', protect, authorize('Admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Active', 'Suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after' }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: `User status updated to ${status}.`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Status update karne mein error aa gaya" });
    }
});

module.exports = router;