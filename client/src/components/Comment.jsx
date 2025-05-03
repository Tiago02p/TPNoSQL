import { useState } from 'react';
import axios from 'axios';

function Comment({ comment, onCommentUpdated, onCommentDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown date';
    
    try {
      // Handle MongoDB date format
      const date = dateObj.$date ? new Date(dateObj.$date) : new Date(dateObj);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(comment.text);
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/comments/${comment._id}`, {
        text: editedText
      });
      onCommentUpdated();
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/comments/${comment._id}`);
      onCommentDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting comment');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="comment editing">
        {error && <div className="error-message">{error}</div>}
        <div className="comment-header">
          <span className="comment-name">{comment.name}</span>
          <span className="comment-date">{formatDate(comment.date)}</span>
        </div>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="edit-textarea"
          rows="4"
        />
        <div className="comment-actions">
          <button onClick={handleCancel} disabled={loading} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="save-button">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment">
      {error && <div className="error-message">{error}</div>}
      <div className="comment-header">
        <span className="comment-name">{comment.name}</span>
        <span className="comment-date">{formatDate(comment.date)}</span>
      </div>
      <div className="comment-text">{comment.text}</div>
      {comment.email && (
        <div className="comment-email">
          <em>From: {comment.email}</em>
        </div>
      )}
      <div className="comment-actions">
        <button onClick={handleEdit} disabled={loading} className="edit-button">
          Edit
        </button>
        <button onClick={handleDelete} disabled={loading} className="delete-button">
          Delete
        </button>
      </div>
    </div>
  );
}

export default Comment;