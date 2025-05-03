const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('sample_mflix');
    return db;
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
}

function getDb() {
  return db;
}

module.exports = { connectToDatabase, getDb };