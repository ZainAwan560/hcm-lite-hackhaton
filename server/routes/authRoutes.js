const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User'); 
const router = express.Router();

// First-run Setup: Admin Account banana
router.post('/setup', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'Admin' });
        if (adminExists) {
            return res.status(400).json({ message: "Admin account pehle se majood hai!" });
        }

        const { name, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

// Hackathon: Employee, HR, aur Admin self-registration is OPEN
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Default 'Employee', warna frontend ka bheja hua role
        const accountRole = role || 'Employee'; 
        
        if (!['Admin', 'HR', 'Employee'].includes(accountRole)) {
            return res.status(400).json({ message: 'Invalid account role.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: accountRole 
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } 
        );

        res.status(201).json({
            message: "Account successfully create ho gaya!",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        // Fix: Duplicate email par ab crash nahi aayega (409 Conflict)
        if (error.code === 11000) {
            return res.status(409).json({ message: "Yeh email pehle se registered hai!" });
        }
        console.error(error);
        res.status(500).json({ message: "Registration mein server error aa gaya" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Galat email ya password" });
        }

        if (user.status === 'Suspended') {
            return res.status(403).json({ message: 'This account has been suspended. Contact an administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Galat email ya password" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } 
        );

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

// Test Protected Route
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

// Update User Status
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