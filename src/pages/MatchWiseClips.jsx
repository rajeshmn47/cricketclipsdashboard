import { useEffect, useState } from 'react';
import axios from 'axios';
import { URL } from '../constants/userConstants';
import { useNavigate } from 'react-router-dom';
import { API } from '@/actions/userAction';
import { ExternalLink } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [filterValues, setFilterValues] = useState({});
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [filteredMatches, setFilteredMatches] = useState(matches); // assume `matches` is the full list
    const [selectedMatchType, setSelectedMatchType] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSeries, setSelectedSeries] = useState("");
    const matchTypeOptions = ['odi', 't20', 'test', 't10'];
    const categoryOptions = ['i', 'd', 'l'];
    const [important, setImportant] = useState('all');
    const [seriesOptions, setSeriesOptions] = useState([]);
    const [seriesQuery, setSeriesQuery] = useState('');
    const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false);
    const [selectedSeriesLabel, setSelectedSeriesLabel] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMatches, setTotalMatches] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [importance, setImportance] = useState("")
    const [sort, setSort] = useState("clipsDesc")

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                const params = {
                    seriesId: selectedSeries,
                    page: currentPage,
                    limit: itemsPerPage,
                    format: selectedMatchType,
                    type: selectedCategory,
                    sort: sort,
                    selectedFilter: selectedFilter,
                    importance: importance
                };
                const res = await API.get(`${URL}/clips/matches`, { params });
                console.log(res.data);
                setMatches(res.data.matches || []);
                setTotalPages(res.data.totalPages || 1);
                setTotalMatches(res.data.total || 0);
            } catch (err) {
                console.error("Error fetching matches:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [selectedSeries, selectedFilter, selectedCategory, selectedMatchType, currentPage, itemsPerPage, importance, sort]);

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

    useEffect(() => {
        if (matches?.length > 0 && (selectedFilter || selectedMatchType || selectedCategory)) {
            const filtered = getFilteredMatches()
            setFilteredMatches(filtered);
            // Don't reset page here since backend handles pagination
        }
    }, [matches, selectedFilter, selectedMatchType, selectedCategory, selectedSeries, importance])

    useEffect(() => {
        if (!editingItem) return;
        const { ballType, direction, shotType } = extractFieldsFromCommentary(editingItem.commText);
        setFilterValues(prev => ({
            ...prev,
            ...(ballType && { ballType }),
            ...(direction && { direction }),
            ...(shotType && { shotType }),
            ...(connection && { connection }),
            ...(keeperCatch && { keeperCatch })
        }));
    }, [editingItem]);

    const handleView = (match) => {
        // Navigate to match details page or perform any action
        console.log("Viewing match:", match);
        window.open(`/match/${match.matchId}`, '_blank');
    };

    const filterMatches = (filterKey) => {
        setSelectedFilter(filterKey);
    };

    const currentDate = new Date();

    function getFilteredMatches2() {
        console.log("filtering", selectedCategory, selectedMatchType)
        const filtered = selectedFilter === 'all'
            ? matches.filter(match => {
                if (match.format === selectedMatchType || match.type === selectedCategory) {
                    return true;
                }
                //else return true
            }
            )
            : matches.filter(match => {
                const matchDate = new Date(match.date);
                const matchEndDate = new Date(match.enddate);
                if (selectedFilter === 'ongoing') {
                    return matchDate <= currentDate && matchEndDate >= currentDate;
                } else if (selectedFilter === 'upcoming') {
                    return matchDate > currentDate;
                } else if (selectedFilter === 'completed') {
                    return match?.matchlive[0]?.result?.toLowerCase() === 'complete';
                    //return matchEndDate < currentDate;
                } else if (selectedFilter === 'delayedOrAbandoned') {
                    // Matches that are genuinely delayed or abandoned
                    const isDelayedOrAbandoned = match.matchlive?.[0]?.result === 'delayed' || match.matchlive?.[0]?.result?.toLowerCase() === 'abandon';
                    return isDelayedOrAbandoned;
                } else if (selectedFilter === 'notUpdated') {
                    // Matches that are not updated due to Cricbuzz API key not working
                    if (currentDate > matchDate) {
                        const isNotUpdated = (!match.matchlive || !match.matchlive[0]?.result) || (currentDate > matchEndDate && !(match.matchlive?.[0]?.result?.toLowerCase() == 'complete' || match.matchlive?.[0]?.result?.toLowerCase() == 'abandon'));
                        return isNotUpdated;
                    }
                    else {
                        return false
                    }
                }
                else if (selectedMatchType && match.format == selectedMatchType) {
                    console.log("filtering", match?.type, selectedCategory, match?.format, selectedMatchType)
                    return true;
                }
                else if (selectedCategory && match.type == selectedCategory) {
                    console.log("filtering", match?.type, selectedCategory, match?.format, selectedMatchType)
                    return true;
                }
                return false;
            });
        return filtered;
    }

    function getFilteredMatches() {
        return matches.filter(match => {
            const matchDate = new Date(match.date);
            const matchEndDate = new Date(match.enddate);
            const result = match?.matchlive?.[0]?.result?.toLowerCase();

            // Apply match status filter
            if (selectedFilter === 'ongoing') {
                if (!(matchDate <= currentDate && matchEndDate >= currentDate)) return false;
            } else if (selectedFilter === 'upcoming') {
                if (!(matchDate > currentDate)) return false;
            } else if (selectedFilter === 'completed') {
                if (result !== 'complete') return false;
            } else if (selectedFilter === 'delayedOrAbandoned') {
                if (!(result === 'delayed' || result === 'abandon')) return false;
            } else if (selectedFilter === 'notUpdated') {
                const isNotUpdated = (!match.matchlive || !result) ||
                    (currentDate > matchEndDate && !(result === 'complete' || result === 'abandon'));
                if (!isNotUpdated) return false;
            }

            // Apply match type filter
            if (selectedMatchType !== 'all' && match.format !== selectedMatchType) return false;

            // Apply category filter
            if (selectedCategory !== 'all' && match.type !== selectedCategory) return false;

            // Apply series filter
            if (selectedSeries !== 'all' && match.seriesId !== selectedSeries) return false;

            return true;
        });
    }

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold mb-4">Cricket Matches</h1>
            <div className="flex justify-start gap-2 flex-wrap mb-4 items-end">
                <div className="relative" style={{ minWidth: 320 }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Series</label>
                    {/* Searchable input with suggestions */}
                    <input
                        type="text"
                        className="border rounded px-2 py-2 mr-2 w-full"
                        placeholder="Type to search series or select..."
                        value={seriesQuery || (selectedSeries === 'all' ? '' : (selectedSeriesLabel || ''))}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSeriesQuery(v);
                            setShowSeriesSuggestions(true);
                            // if user clears input, reset to all
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
                                .filter((s) => {
                                    if (!seriesQuery) return true;
                                    return s.name.toLowerCase().includes(seriesQuery.toLowerCase()) || String(s.seriesId).toLowerCase().includes(seriesQuery.toLowerCase());
                                })
                                .map((s) => (
                                    <div
                                        key={s._id}
                                        className="px-2 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center"
                                        onMouseDown={() => {
                                            setSelectedSeries(s.seriesId);
                                            setSeriesQuery(s.name);
                                            setSelectedSeriesLabel && setSelectedSeriesLabel(s.name);
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
                    <select
                        value={selectedMatchType}
                        onChange={(e) => setSelectedMatchType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="t20">T20</option>
                        <option value="odi">ODI</option>
                        <option value="test">Test</option>
                    </select>
                </div>

                {/* Sort Control */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort</label>
                    <select
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="clipsDesc">Clips: High → Low</option>
                        <option value="clipsAsc">Clips: Low → High</option>
                        <option value="dateDesc">Date: Newest First</option>
                        <option value="dateAsc">Date: Oldest First</option>
                    </select>
                </div>

                {/* Category Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="i">International</option>
                        <option value="d">Domestic</option>
                        <option value="l">T20 League</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Importance</label>
                    <select
                        value={importance}
                        onChange={(e) => setImportance(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">All</option>
                        <option value="very_high">Very High</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div className='flex justify-start'>
                {[
                    { key: "notUpdated", label: "Not Updated" },
                    { key: "all", label: "All Matches" },
                    { key: "ongoing", label: "Ongoing" },
                    { key: "upcoming", label: "Upcoming" },
                    { key: "completed", label: "Completed" },
                    { key: "delayedOrAbandoned", label: "Delayed or Abandoned" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => filterMatches(key)}
                        className={`px-4 py-1 rounded font-semibold text-sm border h-[40px] mr-2
        ${selectedFilter === key
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                            }
      `}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Calculate pagination */}
            {loading ? <div className="p-8 text-center text-lg">Loading matches...</div> : matches && matches.length > 0 && (() => {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;

                return (
                    <>
                        {/* Matches */}
                        {matches.map((match) => {

                            return (
                                <div
                                    key={match._id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                                >
                                    {/* Main Row - Teams, Title, Clips, Status */}
                                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                                        {/* Teams vs */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Home Team */}
                                            <div className="flex flex-col items-center gap-0.5">
                                                {match.teamHomeFlagUrl && (
                                                    <img
                                                        src={match.teamHomeFlagUrl}
                                                        alt={match.teamHomeCode}
                                                        className="w-7 h-7 object-cover rounded-full border border-gray-300"
                                                    />
                                                )}
                                                <div className="text-xs font-bold uppercase text-gray-700">{match.teamHomeCode}</div>
                                            </div>

                                            {/* VS */}
                                            <span className="text-sm font-bold text-gray-400">vs</span>

                                            {/* Away Team */}
                                            <div className="flex flex-col items-center gap-0.5">
                                                {match.teamAwayFlagUrl && (
                                                    <img
                                                        src={match.teamAwayFlagUrl}
                                                        alt={match.teamAwayCode}
                                                        className="w-7 h-7 object-cover rounded-full border border-gray-300"
                                                    />
                                                )}
                                                <div className="text-xs font-bold uppercase text-gray-700">{match.teamAwayCode}</div>
                                            </div>
                                        </div>

                                        {/* Title and Format */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{match.matchTitle}</h3>
                                            <div className="text-xs text-gray-500">
                                                <span className="uppercase font-medium">{match.format}</span>
                                                {match.type && <span> • {match.type.toUpperCase()}</span>}
                                            </div>
                                        </div>

                                        {/* Clips Badge */}
                                        <div className="flex-shrink-0 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-center">
                                            <div className="text-lg font-bold">{match.clipsCount || 0}</div>
                                            <div className="text-xs font-medium">Clips</div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex-shrink-0">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${match.matchStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                match.matchStatus === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                                    match.matchStatus === 'upcoming' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {match.matchStatus?.toUpperCase() || 'PENDING'}
                                            </span>
                                        </div>

                                        {/* More Details Toggle */}
                                        <button
                                            onClick={() => setShowDetails(!showDetails)}
                                            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition"
                                        >
                                            {showDetails ? '▼' : '▶'}
                                        </button>
                                    </div>

                                    {/* Expandable Details Section */}
                                    {showDetails && (
                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                                            {/* Strength Meter */}
                                            {(() => {
                                                const backend = match?.strength;
                                                let label = 'No Clips';
                                                let percent = 0;
                                                let color = 'bg-gray-300';

                                                if (backend && typeof backend === 'object') {
                                                    label = backend.label || label;
                                                    percent = Math.max(0, Math.min(100, Number(backend.percent || 0)));
                                                    color = backend.color || (percent > 70 ? 'bg-green-500' : percent > 30 ? 'bg-amber-500' : 'bg-yellow-400');
                                                } else if (backend !== undefined && backend !== null) {
                                                    percent = Math.max(0, Math.min(100, Number(backend) || 0));
                                                    label = percent === 0 ? 'No Clips' : percent <= 30 ? 'Weak' : percent <= 70 ? 'Moderate' : 'Strong';
                                                    color = percent === 0 ? 'bg-gray-300' : percent <= 30 ? 'bg-yellow-400' : percent <= 70 ? 'bg-amber-500' : 'bg-green-500';
                                                }

                                                return (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-semibold text-gray-700">Strength Quality</span>
                                                            <span className="text-xs font-bold text-gray-600">{label}</span>
                                                        </div>
                                                        <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                                                            <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${percent}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Date Info */}
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium mb-0.5">Start Date</div>
                                                <div className="text-xs text-gray-700">{new Date(match.date).toLocaleDateString()} • {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>

                                            {/* Series ID */}
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium mb-0.5">Series ID</div>
                                                <div className="text-xs font-mono text-gray-700 break-all">{match.seriesId}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer - Action Button */}
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        <button
                                            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group"
                                            onClick={() => handleView(match)}
                                        >
                                            <span>View Match Clips</span>
                                            <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination Controls */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg shadow border border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + itemsPerPage, totalMatches)}</span> of <span className="font-semibold">{totalMatches}</span> matches
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {(() => {
                                        const pages = [];
                                        const maxVisible = 5;
                                        const halfVisible = Math.floor(maxVisible / 2);

                                        let startPage = Math.max(1, currentPage - halfVisible);
                                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                        if (endPage - startPage + 1 < maxVisible) {
                                            startPage = Math.max(1, endPage - maxVisible + 1);
                                        }

                                        // Add first page and ellipsis
                                        if (startPage > 1) {
                                            pages.push(
                                                <button
                                                    key={1}
                                                    onClick={() => setCurrentPage(1)}
                                                    className="px-3 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
                                                >
                                                    1
                                                </button>
                                            );
                                            if (startPage > 2) {
                                                pages.push(
                                                    <span key="ellipsis-start" className="px-2 py-2 text-gray-600">
                                                        ...
                                                    </span>
                                                );
                                            }
                                        }

                                        // Add middle pages
                                        for (let page = startPage; page <= endPage; page++) {
                                            pages.push(
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-2 rounded text-sm font-medium ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-300 bg-white hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        }

                                        // Add last page and ellipsis
                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pages.push(
                                                    <span key="ellipsis-end" className="px-2 py-2 text-gray-600">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            pages.push(
                                                <button
                                                    key={totalPages}
                                                    onClick={() => setCurrentPage(totalPages)}
                                                    className="px-3 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
                                                >
                                                    {totalPages}
                                                </button>
                                            );
                                        }

                                        return pages;
                                    })()}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}