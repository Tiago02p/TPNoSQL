const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../models/db');

const router = express.Router();

// Create a new comment
router.post('/', async (req, res) => {
  try {
    const { movie_id, name, email, text } = req.body;
    
    if (!movie_id || !name || !text) {
      return res.status(400).json({ message: 'Movie ID, name, and text are required' });
    }

    const db = getDb();
    const comment = {
      movie_id: new ObjectId(movie_id),
      name,
      email,
      text,
      date: new Date()
    };

    const result = await db.collection('comments').insertOne(comment);
    comment._id = result.insertedId;
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// Update a comment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const db = getDb();
    const result = await db.collection('comments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { text, date: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const result = await db.collection('comments').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

module.exports = router; 