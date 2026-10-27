const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); 

dotenv.config();
const app = express();

// 1. Standard CORS (Vercel ke preflight ko automatically pass karega)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// 2. Vercel Serverless Database Connection Caching (500 Error Fix)
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const DB_URI = process.env.MONGO_URI;
    if (!DB_URI) throw new Error("CRITICAL ERROR: MONGO_URI is missing!");
    
    const db = await mongoose.connect(DB_URI);
    cachedDb = db;
    console.log('MongoDB Connected successfully!');
    return db;
}

// 3. Global DB Middleware - Har route se pehle connection ensure karega
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('DB Connection Error:', error);
        res.status(500).json({ message: 'Database Connection Failed' });
    }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/setup', require('./routes/setupRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));

app.get('/', (req, res) => {
    res.send('HCM Lite Backend is running completely stable!');
});

// 4. Prevent App Listen on Vercel (Avoids hanging/port clashes)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Vercel Serverless Export
module.exports = app;