const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./models/db');
const moviesRoutes = require('./routes/movies');
const commentsRoutes = require('./routes/comments');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', moviesRoutes);
app.use('/api/comments', commentsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();