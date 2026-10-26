const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Vercel ke liye Advanced CORS Configuration
app.use(cors({
    origin: '*', // Abhi hackathon ke liye sab allow kar diya hai
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Vercel 403 Preflight block fix karne ke liye
app.options('*', cors());

app.use(express.json());

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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('HCM Lite Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// VERCEL SERVERLESS DEPLOYMENT KE LIYE YEH LINE SABSE ZAROORI HAI
module.exports = app;