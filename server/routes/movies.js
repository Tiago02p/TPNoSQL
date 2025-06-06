const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../models/db');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompts for different user types
const SYSTEM_PROMPTS = {
  casual: "You are a friendly movie recommendation assistant. Focus on popular, accessible films that are widely enjoyed. Keep recommendations light and entertaining.",
  critic: "You are a film critic with deep knowledge of cinema. Focus on artistic merit, technical aspects, and cultural significance. Provide detailed analysis.",
  enthusiast: "You are a genre film enthusiast. Focus on specific genres, subgenres, and niche films. Highlight unique aspects and hidden gems."
};

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

// Get LLM-based movie recommendations
router.post('/recommend', async (req, res) => {
  try {
    const { prompt, userType = 'casual' } = req.body;
    
    // Get all movies from database
    const db = getDb();
    const movies = await db.collection('movies')
      .find({})
      .project({ title: 1, year: 1, genre: 1, plot: 1, rating: 1 })
      .toArray();

    // Prepare the messages for OpenAI
    const messages = [
      { role: "system", content: SYSTEM_PROMPTS[userType] },
      { 
        role: "user", 
        content: `Here's a list of movies in our database: ${JSON.stringify(movies)}. 
                 Based on this list, please answer the following question: ${prompt}
                 Format your response as a JSON object with the following structure:
                 {
                   "recommendations": [
                     {
                       "title": "Movie Title",
                       "reason": "Detailed explanation why this movie matches the query"
                     }
                   ],
                   "explanation": "Overall explanation of the recommendations"
                 }`
      }
    ];

    // Get recommendations from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      response_format: { type: "json_object" }
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

module.exports = router;