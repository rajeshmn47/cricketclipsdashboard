import React, { useEffect, useState } from 'react';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

const teamOptions = [
    { id: "rcb", name: "Royal Challengers Bengaluru" },
    { id: "csk", name: "Chennai Super Kings" },
    { id: "mi", name: "Mumbai Indians" },
    { id: "kkr", name: "Kolkata Knight Riders" },
    { id: "srh", name: "Sunrisers Hyderabad" },
    { id: "gt", name: "Gujarat Titans" },
    { id: "rr", name: "Rajasthan Royals" },
    { id: "lsg", name: "Lucknow Super Giants" },
    { id: "pbks", name: "Punjab Kings" },
    { id: "dc", name: "Delhi Capitals" },
    { id: "tkr", name: "Trinbago Knight Riders" },
    { id: "gaw", name: "Guyana Amazon Warriors" },
    { id: "jt", name: "Jamaica Tallawahs" },
    { id: "slz", name: "Saint Lucia Kings" },
    { id: "bt", name: "Barbados Royals" },
    { id: "sknp", name: "St Kitts and Nevis Patriots" },
    { id: "iu", name: "Islamabad United" },
    { id: "kk", name: "Karachi Kings" },
    { id: "lhq", name: "Lahore Qalandars" },
    { id: "ms", name: "Multan Sultans" },
    { id: "pz", name: "Peshawar Zalmi" },
    { id: "qg", name: "Quetta Gladiators" },
    { id: "ind", name: "India" },
    { id: "aus", name: "Australia" },
    { id: "eng", name: "England" },
    { id: "pak", name: "Pakistan" },
    { id: "sa", name: "South Africa" },
    { id: "nz", name: "New Zealand" },
    { id: "wi", name: "West Indies" },
    { id: "ban", name: "Bangladesh" },
    { id: "afg", name: "Afghanistan" },
    { id: "sl", name: "Sri Lanka" },
    { id: "ire", name: "Ireland" },
    { id: "ned", name: "Netherlands" },
    { id: "zim", name: "Zimbabwe" },
    { id: "nam", name: "Namibia" },
    { id: "uae", name: "UAE" },
    { id: "oma", name: "Oman" },
    { id: "usa", name: "USA" },
    { id: "nep", name: "Nepal" },
    { id: "sco", name: "Scotland" }
];

