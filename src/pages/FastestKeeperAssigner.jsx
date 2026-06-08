import React, { useState, useEffect } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

// ---------- API helpers (unchanged) ----------
const fetchSeries = async () => {
  const res = await API.get(`${URL}/api/match/series/all`);
  return res.data || [];
};
const fetchMatchesForSeries = async (seriesId) => {
  const res = await API.get(`${URL}/api/match/series/${seriesId}/matches`);
  return res.data || [];
};
const fetchMatchLineup = async (matchId) => {
  const res = await API.get(`${URL}/api/match/lineup/${matchId}`);
  return res.data.lineup || [];
};
const saveKeeperOverride = async (matchId, teamId, keeperPlayerId) => {
  await API.put(`${URL}/api/match/keeper-override`, { matchId, teamId, keeperPlayerId });
};

const isKeeperCandidate = (player) => {
  const wkRegex = /wk|wicket.?keeper|keeper.?batsman|\(wk\)|†/i;
  return wkRegex.test(player.position || '') || wkRegex.test(player.playerName || '');
};

export default function FastKeeperAssigner() {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [matches, setMatches] = useState([]);
  const [lineups, setLineups] = useState({});
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [saving, setSaving] = useState({});
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [filterHomeTeam, setFilterHomeTeam] = useState('');
  const [filterAwayTeam, setFilterAwayTeam] = useState('');
  const [search, setSearch] = useState('');
  const [seriesSearchTerm, setSeriesSearchTerm] = useState('');
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [bulkTeam, setBulkTeam] = useState('home');
  const [bulkKeeperId, setBulkKeeperId] = useState('');
  const [selectedMatchIds, setSelectedMatchIds] = useState(new Set());

  const filteredSeries = seriesList.filter(s =>
    s.name.toLowerCase().includes(seriesSearchTerm.toLowerCase())
  );

  const homeTeamOptions = [...new Set(matches.map(m => m.teamHomeName || m.teamHomeId).filter(Boolean))];
  const awayTeamOptions = [...new Set(matches.map(m => m.teamAwayName || m.teamAwayId).filter(Boolean))];

  const handleSeriesSelect = (series) => {
    setSelectedSeriesId(series.seriesId);
    setSeriesSearchTerm(series.name);
    setShowSeriesDropdown(false);
    setMatches([]);
    setLineups({});
    setFilterHomeTeam('');
    setFilterAwayTeam('');
  };

  // Load series
  useEffect(() => {
    const loadSeries = async () => {
      setLoadingSeries(true);
      try {
        const data = await fetchSeries();
        setSeriesList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSeries(false);
      }
    };
    loadSeries();
  }, []);

  // Load matches when series changes
  useEffect(() => {
    if (!selectedSeriesId) {
      setMatches([]);
      setLineups({});
      return;
    }
    const loadMatches = async () => {
      setLoadingMatches(true);
      try {
        const matchesData = await fetchMatchesForSeries(selectedSeriesId);
        setMatches(matchesData);
        // Pre-fetch lineups in background – catch errors individually
        for (const match of matchesData) {
          if (!lineups[match.matchId]) {
            try {
              const lineup = await fetchMatchLineup(match.matchId);
              setLineups(prev => ({ ...prev, [match.matchId]: lineup }));
            } catch (err) {
              console.error(`Lineup error for ${match.matchId}`, err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load matches', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadMatches();
  }, [selectedSeriesId]);

  const loadLineupForMatch = async (matchId) => {
    if (lineups[matchId]) return lineups[matchId];
    const lineup = await fetchMatchLineup(matchId);
    setLineups(prev => ({ ...prev, [matchId]: lineup }));
    return lineup;
  };

  const handleKeeperChange = async (matchId, teamId, keeperPlayerId) => {
    setSaving(prev => ({ ...prev, [`${matchId}-${teamId}`]: true }));
    try {
      await saveKeeperOverride(matchId, teamId, keeperPlayerId);
      setLineups(prev => {
        const matchLineup = prev[matchId] || [];
        const updatedLineup = matchLineup.map(team =>
          team.teamId === teamId
            ? { ...team, currentKeeperOverride: { playerId: keeperPlayerId }, currentKeeper: { playerId: keeperPlayerId } }
            : team
        );
        return { ...prev, [matchId]: updatedLineup };
      });
    } catch (err) {
      alert('Error saving keeper');
    } finally {
      setSaving(prev => ({ ...prev, [`${matchId}-${teamId}`]: false }));
    }
  };

  const toggleSelectMatch = (matchId) => {
    setSelectedMatchIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) newSet.delete(matchId);
      else newSet.add(matchId);
      return newSet;
    });
  };

  const applyBulk = async () => {
    if (selectedMatchIds.size === 0 || !bulkKeeperId) return;
    for (const matchId of selectedMatchIds) {
      const lineup = await loadLineupForMatch(matchId);
      const match = matches.find(m => m.matchId === matchId);
      if (!match) continue;
      const team = lineup.find(t =>
        bulkTeam === 'home' ? t.teamId === match.teamHomeId : t.teamId === match.teamAwayId
      );
      if (team) {
        await handleKeeperChange(matchId, team.teamId, bulkKeeperId);
      }
    }
    setSelectedMatchIds(new Set());
  };

  const filteredMatches = matches.filter(match => {
    if (filterHomeTeam && match.teamHomeName !== filterHomeTeam && match.teamHomeId !== filterHomeTeam) return false;
    if (filterAwayTeam && match.teamAwayName !== filterAwayTeam && match.teamAwayId !== filterAwayTeam) return false;
    if (filterMissingOnly) {
      const lineup = lineups[match.matchId];
      if (!lineup) return true;
      const homeTeam = lineup.find(t => t.teamId === match.teamHomeId);
      const awayTeam = lineup.find(t => t.teamId === match.teamAwayId);
      const homeMissing = !homeTeam?.currentKeeperOverride && !homeTeam?.currentKeeper;
      const awayMissing = !awayTeam?.currentKeeperOverride && !awayTeam?.currentKeeper;
      if (!homeMissing && !awayMissing) return false;
    }
    if (search) {
      return match.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
        match.matchId.includes(search);
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚡ Fast Wicket Keeper Assignment</h1>

      {/* Series Autocomplete */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg relative">
        <label className="block font-medium mb-2">Select Series</label>
        <input
          type="text"
          value={seriesSearchTerm}
          onChange={(e) => {
            setSeriesSearchTerm(e.target.value);
            setShowSeriesDropdown(true);
            if (e.target.value === '') setSelectedSeriesId('');
          }}
          onFocus={() => setShowSeriesDropdown(true)}
          placeholder="Type to search series..."
          className="border rounded px-3 py-2 w-full md:w-96"
          disabled={loadingSeries}
        />
        {showSeriesDropdown && filteredSeries.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full md:w-96 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
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
        {loadingSeries && <span className="ml-2 text-sm text-gray-500">Loading series...</span>}
      </div>

      {selectedSeriesId && (
        <>
          {/* Toolbar with new filters */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterMissingOnly}
                onChange={(e) => setFilterMissingOnly(e.target.checked)}
              />
              Show only matches missing keeper
            </label>

            <select
              value={filterHomeTeam}
              onChange={(e) => setFilterHomeTeam(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Home Teams</option>
              {homeTeamOptions.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>

            <select
              value={filterAwayTeam}
              onChange={(e) => setFilterAwayTeam(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Away Teams</option>
              {awayTeamOptions.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search match title / ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-1 w-64"
            />

            <div className="border-l pl-4 flex gap-2 items-center">
              <span className="text-sm font-medium">Bulk assign:</span>
              <select
                value={bulkTeam}
                onChange={(e) => setBulkTeam(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="home">Home Team</option>
                <option value="away">Away Team</option>
              </select>
              <input
                type="text"
                placeholder="Player ID"
                value={bulkKeeperId}
                onChange={(e) => setBulkKeeperId(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-32"
              />
              <button
                onClick={applyBulk}
                disabled={selectedMatchIds.size === 0 || !bulkKeeperId}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Apply to {selectedMatchIds.size}
              </button>
            </div>
          </div>

          {/* Matches table (same as before) */}
          {loadingMatches ? (
            <div className="text-center py-8 text-gray-500">Loading matches...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No matches found</div>
          ) : (
            <div className="overflow-x-auto border rounded-lg shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3"><input type="checkbox" onChange={(e) => {
                      if (e.target.checked) setSelectedMatchIds(new Set(filteredMatches.map(m => m.matchId)));
                      else setSelectedMatchIds(new Set());
                    }} checked={selectedMatchIds.size === filteredMatches.length && filteredMatches.length > 0} /></th>
                    <th className="p-3 text-left">Match ID</th>
                    <th className="p-3 text-left">Match Title / Date</th>
                    <th className="p-3 text-left">Home Keeper</th>
                    <th className="p-3 text-left">Away Keeper</th>
                    <th className="p-3 text-left">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map(match => {
                    const lineup = lineups[match.matchId];
                    const homeTeam = lineup?.find(t => t.teamId === match.teamHomeId);
                    const awayTeam = lineup?.find(t => t.teamId === match.teamAwayId);
                    const homeCandidates = (homeTeam?.players || []).filter(isKeeperCandidate);
                    const awayCandidates = (awayTeam?.players || []).filter(isKeeperCandidate);
                    const currentHomeKeeperId = homeTeam?.currentKeeperOverride?.playerId || homeTeam?.currentKeeper?.playerId || '';
                    const currentAwayKeeperId = awayTeam?.currentKeeperOverride?.playerId || awayTeam?.currentKeeper?.playerId || '';

                    return (
                      <tr key={match.matchId} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedMatchIds.has(match.matchId)} onChange={() => toggleSelectMatch(match.matchId)} />
                        </td>
                        <td className="p-3 font-mono text-xs">{match.matchId}</td>
                        <td className="p-3">
                          <div className="font-medium">{match.matchTitle}</div>
                          <div className="text-gray-500 text-xs">{new Date(match.date).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3">
                          {!homeTeam ? (
                            <button onClick={() => loadLineupForMatch(match.matchId)} className="text-blue-600 text-xs">Load lineup</button>
                          ) : (
                            <select value={currentHomeKeeperId} onChange={(e) => handleKeeperChange(match.matchId, homeTeam.teamId, e.target.value)} disabled={saving[`${match.matchId}-${homeTeam.teamId}`]} className="border rounded px-2 py-1 w-48">
                              <option value="">— Select Keeper —</option>
                              {homeCandidates.map(p => <option key={p.playerId} value={p.playerId}>{p.playerName} {p.isCandidate ? '🧤' : ''}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          {!awayTeam ? (
                            <button onClick={() => loadLineupForMatch(match.matchId)} className="text-blue-600 text-xs">Load lineup</button>
                          ) : (
                            <select value={currentAwayKeeperId} onChange={(e) => handleKeeperChange(match.matchId, awayTeam.teamId, e.target.value)} disabled={saving[`${match.matchId}-${awayTeam.teamId}`]} className="border rounded px-2 py-1 w-48">
                              <option value="">— Select Keeper —</option>
                              {awayCandidates.map(p => <option key={p.playerId} value={p.playerId}>{p.playerName} {p.isCandidate ? '🧤' : ''}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          <a href={`https://cricbuzz.com/live-cricket-scorecard/${match.matchId}`} className="text-blue-600 hover:underline"
                            target="_blank">
                            View Details
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}