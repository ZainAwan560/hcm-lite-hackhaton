const express = require('express');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// Get Today's String function for perfect DB matching
const getTodayDateString = () => {
    const today = new Date();
    // YYYY-MM-DD local format
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

router.get('/all', protect, authorize('Admin', 'HR'), async (req, res) => {
    try {
        const attendance = await Attendance.find().sort({ date: -1, createdAt: -1 });
        res.status(200).json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error aa gaya' });
    }
});

router.get('/me', protect, authorize('Employee'), async (req, res) => {
    try {
        const attendance = await Attendance.find({ employeeId: req.user.userId }).sort({ date: -1, createdAt: -1 });
        res.status(200).json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error aa gaya' });
    }
});

// Employee Check-Out API
const checkOut = async (req, res) => {
    try {
        const employeeId = req.user.userId;
        const today = getTodayDateString();

        const attendance = await Attendance.findOne({ employeeId, date: today });

        if (!attendance) {
            return res.status(400).json({ message: "Aapne aaj check-in hi nahi kiya!" });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({ message: "Aap pehle hi check-out kar chuke hain!" });
        }

        attendance.checkOutTime = new Date();
        await attendance.save();

        res.status(200).json({ message: "Check-out successful! Aapki chutti ho gayi.", attendance });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
};

router.put('/checkout', protect, authorize('Employee'), checkOut);
router.post('/checkout', protect, authorize('Employee'), checkOut);

// Employee Check-In API (Fixed 8:15 AM Late Logic & Existing Bug)
router.post('/checkin', protect, authorize('Employee'), async (req, res) => {
    try {
        const employeeId = req.user.userId;
        const today = getTodayDateString(); // Exact match local string

        const existingAttendance = await Attendance.findOne({ employeeId, date: today });
        if (existingAttendance) {
            return res.status(400).json({ message: "Aap aaj pehle hi check-in kar chuke hain!" });
        }

        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        
        let status = 'Present';

        // STRICT LOGIC: Company time 8:00 AM. Grace time 15 mins.
        // Agar time 8 baj kar 15 minute se zyada hai (ya 9, 10 baj gaye hain), toh Late.
        if (currentHour > 8 || (currentHour === 8 && currentMinute > 15)) {
            status = 'Late';
        }

        const attendance = new Attendance({
            employeeId,
            date: today,
            checkInTime: currentTime,
            status
        });

        await attendance.save();
        
        const responseMsg = status === 'Late' 
            ? `Aap 8:15 AM ke baad aaye hain. Aapka status 'Late' mark ho gaya hai.` 
            : `Check-in successful! Aapka status 'Present' mark ho gaya hai.`;

        res.status(200).json({ message: responseMsg, attendance });

    } catch (error) {
        console.error("Check-in error:", error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

module.exports = router;