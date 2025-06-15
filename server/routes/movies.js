const express = require('express');
const axios = require('axios');
const { ObjectId } = require('mongodb');
const { getDb } = require('../models/db');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

require('dotenv').config(); // or import 'dotenv/config';

const router = express.Router();

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
    
    console.log('Fetching movies:', { page, limit });
    
    const db = getDb();
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }

    console.log('Executing movies query...');
    const movies = await db.collection('movies')
      .find({})
      .project({ title: 1, year: 1, poster: 1, _id: 1 })
      .sort({ year: -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray();
    
    console.log(`Found ${movies.length} movies`);
    if (movies.length > 0) {
      console.log('Sample movie:', {
        id: movies[0]._id,
        title: movies[0].title,
        year: movies[0].year,
        hasPoster: !!movies[0].poster
      });
    }
    
    const total = await db.collection('movies').countDocuments();
    console.log(`Total movies in database: ${total}`);
    
    const response = {
      movies,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
    
    console.log('Sending response:', {
      moviesCount: response.movies.length,
      totalPages: response.totalPages,
      currentPage: response.currentPage
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching movies:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Get LLM-based movie recommendations
router.post('/recommend', async (req, res) => {
  try {
    const { prompt, userType = 'casual' } = req.body;
    console.log('[Request] /recommend called with:', { prompt, userType });

    if (!prompt) {
      console.warn('[Validation] Missing prompt');
      return res.status(400).json({ message: 'Prompt is required' });
    }

    if (!SYSTEM_PROMPTS[userType]) {
      console.warn('[Validation] Invalid user type:', userType);
      return res.status(400).json({ message: 'Invalid user type' });
    }

    console.log('Getting recommendations for userType:', userType);

    const db = getDb();
    if (!db) {
      console.error('[Database] Connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }

    console.log('[Database] Fetching movies...');
    const movies = await db.collection('movies')
      .find({})
      .project({ title: 1, year: 1, genre: 1, plot: 1, rating: 1 })
      .toArray();

    if (!movies || movies.length === 0) {
      console.warn('[Database] No movies found');
      return res.status(404).json({ message: 'No movies found in database' });
    }

    console.log(`[Database] Found ${movies.length} movies`);

    const systemPrompt = SYSTEM_PROMPTS[userType];
    const trimmedMovies = movies
      .filter(m => m.genre && m.rating) // only include well-formed movies
      .slice(0, 50); // limit to 50 movies max

    const movieList = trimmedMovies.map(m =>
      `${m.title} (${m.year}) - Genre: ${m.genre}, Rating: ${m.rating}`
    ).join('\n');

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[Config] OPENROUTER_API_KEY not set');
      return res.status(500).json({ message: 'API key is not configured' });
    }

    // Prepare the messages for OpenRouter
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here are the movies from the database:\n\n${movieList}\n\nBased on this, answer: ${prompt}\n\nRespond in this format:\n{
          "recommendations": [
            {
              "title": "Movie Title",
              "reason": "Why this matches the query"
            }
          ],
          "explanation": "Short summary"
        }`
      }
    ];

    console.log('[OpenRouter] Sending request to OpenRouter API...');

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mixtral-8x7b-instruct',
      messages: messages
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      console.error('[OpenRouter] Non-200 response:', response.status, response.data);
      return res.status(500).json({ message: 'Error from OpenRouter', details: response.data });
    }

    console.log('[OpenRouter] Response received');

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[OpenRouter] Empty response content');
      return res.status(500).json({ message: 'Empty response from OpenRouter' });
    }

    try {
      const json = JSON.parse(content);
      console.log('[OpenRouter] Parsed JSON response successfully');
      res.json(json);
    } catch (parseError) {
      console.error('[Parse Error] Failed to parse JSON from OpenRouter response:', content);
      res.status(500).json({ message: 'Invalid JSON from model', raw: content });
    }

  } catch (error) {
    console.error('[Error] Exception caught in /recommend:', error);

    if (error.name === 'OpenRouterError') {
      console.error('[OpenRouterError]', error.message);
      return res.status(500).json({
        message: 'Error communicating with OpenRouter',
        details: error.message
      });
    }

    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      console.error('[SyntaxError] JSON parsing issue:', error.message);
      return res.status(500).json({
        message: 'Error parsing OpenRouter response',
        details: error.message
      });
    }

    res.status(500).json({
      message: 'Error getting recommendations',
      details: error.message
    });
  }
});

// Get single movie with comments
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    console.log('Fetching movie details for ID:', movieId);
    
    const db = getDb();
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }

    let movieIdObj;
    try {
      movieIdObj = new ObjectId(movieId);
    } catch (error) {
      console.error('Invalid movie ID format:', movieId);
      return res.status(400).json({ message: 'Invalid movie ID format' });
    }
    
    console.log('Executing movie query...');
    const movie = await db.collection('movies').findOne({ _id: movieIdObj });
    
    if (!movie) {
      console.log('Movie not found:', movieId);
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    console.log('Fetching comments for movie:', movieId);
    const comments = await db.collection('comments')
      .find({ movie_id: movieIdObj })
      .sort({ date: -1 })
      .limit(20)
      .toArray();
    
    console.log(`Found ${comments.length} comments for movie ${movieId}`);
    
    res.json({ movie, comments });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

// Check if movie exists by title
router.get('/check/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title);
    console.log('Checking if movie exists:', title);
    
    const db = getDb();
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    const movie = await db.collection('movies').findOne(
      { title: { $regex: new RegExp(`^${title}$`, 'i') } },
      { projection: { _id: 1 } }
    );
    
    if (!movie) {
      console.log('Movie not found:', title);
      return res.json({ exists: false });
    }
    
    console.log('Movie found:', { title, id: movie._id });
    res.json({ exists: true, id: movie._id });
  } catch (error) {
    console.error('Error checking movie:', error);
    res.status(500).json({ message: 'Error checking movie' });
  }
});

module.exports = router;