const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: String, // Hum sirf date save karenge jaise "2026-10-25" taake daily ek hi record bane
    required: true 
  },
  checkInTime: { 
    type: Date,
    required: true
  },
  checkOutTime: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['Present', 'Late', 'Half-Day', 'Absent'], 
    default: 'Present' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);