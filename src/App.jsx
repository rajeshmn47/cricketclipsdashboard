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
import WicketKeepers from './pages/WicketKeepers';
import FastKeeperAssigner from './pages/FastestKeeperAssigner';
import DismissalsTable from './pages/Dismissals';
import KeeperFixDashboard from './pages/MissingWk';
import BowlerBatsmanRivalry from '../../../cricinfo/src/pages/BatsmanBowlerRivalry';
import AddPlayersPage from './pages/AddingPlayers';
import ClipNameEditor from './pages/ClipnameEditor';
import MissingHandsEditor from './pages/MissingHands';


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
          <Route path="/wicket-keepers" element={<WicketKeepers />} />
          <Route path="/fastest-keeper-assigner" element={<FastKeeperAssigner />} />
          <Route path="/dismissals" element={<DismissalsTable />} />
          <Route path="/missing-wicket-keepers" element={<KeeperFixDashboard />} />
          <Route path="/add-players" element={<AddPlayersPage />} />
          <Route path="/clip-editor" element={<ClipNameEditor />} />
          <Route path="*" element={<Dashboard />} />
          <Route path="/rivalry" element={<BowlerBatsmanRivalry />} />
          <Route path="/missing-hands" element={<MissingHandsEditor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

