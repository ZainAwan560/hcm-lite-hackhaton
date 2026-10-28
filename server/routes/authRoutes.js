const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Company = require('../models/Company');
const router = express.Router();

// ─── CHECK IF ADMIN EXISTS (Frontend uses this at startup) ───────────────────
router.get('/setup/status', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'Admin' });
        res.json({ adminExists: !!adminExists });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── ADMIN SIGNUP: Create Admin + Company ────────────────────────────────────
router.post('/setup', async (req, res) => {
    try {
        const { companyName, name, email, password } = req.body;

        if (!companyName || !name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Create or update company record
        let company = await Company.findOne();
        if (company) {
            company.name = companyName;
            await company.save();
        } else {
            company = new Company({ name: companyName });
            await company.save();
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const admin = new User({ name, email: email.toLowerCase(), password: hashedPassword, role: 'Admin' });
        await admin.save();

        const token = jwt.sign(
            { userId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Admin account created successfully!',
            token,
            user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) return res.status(409).json({ message: 'This email is already registered. Please use a different email.' });
        res.status(500).json({ message: 'Server error.' });
    }
});

// ─── LOGIN (All roles: Admin, HR, Employee) ───────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email?.toLowerCase() });

        if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

        if (user.status === 'Suspended') {
            return res.status(403).json({ message: 'Your account has been suspended. Contact your administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password.' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── REGISTER (Admin creates HR or Employee accounts) ────────────────────────
router.post('/register', protect, authorize('Admin', 'HR'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const accountRole = role || 'Employee';

        if (!['HR', 'Employee'].includes(accountRole)) {
            return res.status(400).json({ message: 'Admin can only create HR or Employee accounts.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name, email: email.toLowerCase(), password: hashedPassword, role: accountRole });
        await user.save();

        res.status(201).json({
            message: `${accountRole} account created successfully.`,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'This email is already registered.' });
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ─── GET ALL USERS (Admin & HR) ───────────────────────────────────────────────
router.get('/users', protect, authorize('Admin', 'HR'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// ─── UPDATE USER STATUS (Admin only) ─────────────────────────────────────────
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

        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json({ message: `User status updated to ${status}.`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status.' });
    }
});

module.exports = router;
