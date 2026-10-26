const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// HR naya employee register karta hai
router.post('/register', protect, authorize('HR', 'Admin'), async (req, res) => {
    try {
        const { name, email, password, departmentId, department, designation, basicSalary, joiningDate } = req.body;

        // Check karo email pehle se use toh nahi ho rahi
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Is email se account pehle hi majood hai!" });
        }

        // Password hash karo (PDF ke mutabiq temporary password hoga jo pehli baar login par change hoga)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. User account banao (Role automatically 'Employee' set hoga)
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'Employee'
        });
        await newUser.save();

        // 2. Employee ki job details save karo
        const newEmployee = new Employee({
            userId: newUser._id,
            departmentId,
            department,
            designation,
            basicSalary,
            joiningDate
        });
        await newEmployee.save();

        res.status(201).json({ message: "Employee successfully register ho gaya!", employee: newEmployee });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

module.exports = router;