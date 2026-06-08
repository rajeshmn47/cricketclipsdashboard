import React, { useState, useEffect } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

export default function BulkRenameNames() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [batsmanNames, setBatsmanNames] = useState([]);
  const [bowlerNames, setBowlerNames] = useState([]);
  const [standardNames, setStandardNames] = useState([]);
  const [renameTarget, setRenameTarget] = useState({ type: 'batsman', oldName: '', newName: '' });
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchUniqueNames = async () => {
    setLoading(true);
    try {
      const res = await API.get(`${URL}/clips/unique-names`);
      setBatsmanNames(res.data.batsmen || []);
      setBowlerNames(res.data.bowlers || []);
    } catch (err) {
      setError('Failed to load unique names');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardNames = async () => {
    try {
      const res = await API.get(`${URL}/players/standard-names`);
      setStandardNames(res.data || []);
    } catch (err) {
      console.error('Could not load standard names');
    }
  };

  useEffect(() => {
    fetchUniqueNames();
    fetchStandardNames();
  }, []);

  // Helper: sum of clip counts
  const totalClips = (namesArray) => namesArray.reduce((sum, item) => sum + (item.count || 0), 0);

  const suggestProperName = (oldName) => {
    if (!oldName) return '';
    const trimmed = oldName.trim();
    const parts = trimmed.split(/\s+/);
    let lastName = parts[parts.length - 1];
    const match = standardNames.find(name =>
      name.toLowerCase().includes(lastName.toLowerCase())
    );
    if (match) return match;
    if (parts.length > 1 && parts[0].length === 1) {
      const fullSearch = parts.slice(1).join(' ');
      const fallback = standardNames.find(name =>
        name.toLowerCase().includes(fullSearch.toLowerCase())
      );
      if (fallback) return fallback;
    }
    return trimmed;
  };

  const handleRename = async () => {
    if (!renameTarget.oldName || !renameTarget.newName) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await API.post(`${URL}/clips/rename-name`, renameTarget);
      setSuccess(`Renamed "${renameTarget.oldName}" → "${renameTarget.newName}" in all clips`);
      setShowConfirm(false);
      fetchUniqueNames(); // refresh lists
      setRenameTarget({ type: 'batsman', oldName: '', newName: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Rename failed');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (type, oldName) => {
    setRenameTarget({ type, oldName, newName: '' });
    setShowConfirm(true);
  };

  const fillSuggestion = () => {
    const suggested = suggestProperName(renameTarget.oldName);
    setRenameTarget({ ...renameTarget, newName: suggested });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">
          🔄 Unique Names – Mass Rename to Proper Standards
        </h1>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>}

        {loading && !batsmanNames.length ? (
          <div className="text-center py-12">Loading unique names...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batsmen Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">🏏 Batsmen</h2>
                <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  📊 {batsmanNames.length} distinct | 🎬 {totalClips(batsmanNames)} clips
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-center">Clips</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batsmanNames.map((item) => (
                      <tr key={item.name} className="border-t">
                        <td className="px-4 py-2 font-mono">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.count}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => openConfirm('batsman', item.name)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                          >
                            Rename
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowlers Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">🎯 Bowlers</h2>
                <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  📊 {bowlerNames.length} distinct | 🎬 {totalClips(bowlerNames)} clips
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-center">Clips</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlerNames.map((item) => (
                      <tr key={item.name} className="border-t">
                        <td className="px-4 py-2 font-mono">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.count}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => openConfirm('bowler', item.name)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                          >
                            Rename
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal (unchanged) */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Rename {renameTarget.type}</h3>
              <p className="mb-4">
                Old name: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{renameTarget.oldName}</span>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">New name (proper standard)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    list="standardNamesList"
                    value={renameTarget.newName}
                    onChange={(e) => setRenameTarget({ ...renameTarget, newName: e.target.value })}
                    className="flex-1 border rounded-md p-2"
                    placeholder="Start typing or use Suggest"
                  />
                  <button
                    onClick={fillSuggestion}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Suggest
                  </button>
                </div>
                <datalist id="standardNamesList">
                  {standardNames.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  disabled={!renameTarget.newName.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                  {loading ? 'Renaming...' : 'Rename All'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                This will update every clip where {renameTarget.type} equals "{renameTarget.oldName}" to the new name.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}