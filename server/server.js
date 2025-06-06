const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./models/db');
const moviesRoutes = require('./routes/movies');
const commentsRoutes = require('./routes/comments');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting server with configuration:', {
  PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'URI is set' : 'URI is not set'
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/movies', moviesRoutes);
app.use('/api/comments', commentsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
async function startServer() {
  try {
    console.log('Initializing server...');
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`Movies API available at: http://localhost:${PORT}/api/movies`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();