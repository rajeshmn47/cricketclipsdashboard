import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';
import { Delete, DeleteIcon, Edit, Eye, Trash, Upload } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

const teamOptions = [
    "afghanistan",
    "australia",
    "bangladesh",
    "canada",
    "england",
    "india",
    "ireland",
    "namibia",
    "nepal",
    "netherlands",
    "new zealand",
    "oman",
    "pakistan",
    "scotland",
    "south africa",
    "sri lanka",
    "united arab emirates",
    "united states of america",
    "west indies",
    "zimbabwe",
    // League / franchise teams (sorted)
    "abu dhabi knight riders",
    "adelaide strikers",
    "brisbane heat",
    "chennai super kings",
    "delhi capitals",
    "desert vipers",
    "dubai capitals",
    "durban super giants",
    "gujarat titans",
    "gulf giants",
    "hobart hurricanes",
    "hyderabad kingsmen",
    "islamabad united",
    "joburg super kings",
    "karachi kings",
    "kolkata knight riders",
    "lahore qalandars",
    "lucknow super giants",
    "melbourne renegades",
    "melbourne stars",
    "mi cape town",
    "mi emirates",
    "mumbai indians",
    "multan sultans",
    "paarl royals",
    "perth scorchers",
    "peshawar zalmi",
    "pretoria capitals",
    "punjab kings",
    "quetta gladiators",
    "rajasthan royals",
    "rawalpindiz",
    "royal challengers bengaluru",
    "royal challengers bengaluru women",
    "sharjah warriorz",
    "sunrisers eastern cape",
    "sunrisers hyderabad",
    "sydney sixers",
    "sydney thunder"
];

