function Comment({ comment }) {
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
  
    return (
      <div className="comment">
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
      </div>
    );
  }
  
  export default Comment;