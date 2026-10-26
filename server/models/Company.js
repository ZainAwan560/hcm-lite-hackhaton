const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  officeHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },
  graceTimeMinutes: { type: Number, default: 15 },
  halfDayUnderHours: { type: Number, default: 5 },
  weekend: { type: [String], default: ['Saturday', 'Sunday'] },
  officeLocation: {
    lat: { type: Number },
    lng: { type: Number },
    radiusMeters: { type: Number, default: 150 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);