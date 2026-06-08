import React, { useState, useEffect } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

export default function MissingHandsEditor() {
    const [batsmen, setBatsmen] = useState([]);
    const [bowlers, setBowlers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedLeague, setSelectedLeague] = useState('IPL');
    const [searchTerm, setSearchTerm] = useState('');
    const [batsmenSortOrder, setBatsmenSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [bowlersSortOrder, setBowlersSortOrder] = useState('desc');
    const [editingBatsman, setEditingBatsman] = useState(null);
    const [editingBowler, setEditingBowler] = useState(null);

    const leagues = ['IPL', 'BBL', 'PSL', 'CPL', 'Test', 'ODI', 'T20'];
    const [updating, setUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    const runAddPlayerHands = async () => {
        if (!window.confirm('This will update clip bowlingHand/bowlerType from player data. Continue?')) return;
        setUpdating(true);
        setUpdateMessage('');
        try {
            const res = await API.post(`${URL}/clips/update-clip-hands`);
            setUpdateMessage(res.data.message);
            setTimeout(() => setUpdateMessage(''), 3000);
            // Optionally refresh the current page data
            fetchData(); // if you have a refresh function
        } catch (err) {
            setUpdateMessage('Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUpdating(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${URL}/players/missing-hands?league=${selectedLeague}`);
            setBatsmen(res.data.batsmen || []);
            setBowlers(res.data.bowlers || []);
            setError('');
        } catch (err) {
            setError('Failed to load missing hands data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedLeague]);

    const updatePlayer = async (playerId, payload) => {
        try {
            await API.put(`${URL}/players/${playerId}`, payload);
            setSuccess('Player updated');
            setTimeout(() => setSuccess(''), 2000);
            fetchData();
        } catch (err) {
            setError('Update failed');
            setTimeout(() => setError(''), 2000);
        }
    };

    // Filter by search term
    const filteredBatsmen = batsmen.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredBowlers = bowlers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort functions
    const sortByCount = (data, order) => {
        return [...data].sort((a, b) => {
            if (order === 'desc') return b.count - a.count;
            return a.count - b.count;
        });
    };

    const sortedBatsmen = sortByCount(filteredBatsmen, batsmenSortOrder);
    const sortedBowlers = sortByCount(filteredBowlers, bowlersSortOrder);

    // Handlers
    const handleBatsmanEdit = (player) => {
        setEditingBatsman({ player, value: player.battingHand || '' });
    };

    const handleBatsmanSave = () => {
        if (editingBatsman) {
            updatePlayer(editingBatsman.player._id, { battingHand: editingBatsman.value });
            setEditingBatsman(null);
        }
    };

    const handleBowlerEdit = (player) => {
        setEditingBowler({
            player,
            bowlingHand: player.bowlingHand || '',
            bowlerType: player.bowlerType || ''
        });
    };

    const handleBowlerSave = () => {
        if (editingBowler) {
            updatePlayer(editingBowler.player._id, {
                bowlingHand: editingBowler.bowlingHand,
                bowlerType: editingBowler.bowlerType
            });
            setEditingBowler(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-6 text-blue-900">
                    🏏 Players Missing Hand / Type Info
                </h1>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium">League:</label>
                    <select
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
                        className="px-3 py-1 border rounded-md"
                    >
                        {leagues.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button onClick={fetchData} className="px-3 py-1 bg-blue-500 text-white rounded">⟳ Refresh</button>
                    <button
                        onClick={runAddPlayerHands}
                        disabled={updating}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {updating ? 'Updating clips...' : '🔄 Update Clip Hands'}
                    </button>
                    {updateMessage && <div className="text-sm text-green-600 ml-2">{updateMessage}</div>}
                    <input
                        type="text"
                        placeholder="🔍 Search by player name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-1 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-sm text-gray-500 hover:text-gray-700">
                            Clear ✖
                        </button>
                    )}
                </div>

                {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
                {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>}

                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Batsmen missing batting hand */}
                        <div>
                            <h2 className="text-xl font-semibold mb-3">🏏 Batsmen (missing batting hand)</h2>
                            <table className="min-w-full bg-white border rounded-lg">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th
                                            className="px-4 py-2 text-center cursor-pointer hover:bg-gray-200"
                                            onClick={() => setBatsmenSortOrder(batsmenSortOrder === 'desc' ? 'asc' : 'desc')}
                                        >
                                            Clips {batsmenSortOrder === 'desc' ? '▼' : '▲'}
                                        </th>
                                        <th className="px-4 py-2 text-center">Batting Hand</th>
                                        <th className="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedBatsmen.map(player => (
                                        <tr key={player._id} className="border-t">
                                            <td className="px-4 py-2 font-medium">{player.name}</td>
                                            <td className="px-4 py-2 text-center">{player.count}</td>
                                            <td className="px-4 py-2 text-center">
                                                {editingBatsman?.player._id === player._id ? (
                                                    <select
                                                        value={editingBatsman.value}
                                                        onChange={(e) => setEditingBatsman({ ...editingBatsman, value: e.target.value })}
                                                        className="border rounded p-1"
                                                    >
                                                        <option value="">-- Select --</option>
                                                        <option value="left">Left-handed</option>
                                                        <option value="right">Right-handed</option>
                                                        <option value="none">Not a batsman</option>
                                                    </select>
                                                ) : (
                                                    <span>{player.battingHand || '—'}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {editingBatsman?.player._id === player._id ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={handleBatsmanSave} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Save</button>
                                                        <button onClick={() => setEditingBatsman(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-xs">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleBatsmanEdit(player)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedBatsmen.length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-4 text-gray-400">
                                            {searchTerm ? 'No batsmen match your search' : 'All batsmen have batting hand info!'}
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Bowlers missing bowling hand or type */}
                        <div>
                            <h2 className="text-xl font-semibold mb-3">🎯 Bowlers (missing bowling hand or type)</h2>
                            <table className="min-w-full bg-white border rounded-lg">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th
                                            className="px-4 py-2 text-center cursor-pointer hover:bg-gray-200"
                                            onClick={() => setBowlersSortOrder(bowlersSortOrder === 'desc' ? 'asc' : 'desc')}
                                        >
                                            Clips {bowlersSortOrder === 'desc' ? '▼' : '▲'}
                                        </th>
                                        <th className="px-4 py-2 text-center">Bowling Hand</th>
                                        <th className="px-4 py-2 text-center">Bowler Type</th>
                                        <th className="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedBowlers.map(player => (
                                        <tr key={player._id} className="border-t">
                                            <td className="px-4 py-2 font-medium">{player.name}</td>
                                            <td className="px-4 py-2 text-center">{player.count}</td>
                                            <td className="px-4 py-2 text-center">{player.bowlingHand || '—'}</td>
                                            <td className="px-4 py-2 text-center">{player.bowlerType ? player.bowlerType.replace(/_/g, ' ') : '—'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => handleBowlerEdit(player)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit Both</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedBowlers.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-4 text-gray-400">
                                            {searchTerm ? 'No bowlers match your search' : 'All bowlers have hand & type info!'}
                                        </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bowler Edit Modal */}
            {editingBowler && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Edit Bowler: {editingBowler.player.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Bowling Hand</label>
                                <select
                                    value={editingBowler.bowlingHand}
                                    onChange={(e) => setEditingBowler({ ...editingBowler, bowlingHand: e.target.value })}
                                    className="w-full border rounded-md p-2"
                                >
                                    <option value="">-- Select --</option>
                                    <option value="left">Left-arm</option>
                                    <option value="right">Right-arm</option>
                                    <option value="none">Not a bowler</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Bowler Type</label>
                                <select
                                    value={editingBowler.bowlerType}
                                    onChange={(e) => setEditingBowler({ ...editingBowler, bowlerType: e.target.value })}
                                    className="w-full border rounded-md p-2"
                                >
                                    <option value="">-- Select --</option>
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
                            <button onClick={() => setEditingBowler(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={handleBowlerSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Both</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}