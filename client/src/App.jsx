import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MovieList from './components/MovieList';
import MovieDetails from './components/MovieDetails';
import MovieRecommendations from './components/MovieRecommendations';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>🎬 Movie Database</h1>
        </header>
        <main className="app-content">
          <Routes>
            <Route path="/" element={<MovieList />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/recommendations" element={<MovieRecommendations />} />
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