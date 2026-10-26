const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Company = require('../models/Company');
const Department = require('../models/Department');

// Company settings create ya update karne ka route (Sirf Admin)
router.post('/company', protect, authorize('Admin'), async (req, res) => {
    try {
        let company = await Company.findOne();
        if (company) {
            // Agar pehle se bani hai toh update karo
            company = await Company.findOneAndUpdate({}, req.body, { returnDocument: 'after' });
        } else {
            // Nahi toh nayi banao
            company = new Company(req.body);
            await company.save();
        }
        res.json({ message: "Company settings save ho gayin!", company });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// Naya Department banane ka route (Sirf Admin)
router.post('/department', protect, authorize('Admin'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const department = new Department({ name, description });
        await department.save();
        res.status(201).json({ message: "Department successfully ban gaya!", department });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error aaya hai, shayad yeh department pehle se majood hai." });
    }
});
module.exports = router;