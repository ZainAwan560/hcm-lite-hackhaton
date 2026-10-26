const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    empName: { type: String, required: true },
    month: { type: String, required: true },
    basicSalary: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Pending Admin Approval', 'Approved & Locked', 'Rejected'], 
        default: 'Pending Admin Approval' 
    },
    reason: { type: String, default: '' } // For Admin Rejection reason
}, { timestamps: true });

module.exports = mongoose.model('Payroll', payrollSchema);