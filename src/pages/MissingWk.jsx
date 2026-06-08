import React, { useState, useEffect, useRef } from "react";
import { API } from "@/actions/userAction";
import { URL } from "../constants/userConstants";

export default function KeeperLineupFixDashboard() {
    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [saving, setSaving] = useState({});
    const [filters, setFilters] = useState({
        seriesId: "",
        homeTeam: "",
        awayTeam: "",
        showOnlyMissingKeeper: false,
    });
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Available options for filters
    const [allSeries, setAllSeries] = useState([]);
    const [teamOptions, setTeamOptions] = useState([]);

    // Series autocomplete states
    const [seriesSearchTerm, setSeriesSearchTerm] = useState("");
    const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
    const seriesContainerRef = useRef(null);
    const seriesInputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (seriesContainerRef.current && !seriesContainerRef.current.contains(event.target)) {
                setShowSeriesDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch all series for autocomplete
    useEffect(() => {
        const fetchSeries = async () => {
            setLoadingSeries(true);
            try {
                const res = await API.get(`${URL}/api/match/series/all`);
                setAllSeries(res.data || []);
            } catch (err) {
                console.error("Failed to fetch series:", err);
            } finally {
                setLoadingSeries(false);
            }
        };
        fetchSeries();
    }, []);

    // Fetch all matches with lineup data
    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${URL}/api/match/matches-with-lineup-analysis`);
            setMatches(res.data);

            // Sort: Not assigned matches first, then assigned
            const sorted = [...res.data].sort((a, b) => {
                // Check if either home or away is not assigned
                const aHasMissing = !a.hasHomeAssigned || !a.hasAwayAssigned;
                const bHasMissing = !b.hasHomeAssigned || !b.hasAwayAssigned;

                if (aHasMissing && !bHasMissing) return -1;
                if (!aHasMissing && bHasMissing) return 1;
                return 0;
            });

            setFilteredMatches(sorted);

            // Extract unique teams for filters
            const teams = [...new Set(res.data.flatMap(m => [m.teamHomeName, m.teamAwayName]).filter(Boolean))];
            setTeamOptions(teams);
        } catch (err) {
            console.error("Failed to fetch matches:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...matches];

        if (filters.seriesId) {
            filtered = filtered.filter(m => m.seriesId == filters.seriesId);
        }
        if (filters.homeTeam) {
            filtered = filtered.filter(m =>
                (m.teamHomeName || "").toLowerCase().includes(filters.homeTeam.toLowerCase())
            );
        }
        if (filters.awayTeam) {
            filtered = filtered.filter(m =>
                (m.teamAwayName || "").toLowerCase().includes(filters.awayTeam.toLowerCase())
            );
        }
        if (filters.showOnlyMissingKeeper) {
            filtered = filtered.filter(m => !m.hasHomeAssigned || !m.hasAwayAssigned);
        }

        // Sort filtered results: missing assignments first
        const sorted = [...filtered].sort((a, b) => {
            const aHasMissing = !a.hasHomeAssigned || !a.hasAwayAssigned;
            const bHasMissing = !b.hasHomeAssigned || !b.hasAwayAssigned;

            if (aHasMissing && !bHasMissing) return -1;
            if (!aHasMissing && bHasMissing) return 1;
            return 0;
        });

        setFilteredMatches(sorted);
    }, [filters, matches]);

    // Assign keeper to match (quick assign from dropdown)
    const assignKeeper = async (matchId, team, playerId) => {
        setSaving(prev => ({ ...prev, [`${matchId}-${team}`]: true }));
        try {
            const match = matches.find(m => m.matchId === matchId);
            await API.put(`${URL}/api/match/keeper-override`, {
                matchId,
                teamId: team === "home" ? match?.teamHomeId : match?.teamAwayId,
                keeperPlayerId: playerId,
                seriesId: match.seriesId,
                teamHomeId: match.teamHomeId,     // Make sure this is included
                teamAwayId: match.teamAwayId,     // Make sure this is included
                teamHomeName: match.teamHomeName,
                teamAwayName: match.teamAwayName,
            });
            await fetchMatches();
        } catch (err) {
            console.error("Failed to assign keeper:", err);
            alert("Error assigning keeper");
        } finally {
            setSaving(prev => {
                const newState = { ...prev };
                delete newState[`${matchId}-${team}`];
                return newState;
            });
        }
    };

    // Get badge for keeper status - using ASSIGNED status
    const getKeeperBadge = (hasAssigned, keeperName, candidates, match, team) => {
        // If keeper is assigned in database
        if (hasAssigned && keeperName) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <span>✅</span> {keeperName}
                    </span>
                </div>
            );
        }

        // No keeper assigned - show dropdown if candidates exist
        if (candidates && candidates.length > 0) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-red-600 text-xs font-semibold">❌ Not assigned</span>
                    <select
                        onChange={(e) => assignKeeper(match.matchId, team, e.target.value)}
                        disabled={saving[`${match.matchId}-${team}`]}
                        className="border rounded px-2 py-1 text-xs w-32"
                        defaultValue=""
                    >
                        <option value="">Quick assign...</option>
                        {candidates.map(p => (
                            <option key={p.playerId} value={p.playerId}>
                                {p.playerName}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // No candidates - show fix button
        return (
            <button
                onClick={() => {
                    setSelectedMatch(match);
                    setSelectedTeam(team);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer"
            >
                <span>⚠️</span> Missing in lineup
            </button>
        );
    };

    // Get series name from ID
    const getSeriesName = (seriesId) => {
        const series = allSeries.find(s => s.seriesId === seriesId);
        return series?.name || seriesId || "—";
    };

    // Filtered series options based on search term
    const filteredSeriesOptions = allSeries.filter(series =>
        series.name?.toLowerCase().includes(seriesSearchTerm.toLowerCase())
    );

    // Handle series selection from autocomplete
    const handleSeriesSelect = (series) => {
        setFilters({ ...filters, seriesId: series.seriesId });
        setSeriesSearchTerm(series.name);
        setShowSeriesDropdown(false);
    };

    // Stats
    const totalMatches = filteredMatches.length;
    const matchesWithBothAssigned = filteredMatches.filter(m => m.hasHomeAssigned && m.hasAwayAssigned).length;
    const matchesMissingHomeKeeper = filteredMatches.filter(m => !m.hasHomeAssigned).length;
    const matchesMissingAwayKeeper = filteredMatches.filter(m => !m.hasAwayAssigned).length;

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            seriesId: "",
            homeTeam: "",
            awayTeam: "",
            showOnlyMissingKeeper: false,
        });
        setSeriesSearchTerm("");
    };

    const closeModal = () => {
        setSelectedMatch(null);
        setSelectedTeam(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">🧤 Fix Wicketkeeper Lineup</h1>
            <p className="text-gray-500 mb-6">Mark players as wicketkeepers where data is missing</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{totalMatches}</div>
                    <div className="text-xs text-gray-500">Total Matches</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{matchesWithBothAssigned}</div>
                    <div className="text-xs text-gray-500">Both Assigned</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{matchesMissingHomeKeeper}</div>
                    <div className="text-xs text-gray-500">Home Not Assigned</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{matchesMissingAwayKeeper}</div>
                    <div className="text-xs text-gray-500">Away Not Assigned</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg items-end">
                {/* Series Autocomplete */}
                <div className="relative" ref={seriesContainerRef}>
                    <label className="text-xs text-gray-500 mb-1 block">Series</label>
                    <input
                        ref={seriesInputRef}
                        type="text"
                        value={seriesSearchTerm}
                        onChange={(e) => {
                            setSeriesSearchTerm(e.target.value);
                            setShowSeriesDropdown(true);
                            if (e.target.value === "") {
                                setFilters({ ...filters, seriesId: "" });
                            }
                        }}
                        onFocus={() => setShowSeriesDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSeriesDropdown(false), 200)}
                        placeholder="Search series..."
                        className="border rounded px-3 py-2 text-sm w-64 bg-white"
                        disabled={loadingSeries}
                    />
                    {showSeriesDropdown && filteredSeriesOptions.length > 0 && !loadingSeries && (
                        <ul className="absolute z-10 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredSeriesOptions.map(series => (
                                <li
                                    key={series.seriesId}
                                    onClick={() => handleSeriesSelect(series)}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {series.name} {series.startDate ? `(${new Date(series.startDate).getFullYear()})` : ''}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <select
                    value={filters.homeTeam}
                    onChange={(e) => setFilters({ ...filters, homeTeam: e.target.value })}
                    className="border rounded px-3 py-2 text-sm bg-white"
                >
                    <option value="">All Home Teams</option>
                    {teamOptions.map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>

                <select
                    value={filters.awayTeam}
                    onChange={(e) => setFilters({ ...filters, awayTeam: e.target.value })}
                    className="border rounded px-3 py-2 text-sm bg-white"
                >
                    <option value="">All Away Teams</option>
                    {teamOptions.map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>

                <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.showOnlyMissingKeeper}
                        onChange={(e) => setFilters({ ...filters, showOnlyMissingKeeper: e.target.checked })}
                    />
                    Show only not assigned
                </label>

                <button
                    onClick={clearFilters}
                    className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded text-sm transition"
                >
                    Clear Filters
                </button>

                <button
                    onClick={fetchMatches}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
                >
                    Refresh
                </button>
            </div>

            {/* Matches Table */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading matches...</div>
            ) : (
                <div className="overflow-x-auto border rounded-lg shadow">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 text-left">Match ID</th>
                                <th className="p-3 text-left">Series</th>
                                <th className="p-3 text-left">Home Team</th>
                                <th className="p-3 text-center">Home Keeper</th>
                                <th className="p-3 text-left">Away Team</th>
                                <th className="p-3 text-center">Away Keeper</th>
                                <th className="p-3 text-left">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatches.map((match) => (
                                <tr key={match.matchId} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-mono text-xs">{match.matchId}</td>
                                    <td className="p-3 text-xs">{getSeriesName(match.seriesId)}</td>

                                    {/* Home Team */}
                                    <td className="p-3 font-medium">{match.teamHomeName || match.teamHomeId}</td>
                                    <td className="p-3 text-center">
                                        {getKeeperBadge(
                                            match.hasHomeAssigned,
                                            match.currentHomeKeeperName,
                                            match.homeCandidates,
                                            match,
                                            "home"
                                        )}
                                    </td>

                                    {/* Away Team */}
                                    <td className="p-3 font-medium">{match.teamAwayName || match.teamAwayId}</td>
                                    <td className="p-3 text-center">
                                        {getKeeperBadge(
                                            match.hasAwayAssigned,
                                            match.currentAwayKeeperName,
                                            match.awayCandidates,
                                            match,
                                            "away"
                                        )}
                                    </td>

                                    <td className="p-3 text-center">
                                        <a
                                            href={`https://www.cricbuzz.com/live-cricket-scorecard/${match.matchId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline text-sm"
                                        >
                                            View Match
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {filteredMatches.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">
                                        No matches found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for fixing lineup - shows all players for the selected team */}
            {selectedMatch && selectedTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
                        <h2 className="text-xl font-bold mb-4">
                            Fix Lineup - {selectedTeam === "home" ? selectedMatch.teamHomeName : selectedMatch.teamAwayName}
                        </h2>
                        <p className="text-gray-500 mb-4">Match ID: {selectedMatch.matchId}</p>

                        <div className="space-y-3">
                            <h3 className="font-semibold mb-2">Select the wicketkeeper:</h3>
                            <div className="space-y-2">
                                {(selectedTeam === "home" ? selectedMatch.homePlayers : selectedMatch.awayPlayers)?.map(player => (
                                    <div key={player.playerId} className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50">
                                        <span className="flex-1 font-medium">{player.playerName}</span>
                                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                            {player.position || "No position set"}
                                        </span>
                                        <button
                                            onClick={() => {
                                                assignKeeper(selectedMatch.matchId, selectedTeam, player.playerId);
                                                closeModal();
                                            }}
                                            disabled={saving[`${selectedMatch.matchId}-${selectedTeam}`]}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                                        >
                                            Set as Keeper
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}