export default function Tasks() {
    const [seriesQuery, setSeriesQuery] = useState('');
    const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatus, setBulkStatus] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSeries, setFilterSeries] = useState('');
    const [seriesOptions, setSeriesOptions] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTask, setUploadTask] = useState(null);
    const [cookiesModalOpen, setCookiesModalOpen] = useState(false);
    const [cookiesForm, setCookiesForm] = useState({
        hotstar: "",
        youtube: ""
    });
    const homeTeamRef = useRef(null);
    const awayTeamRef = useRef(null);
    const [homeTeamQuery, setHomeTeamQuery] = useState('');
    const [awayTeamQuery, setAwayTeamQuery] = useState('');
    const [filterHomeTeam, setFilterHomeTeam] = useState('');
    const [showHomeTeamDropdown, setShowHomeTeamDropdown] = useState(false);
    const [filterAwayTeam, setFilterAwayTeam] = useState('');
    const [showAwayTeamDropdown, setShowAwayTeamDropdown] = useState(false);

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const res = await API.get(`${URL}/api/match/series/all`);
                setSeriesOptions(res.data || []);
            } catch (err) {
                setSeriesOptions([]);
            }
        };
        fetchSeries();
    }, []);

    useEffect(() => {
        fetchCookies()
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (homeTeamRef.current && !homeTeamRef.current.contains(event.target)) {
                setShowHomeTeamDropdown(false);
            }
            if (awayTeamRef.current && !awayTeamRef.current.contains(event.target)) {
                setShowAwayTeamDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusOptions = [
        'created',
        'downloading',
        'creating-matches-list',
        'cropping',
        'ocr',
        'commentary',
        'cutting',
        'finished',
        'error',
    ];

    const [createForm, setCreateForm] = useState({
        matchId: '',
        teamHomeName: '',
        status: statusOptions[0],
        format: '',
        year: '',
        youtubeFormat: '',
    });

    const fetchTasks = async (page = currentPage, limit = itemsPerPage, status = filterStatus) => {
        setLoading(true);
        try {
            let url = `${URL}/tasks/alltasks?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }
            if (filterSeries) {
                url += `&series=${filterSeries}`;
            }
            if (homeTeamQuery || filterHomeTeam) {
                url += `&teamHomeName=${filterHomeTeam || homeTeamQuery}`;
            }
            if (awayTeamQuery || filterAwayTeam) {
                url += `&teamAwayName=${filterAwayTeam || awayTeamQuery}`;
            }
            const { data } = await API.get(url);
            setTasks(data.tasks || []);
            setTotalPages(data.pages || 1);
            setTotalTasks(data.total || 0);
        } catch (err) {
            setTasks([]);
            setTotalPages(1);
            setTotalTasks(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line
    }, [currentPage, awayTeamQuery, homeTeamQuery, itemsPerPage, filterStatus, filterSeries]);

    const handleEdit = (task) => {
        setEditTask(task);
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        try {
            await API.put(`${URL}/tasks/update/${editTask._id}`, editTask);
            setShowEditModal(false);
            setEditTask(null);
            fetchTasks();
        } catch (err) {
            alert('Failed to update task');
        }
    };

    const handleUpload = async (task) => {
        console.log('Upload task:', task);
        setUploadTask(task);
        setShowUploadModal(true);
    };

    const handleUploadSave = async () => {
        try {
            await API.put(`${URL}/tasks/update/${editTask._id}`, editTask);
            setShowEditModal(false);
            setEditTask(null);
        } catch (err) {
            alert('Failed to update task');
        }
    };

    const handleCreate = async () => {
        try {
            await API.post(`${URL}/tasks/create`, createForm);
            setShowCreateModal(false);
            setCreateForm({ matchId: '', teamHomeName: '', status: statusOptions[0], format: '', year: '' });
            fetchTasks();
        } catch (err) {
            alert('Failed to create task');
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await API.delete(`${URL}/tasks/delete/${taskId}`);
            fetchTasks();
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    const toggleSelectTask = (taskId) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const selectAllTasks = () => {
        setSelectedTaskIds(tasks.map(t => t._id));
    };

    const deselectAllTasks = () => {
        setSelectedTaskIds([]);
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus) {
            alert('Please select a status');
            return;
        }

        setLoading(true);
        try {
            // Update each task one by one using the existing endpoint
            const updatePromises = selectedTaskIds.map(id =>
                API.put(`${URL}/tasks/update/${id}`, { status: bulkStatus })
            );

            await Promise.all(updatePromises);

            alert(`Successfully updated ${selectedTaskIds.length} task(s)`);
            setShowBulkStatusModal(false);
            setBulkStatus('');
            setSelectedTaskIds([]);
            fetchTasks();
        } catch (err) {
            alert('Failed to update some tasks. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPipeline = async (taskId) => {
        try {
            const { data } = await API.get(`${URL}/tasks/startPipeline`);
            alert(data.message || 'Pipeline started successfully');
            fetchTasks();
        } catch (err) {
            alert(`Failed to start pipeline: ${err.response?.data?.error || err.message}`);
        }
    };

    const saveCookies = async () => {
        try {
            await API.post(`${URL}/tasks/cookies`, {
                name: "fango11",
                cookies: cookiesForm
            });

            alert("Cookies saved successfully");
        } catch (err) {
            console.log(err);
        }
    };

    const fetchCookies = async () => {
        try {
            const { data } = await API.get(`${URL}/tasks/cookies?name=fango11`);

            setCookiesForm({
                hotstar: data.cookies.hotstar || "",
                youtube: data.cookies.youtube || ""
            });
        } catch (err) {
            console.log(err);
        }
    };

    const handleGenerateIgnoreTeams = async () => {
        try {
            const res = await API.get(`${URL}/tasks/generate-ignore-teams`);
            if (res.data.success) {
                alert(`✅ ${res.data.message}\nIgnored teams: ${res.data.ignoreTeams.join(', ')}`);
            } else {
                alert('Error: ' + res.data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Request failed');
        }
    };

    return (
        <div className="p-6 mx-auto max-w-6xl">
            {/* Header with title and action buttons */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold">Tasks</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setCookiesModalOpen(true)} className="bg-indigo-600 text-white">Manage Cookies</Button>
                    <Button onClick={() => fetchTasks()} className="bg-blue-600 text-white">Refresh</Button>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 text-white">+ Create Task</Button>
                    <Button onClick={handleGenerateIgnoreTeams} className="bg-purple-600 text-white">
                        Generate Ignore Teams
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Items per page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={itemsPerPage}
                            onChange={e => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 20, 50, 100].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter by status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterStatus}
                            onChange={e => {
                                setFilterStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Home Team (searchable dropdown) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                        <div className="relative" ref={homeTeamRef}>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search home team..."
                                value={homeTeamQuery || filterHomeTeam}
                                onChange={e => {
                                    const value = e.target.value;
                                    setHomeTeamQuery(value);
                                    setShowHomeTeamDropdown(true);
                                    if (value === '') {
                                        setFilterHomeTeam('');
                                        setCurrentPage(1);
                                    }
                                }}
                                onFocus={() => setShowHomeTeamDropdown(true)}
                                onBlur={() => {
                                    if (filterHomeTeam && !homeTeamQuery) {
                                        setHomeTeamQuery(filterHomeTeam);
                                    }
                                }}
                            />
                            {filterHomeTeam && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        setFilterHomeTeam('');
                                        setHomeTeamQuery('');
                                        setCurrentPage(1);
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                            {showHomeTeamDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-auto">
                                    <div
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        onMouseDown={() => {
                                            setFilterHomeTeam('');
                                            setHomeTeamQuery('');
                                            setShowHomeTeamDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        All Teams
                                    </div>
                                    {teamOptions
                                        .filter(team => !homeTeamQuery || team.toLowerCase().includes(homeTeamQuery.toLowerCase()))
                                        .map(team => (
                                            <div
                                                key={team}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                onMouseDown={() => {
                                                    setFilterHomeTeam(team);
                                                    setHomeTeamQuery(team);
                                                    setShowHomeTeamDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {team}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Away Team (searchable dropdown) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
                        <div className="relative" ref={awayTeamRef}>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search away team..."
                                value={awayTeamQuery || filterAwayTeam}
                                onChange={e => {
                                    const value = e.target.value;
                                    setAwayTeamQuery(value);
                                    setShowAwayTeamDropdown(true);
                                    if (value === '') {
                                        setFilterAwayTeam('');
                                        setCurrentPage(1);
                                    }
                                }}
                                onFocus={() => setShowAwayTeamDropdown(true)}
                                onBlur={() => {
                                    if (filterAwayTeam && !awayTeamQuery) {
                                        setAwayTeamQuery(filterAwayTeam);
                                    }
                                }}
                            />
                            {filterAwayTeam && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        setFilterAwayTeam('');
                                        setAwayTeamQuery('');
                                        setCurrentPage(1);
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                            {showAwayTeamDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-auto">
                                    <div
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        onMouseDown={() => {
                                            setFilterAwayTeam('');
                                            setAwayTeamQuery('');
                                            setShowAwayTeamDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        All Teams
                                    </div>
                                    {teamOptions
                                        .filter(team => !awayTeamQuery || team.toLowerCase().includes(awayTeamQuery.toLowerCase()))
                                        .map(team => (
                                            <div
                                                key={team}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                onMouseDown={() => {
                                                    setFilterAwayTeam(team);
                                                    setAwayTeamQuery(team);
                                                    setShowAwayTeamDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {team}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Series (searchable dropdown) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type to search series..."
                                value={seriesQuery || (filterSeries ? (seriesOptions.find(opt => opt.seriesId === filterSeries)?.name || '') : '')}
                                onChange={e => {
                                    setSeriesQuery(e.target.value);
                                    setShowSeriesDropdown(true);
                                }}
                                onFocus={() => setShowSeriesDropdown(true)}
                            />
                            {showSeriesDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-auto">
                                    <div
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        onMouseDown={() => {
                                            setFilterSeries('');
                                            setSeriesQuery('');
                                            setShowSeriesDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        All Series
                                    </div>
                                    {seriesOptions
                                        .filter(opt => {
                                            if (!seriesQuery) return true;
                                            return (
                                                (opt.name || '').toLowerCase().includes(seriesQuery.toLowerCase()) ||
                                                String(opt.seriesId).toLowerCase().includes(seriesQuery.toLowerCase())
                                            );
                                        })
                                        .map(opt => (
                                            <div
                                                key={opt.seriesId}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                onMouseDown={() => {
                                                    setFilterSeries(opt.seriesId);
                                                    setSeriesQuery(opt.name || '');
                                                    setShowSeriesDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {opt.name || opt.label}
                                                <span className="ml-2 text-xs text-gray-400">{opt.seriesId}</span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination info + selection buttons row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages} ({totalTasks} tasks)
                </div>
                <div className="flex gap-2">
                    {selectedTaskIds.length > 0 ? (
                        <>
                            <span className="text-sm font-medium text-blue-700">{selectedTaskIds.length} selected</span>
                            <Button onClick={() => setShowBulkStatusModal(true)} className="bg-purple-600 text-white text-sm">Update Status</Button>
                            <Button onClick={deselectAllTasks} variant="outline" className="border-red-300 text-red-600 text-sm">Deselect All</Button>
                        </>
                    ) : tasks.length > 0 && (
                        <Button onClick={selectAllTasks} variant="outline" className="border-blue-300 text-blue-600 text-sm">Select All</Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded shadow">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                                            onChange={() => {
                                                if (selectedTaskIds.length === tasks.length) {
                                                    deselectAllTasks();
                                                } else {
                                                    selectAllTasks();
                                                }
                                            }}
                                            className="cursor-pointer w-4 h-4"
                                        />
                                    </th>
                                    <th className="p-2 text-left">Match ID</th>
                                    <th className="p-2 text-left">Home Team</th>
                                    <th className="p-2 text-left">Status</th>
                                    <th className="p-2 text-left">Format</th>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Clips</th>
                                    <th className="p-2 text-left">Video Link</th>
                                    <th className="p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task._id} className="border-t hover:bg-gray-50">
                                        <td className="p-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskIds.includes(task._id)}
                                                onChange={() => toggleSelectTask(task._id)}
                                                className="cursor-pointer w-4 h-4"
                                            />
                                        </td>
                                        <td className="p-2">{task.matchId}</td>
                                        <td className="p-2 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis" title={task.teamHomeName}>
                                            {task.teamHomeName && task.teamHomeName.length > 30
                                                ? `${task.teamHomeName.slice(0, 18)}...${task.teamHomeName.slice(-8)}`
                                                : task.teamHomeName}
                                        </td>
                                        <td className="p-2">
                                            <span
                                                data-tooltip-id={`error-tooltip-${task._id}`}
                                                data-tooltip-content={
                                                    task.status === "error" && task.logs
                                                        ? task.logs.join("\n")
                                                        : ""
                                                }
                                                className={`px-2 py-1 rounded text-xs font-semibold cursor-help ${task.status === 'finished' ? 'bg-green-100 text-green-800' :
                                                    task.status === 'error' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {task.status}
                                            </span>
                                            {task.status === "error" && task.logs && (
                                                <Tooltip id={`error-tooltip-${task._id}`} place="top" style={{ maxWidth: "300px", whiteSpace: "pre-line" }} />
                                            )}
                                        </td>
                                        <td className="p-2 uppercase">{task.format}</td>
                                        <td className="p-2">
                                            {task.matchDate
                                                ? new Date(task.matchDate).toLocaleDateString()
                                                : ''}
                                        </td>
                                        <td className="p-2">
                                            {task.expectedTotal ?
                                                <span className="text-xs text-red-200">{task?.expectedTotal}</span> : <span className="text-xs font-semibold text-red-600">{task.clips}</span>}
                                        </td>
                                        <td className="p-2 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                            {task.videoLink ? (
                                                <a
                                                    href={task.videoLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline"
                                                    title={task.videoLink}
                                                >
                                                    {task.videoLink.length > 40
                                                        ? `${task.videoLink.slice(0, 20)}...${task.videoLink.slice(-15)}`
                                                        : task.videoLink}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic">No Link</span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex gap-2">
                                                {(!task?.expectedTotal == 0) && <Button onClick={() => handleUpload(task)} className="bg-yellow-500 text-white text-xs px-2 py-1"><Upload className="w-3 h-3" /></Button>}
                                                <Button onClick={() => handleEdit(task)} className="bg-yellow-500 text-white text-xs px-2 py-1"><Edit className="w-3 h-3" /></Button>
                                                <Button onClick={() => window.open(`/match/${task.matchId}`)} className="bg-blue-600 text-white text-xs px-2 py-1"><Eye className="w-3 h-3" /></Button>
                                                <Button onClick={() => handleStartPipeline(task._id)} className="bg-green-600 text-white text-xs px-2 py-1">Start</Button>
                                                <Button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white text-xs px-2 py-1"><Trash className="w-3 h-3" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">

                            {/* Previous */}
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </Button>

                            {/* First Page */}
                            {currentPage > 3 && (
                                <>
                                    <Button variant="outline" onClick={() => setCurrentPage(1)}>
                                        1
                                    </Button>
                                    <span>...</span>
                                </>
                            )}

                            {/* Page Window */}
                            {Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
                                .filter(page => page > 0 && page <= totalPages)
                                .map(page => (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        className={page === currentPage ? "bg-blue-600 text-white" : ""}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}

                            {/* Last Page */}
                            {currentPage < totalPages - 2 && (
                                <>
                                    <span>...</span>
                                    <Button variant="outline" onClick={() => setCurrentPage(totalPages)}>
                                        {totalPages}
                                    </Button>
                                </>
                            )}

                            {/* Next */}
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}

            {cookiesModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-4 rounded shadow mt-6">
                        <h2 className="text-lg font-bold mb-2">Manage Cookies</h2>
                        <h2 className="text-lg font-bold mb-2">Hotstar</h2>
                        <textarea
                            className="w-full border p-2 rounded mb-2"
                            placeholder="Paste Hotstar cookies"
                            value={cookiesForm.hotstar}
                            onChange={(e) =>
                                setCookiesForm({ ...cookiesForm, hotstar: e.target.value })
                            }
                        />
                        <h2 className="text-lg font-bold mb-2">YouTube</h2>
                        <textarea
                            className="w-full border p-2 rounded mb-2"
                            placeholder="Paste YouTube cookies"
                            value={cookiesForm.youtube}
                            onChange={(e) =>
                                setCookiesForm({ ...cookiesForm, youtube: e.target.value })
                            }
                        />

                        <div className="flex gap-2">
                            <button
                                className="bg-green-600 text-white px-4 py-1 rounded"
                                onClick={saveCookies}
                            >
                                Save Cookies
                            </button>

                            <button
                                className="bg-blue-600 text-white px-4 py-1 rounded"
                                onClick={fetchCookies}
                            >
                                Load Cookies
                            </button>
                            <button
                                className="bg-gray-400 text-white px-4 py-1 rounded"
                                onClick={() => setCookiesModalOpen(false)}
                            >Close
                            </button>
                        </div>
                    </div>
                </div>)}

            {/* Bulk Status Update Modal */}
            {showBulkStatusModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-6 rounded-xl w-[95%] max-w-md space-y-4">
                        <h2 className="text-lg font-bold">Update Status for {selectedTaskIds.length} Task(s)</h2>
                        <p className="text-sm text-gray-600">Select a new status to apply to all selected tasks:</p>
                        <select
                            className="w-full border p-2 rounded"
                            value={bulkStatus}
                            onChange={e => setBulkStatus(e.target.value)}
                        >
                            <option value="">-- Select Status --</option>
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-between pt-3">
                            <Button onClick={() => setShowBulkStatusModal(false)} className="bg-gray-400 text-white">Cancel</Button>
                            <Button
                                onClick={handleBulkStatusUpdate}
                                className="bg-purple-600 text-white"
                                disabled={!bulkStatus}
                            >
                                Update All
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-6 rounded-xl w-[95%] max-w-md space-y-4">
                        <h2 className="text-lg font-bold">Edit Task</h2>
                        <input
                            className="w-full border p-2 rounded"
                            value={editTask.teamHomeName || ''}
                            onChange={e => setEditTask({ ...editTask, teamHomeName: e.target.value })}
                            placeholder="Team Name"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={editTask.videoLink || ''}
                            onChange={e => setEditTask({ ...editTask, videoLink: e.target.value })}
                            placeholder="Video Link (URL)"
                        />
                        <select
                            className="w-full border p-2 rounded"
                            value={editTask.status}
                            onChange={e => setEditTask({ ...editTask, status: e.target.value })}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </option>
                            ))}
                        </select>
                        <label className="block mt-2 text-sm font-medium text-gray-700">YouTube Format</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={editTask.youtubeFormat || ''}
                            onChange={e => setEditTask({ ...editTask, youtubeFormat: e.target.value })}
                        >
                            <option value="">Select Format</option>
                            <option value="136">136</option>
                            <option value="298">298</option>
                            <option value="300">300</option>
                        </select>
                        <div className="flex justify-between pt-3">
                            <Button onClick={() => setShowEditModal(false)} className="bg-gray-400 text-white">Cancel</Button>
                            <Button onClick={handleEditSave} className="bg-green-600 text-white">Save</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-6 rounded-xl w-[95%] max-w-md space-y-4">
                        <h2 className="text-lg font-bold">Create Task</h2>
                        <input
                            className="w-full border p-2 rounded"
                            value={createForm.matchId}
                            onChange={e => setCreateForm({ ...createForm, matchId: e.target.value })}
                            placeholder="Match ID"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={createForm.videoLink || ''}
                            onChange={e => setCreateForm({ ...createForm, videoLink: e.target.value })}
                            placeholder="Video Link (URL)"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={createForm.teamHomeName}
                            onChange={e => setCreateForm({ ...createForm, teamHomeName: e.target.value })}
                            placeholder="Home Team Name"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={createForm.format}
                            onChange={e => setCreateForm({ ...createForm, format: e.target.value })}
                            placeholder="Format (e.g. ODI, T20)"
                        />
                        <input
                            className="w-full border p-2 rounded"
                            value={createForm.year}
                            onChange={e => setCreateForm({ ...createForm, year: e.target.value })}
                            placeholder="Year"
                        />
                        <select
                            className="w-full border p-2 rounded"
                            value={createForm.status}
                            onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-between pt-3">
                            <Button onClick={() => setShowCreateModal(false)} className="bg-gray-400 text-white">Cancel</Button>
                            <Button onClick={handleCreate} className="bg-green-600 text-white">Create</Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="w-[30%] h-[20%] bg-white rounded p-4 mt-2 flex items-center gap-2">
                        <div className='flex flex-col gap-4 items-center justify-center w-full'>
                            <h5>are u sure u want to upload clips for this task?</h5>
                            <div className='flex gap-4'>
                                <button
                                    className="px-3 py-1 bg-gray-400 text-white rounded"
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadTask(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                {loading ?
                                    <button className='px-3 py-1 bg-indigo-600 text-white rounded cursor-not-allowed'>Loading...</button>
                                    : <button
                                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                await API.get(`${URL}/tasks/insertClips/${uploadTask?.matchId}`)
                                                setShowUploadModal(false);
                                                fetchTasks();
                                                setLoading(false);
                                                alert(clipsRes.data.message || 'Clips uploaded successfully');
                                            } catch (err) {
                                                console.error('Failed to parse pasted JSON', err);
                                            }
                                        }}
                                    >
                                        Upload
                                    </button>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
