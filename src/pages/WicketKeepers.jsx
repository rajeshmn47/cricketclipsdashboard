import React, { useState, useEffect } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

// ---------- Helper: detect keeper candidates from position/name ----------
const detectCandidates = (players) => {
  const wkRegex = /wk|wicket.?keeper|keeper.?batsman|\(wk\)|†/i;
  return players.map(p => ({
    ...p,
    isCandidate: wkRegex.test(p.position || '') || wkRegex.test(p.playerName || ''),
  }));
};

// ---------- Fetch squads for a series (existing) ----------
const fetchSquadsForSeries = async (seriesId) => {
  try {
    const res = await API.get(`${URL}/api/match/allsquads`, { params: { seriesId } });
    const squads = res.data.squads || [];
    return squads.map(squad => {
      const enhancedPlayers = detectCandidates(squad.players || []);
      const keeperPriority = squad.keeperPriority || [];
      const primaryKeeperId = keeperPriority.find(pid =>
        enhancedPlayers.some(p => p.playerId === pid && p.isCandidate)
      ) || null;
      const primaryKeeper = enhancedPlayers.find(p => p.playerId === primaryKeeperId) || null;
      return {
        ...squad,
        players: enhancedPlayers,
        keeperPriority,
        currentKeeper: primaryKeeper,
        candidates: enhancedPlayers.filter(p => p.isCandidate)
      };
    });
  } catch (err) {
    console.error(`Failed to fetch squads for series ${seriesId}`, err);
    return [];
  }
};

// ---------- Fetch all matches of a series ----------
const fetchMatchesForSeries = async (seriesId) => {
  try {
    const res = await API.get(`${URL}/api/match/series/${seriesId}/matches`, { params: { seriesId } });
    return res.data || [];
  } catch (err) {
    console.error(`Failed to fetch matches for series ${seriesId}`, err);
    return [];
  }
};

// ---------- Fetch lineup for a specific match ----------
const fetchMatchLineup = async (matchId) => {
  try {
    const res = await API.get(`${URL}/api/match/lineup/${matchId}`);
    return res.data.lineup || []; // array of teams: { teamId, teamName, players: [...] }
  } catch (err) {
    console.error(`Failed to fetch lineup for match ${matchId}`, err);
    return [];
  }
};

// ---------- Save keeper override for a match ----------
const saveMatchKeeperOverride = async (matchId, teamId, keeperPlayerId) => {
  try {
    await API.put(`${URL}/api/match/keeper-override`, {
      matchId,
      teamId,
      keeperPlayerId
    });
    return true;
  } catch (err) {
    console.error('Failed to save keeper override', err);
    return false;
  }
};

