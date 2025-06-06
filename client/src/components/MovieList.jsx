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
      const apiUrl = '/api/movies?page=' + page;
      console.log('Fetching movies from:', apiUrl);
      
      try {
        setLoading(true);
        console.log('Making API request...');
        const response = await axios.get(apiUrl);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        console.log('API Response:', {
          moviesCount: response.data.movies?.length || 0,
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
          rawResponse: response.data
        });
        
        if (!Array.isArray(response.data.movies)) {
          throw new Error('Invalid movies data format');
        }
        
        setMovies(response.data.movies);
        setTotalPages(response.data.totalPages || 0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movies:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          error: err
        });
        setError('Error fetching movies. Please try again later.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page]);

  const handlePrevPage = () => {
    console.log('Navigating to previous page:', page - 1);
    setPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    console.log('Navigating to next page:', page + 1);
    setPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  console.log('MovieList render state:', {
    loading,
    error,
    moviesCount: movies.length,
    currentPage: page,
    totalPages,
    movies: movies.slice(0, 2) // Log first two movies for debugging
  });

  if (loading) {
    console.log('Rendering loading state');
    return <div className="loading">Loading movies...</div>;
  }
  
  if (error) {
    console.log('Rendering error state:', error);
    return <div className="error">{error}</div>;
  }
  
  if (!movies || movies.length === 0) {
    console.log('Rendering no movies state');
    return <div className="no-movies">No movies found</div>;
  }

  return (
    <div className="movie-list">
      <div className="movie-list-header">
        <h1>Movies</h1>
        <Link to="/recommendations" className="recommendations-link">
          Get AI Recommendations
        </Link>
      </div>
      <div className="movies-grid">
        {movies.map(movie => {
          console.log('Rendering movie:', { 
            id: movie._id, 
            title: movie.title,
            year: movie.year,
            hasPoster: !!movie.poster
          });
          return (
            <Link to={`/movie/${movie._id}`} key={movie._id} className="movie-card">
              {movie.poster ? (
                <img 
                  src={movie.poster} 
                  alt={`${movie.title} poster`} 
                  className="movie-poster"
                  onError={(e) => {
                    console.log('Poster load error for movie:', movie.title);
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
          );
        })}
      </div>
      <div className="pagination">
        <button 
          onClick={handlePrevPage} 
          disabled={page === 0}
          className={page === 0 ? 'disabled' : ''}
        >
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button 
          onClick={handleNextPage} 
          disabled={page >= totalPages - 1}
          className={page >= totalPages - 1 ? 'disabled' : ''}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default MovieList;