const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// 🚀 BULLETPROOF VERCEL CORS MIDDLEWARE (100% Fix for 500/403 Errors)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Agar request sirf check (OPTIONS) karne aayi hai, toh fauran 200 OK bhej do
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const setupRoutes = require('./routes/setupRoutes');
app.use('/api/setup', setupRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

const leaveRoutes = require('./routes/leaveRoutes');
app.use('/api/leaves', leaveRoutes);
 
const payrollRoutes = require('./routes/payrollRoutes');
app.use('/api/payroll', payrollRoutes);

// MongoDB Connection Error Handling
const DB_URI = process.env.MONGO_URI;
if (!DB_URI) {
    console.error("CRITICAL ERROR: MONGO_URI is missing in Environment Variables!");
}

mongoose.connect(DB_URI || "mongodb://localhost:27017/fallback")
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('HCM Lite Backend is running without CORS issues!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Vercel Serverless Export
module.exports = app;