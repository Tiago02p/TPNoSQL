const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri ? 'URI is set' : 'URI is not set');

const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    db = client.db('sample_mflix');
    console.log('Connected to database: sample_mflix');
    
    // Verify connection by checking collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if movies collection exists and has data
    const movieCount = await db.collection('movies').countDocuments();
    console.log(`Number of movies in database: ${movieCount}`);
    
    return db;
  } catch (error) {
    console.error('Could not connect to MongoDB:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    console.warn('Database connection not established when getDb() was called');
  }
  return db;
}

module.exports = { connectToDatabase, getDb };