// ---------- Component: Match Keeper Editor (manual override) ----------
const MatchKeeperEditor = ({ match, onSaved }) => {
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedKeepers, setSelectedKeepers] = useState({});

  useEffect(() => {
    if (!match) return;
    const loadLineup = async () => {
      setLoading(true);
      const data = await fetchMatchLineup(match.matchId);
      setLineup(data);
      // initialise selectedKeepers from existing overrides (if any)
      const initial = {};
      data.forEach(team => {
        if (team.currentKeeperOverride) {
          initial[team.teamId] = team.currentKeeperOverride.playerId;
        } else if (team.currentKeeper) {
          initial[team.teamId] = team.currentKeeper.playerId;
        }
      });
      setSelectedKeepers(initial);
      setLoading(false);
    };
    loadLineup();
  }, [match]);

  const handleKeeperChange = (teamId, playerId) => {
    setSelectedKeepers(prev => ({ ...prev, [teamId]: playerId }));
  };

  const handleSave = async (teamId, keeperPlayerId) => {
    setSaving(true);
    const success = await saveMatchKeeperOverride(match.matchId, teamId, keeperPlayerId);
    if (success && onSaved) onSaved(match.matchId, teamId, keeperPlayerId);
    setSaving(false);
  };

  if (!match) return <div className="text-gray-500 text-sm">Select a match to edit</div>;
  if (loading) return <div className="text-gray-500">Loading lineup...</div>;
  if (!lineup || lineup.length === 0) return <div className="text-red-500">No lineup data for this match.</div>;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-bold text-lg mb-3">
        {match.seriesName} – {match.matchTitle} ({new Date(match.date).toLocaleDateString()})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lineup.map(team => {
          const candidates = (team.players || []).filter(p => p.isCandidate);
          const displayPlayers = candidates.length > 0 ? candidates : team.players;
          const currentKeeperId = selectedKeepers[team.teamId];
          const currentKeeper = displayPlayers.find(p => p.playerId === currentKeeperId);
          return (
            <div key={team.teamId} className="border rounded p-3 bg-gray-50">
              <h4 className="font-semibold mb-2">{team.teamName}{currentKeeperId}</h4>
              <div className="space-y-2">
                <select
                  value={currentKeeperId || ''}
                  onChange={(e) => handleKeeperChange(team.teamId, e.target.value)}
                  className="w-full p-1 border rounded text-sm"
                >
                  <option value="">-- Select Keeper --</option>
                  {displayPlayers.map(p => (
                    <option key={p.playerId} value={p.playerId}>
                      {p.playerName} {p.isCandidate ? '(candidate)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(team.teamId, currentKeeperId)}
                  disabled={saving || !currentKeeperId}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? 'Saving...' : 'Save Override'}
                </button>
                {currentKeeper && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Primary keeper: {currentKeeper.playerName}
                    {team.currentKeeperOverride && ' (overridden)'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Component: Match Picker (series + match dropdown) ----------
const MatchPicker = ({ onMatchSelect }) => {
  const [allSeries, setAllSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [seriesSearchTerm, setSeriesSearchTerm] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const filteredSeries = allSeries.filter(s => s.name.toLowerCase().includes(seriesSearchTerm.toLowerCase()));

  useEffect(() => {
    const fetchSeries = async () => {
      setLoadingSeries(true);
      try {
        const res = await API.get(`${URL}/api/match/series/all`);
        setAllSeries(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchSeries();
  }, []);

  useEffect(() => {
    if (!selectedSeriesId) {
      setMatches([]);
      setSelectedMatchId('');
      return;
    }
    const loadMatches = async () => {
      setLoadingMatches(true);
      const matchesData = await fetchMatchesForSeries(selectedSeriesId);
      setMatches(matchesData);
      setLoadingMatches(false);
    };
    loadMatches();
  }, [selectedSeriesId]);

  const handleSeriesSelect = (series) => {
    setSeriesSearchTerm(series.name);
    setSelectedSeriesId(series.seriesId);
    setShowSeriesDropdown(false);
    setSelectedMatchId('');
    onMatchSelect(null);
  };

  const handleSeriesChange = (e) => {
    const seriesId = e.target.value;
    setSelectedSeriesId(seriesId);
    setSelectedMatchId('');
    onMatchSelect(null);
  };

  const handleMatchChange = (e) => {
    const matchId = e.target.value;
    setSelectedMatchId(matchId);
    const selectedMatch = matches.find(m => m.matchId === matchId);
    onMatchSelect(selectedMatch || null);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-6">
      <h3 className="font-bold mb-3">✏️ Manual Override for a Specific Match</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium">Series</label>
          <input
            type="text"
            value={seriesSearchTerm}
            onChange={(e) => {
              setSeriesSearchTerm(e.target.value);
              setShowSeriesDropdown(true);
              setSelectedSeriesId('');
            }}
            onFocus={() => setShowSeriesDropdown(true)}
            placeholder="Type to search series..."
            className="mt-1 block w-full border rounded-md p-2 text-sm"
            disabled={loadingSeries}
          />
          {showSeriesDropdown && filteredSeries.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSeries.map(series => (
                <li
                  key={series.seriesId}
                  onClick={() => handleSeriesSelect(series)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {series.name} ({series.startDate ? new Date(series.startDate).getFullYear() : ''})
                </li>
              ))}
            </ul>
          )}
          {loadingSeries && <p className="text-xs text-gray-500 mt-1">Loading series...</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Match</label>
          <select
            value={selectedMatchId}
            onChange={handleMatchChange}
            className="mt-1 block w-full border rounded-md p-2 text-sm"
            disabled={loadingMatches || !selectedSeriesId}
          >
            <option value="">-- Select Match --</option>
            {matches.map(match => (
              <option key={match.matchId} value={match.matchId}>
                {match.matchTitle} ({new Date(match.date).toLocaleDateString()})({match?.teamHomeCode}vs{match?.teamAwayCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ---------- Existing TeamKeeperSelector (unchanged, but used for series-level) ----------
const TeamKeeperSelector = ({ squad, seriesId, onUpdate }) => {
  // ... (keep your existing implementation exactly as you had it) ...
  // (I'm omitting it here to save space, but you must paste your original TeamKeeperSelector code here)
};

// ---------- Main Page (extended) ----------
export default function SeriesWicketKeeperPage() {
  const [allSeries, setAllSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: '',
    format: '',
    season: '',
    search: ''
  });
  const [expandedSeries, setExpandedSeries] = useState({});
  const [squadsCache, setSquadsCache] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);

  // status, type, format options (same as before)
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'upcoming', label: 'Upcoming' }
  ];
  const typeOptions = [
    { value: '', label: 'All' },
    { value: 'i', label: 'International' },
    { value: 'd', label: 'Domestic' },
    { value: 'l', label: 'League' }
  ];
  const formatOptions = [
    { value: '', label: 'All' },
    { value: 'test', label: 'Test' },
    { value: 'odi', label: 'ODI' },
    { value: 't20', label: 'T20' }
  ];

  const fetchSeries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`${URL}/api/match/series/all`);
      setAllSeries(res.data || []);
    } catch (err) {
      setError('Failed to fetch series');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    if (!allSeries.length) return;
    let filtered = [...allSeries];
    if (filters.type) filtered = filtered.filter(s => s.type === filters.type);
    if (filters.format) filtered = filtered.filter(s => s.format === filters.format);
    if (filters.season) {
      filtered = filtered.filter(s => {
        const year = s.startDate ? new Date(s.startDate).getFullYear().toString() : '';
        return year === filters.season;
      });
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(lower));
    }
    const now = new Date();
    if (filters.status === 'ongoing') {
      filtered = filtered.filter(s => new Date(s.startDate) <= now && new Date(s.endDate) >= now);
    } else if (filters.status === 'completed') {
      filtered = filtered.filter(s => new Date(s.endDate) < now);
    } else if (filters.status === 'upcoming') {
      filtered = filtered.filter(s => new Date(s.startDate) > now);
    }
    setFilteredSeries(filtered);
    setExpandedSeries({});
    setSquadsCache({});
  }, [allSeries, filters]);

  const toggleExpand = async (seriesId) => {
    const isExpanding = !expandedSeries[seriesId];
    setExpandedSeries(prev => ({ ...prev, [seriesId]: isExpanding }));
    if (isExpanding && !squadsCache[seriesId]) {
      const squads = await fetchSquadsForSeries(seriesId);
      setSquadsCache(prev => ({ ...prev, [seriesId]: squads }));
    }
  };

  const handleMatchOverrideSaved = (matchId, teamId, keeperPlayerId) => {
    // Optional: refresh match data or show a toast
    console.log(`Override saved: match ${matchId}, team ${teamId}, keeper ${keeperPlayerId}`);
    // You could also refetch the match lineup to show the updated override
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Wicket Keeper Management</h1>

        {/* ----- NEW: Manual match override section ----- */}
        <MatchPicker onMatchSelect={setSelectedMatch} />
        {selectedMatch && (
          <div className="mb-8">
            <MatchKeeperEditor match={selectedMatch} onSaved={handleMatchOverrideSaved} />
          </div>
        )}

        {/* ----- Existing series-level priority editor (with divider) ----- */}
        <hr className="my-6 border-gray-300" />
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Series‑level Keeper Priority</h2>

        {/* Filters (same as before) */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* ... (keep your existing filter JSX) ... */}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading series...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No series found.</div>
        ) : (
          <div className="space-y-4">
            {filteredSeries.map(series => {
              const isExpanded = expandedSeries[series.seriesId];
              const squads = squadsCache[series.seriesId] || [];
              const isLoading = isExpanded && squads.length === 0 && !squadsCache[series.seriesId];
              const missingCount = series.missingPrimaryCount || 0;
              return (
                <div key={series.seriesId} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-100 p-4 cursor-pointer hover:bg-gray-200 flex justify-between items-center" onClick={() => toggleExpand(series.seriesId)}>
                    <div>
                      <h3 className="font-bold text-lg">{series.name}</h3>
                      <div className="text-sm text-gray-600">
                        {series.seriesId} | {series.type || 'N/A'} | {series.format || 'N/A'} |{' '}
                        {series.startDate ? new Date(series.startDate).toLocaleDateString() : '?'} -{' '}
                        {series.endDate ? new Date(series.endDate).toLocaleDateString() : '?'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {missingCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          ⚠️ {missingCount} team(s) missing primary keeper
                        </span>
                      )}
                      <span className="text-2xl">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-white border-t">
                      {isLoading ? (
                        <div className="text-center py-4 text-gray-500">Loading squads...</div>
                      ) : squads.length === 0 ? (
                        <p className="text-gray-500">No squads found for this series.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {squads.map(squad => (
                            <TeamKeeperSelector
                              key={squad._id}
                              squad={squad}
                              seriesId={series.seriesId}
                              onUpdate={async () => {
                                const refreshed = await fetchSquadsForSeries(series.seriesId);
                                setSquadsCache(prev => ({ ...prev, [series.seriesId]: refreshed }));
                                fetchSeries(); // refresh badge counts
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}