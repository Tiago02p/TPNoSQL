import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies?page=${page}`);
        setMovies(response.data.movies);
        setTotalPages(response.data.totalPages);
        setLoading(false);
      } catch (err) {
        setError('Error fetching movies. Please try again later.');
        setLoading(false);
        console.error('Error fetching movies:', err);
      }
    };

    fetchMovies();
  }, [page]);

  const handlePrevPage = () => {
    setPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  if (loading) return <div className="loading">Loading movies...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="movie-list">
      <h1>Movies</h1>
      <div className="movies-grid">
        {movies.map(movie => (
          <Link to={`/movie/${movie._id}`} key={movie._id} className="movie-card">
            {movie.poster ? (
              <img 
                src={movie.poster} 
                alt={`${movie.title} poster`} 
                className="movie-poster"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150x225?text=No+Poster';
                }}
              />
            ) : (
              <div className="no-poster">No poster available</div>
            )}
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>{movie.year}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={page === 0}>Previous</button>
        <span>Page {page + 1} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page >= totalPages - 1}>Next</button>
      </div>
    </div>
  );
}

export default MovieList;