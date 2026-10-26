const express = require('express');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// 1. Employee Leave Apply Karta Hai
router.post('/apply', protect, authorize('Employee'), async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const leaveType = req.body.leaveType || req.body.type;
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (!['Sick', 'Casual', 'Annual'].includes(leaveType)) {
            return res.status(400).json({ message: 'Invalid leave type.' });
        }

        if (
            !startDate ||
            !endDate ||
            Number.isNaN(parsedStartDate.getTime()) ||
            Number.isNaN(parsedEndDate.getTime()) ||
            parsedEndDate < parsedStartDate
        ) {
            return res.status(400).json({ message: 'Leave end date must be on or after the start date.' });
        }
        
        const newLeave = new Leave({
            employeeId: req.user.userId,
            leaveType,
            startDate,
            endDate,
            reason
        });

        await newLeave.save();
        res.status(201).json({ message: "Chutti ki request successfully submit ho gayi hai!", leave: newLeave });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

router.get('/me', protect, authorize('Employee'), async (req, res) => {
    try {
        const leaves = await Leave.find({ employeeId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

// 2. HR/Admin Saari Pending ya Approved Leaves Dekhte Hain
router.get('/all', protect, authorize('HR', 'Admin'), async (req, res) => {
    try {
        // .populate se humein us user ka naam aur email bhi mil jayega jisne chutti apply ki hai
        const leaves = await Leave.find().populate('employeeId', 'name email').sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

// 3. HR/Admin Leave ko Approve ya Reject Karte Hain
router.put('/:id/status', protect, authorize('HR', 'Admin'), async (req, res) => {
    try {
        const { status } = req.body; // Frontend se 'Approved' ya 'Rejected' aayega

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid leave status.' });
        }
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave record nahi mila!" });
        }

        leave.status = status;
        await leave.save();

        res.status(200).json({ message: `Leave status update ho kar ${status} ho gaya hai!`, leave });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error aa gaya" });
    }
});

module.exports = router;