import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MovieList from './components/MovieList';
import MovieDetails from './components/MovieDetails';
import MovieRecommendations from './components/MovieRecommendations';
import './App.css';

function App() {
  console.log('App component rendering');

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <header className="app-header">
          <h1>🎬 Movie Database</h1>
        </header>
        <main className="app-content">
          <Routes>
            <Route 
              path="/" 
              element={<MovieList />} 
              onError={(error) => {
                console.error('Error in MovieList route:', error);
              }}
            />
            <Route 
              path="/movie/:id" 
              element={<MovieDetails />}
              onError={(error) => {
                console.error('Error in MovieDetails route:', error);
              }}
            />
            <Route 
              path="/recommendations" 
              element={<MovieRecommendations />}
              onError={(error) => {
                console.error('Error in MovieRecommendations route:', error);
              }}
            />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>Movie Database App - Sample Mflix Dataset</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;