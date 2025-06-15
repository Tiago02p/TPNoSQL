import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const MovieRecommendations = () => {
  const [prompt, setPrompt] = useState('');
  const [userType, setUserType] = useState('casual');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [movieWarning, setMovieWarning] = useState(null);
  const navigate = useNavigate();

  console.log('MovieRecommendations render state:', {
    prompt,
    userType,
    hasRecommendations: !!recommendations,
    loading,
    error
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting recommendation request:', { prompt, userType });
    
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/movies/recommend`;
      console.log('Making API request to:', apiUrl);
      
      const response = await axios.post(apiUrl, {
        prompt,
        userType
      });
      
      console.log('Received recommendations:', {
        recommendationsCount: response.data.recommendations?.length || 0,
        hasExplanation: !!response.data.explanation
      });
      
      setRecommendations(response.data);
    } catch (err) {
      console.error('Error getting recommendations:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (e, movieTitle) => {
    e.preventDefault();
    setMovieWarning(null);
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies/check/${encodeURIComponent(movieTitle)}`);
      
      if (response.data.exists) {
        navigate(`/movie/${response.data.id}`);
      } else {
        setMovieWarning(`"${movieTitle}" is not in our database. It was recommended by AI but we don't have its details.`);
      }
    } catch (err) {
      console.error('Error checking movie:', err);
      setMovieWarning('Error checking if movie exists. Please try again.');
    }
  };

  return (
    <div className="movie-recommendations">
      <Link to="/" className="back-link">← Back to Movies</Link>
      <h2>AI Movie Recommendations</h2>
      
      {movieWarning && (
        <div className="movie-warning">
          {movieWarning}
        </div>
      )}

      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-group">
          <label htmlFor="userType">I am a:</label>
          <select
            id="userType"
            value={userType}
            onChange={(e) => {
              console.log('User type changed to:', e.target.value);
              setUserType(e.target.value);
            }}
            className="form-select"
          >
            <option value="casual">Casual Viewer</option>
            <option value="critic">Film Critic</option>
            <option value="enthusiast">Genre Enthusiast</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="prompt">Ask for recommendations:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => {
              console.log('Prompt updated:', e.target.value);
              setPrompt(e.target.value);
            }}
            placeholder="e.g., What movies should I watch if I liked Inception?"
            className="form-textarea"
            rows="3"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !prompt.trim()} 
          className={`submit-button ${(!prompt.trim() || loading) ? 'disabled' : ''}`}
        >
          {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {recommendations && (
        <div className="recommendations-results">
          <h3>Recommendations</h3>
          <p className="explanation">{recommendations.explanation}</p>
          
          <div className="recommendations-list">
            {recommendations.recommendations.map((rec, index) => {
              console.log('Rendering recommendation:', { index, title: rec.title });
              return (
                <div 
                  key={index} 
                  className="recommendation-card"
                  onClick={(e) => handleMovieClick(e, rec.title)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleMovieClick(e, rec.title);
                    }
                  }}
                >
                  <h4>{rec.title}</h4>
                  <p>{rec.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieRecommendations; 