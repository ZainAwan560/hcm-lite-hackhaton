const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. HR: Generate Draft
router.post('/draft', protect, authorize('HR', 'Admin'), async (req, res) => {
    try {
        const basicSalary = Number(req.body.basicSalary);
        const deductions = Number(req.body.deductions || 0);

        if (!Number.isFinite(basicSalary) || !Number.isFinite(deductions) || basicSalary < 0 || deductions < 0 || deductions > basicSalary) {
            return res.status(400).json({ message: 'Salary and deductions must be valid non-negative amounts.' });
        }

        const newPayroll = new Payroll({
            userId: req.body.userId,
            empName: req.body.empName,
            month: req.body.month,
            basicSalary,
            deductions,
            netPay: basicSalary - deductions,
            status: 'Pending Admin Approval'
        });
        await newPayroll.save();
        res.status(201).json(newPayroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating draft', error });
    }
});

// 2. Admin & HR: Get All Payrolls
router.get('/all', protect, authorize('Admin', 'HR'), async (req, res) => {
    try {
        const payrolls = await Payroll.find().sort({ createdAt: -1 });
        res.status(200).json(payrolls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payrolls', error });
    }
});

// 3. Employee: Get My Approved Payrolls
router.get('/me', protect, authorize('Employee'), async (req, res) => {
    try {
        // FIX: req.user.userId check karna hai
        const payrolls = await Payroll.find({ userId: req.user.userId, status: 'Approved & Locked' }).sort({ createdAt: -1 });
        res.status(200).json(payrolls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching your payrolls', error });
    }
});

// 4. Admin: Approve & Lock Payroll
router.put('/:id/finalize', protect, authorize('Admin'), async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndUpdate(
            req.params.id,
            { status: 'Approved & Locked' },
            { returnDocument: 'after', runValidators: true }
        );
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found.' });
        }
        res.status(200).json(payroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving payroll', error });
    }
});

// 5. Admin: Reject Payroll
router.put('/:id/reject', protect, authorize('Admin'), async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndUpdate(
            req.params.id,
            { status: 'Rejected', reason: req.body.reason },
            { returnDocument: 'after', runValidators: true }
        );
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found.' });
        }
        res.status(200).json(payroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error rejecting payroll', error });
    }
});

module.exports = router;