export default function SeriesWiseClips() {
    const [seriesList, setSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        teamHomeName: '',
        teamAwayName: '',
        name: '',
        type: '',
        format: '',
        season: '',
        fromDate: '',
        toDate: '',
        sort: 'clips-desc',
    });
    const [selectedSeries, setSelectedSeries] = useState('all');
    const [selectedSeriesLabel, setSelectedSeriesLabel] = useState('');
    const [seriesQuery, setSeriesQuery] = useState('');
    const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false);
    const [seriesOptions, setSeriesOptions] = useState([]);
    const [expandedSeries, setExpandedSeries] = useState({});
    const [matchSort, setMatchSort] = useState({});

    const toggleExpand = (seriesId) => {
        setExpandedSeries(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));
    };

    const sortMatches = (matches, seriesId) => {
        const sortConfig = matchSort[seriesId];
        if (!sortConfig || !matches) return matches;
        const { key, direction } = sortConfig;
        const sorted = [...matches];
        sorted.sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            if (key === 'matchId') {
                aVal = String(aVal);
                bVal = String(bVal);
            } else if (key === 'clipsCount') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            } else {
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    };

    const requestMatchSort = (seriesId, key) => {
        setMatchSort(prev => {
            const current = prev[seriesId];
            let direction = 'asc';
            if (current && current.key === key && current.direction === 'asc') {
                direction = 'desc';
            }
            return { ...prev, [seriesId]: { key, direction } };
        });
    };

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            setError('');
            try {
                const params = [];
                if (filters.teamHomeName) params.push(`teamHomeName=${encodeURIComponent(filters.teamHomeName)}`);
                if (filters.teamAwayName) params.push(`teamAwayName=${encodeURIComponent(filters.teamAwayName)}`);
                if (filters.type) params.push(`type=${encodeURIComponent(filters.type)}`);
                if (filters.season) params.push(`season=${encodeURIComponent(filters.season)}`);
                if (filters.fromDate) params.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
                if (filters.toDate) params.push(`toDate=${encodeURIComponent(filters.toDate)}`);
                if (filters.format) params.push(`format=${encodeURIComponent(filters.format)}`);
                if (selectedSeries && selectedSeries !== 'all') params.push(`name=${encodeURIComponent(selectedSeries)}`);
                params.push('limit=100');
                const query = params.length ? `?${params.join('&')}` : '';
                const res = await API.get(`${URL}/clips/series/completed${query}`);
                setSeriesList(res.data.series || []);
            } catch (err) {
                setError('Failed to fetch series');
            } finally {
                setLoading(false);
            }
        };
        fetchSeries();
    }, [filters.teamHomeName, filters.teamAwayName, filters.name, filters.type, filters.season, filters.fromDate, filters.toDate, filters.format, selectedSeries]);

    useEffect(() => {
        const fetchSeriesList = async () => {
            try {
                const res = await API.get(`${URL}/api/match/series/all`);
                setSeriesOptions(res.data || []);
            } catch (error) {
                console.error("Error fetching series list:", error);
            }
        };
        fetchSeriesList();
    }, []);

    const filteredSeries = [...seriesList].sort((a, b) => {
        if (filters.sort === 'clips-desc') return (b.clipsCount || 0) - (a.clipsCount || 0);
        if (filters.sort === 'clips-asc') return (a.clipsCount || 0) - (b.clipsCount || 0);
        return 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="mx-auto bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h1 className="text-2xl font-bold mb-6 text-blue-900 tracking-tight">Series-wise Clips</h1>

                {/* Filters (unchanged) */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 mb-6 flex flex-wrap gap-4 items-end px-2 py-3 rounded-t-xl shadow-sm">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                            className="border rounded p-2 text-sm w-24"
                        >
                            <option value="">All</option>
                            <option value="i">i</option>
                            <option value="d">d</option>
                            <option value="l">l</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Match Format</label>
                        <select
                            value={filters.format}
                            onChange={e => setFilters(f => ({ ...f, format: e.target.value }))}
                            className="border border-gray-300 rounded-md p-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="">All</option>
                            <option value="test">Test</option>
                            <option value="odi">ODI</option>
                            <option value="t20">T20</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">teamHomeName</label>
                        <select
                            value={filters.teamHomeName}
                            onChange={e => setFilters(f => ({ ...f, teamHomeName: e.target.value }))}
                            className="border rounded p-2 text-sm w-36"
                        >
                            <option value="">All</option>
                            {teamOptions.map(opt => (
                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">teamAwayName</label>
                        <select
                            value={filters.teamAwayName}
                            onChange={e => setFilters(f => ({ ...f, teamAwayName: e.target.value }))}
                            className="border rounded p-2 text-sm w-36"
                        >
                            <option value="">All</option>
                            {teamOptions.map(opt => (
                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Series Name</label>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                            placeholder="Series name"
                            className="border rounded p-2 text-sm w-44"
                        />
                    </div>
                    <div className="relative" style={{ minWidth: 320 }}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Series</label>
                        <input
                            type="text"
                            className="border rounded px-2 py-2 mr-2 w-full"
                            placeholder="Type to search series or select..."
                            value={seriesQuery || (selectedSeries === 'all' ? '' : (selectedSeriesLabel || ''))}
                            onChange={(e) => {
                                const v = e.target.value;
                                setSeriesQuery(v);
                                setShowSeriesSuggestions(true);
                                if (v === '') setSelectedSeries('all');
                            }}
                            onFocus={() => setShowSeriesSuggestions(true)}
                        />
                        {showSeriesSuggestions && (
                            <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
                                <div
                                    className="px-2 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                    onMouseDown={() => {
                                        setSelectedSeries('all');
                                        setSeriesQuery('');
                                        setShowSeriesSuggestions(false);
                                    }}
                                >
                                    All Series
                                </div>
                                {seriesOptions
                                    .filter(s => {
                                        if (!seriesQuery) return true;
                                        return s.name.toLowerCase().includes(seriesQuery.toLowerCase()) || String(s.seriesId).toLowerCase().includes(seriesQuery.toLowerCase());
                                    })
                                    .map(s => (
                                        <div
                                            key={s._id}
                                            className="px-2 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center"
                                            onMouseDown={() => {
                                                setSelectedSeries(s.name);
                                                setSeriesQuery(s.name);
                                                setSelectedSeriesLabel(s.name);
                                                setShowSeriesSuggestions(false);
                                            }}
                                        >
                                            <span>{s.name}</span>
                                            <small className="text-gray-400">{s.seriesId}</small>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Season</label>
                        <input
                            type="text"
                            value={filters.season}
                            onChange={e => setFilters(f => ({ ...f, season: e.target.value }))}
                            placeholder="e.g. 2024"
                            className="border rounded p-2 text-sm w-24"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
                            className="border rounded p-2 text-sm w-36"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
                            className="border rounded p-2 text-sm w-36"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sort by Clips</label>
                        <select
                            value={filters.sort}
                            onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                            className="border rounded p-2 text-sm"
                        >
                            <option value="clips-desc">Most Clips</option>
                            <option value="clips-asc">Fewest Clips</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-lg text-gray-500 animate-pulse">Loading series...</div>
                ) : error ? (
                    <div className="text-red-600 text-center py-8">{error}</div>
                ) : filteredSeries.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-lg">No series found for the selected filters.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                        <table className="min-w-[900px] bg-white rounded-xl overflow-hidden">
                            <thead>
                                <tr className="bg-blue-50 text-blue-900">
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[70px]">ID</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[60px]">Type</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[110px]">Last Date</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[180px]">Series</th>
                                    <th className="p-2 text-center font-semibold whitespace-nowrap min-w-[80px]">Clips</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[160px]">Teams</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[120px]">Match Types</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSeries.map((series, idx) => (
                                    <React.Fragment key={series.seriesId}>
                                        <tr className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/60`}>
                                            <td className="p-2 text-xs text-gray-500 whitespace-nowrap">
                                                <button
                                                    className="mr-2 text-blue-600 hover:underline focus:outline-none"
                                                    onClick={() => toggleExpand(series.seriesId)}
                                                >
                                                    {expandedSeries[series.seriesId] ? '▼' : '▶'}
                                                </button>
                                                {series.seriesId}
                                            </td>
                                            <td className="p-2 text-xs text-gray-700 whitespace-nowrap">{series.type || ''}</td>
                                            <td className="p-2 text-xs text-gray-700 whitespace-nowrap">{series.endDate ? new Date(series.endDate).toLocaleDateString() : ''}</td>
                                            <td className="p-2 font-medium max-w-xs truncate" title={series.name}>
                                                <button
                                                    onClick={() => window.open(`/match-wise?seriesId=${series.seriesId}`, '_blank')}
                                                    className="text-blue-600 hover:underline focus:outline-none text-left"
                                                >
                                                    {series.name}
                                                </button>
                                            </td>
                                            <td className="p-2 font-semibold text-blue-700 text-center">{series.clipsCount}</td>
                                            <td className="p-2">
                                                <span className="text-sm text-gray-700">{series.homeTeams?.join(', ')}</span>
                                                <span className="mx-1 text-gray-400">vs</span>
                                                <span className="text-sm text-gray-700">{series.awayTeams?.join(', ')}</span>
                                            </td>
                                            <td className="p-2 text-xs text-gray-700 whitespace-nowrap">
                                                {series.matchTypeCounts ? Object.entries(series.matchTypeCounts).map(([type, count]) => `${type}: ${count}`).join(', ') : '-'}
                                            </td>
                                        </tr>
                                        {expandedSeries[series.seriesId] && series.matches && (
                                            <tr>
                                                <td colSpan={7} className="bg-blue-50/40 p-3">
                                                    <div>
                                                        <div className="font-semibold mb-2 text-blue-900">Matches in this series:</div>
                                                        {series.matches.length === 0 ? (
                                                            <div className="text-gray-500 text-sm">No matches found.</div>
                                                        ) : (
                                                            <table className="min-w-[600px] w-full text-sm border border-gray-200 rounded">
                                                                <thead>
                                                                    <tr className="bg-blue-100">
                                                                        <th
                                                                            className="p-2 text-left cursor-pointer hover:bg-blue-200"
                                                                            onClick={() => requestMatchSort(series.seriesId, 'matchId')}
                                                                        >
                                                                            Match ID {matchSort[series.seriesId]?.key === 'matchId' && (matchSort[series.seriesId].direction === 'asc' ? '↑' : '↓')}
                                                                        </th>
                                                                        <th
                                                                            className="p-2 text-left cursor-pointer hover:bg-blue-200"
                                                                            onClick={() => requestMatchSort(series.seriesId, 'type')}
                                                                        >
                                                                            Type {matchSort[series.seriesId]?.key === 'type' && (matchSort[series.seriesId].direction === 'asc' ? '↑' : '↓')}
                                                                        </th>
                                                                        <th
                                                                            className="p-2 text-left cursor-pointer hover:bg-blue-200"
                                                                            onClick={() => requestMatchSort(series.seriesId, 'clipsCount')}
                                                                        >
                                                                            Clips {matchSort[series.seriesId]?.key === 'clipsCount' && (matchSort[series.seriesId].direction === 'asc' ? '↑' : '↓')}
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sortMatches(series.matches, series.seriesId).map(match => (
                                                                        <tr
                                                                            key={match.matchId}
                                                                            className="border-b last:border-b-0 cursor-pointer hover:bg-blue-100/50"
                                                                            onClick={() => window.open(`/match/${match.matchId}`, '_blank')}
                                                                        >
                                                                            <td className="p-2 text-blue-600 hover:underline">{match.matchId}</td>
                                                                            <td className="p-2">{match.type}</td>
                                                                            <td className="p-2">{match.clipsCount}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}