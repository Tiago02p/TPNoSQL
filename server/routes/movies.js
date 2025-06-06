const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../models/db');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'API Key is set' : 'API Key is not set');

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
      movies: movies || [],
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

// Get LLM-based movie recommendations
router.post('/recommend', async (req, res) => {
  try {
    const { prompt, userType = 'casual' } = req.body;
    console.log('Getting recommendations:', { prompt, userType });
    
    const db = getDb();
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }

    console.log('Fetching movies for recommendations...');
    const movies = await db.collection('movies')
      .find({})
      .project({ title: 1, year: 1, genre: 1, plot: 1, rating: 1 })
      .toArray();

    console.log(`Found ${movies.length} movies for recommendations`);

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

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      response_format: { type: "json_object" }
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);
    console.log('Received recommendations from OpenAI');
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

module.exports = router;