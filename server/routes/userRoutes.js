const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// Naya HR Account banane ka route (Sirf Admin)
router.post('/create-hr', protect, authorize('Admin'), async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check karte hain ke is email se koi aur account toh nahi hai
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Is email se account pehle hi majood hai!" });
        }

        // Password ko encrypt (hash) karna
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // HR create karna
        const hrUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'HR' // System khud role HR set kar raha hai
        });

        await hrUser.save();
        res.status(201).json({ 
            message: "HR account successfully ban gaya!", 
            user: { name: hrUser.name, email: hrUser.email, role: hrUser.role } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;