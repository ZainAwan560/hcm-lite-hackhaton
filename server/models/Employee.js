const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  departmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  department: {
    type: String,
    trim: true
  },
  designation: { 
    type: String, 
    required: true 
  },
  basicSalary: { 
    type: Number, 
    required: true 
  },
  joiningDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);