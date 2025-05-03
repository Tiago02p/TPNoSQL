import { useState } from 'react';
import axios from 'axios';

function CommentForm({ movieId, onCommentAdded, editingComment = null, onCancelEdit }) {
  const [formData, setFormData] = useState({
    name: editingComment?.name || '',
    email: editingComment?.email || '',
    text: editingComment?.text || ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editingComment) {
        // Update existing comment
        await axios.put(`${import.meta.env.VITE_API_URL}/comments/${editingComment._id}`, {
          text: formData.text
        });
        onCommentAdded();
        onCancelEdit();
      } else {
        // Create new comment
        await axios.post(`${import.meta.env.VITE_API_URL}/comments`, {
          movie_id: movieId,
          ...formData
        });
        setFormData({ name: '', email: '', text: '' });
        onCommentAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {error && <div className="error-message">{error}</div>}
      
      {!editingComment && (
        <>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </>
      )}
      
      <div className="form-group">
        <label htmlFor="text">Comment *</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          required
          rows="4"
        />
      </div>
      
      <div className="form-actions">
        {editingComment && (
          <button type="button" onClick={onCancelEdit} className="cancel-button">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Saving...' : editingComment ? 'Update Comment' : 'Add Comment'}
        </button>
      </div>
    </form>
  );
}

export default CommentForm; 