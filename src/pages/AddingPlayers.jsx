import React, { useState, useEffect } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

export default function AddPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalPlayer, setModalPlayer] = useState(null);
  const [modalForm, setModalForm] = useState({
    battingHand: '',
    bowlingHand: '',
    bowlerType: '',
  });
  const [modalSaving, setModalSaving] = useState(false);

  // Add player modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    battingHand: '',
    bowlingHand: '',
    bowlerType: '',
  });
  const [adding, setAdding] = useState(false);

  const leagueOptions = ['IPL', 'BBL', 'PSL', 'CPL', 'Test', 'ODI', 'T20'];

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let url = `${URL}/players/all_players?inClips=true`;
      if (selectedLeague) url += `&league=${encodeURIComponent(selectedLeague)}`;
      const res = await API.get(url);
      setPlayers(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch players');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [selectedLeague]);

  const isUnknownPlayer = (p) => !p.battingHand || p.battingHand === 'none';
  const sortedPlayers = [...players].sort((a, b) => {
    const aUnknown = isUnknownPlayer(a);
    const bUnknown = isUnknownPlayer(b);
    if (aUnknown && !bUnknown) return -1;
    if (!aUnknown && bUnknown) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  const filteredPlayers = sortedPlayers.filter(player =>
    player.name && player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Add player modal handlers ---
  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setError('Player name is required');
      return;
    }
    setAdding(true);
    setError('');
    setSuccess('');

    const commonPayload = {
      name: addForm.name,
      battingHand: addForm.battingHand,
      bowlingHand: addForm.bowlingHand,
      bowlerType: addForm.bowlerType,
    };

    try {
      const newPlayerPayload = {
        ...commonPayload,
        id: Date.now(),
        image: 'default',
        country_id: null,
        flagUrls: [],
        teamId: '',
        teamIds: [],
        firstname: '',
        lastname: '',
        dateofbirth: '',
        position: '',
      };
      await API.post(`${URL}/players/create`, newPlayerPayload);
      setSuccess('Player added successfully');
      setAddForm({ name: '', battingHand: '', bowlingHand: '', bowlerType: '' });
      setIsAddModalOpen(false);
      fetchPlayers();
    } catch (err) {
      setError('Failed to add player');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // --- Edit modal handlers (unchanged) ---
  const openEditModal = (player) => {
    setModalPlayer(player);
    setModalForm({
      battingHand: player.battingHand || '',
      bowlingHand: player.bowlingHand || '',
      bowlerType: player.bowlerType || '',
    });
    setIsEditModalOpen(true);
  };

  const handleModalChange = (e) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };

  const handleModalSave = async () => {
    if (!modalPlayer) return;
    setModalSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: modalPlayer.name,
      battingHand: modalForm.battingHand,
      bowlingHand: modalForm.bowlingHand,
      bowlerType: modalForm.bowlerType,
    };

    try {
      await API.put(`${URL}/players/${modalPlayer._id}`, payload);
      setSuccess('Player updated successfully');
      setIsEditModalOpen(false);
      fetchPlayers();
    } catch (err) {
      setError('Failed to update player');
      console.error(err);
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    setLoading(true);
    try {
      await API.delete(`${URL}/players/${playerId}`);
      setSuccess('Player deleted successfully');
      fetchPlayers();
    } catch (err) {
      setError('Failed to delete player');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (val) => {
    if (!val || val === 'none') return '—';
    return val.replace(/_/g, ' ');
  };

  const getCountryDisplay = (player) => {
    if (player.country) return player.country;
    if (player.country_id) return `ID: ${player.country_id}`;
    return '—';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">
          🏏 Manage Players – Batting Hand, Bowling Hand & Bowler Type
        </h1>

        {/* League selector and action buttons */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">League:</label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="">All Leagues</option>
            {leagueOptions.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
          <button
            onClick={fetchPlayers}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            ⟳ Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            ➕ Add New Player
          </button>
        </div>

        {/* Players Table */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📋 Players that appear in clips
              {selectedLeague && <span className="ml-2 text-sm font-normal text-gray-500">(league: {selectedLeague})</span>}
              <span className="ml-2 text-sm font-normal text-gray-500">(unknown = missing batting hand)</span>
            </h2>
            <input
              type="text"
              placeholder="🔍 Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {loading && !players.length ? (
            <div className="text-center py-8 text-gray-500">Loading players...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Country</th>
                    <th className="px-4 py-2 text-left">Batting Hand</th>
                    <th className="px-4 py-2 text-left">Bowling Hand</th>
                    <th className="px-4 py-2 text-left">Bowler Type</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-400">
                      {searchTerm ? `No players match "${searchTerm}"` : 'No players found.'}
                    </td></tr>
                  ) : (
                    filteredPlayers.map(player => {
                      const isUnknown = isUnknownPlayer(player);
                      return (
                        <tr key={player._id} className={`border-t hover:bg-gray-50 ${isUnknown ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-2 font-medium">{player.name}</td>
                          <td className="px-4 py-2">{getCountryDisplay(player)}</td>
                          <td className="px-4 py-2 capitalize">{displayValue(player.battingHand)}</td>
                          <td className="px-4 py-2 capitalize">{displayValue(player.bowlingHand)}</td>
                          <td className="px-4 py-2 capitalize">{displayValue(player.bowlerType)}</td>
                          <td className="px-4 py-2 text-center space-x-2">
                            <button onClick={() => openEditModal(player)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
                            <button onClick={() => handleDelete(player._id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-6 text-center">
          * Unknown players (missing batting hand) appear at the top and have a red background. Filtered by selected league.
        </p>
      </div>

      {/* --- ADD PLAYER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">➕ Add New Player</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Player Name *</label>
                  <input type="text" name="name" value={addForm.name} onChange={handleAddChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batting Hand</label>
                  <select name="battingHand" value={addForm.battingHand} onChange={handleAddChange} className="mt-1 block w-full border rounded-md p-2">
                    <option value="">-- Not specified --</option>
                    <option value="left">Left-handed</option>
                    <option value="right">Right-handed</option>
                    <option value="none">Not a batsman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bowling Hand</label>
                  <select name="bowlingHand" value={addForm.bowlingHand} onChange={handleAddChange} className="mt-1 block w-full border rounded-md p-2">
                    <option value="">-- Not specified --</option>
                    <option value="left">Left-arm</option>
                    <option value="right">Right-arm</option>
                    <option value="none">Not a bowler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bowler Type</label>
                  <select name="bowlerType" value={addForm.bowlerType} onChange={handleAddChange} className="mt-1 block w-full border rounded-md p-2">
                    <option value="">-- Select type --</option>
                    <option value="fast">Fast</option>
                    <option value="medium">Medium</option>
                    <option value="off_spin">Off Spin</option>
                    <option value="leg_spin">Leg Spin</option>
                    <option value="slow_left_arm">Slow Left Arm</option>
                    <option value="none">Not a bowler</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
                  {adding ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PLAYER MODAL (unchanged) --- */}
      {isEditModalOpen && modalPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">✏️ Edit Player</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium">Player Name</label><div className="mt-1 p-2 bg-gray-100 rounded border">{modalPlayer.name}</div></div>
              <div><label className="block text-sm font-medium">Country</label><div className="mt-1 p-2 bg-gray-100 rounded border">{getCountryDisplay(modalPlayer)}</div></div>
              <div><label className="block text-sm font-medium">Batting Hand</label>
                <select name="battingHand" value={modalForm.battingHand} onChange={handleModalChange} className="w-full border rounded-md p-2">
                  <option value="">-- Not specified --</option><option value="left">Left-handed</option><option value="right">Right-handed</option><option value="none">Not a batsman</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium">Bowling Hand</label>
                <select name="bowlingHand" value={modalForm.bowlingHand} onChange={handleModalChange} className="w-full border rounded-md p-2">
                  <option value="">-- Not specified --</option><option value="left">Left-arm</option><option value="right">Right-arm</option><option value="none">Not a bowler</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium">Bowler Type</label>
                <select name="bowlerType" value={modalForm.bowlerType} onChange={handleModalChange} className="w-full border rounded-md p-2">
                  <option value="">-- Select type --</option><option value="fast">Fast</option><option value="medium">Medium</option><option value="off_spin">Off Spin</option><option value="leg_spin">Leg Spin</option><option value="slow_left_arm">Slow Left Arm</option><option value="none">Not a bowler</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleModalSave} disabled={modalSaving} className="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Global toasts */}
      {error && <div className="fixed bottom-4 right-4 p-3 bg-red-100 text-red-700 rounded shadow-lg">{error}</div>}
      {success && <div className="fixed bottom-4 right-4 p-3 bg-green-100 text-green-700 rounded shadow-lg">{success}</div>}
    </div>
  );
}