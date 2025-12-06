
import { useEffect, useState } from 'react';
const teamOptions = [
    { id: "rcb", name: "RCB" },
    { id: "csk", name: "CSK" },
    { id: "mi", name: "MI" },
    { id: "kkr", name: "KKR" },
    { id: "srh", name: "SRH" },
    { id: "gt", name: "GT" },
    { id: "rr", name: "RR" },
    { id: "lsg", name: "LSG" },
    { id: "pbks", name: "PBKS" },
    { id: "dc", name: "DC" },
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
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

export default function SeriesWiseClips() {
    const [seriesList, setSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        teamHomeName: '',
        teamAwayName: '',
        name: '',
        type: '',
        season: '',
        fromDate: '',
        toDate: '',
        sort: 'clips-desc',
    });

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            setError('');
            try {
                const params = [];
                if (filters.teamHomeName) params.push(`teamHomeName=${encodeURIComponent(filters.teamHomeName)}`);
                if (filters.teamAwayName) params.push(`teamAwayName=${encodeURIComponent(filters.teamAwayName)}`);
                if (filters.name) params.push(`name=${encodeURIComponent(filters.name)}`);
                if (filters.type) params.push(`type=${encodeURIComponent(filters.type)}`);
                if (filters.season) params.push(`season=${encodeURIComponent(filters.season)}`);
                if (filters.fromDate) params.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
                if (filters.toDate) params.push(`toDate=${encodeURIComponent(filters.toDate)}`);
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
    }, [filters.teamHomeName, filters.teamAwayName, filters.name, filters.type, filters.season, filters.fromDate, filters.toDate]);

    // Only sort client-side
    const filteredSeries = [...seriesList].sort((a, b) => {
        if (filters.sort === 'clips-desc') return (b.clipsCount || 0) - (a.clipsCount || 0);
        if (filters.sort === 'clips-asc') return (a.clipsCount || 0) - (b.clipsCount || 0);
        return 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="mx-auto bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h1 className="text-2xl font-bold mb-6 text-blue-900 tracking-tight">Series-wise Clips</h1>
                {/* Filters */}
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
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[70px]" title="Series unique identifier">ID</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[60px]" title="Series type (i, d, l)">Type</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[110px]" title="Last match date in the series">Last Date</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[180px]" title="Full name of the series">Series</th>
                                    <th className="p-2 text-center font-semibold whitespace-nowrap min-w-[80px]" title="Total number of clips in this series">Clips</th>
                                    <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[160px]" title="Home and away teams in the series">Teams</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSeries.map((series, idx) => (
                                    <tr key={series.seriesId} className={"transition-colors " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-blue-50/60"}>
                                        <td className="p-2 text-xs text-gray-500 whitespace-nowrap">{series.seriesId}</td>
                                        <td className="p-2 text-xs text-gray-700 whitespace-nowrap">{series.type || ''}</td>
                                        <td className="p-2 text-xs text-gray-700 whitespace-nowrap">{series.endDate ? new Date(series.endDate).toLocaleDateString() : ''}</td>
                                        <td className="p-2 font-medium max-w-xs truncate" title={series.name}>{series.name}</td>
                                        <td className="p-2 font-semibold text-blue-700 text-center">{series.clipsCount}</td>
                                        <td className="p-2">
                                            <span className="text-sm text-gray-700">
                                                {series.homeTeams?.join(', ')}
                                            </span>
                                            <span className="mx-1 text-gray-400">vs</span>
                                            <span className="text-sm text-gray-700">
                                                {series.awayTeams?.join(', ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
