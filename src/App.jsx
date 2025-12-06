import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from './actions/userAction';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Login from './pages/Login';
import PlaylistsPage from './pages/PlayLists';
import Contact from './pages/Contact';
import MatchWiseClips from './pages/MatchWiseClips';
import MatchClips from './pages/MatchClips';
import Tasks from './pages/Tasks';
import Navbar from './components/Navbar';
import SeriesWiseClips from './pages/SeriesWiseClips';


function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/match-wise" element={<MatchWiseClips />} />
          <Route path="/match/:matchId" element={<MatchClips />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/series-wise" element={<SeriesWiseClips />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

