import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Search, XCircle } from 'lucide-react';
import Filters from '../components/Filters';
import { API } from '../actions/userAction';
import { NEW_URL, URL } from '../constants/userConstants';
import axios from 'axios';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import VideoTrimmer from '../VideoTrimmer';
import { inferDismissals } from '../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../actions/userAction';
import { useNavigate } from 'react-router-dom';
import EditClipForm from '@/components/EditClipForm';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user || {});

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [trimmingClip, setTrimmingClip] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedQuality, setSelectedQuality] = useState('240p');
  const videoRef = useRef(null);
  const videoSrc = `${NEW_URL}/${selectedQuality == '240p' ? 'mockvideos' : selectedQuality == '360p' ? '360p' : '720p'}`;

  // Backend Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalClips, setTotalClips] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [allPlayers, setAllPlayers] = useState([]);
  const [clipModal, setClipModal] = useState(false);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({
    flagged: null,      // true/false/null
    flagReason: '',
    conflictField: '',
    reviewStatus: '',
    reported: null,
  });
  const conflictFieldOptions = [
    { id: "batsman", name: "Batsman" }, { id: "bowler", name: "Bowler" },
    { id: "half_clip", name: "Half Clip" }, { id: "shotType", name: "Shot Type" },
    { id: "direction", name: "Direction" }, { id: "ballType", name: "Ball Type" },
    { id: "lengthType", name: "Length Type" }, { id: "catchBy", name: "Caught By" },
    { id: "droppedBy", name: "Dropped By" }, { id: "runoutBy", name: "Runout By" },
    { id: "stumpedBy", name: "Stumped By" }
  ];

  // Debounce timeout for search
  const debounceTimeout = useRef(null);

  // Clear all filters
  const clearFilters = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

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

  // Handle filter changes from Filters component
  const handleFilterChange = (key, value) => {
    let backendKey = key;
    let backendValue = value;

    // Map frontend filter keys to backend parameter names
    if (key === 'flagged') {
      backendKey = 'isFlagged';
      if (value === 'flagged') backendValue = 'true';
      else if (value === 'notFlagged') backendValue = 'false';
      else backendValue = '';
    }
    // Map conflictFields to conflictField (singular)
    else if (key === 'conflictFields') {
      backendKey = 'conflictField';
    }
    // Keep others as is: reviewStatus, flagReason, isDropped, etc.

    setFilterValues((prev) => ({ ...prev, [backendKey]: backendValue }));
    setCurrentPage(1);
  };

  // Fetch clips with backend pagination
  const fetchClips = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      if (searchTerm) params.append('search', searchTerm);
      // In fetchClips, after building params:
      // Add filter values
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const res = await axios.get(`${URL}/clips/allclips?${params.toString()}`);

      const enhancedClips = (res.data.clips || []).map((clip) => {
        const inferred = inferDismissals(clip?.event, clip.commentary || "")
        return { ...clip, ...inferred }
      });

      setClips(enhancedClips);
      setTotalClips(res.data.total || 0);
      setTotalPages(res.data.totalPages || 0);

    } catch (err) {
      console.error("Error fetching clips:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setCurrentPage(1);
      fetchClips();
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [filterValues]);

  // Fetch when page or itemsPerPage changes
  useEffect(() => {
    fetchClips();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    async function getPlayers() {
      const { data } = await API.get(`${URL}/clips/all_players`)
      setAllPlayers([...data])
    }
    getPlayers()
  }, [])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDownloadSelected = () => {
    selectedClipIds.forEach((clipId) => {
      const clip = clips.find(c => c._id === clipId);
      if (clip) {
        const link = document.createElement("a");
        link.href = `${URL}/mockvideos/${clip.clip}`;
        link.download = clip.clip;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleMergeAndDownload = async () => {
    setLoading(true)
    const selectedClipsObjects = clips.filter(clip =>
      selectedClipIds.includes(clip._id)
    ).map((c) => c._id)
    const response = await fetch(`${URL}/auth/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clips: selectedClipsObjects, quality: selectedQuality }),
    });

    const res = await response.json()
    const downloadUrl = `${videoSrc}/${res.file}`;
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = downloadUrl;
    a.download = res.file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setLoading(false)
  };

  const handleEditSave = async (updatedClip) => {
    try {
      const res = await API.put(`${URL}/clips/update-clip/${updatedClip._id}`, { ...updatedClip, flag: { ...updatedClip.flag, flaggedBy: user?._id } })
      const saved = res.data
      setClips(prev => prev.map(c => (c._id === saved._id ? saved : c)))
    } catch (error) {
      console.error("Failed to update clip", error)
      alert("Failed to update clip")
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClips();
  };

  const toggleSelect = (clipId) => {
    setSelectedClipIds((prev) =>
      prev.includes(clipId)
        ? prev.filter((id) => id !== clipId)
        : [...prev, clipId]
    );
  };

  const selectAll = () => {
    if (selectedClipIds.length === clips.length) {
      setSelectedClipIds([]);
    } else {
      setSelectedClipIds(clips.map(c => c._id));
    }
  };

  const deleteSelected = async () => {
    if (!confirm("Delete all selected clips?")) return
    await axios.post(`${URL}/delete-multiple`, { clips: selectedClipIds })
    setSelectedClipIds([])
    fetchClips();
  }

  const handleDelete = async (clip) => {
    await axios.delete(`${URL}/delete-clip/${clip._id}`);
    setIsDeleteMode(false)
    fetchClips();
  }

  const handleDeleteClick = (clip) => {
    setSelectedClip(clip)
    setIsDeleteMode(true)
  }

  const handleReportClick = async (clip) => {
    await API.post(`${URL}/clips/report`, { clipId: clip._id });
    setClips(prev =>
      prev.map(c =>
        c._id === clip._id ? { ...c, reported: true } : c
      )
    );
  }

  const fetchMatchPlayers = async (matchId) => {
    if (!matchId) return [];
    try {
      const res = await API.get(`${URL}/getmatch/${matchId}`);
      return [...res.data.livematch.teamHomePlayers, ...res.data.livematch.teamAwayPlayers];
    } catch (err) {
      console.error("Failed to fetch match players", err);
      return [];
    }
  };

  const handleBulkUpdate = async () => {
    // Build updates object, removing null/empty values
    const updates = {};
    if (bulkUpdates.flagged !== null) updates.flagged = bulkUpdates.flagged;
    if (bulkUpdates.flagReason) updates.flagReason = bulkUpdates.flagReason;
    if (bulkUpdates.conflictField) updates.conflictField = bulkUpdates.conflictField;
    if (bulkUpdates.reviewStatus) updates.reviewStatus = bulkUpdates.reviewStatus;
    if (bulkUpdates.reported !== null) updates.reported = bulkUpdates.reported;

    if (Object.keys(updates).length === 0) {
      alert('No update options selected');
      return;
    }

    try {
      const res = await API.post(`${URL}/clips/bulk-update`, {
        ids: selectedClipIds,
        updates
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowBulkUpdateModal(false);
        fetchClips(); // refresh list
        setSelectedClipIds([]);
      } else {
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error performing bulk update');
    }
  };

  const isAdmin = !!user;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + clips.length - 1, totalClips);

  return (
    <div className="p-3 sm:p-4 space-y-4 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-2 sm:px-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-white/80 shadow-md border border-blue-100 mb-2">
        {/* Left: Title */}
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 drop-shadow-sm text-center sm:text-left tracking-tight leading-tight mb-1">
            Cricket Clips Dashboard
          </h1>
          <span className="text-xs sm:text-sm text-blue-700 font-medium tracking-wide opacity-80">
            AI-powered search &amp; video management
          </span>
        </div>

        {/* Right side: Clear Filters + Search Form together */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

          {/* Search Form */}
          <form
            className="flex items-center w-full sm:w-auto max-w-lg bg-white/90 rounded-lg shadow-sm border border-blue-200 px-2 py-1 focus-within:ring-2 focus-within:ring-blue-200 transition-all"
            onSubmit={handleSearchSubmit}
          >
            <Search className="text-blue-400 mr-2 w-5 h-5" />
            <Input
              placeholder="Search clips, players, events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm sm:text-base placeholder:text-blue-300"
              aria-label="Search clips or players"
            />
            <Button type="submit" variant="outline" className="ml-2 border-blue-300 text-xs sm:text-base">Search</Button>
          </form>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="border-red-300 text-red-600 hover:bg-red-50 whitespace-nowrap"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Video Quality Selector & Buttons */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-4 flex-1">
          <label className="text-xs sm:text-sm font-medium text-gray-700">Video Quality:</label>
          <select
            className="p-2 border border-gray-300 rounded bg-white/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-xs sm:text-sm w-full xs:w-auto"
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            <option value="720p">High (720p)</option>
            <option value="360p">Medium (360p)</option>
            <option value="240p">Low (240p)</option>
          </select>
          <Button variant="ghost" onClick={() => setClipModal(true)} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs sm:text-base w-full xs:w-full">➕ Create Clip</Button>
        </div>
        <div className="flex flex-col xs:flex-row flex-wrap gap-2 flex-1 justify-end">
          <label className="text-xs sm:text-sm font-medium text-gray-700">Select All:</label>
          <div className="flex gap-2 justify-between">
            <Button variant="outline" disabled={selectedClipIds.length === clips.length} onClick={selectAll} className="border-blue-300 hover:bg-blue-50 text-xs sm:text-base w-[250px]">Select All</Button>
            <Button variant="outline" disabled={selectedClipIds.length === 0} onClick={() => setSelectedClipIds([])} className="border-red-300 hover:bg-red-50 text-xs sm:text-base w-[250px]">Deselect All</Button>
          </div>
          <Button variant="secondary" disabled={selectedClipIds.length === 0} onClick={handleDownloadSelected} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base w-full xs:w-auto">📥 Download Selected</Button>
          <Button variant="default" disabled={selectedClipIds.length === 0} onClick={handleMergeAndDownload} className="bg-blue-500 text-white hover:bg-blue-600 text-xs sm:text-base w-full xs:w-auto">🎞️ Combine & Download</Button>
        </div>
      </div>

      {/* Filters Component + Clear Filters Button */}
      <div className="relative">
        <Filters values={filterValues} players={allPlayers} onChange={handleFilterChange} clips={clips} />
      </div>

      {isAdmin && selectedClipIds.length > 0 && (
        <div className="flex justify-end">
          <Button variant="destructive" className="text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base" onClick={deleteSelected}>Delete Selected ({selectedClipIds.length})</Button>
          <Button onClick={() => setShowBulkUpdateModal(true)} className="bg-purple-600 text-white">
            Bulk Update
          </Button>
        </div>
      )}

      {/* Items info and per page selector */}
      <div className="flex flex-wrap items-center gap-4 justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalClips} items
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-700 font-medium">Items per page:</label>
          <select
            id="itemsPerPage"
            className="p-1 border border-gray-300 rounded bg-white/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-xs sm:text-base"
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[6, 12, 24, 48, 100].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {clips.map(clip => (
          <Card key={clip._id} className="relative shadow-lg hover:shadow-2xl transition-shadow bg-white/90 border-blue-100">
            <video key={clip._id + selectedQuality} ref={videoRef} controls className="w-full rounded-t-xl aspect-video bg-black min-h-[180px] sm:min-h-[220px] md:min-h-[240px]">
              <source src={`${videoSrc}/${clip.clip}`} type="video/mp4" />
            </video>
            <CardContent className='relative space-y-1 pt-2'>
              <p className="font-semibold text-base sm:text-lg text-blue-900">{clip.batsman}</p>
              <p className="text-xs sm:text-sm text-gray-600">vs {clip.bowler}</p>
              <p className="text-xs sm:text-sm font-medium text-blue-600">{clip.event}</p>
              <p className="text-xs sm:text-sm text-gray-500">{clip?.commentary}...</p>
              <div className='flex flex-wrap gap-2'>
                {clip?.labels?.shotType && <Button variant="secondary" size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">{clip?.labels?.shotType?.split('_').join(' ')}</Button>}
                {clip?.labels?.ballType && <Button variant="secondary" size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">{clip?.labels?.ballType?.split('_').join(' ')}</Button>}
                {clip?.labels?.direction && <Button variant="secondary" size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">{clip?.labels?.direction?.split('_').join(' ')}</Button>}
              </div>
              {clip?.flag?.isFlagged && (
                <div className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-red-700 border border-red-200">
                  ⚠️ Flagged
                  {clip?.flag?.reason && <span className="ml-1">({clip.flag.reason})</span>}
                  {clip?.flag?.reviewStatus && <span className="ml-1">- {clip.flag.reviewStatus}</span>}
                </div>
              )}
              <Checkbox
                checked={selectedClipIds.includes(clip._id)}
                onCheckedChange={() => toggleSelect(clip._id)}
                className="absolute top-2 right-2 border border-blue-400 bg-white/80"
              />
              {isAdmin && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-blue-300 text-xs sm:text-base">Edit</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-lg md:max-w-2xl">
                      <EditClipForm clip={clip} onSave={handleEditSave} fetchMatchPlayers={fetchMatchPlayers} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" className='text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base' onClick={() => handleDeleteClick(clip)}>Delete</Button>
                  {clip?.reported ?
                    <Button variant="destructive" size="sm" className='text-white bg-red-100 border border-red-100 hover:bg-red-100 text-xs sm:text-base' onClick={() => handleReportClick(clip)}>Reported</Button> :
                    <Button variant="destructive" size="sm" className='text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base' onClick={() => handleReportClick(clip)}>Report</Button>}
                  <Button variant="secondary" size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base" onClick={() => setTrimmingClip(clip)}>✂️ Trim</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Backend Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="px-3 py-1"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Modals */}
      {trimmingClip && (
        <Dialog open={!!trimmingClip} onOpenChange={() => setTrimmingClip(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Trim Clip</DialogTitle>
              <DialogDescription>Adjust the start and end time before trimming.</DialogDescription>
            </DialogHeader>
            <VideoTrimmer videoFileUrl={`${URL}/mockvideos/${trimmingClip.clip}`} onClose={() => setTrimmingClip(null)} />
          </DialogContent>
        </Dialog>
      )}

      {isDeleteMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to delete this clip?</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsDeleteMode(false)}>Cancel</Button>
              <Button variant="destructive" className='text-white bg-red-500 border border-red-300 hover:bg-red-600' onClick={() => handleDelete(selectedClip)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Bulk Update Clips</h2>
            <p className="text-sm text-gray-600 mb-4">Updating {selectedClipIds.length} clip(s)</p>
            <div className="space-y-3">
              {/* Flagged */}
              <div>
                <label className="block text-sm font-medium mb-1">Flagged</label>
                <select
                  className="w-full border rounded p-2"
                  value={bulkUpdates.flagged === null ? '' : bulkUpdates.flagged.toString()}
                  onChange={e => {
                    const val = e.target.value;
                    setBulkUpdates(prev => ({
                      ...prev,
                      flagged: val === '' ? null : val === 'true'
                    }));
                  }}
                >
                  <option value="">— No change —</option>
                  <option value="true">Flagged</option>
                  <option value="false">Not Flagged</option>
                </select>
              </div>

              {/* Flag Reason */}
              <div>
                <label className="block text-sm font-medium mb-1">Flag Reason</label>
                <select
                  className="w-full border rounded p-2"
                  value={bulkUpdates.flagReason}
                  onChange={e => setBulkUpdates(prev => ({ ...prev, flagReason: e.target.value }))}
                >
                  <option value="">— No change —</option>
                  <option value="label_conflict">Label Conflict</option>
                  <option value="video_mismatch">Video Mismatch</option>
                  <option value="half_clip">Half Clip</option>
                  <option value="multiple_clips">Multiple Clips</option>
                  <option value="manual">Manual</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Conflict Field */}
              <div>
                <label className="block text-sm font-medium mb-1">Conflict Field</label>
                <select
                  className="w-full border rounded p-2"
                  value={bulkUpdates.conflictField}
                  onChange={e => setBulkUpdates(prev => ({ ...prev, conflictField: e.target.value }))}
                >
                  <option value="">— No change —</option>
                  {conflictFieldOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              {/* Review Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Review Status</label>
                <select
                  className="w-full border rounded p-2"
                  value={bulkUpdates.reviewStatus}
                  onChange={e => setBulkUpdates(prev => ({ ...prev, reviewStatus: e.target.value }))}
                >
                  <option value="">— No change —</option>
                  <option value="pending">Pending</option>
                  <option value="fixed">Fixed</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              {/* Reported */}
              <div>
                <label className="block text-sm font-medium mb-1">Reported</label>
                <select
                  className="w-full border rounded p-2"
                  value={bulkUpdates.reported === null ? '' : bulkUpdates.reported.toString()}
                  onChange={e => {
                    const val = e.target.value;
                    setBulkUpdates(prev => ({
                      ...prev,
                      reported: val === '' ? null : val === 'true'
                    }));
                  }}
                >
                  <option value="">— No change —</option>
                  <option value="true">Reported</option>
                  <option value="false">Not Reported</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowBulkUpdateModal(false)}>Cancel</Button>
              <Button onClick={handleBulkUpdate} className="bg-purple-600 text-white">Apply to Selected</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}