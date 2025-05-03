import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Comment from './Comment';

function MovieDetails() {
  const { id } = useParams();
  const [movieData, setMovieData] = useState({ movie: null, comments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
        setMovieData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching movie details. Please try again later.');
        setLoading(false);
        console.error('Error fetching movie details:', err);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) return <div className="loading">Loading movie details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!movieData.movie) return <div className="error">Movie not found</div>;

  const { movie, comments } = movieData;

  return (
    <div className="movie-details">
      <Link to="/" className="back-link">← Back to Movies</Link>
      
      <div className="movie-header">
        <div className="poster-container">
          {movie.poster ? (
            <img 
              src={movie.poster} 
              alt={`${movie.title} poster`} 
              className="movie-poster-large"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
              }}
            />
          ) : (
            <div className="no-poster large">No poster available</div>
          )}
        </div>
        
        <div className="movie-info-container">
          <h1>{movie.title} {movie.year && `(${movie.year})`}</h1>
          
          {movie.rated && <span className="movie-rating">{movie.rated}</span>}
          
          <div className="movie-meta">
            {movie.runtime && <span>{movie.runtime} min</span>}
            {movie.genres && movie.genres.length > 0 && (
              <span className="genres">{movie.genres.join(', ')}</span>
            )}
            {movie.released && <div>Released: {new Date(movie.released.$date).toLocaleDateString()}</div>}
          </div>
          
          {movie.directors && movie.directors.length > 0 && (
            <div className="directors">
              <strong>Director{movie.directors.length > 1 ? 's' : ''}:</strong> {movie.directors.join(', ')}
            </div>
          )}
          
          {movie.cast && movie.cast.length > 0 && (
            <div className="cast">
              <strong>Cast:</strong> {movie.cast.join(', ')}
            </div>
          )}
          
          {movie.plot && (
            <div className="plot">
              <h3>Plot</h3>
              <p>{movie.plot}</p>
            </div>
          )}
          
          {movie.imdb && (
            <div className="ratings">
              <h3>Ratings</h3>
              <div className="imdb-rating">
                <strong>IMDb:</strong> {movie.imdb.rating} ({movie.imdb.votes} votes)
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="comments-section">
        <h2>Comments ({comments.length})</h2>
        {comments.length === 0 ? (
          <p>No comments for this movie.</p>
        ) : (
          <div className="comments-list">
            {comments.map(comment => (
              <Comment key={comment._id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieDetails;