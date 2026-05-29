const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const queueRoutes = require('./routes/queue');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (weak/broad CORS config)

// trusted production frontend domains
const whitelist = ['https://localhost:3000', 'https://yourdomain.com'];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Restrict verbs
  allowedHeaders: ['Content-Type', 'Authorization'], // Restrict headers
  credentials: true, // Required for cookies, authorization headers, or TLS client certificates
  // optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Different for local and production
if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
} else {
  // Allow all origins in local development
  app.use(cors()); 
}

// Body parser
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Hospital Appointment and Queue Management System (HAQMS) Backend API',
    status: 'Running',
    version: '1.0.0-deliberate-bugs'
  });
});

// GLOBAL ERROR HANDLER
// BUG: Improper error handling. It returns the raw error stack trace to the client,
// which leaks details about database types, schema layout, and file paths.
app.use((err, req, res, next) => {
  console.error('[CRITICAL-ERROR]:', err);
  const errorResponse = {
    message: 'An unexpected internal server error occurred!',
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
});

// Listen on port
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`   HAQMS BACKEND SERVER IS RUNNING ON PORT ${PORT}`);
  console.log(`   ENVIRONMENT: ${process.env.NODE_ENV}`);
  console.log(`===================================================`);
});

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Intentionally do not exit process so candidates see unhandled promise logs
});
