const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../models/db');

const router = express.Router();

// Get all movies (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    const db = getDb();
    const movies = await db.collection('movies')
      .find({})
      .project({ title: 1, year: 1, poster: 1 })
      .sort({ year: -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray();
    
    const total = await db.collection('movies').countDocuments();
    
    res.json({
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Get single movie with comments
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const movieId = new ObjectId(req.params.id);
    
    const movie = await db.collection('movies').findOne({ _id: movieId });
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Fetch comments for this movie
    const comments = await db.collection('comments')
      .find({ movie_id: movieId })
      .sort({ date: -1 })
      .limit(20)
      .toArray();
    
    res.json({ movie, comments });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

module.exports = router;