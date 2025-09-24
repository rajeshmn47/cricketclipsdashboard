import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Filter, Search } from 'lucide-react';
import Filters from '../components/Filters';
import { Switch } from '../components/ui/switch';
import { API } from '../actions/userAction';
import { HTTPS_URL, NEW_URL, URL } from '../constants/userConstants';
import axios from 'axios';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import VideoTrimmer from '../VideoTrimmer';
import { inferDismissals } from '../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../actions/userAction';
import cricketSynonyms from '../utils/cricket_synonyms.json';
import exclusionMap from '../utils/exclusion_map.json';
import { useNavigate } from 'react-router-dom';

const filters = [
  'Match', 'Player', 'Shot Type', 'Over', 'Ball', 'Batting Team', 'Bowler', 'Striker', 'Non-Striker',
  'Fielder', 'Wicket', 'Runs', 'Boundary', 'Sixes', 'Powerplay', 'Match Type', 'Pitch Type',
  'Weather', 'Match Date', 'League'
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState();
  const [filterValues, setFilterValues] = useState({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Simulating super admin status
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isEditClipOpen, setIsEditClipOpen] = useState(false);
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [trimmingClip, setTrimmingClip] = useState(null);
  const editClipForm = useRef(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const navigate = useNavigate();
  const [selectedQuality, setSelectedQuality] = useState('240p');
  const videoRef = useRef(null);
  const videoSrc = `${NEW_URL}/${selectedQuality == '240p' ? 'mockvideos' : selectedQuality == '360p' ? '360p' : '720p'}`;
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState({});

  useEffect(() => {
    const stored = { ...localStorage };
    const loadedPlaylists = {};

    Object.keys(stored).forEach((key) => {
      try {
        const value = JSON.parse(stored[key]);
        if (Array.isArray(value)) {
          loadedPlaylists[key] = value;
        }
      } catch (e) {
        console.error(`Invalid JSON in playlist: ${key}`);
      }
    });

    setPlaylists(loadedPlaylists);
  }, []);

  const filteredClips = clips
    .filter((clip) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        const clipValue = clip[key];
        console.log(clipValue, key, value, 'clip value')
        // Semantic matching for shotType, direction, ballType
        if (["shotType", "direction", "ballType", "isCleanBowled", "connection"].includes(key)) {
          if (key == "isCleanBowled") {
            value = "isCleanBowled"
          }
          return (
            matchesWithSynonyms(clip.commentary, value, key)
          );
        }
        if (searchTerm) {
          if (clip?.commentary?.toLowerCase()?.includes(searchTerm)) {
            //return true;
          }
        }
        // Keeper Catch filter logic
        if (key === 'isKeeperCatch') {
          const commentary = clip.commentary?.toLowerCase() || "";
          const keeperCatchSynonyms = cricketSynonyms.keeperCatch?.keeper_catch || [];
          const catches = keeperCatchSynonyms.some(syn =>
            clip.commentary?.toLowerCase().includes(syn.toLowerCase())
          );
          if (clip?.event?.toLowerCase() == "wicket") {
            console.log(catches, clip?.commentary, 'catches');
            return catches;
          }
          else {
            return false;
          }
        }
        if (key === 'caughtBy') {
          console.log('caught by is selected')
          let values = value?.split(" ")
          if (clip?.commentary?.toLowerCase().includes(`caught by ${values[1]?.toLowerCase()}`) || clip?.commentary?.toLowerCase().includes(`caught by ${values[0]?.toLowerCase()}`)) {
            if (clip?.batsman?.toLowerCase() == value?.toLowerCase()) {
              return false;
            }
            if (clip?.bowler?.toLowerCase() == value?.toLowerCase()) {
              return false;
            }
            //const fieldersNamedSame = clips.filter(player =>
            ////  player.toLowerCase().includes(values[0]?.toLowerCase()) || player.toLowerCase().includes(values[1]?.toLowerCase())
            //);
            let droppedByValue = value?.split(" ")?.[0]?.toLowerCase();
            let droppedByValue2 = value?.split(" ")?.[1]?.toLowerCase();
            console.log(values, values?.length, droppedByValue, droppedByValue2, 'testValue');
            if (values?.length == 3) {
              let values = value?.split(" ")
              droppedByValue2 = [values[1], values[2]]?.join(" ")?.toLowerCase();
              if (clip?.commentary?.toLowerCase().includes(`caught by ${droppedByValue2.toLowerCase()}`)) {
                return true;
              }
            }
            else {
              return true;
            }
          }
          else {
            return false;
          }
        }
        if (key === 'isWicket') return clip.event?.includes('WICKET');
        if (key === 'isFour') return clip.event?.includes('FOUR');
        if (key === 'isSix') return clip.event?.includes('SIX');
        if (key === 'isLofted') {
          // Only filter if isLofted is true
          if (!value) return true;
          const comm = clip.commentary?.toLowerCase() || "";
          const shotType = clip.shotType?.toLowerCase() || "";
          // Synonyms for lofted
          const loftedSynonyms = cricketSynonyms?.lofted?.lofted || [];
          // Match in commentary or shotType
          return (
            loftedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn))
          );
        }
        if (key === 'isGrounded') {
          if (!value) return true;
          const comm = clip.commentary?.toLowerCase() || "";
          const shotType = clip.shotType?.toLowerCase() || "";
          // Synonyms for grounded shots
          const groundedSynonyms = [
            "along the ground",
            "kept it down",
            "keeps it down",
            "kept on the ground",
            "along ground",
            "grounded",
            "kept low",
            "keeps it low"
          ];
          // Should NOT match any lofted synonyms
          const loftedSynonyms = cricketSynonyms.lofted || [];
          // Must match a grounded synonym and NOT a lofted synonym
          return (
            groundedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn)) ||
            !loftedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn))
          );
        }

        // Example for duration range (adjust as per your data)
        if (key === 'durationRange') {
          const duration = clip.duration;
          if (value === '0-2') return duration >= 0 && duration < 2;
          if (value === '2-5') return duration >= 2 && duration < 5;
          if (value === '5-10') return duration >= 5 && duration < 10;
          if (value === '10+') return duration >= 10;
          return true;
        }

        // Additional semantic matching for runOutBy
        if (key === 'runOutBy') {
          // Only filter if isRunout is also selected
          if (!filterValues.isRunout) return true;
          let values = value?.split(" ");
          let droppedByValue = value?.split(" ")?.[0]?.toLowerCase();
          let droppedByValue2 = value?.split(" ")?.[1]?.toLowerCase();
          console.log(values, values?.length, droppedByValue, droppedByValue2, 'testValue');
          if (values?.length == 3) {
            let values = value?.split(" ")
            droppedByValue2 = [values[1], values[2]]?.join(" ")?.toLowerCase();
          }
          const runOutByValue = values[1]?.toLowerCase();
          // Try to match in a dedicated runOutBy field if present
          //if (clip.runOutBy && clip.runOutBy.toLowerCase().includes(runOutByValue)) return true;
          // Fallback: try to match in commentary
          if (clip?.batsman?.toLowerCase().includes(runOutByValue)) {
            return false;
          }
          if (clip?.bowler?.toLowerCase().includes(runOutByValue)) {
            return false;
          }
          if (clip.commentary?.toLowerCase().includes(`direct hit by ${runOutByValue}`)) return true;
          if (clip.commentary?.toLowerCase().includes(`direct-hit from ${runOutByValue}`)) return true;
          if (clip.commentary?.toLowerCase().includes(`${runOutByValue}`)) return true;
          // Optionally, match just the name if commentary is inconsistent
          //if (clip.commentary?.toLowerCase().includes(runOutByValue)) return true;
          return false;
        }
        if (key === 'isDropped') {
          return clip.event?.includes('DROPPED');
        }
        if (key === 'droppedBy') {
          if (!filterValues.isDropped) return true;
          let droppedByValue = value?.split(" ")?.[0]?.toLowerCase();
          let droppedByValue2 = value?.split(" ")?.[1]?.toLowerCase();
          let testValue = value?.split(" ")
          console.log(testValue, testValue?.length, droppedByValue, droppedByValue2, 'testValue');
          if (testValue?.length == 3) {
            let values = value?.split(" ")
            droppedByValue2 = [values[1], values[2]]?.join(" ")?.toLowerCase();
          }
          console.log(testValue, testValue?.length, droppedByValue, droppedByValue2, 'testValue');
          // Try to match in a dedicated droppedBy field if present
          //if (clip.droppedBy && clip.droppedBy.toLowerCase().includes(droppedByValue)) return true;
          // Fallback: try to match in commentary
          if (clip.batsman?.toLowerCase().includes(droppedByValue)) return false;
          if (clip.batsman?.toLowerCase().includes(droppedByValue2)) return false;
          if (clip.bowler?.toLowerCase().includes(droppedByValue)) return false;
          //if (clip.commentary?.toLowerCase().includes(`${droppedByValue}`)) return true;
          // Optionally, match just the name if commentary is inconsistent
          if (clip.commentary?.toLowerCase().includes(droppedByValue)) return true;
          if (clip.commentary?.toLowerCase().includes(droppedByValue2)) return true;
          // Optionally, match just the name if commentary is inconsistent
          //if (clip.commentary?.toLowerCase().includes(droppedByValue2)) return true;
          return false;
        }
        if (key == "connection") {
          //if (clip.commentary?.toLowerCase().includes(value)) return true;
        }

        if(key=="reported"){
          return clip?.reported==true
        }

        // Default: string includes (case-insensitive)
        //console.log(clipValue, key, value, 'clip value two')
        return clipValue && String(clipValue).toLowerCase().includes(String(value).toLowerCase());
      });
    }).filter((clip) => {
      if (!searchTerm) return true;
      return clip.commentary?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Calculate paginated clips
  const paginatedClips = filteredClips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredClips.length / itemsPerPage);

  // Only show admin controls if user is logged in and user.role is 'admin'
  const isAdmin = user && user.role === "user";
  console.log(user, 'user')
  useEffect(() => {
    dispatch(loadUser());
    const fetchClips = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${URL}/auth/allclips`);
        //const clipsWithDuration = await Promise.all(
        //  res.data.map((clip) => getClipWithDuration(clip))
        //);
        const enhancedClips = res.data.map((clip) => {
          const inferred = inferDismissals(clip?.event, clip.commentary || "")
          return { ...clip, ...inferred }
        })
        setClips(enhancedClips);
        //setClips(clipsWithDuration);
      } catch (err) {
        console.error("Error fetching clips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
  }, [dispatch]);

  const getClipWithDuration = (clip) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = `${URL}/mockvideos/${clip.clip}`;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({ ...clip, duration: video.duration });
      };
      video.onerror = () => {
        // fallback in case video fails to load
        resolve({ ...clip, duration: 0 });
      };
    });
  };

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleDownloadSelected = () => {
    selectedClipIds.forEach((clip) => {
      const link = document.createElement("a");
      link.href = `${URL}/mockvideos/${clip}`;
      link.download = clip;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleMergeAndDownload = async () => {
    setLoading(true)
    const selectedClipsObjects = clips.filter(clip =>
      selectedClipIds.includes(clip._id)
    ).map((c) => c.clip)
    const response = await fetch(`${NEW_URL}/auth/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clips: selectedClipsObjects, quality: selectedQuality }),
    });
    console.log(response, 'res');
    const res = await response.json()
    console.log(res, 'res');
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

  const videos = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx,
    title: `Clip ${idx + 1}`,
    videoUrl: `https://www.example.com/clip${idx + 1}.mp4`,
  }));

  const handleEditSave = (updatedClip) => {
    // Mock request delay
    setTimeout(() => {
      setClips(prev =>
        prev.map(c => c.clip === updatedClip.clip ? updatedClip : c)
      )
      alert("Clip updated (mock)")
    }, 300)
  }

  const toggleSelecte = (clip) => {
    console.log(clip, selectedClipIds, 'toggle clip')
    setSelectedClipIds(prev =>
      prev.find((p) => p.clip == clip.clip)
        ? prev.filter(cl => cl.clip !== clip.clip)
        : [...prev, clip]
    )
  }

  const toggleSelect = (clip) => {
    console.log(clip, selectedClipIds, 'toggle clip')
    setSelectedClipIds((prev) =>
      prev.find((p) => p == clip) // use unique id
        ? prev.filter((cl) => cl !== clip)
        : [...prev, clip]
    );
    console.log('completed toggle')
  };

  const deleteSelected = async () => {
    if (!confirm("Delete all selected clips?")) return
    setTimeout(() => {
      setClips(prev => prev.filter(c => !selectedClipIds.includes(c.clip)))
      setSelectedClipIds([])
    }, 300)
    await axios.post(`${URL}/auth/delete-multiple`, { clips: selectedClipIds })
  }

  const handleDelete = async (clip) => {
    //if (!confirm("Delete all selected clips?")) return
    await axios.delete(`${URL}/auth/delete-clip/${clip._id}`);
    setIsDeleteMode(false)
    setClips(prev => prev.filter(c => c._id !== clip._id));
  }

  const handleAddToPlayliste = () => {
    if (!playlistName || selectedClipIds.length === 0) return;

    // Example: Save to localStorage or backend
    const existing = JSON.parse(localStorage.getItem(playlistName)) || [];
    localStorage.setItem(
      playlistName,
      JSON.stringify([...existing, ...selectedClipIds])
    );

    setPlaylistName("");
    setShowPlaylistModal(false);
    alert("Clips added to playlist!");
  };

  const handleAddToPlaylistee = () => {
    const finalName =
      playlistName === "__new__" ? newPlaylistName.trim() : playlistName;

    if (!finalName) {
      alert("Please enter a valid playlist name.");
      return;
    }

    // Get existing clips (if any)
    const existingClips = JSON.parse(localStorage.getItem(finalName) || "[]");

    // Merge and deduplicate
    const updatedClips = Array.from(new Set([...existingClips, ...selectedClipIds]));

    // Save back to localStorage
    localStorage.setItem(finalName, JSON.stringify(updatedClips));

    // Reset
    setPlaylistName("");
    setNewPlaylistName("");
    setShowPlaylistModal(false);
  };

  const handleAddToPlaylist = () => {
    const finalName =
      playlistName === "__new__" ? newPlaylistName.trim() : playlistName;

    if (!finalName) {
      alert("Please enter a valid playlist name.");
      return;
    }

    // Get existing clips (objects)
    const existingClips = JSON.parse(localStorage.getItem(finalName) || "[]");

    // Only keep the selected clip objects
    // If you're using selectedClipIds (Set of IDs), map them back to full clip objects
    const selectedClipsObjects = clips.filter(clip =>
      selectedClipIds.includes(clip._id)
    );

    // Merge with existing clips
    const merged = [...existingClips, ...selectedClipsObjects];

    // Deduplicate by unique ID
    const uniqueClips = merged.filter(
      (clip, index, self) =>
        index === self.findIndex(c => c._id === clip._id)
    );

    // Save to localStorage
    localStorage.setItem(finalName, JSON.stringify(uniqueClips));

    // Reset
    setPlaylistName("");
    setNewPlaylistName("");
    setShowPlaylistModal(false);
  };

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

  //console.log(filterValues, clips, 'filterValues');
  //console.log(filteredClips, 'filteredClips');

  return (
    <div className="p-3 sm:p-4 space-y-4 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-2 sm:px-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-white/80 shadow-md border border-blue-100 mb-2">
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 drop-shadow-sm text-center sm:text-left tracking-tight leading-tight mb-1">Cricket Clips Dashboard</h1>
          <span className="text-xs sm:text-sm text-blue-700 font-medium tracking-wide opacity-80">AI-powered search &amp; video management</span>
        </div>
        <form className="flex items-center w-full sm:w-auto max-w-lg bg-white/90 rounded-lg shadow-sm border border-blue-200 px-2 py-1 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
          <Search className="text-blue-400 mr-2 w-5 h-5" />
          <Input
            placeholder="Search clips, players, events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm sm:text-base placeholder:text-blue-300"
            aria-label="Search clips or players"
          />
        </form>
      </div>
      {/* Video Quality Selector */}
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
          <Button
            variant="outline"
            onClick={() => navigate("/playlists")}
            className="text-sm w-full"
          >
            🎬 View Playlists
          </Button>
          <Button
            variant="ghost"
            disabled={selectedClipIds.length === 0}
            onClick={() => setShowPlaylistModal(true)}
            className="bg-green-100 text-green-700 hover:bg-green-200 text-xs sm:text-base w-full xs:w-full"
          >
            ➕ Add to Playlist
          </Button>
        </div>
        <div className="flex flex-col xs:flex-row flex-wrap gap-2 flex-1 justify-end">
          <label className="text-xs sm:text-sm font-medium text-gray-700">Select All:</label>
          <div className="flex gap-2 justify-between">
            {/* Select All Button */}
            <Button
              variant="outline"
              disabled={selectedClipIds.length === filteredClips?.length}
              onClick={() => setSelectedClipIds(filteredClips.map((clip) => clip.clip))}
              className="border-blue-300 hover:bg-blue-50 text-xs sm:text-base w-1/2"
            >
              Select All
            </Button>

            {/* Deselect All Button */}
            <Button
              variant="outline"
              disabled={selectedClipIds.length === 0}
              onClick={() => setSelectedClipIds([])}
              className="border-red-300 hover:bg-red-50 text-xs sm:text-base w-1/2"
            >
              Deselect All
            </Button>
          </div>
          <Button
            variant="secondary"
            disabled={selectedClipIds.length === 0}
            onClick={handleDownloadSelected}
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base w-full xs:w-auto"
          >
            📥 Download Selected
          </Button>
          <Button
            variant="default"
            disabled={selectedClipIds.length === 0}
            onClick={handleMergeAndDownload}
            className="bg-blue-500 text-white hover:bg-blue-600 text-xs sm:text-base w-full xs:w-auto"
          >
            🎞️ Combine & Download
          </Button>
        </div>
      </div>
      <Filters values={filterValues} onChange={handleFilterChange} clips={clips} />
      {isAdmin && selectedClipIds.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            className="text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base"
            onClick={deleteSelected}
          >
            Delete Selected ({selectedClipIds.length})
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4 justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {filteredClips.length} item{filteredClips.length !== 1 && "s"} selected
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-700 font-medium">Items per page:</label>
          <select
            id="itemsPerPage"
            className="p-1 border border-gray-300 rounded bg-white/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-xs sm:text-base"
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page on change
            }}
          >
            {[6, 12, 24, 48, 100].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {paginatedClips.map(clip => (
          <Card key={clip._id} className="relative shadow-lg hover:shadow-2xl transition-shadow bg-white/90 border-blue-100">
            {/*<a
              target='__blank'
              href={`${URL}/mockvideos/${clip.clip}`}
              className="underline text-blue-700 hover:text-blue-900 break-all"
              style={{ wordBreak: 'break-all' }}
            >
              {`${URL}/mockvideos/${clip.clip}`}
            </a>*/}
            <video key={clip._id + selectedQuality} ref={videoRef} controls className="w-full rounded-t-xl aspect-video bg-black min-h-[180px] sm:min-h-[220px] md:min-h-[240px]">
              <source src={`${videoSrc}/${clip.clip}`} type="video/mp4" />
            </video>
            <CardContent className='relative space-y-1 pt-2'>
              <p className="font-semibold text-base sm:text-lg text-blue-900">{clip.batsman}</p>
              <p className="text-xs sm:text-sm text-gray-600">vs {clip.bowler}</p>
              <p className="text-xs sm:text-sm font-medium text-blue-600">{clip.event}</p>
              <p className="text-xs sm:text-sm text-gray-500">{clip?.commentary}</p>
              <div className='flex flex-wrap gap-2'>
                {clip?.labels?.shotType && <Button variant="secondary"
                  size="sm"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">
                  {clip?.labels?.shotType?.split('_').join(' ')}
                </Button>}
                {clip?.labels?.ballType && <Button variant="secondary"
                  size="sm"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">
                  {clip?.labels?.ballType?.split('_').join(' ')}</Button>}
                {clip?.labels?.direction && <Button variant="secondary"
                  size="sm"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">
                  {clip?.labels?.direction?.split('_').join(' ')}
                </Button>}
                {clip?.labels?.connection && <Button variant="secondary"
                  size="sm"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base">
                  {clip?.labels?.connection?.split('_').join(' ')}
                </Button>}</div>
              {/*<p className="font-semibold">{clip.duration}</p>*/}
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
                    <DialogContent>
                      <EditClipForm clip={clip} onSave={handleEditSave} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    className='text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base'
                    onClick={() => handleDeleteClick(clip)}
                  >
                    Delete
                  </Button>
                  {clip?.reported ?
                    <Button
                      variant="destructive"
                      size="sm"
                      className='text-white bg-red-100 border border-red-100 hover:bg-red-100 text-xs sm:text-base'
                      onClick={() => handleReportClick(clip)}
                    >
                      Reported
                    </Button> :
                    <Button
                      variant="destructive"
                      size="sm"
                      className='text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base'
                      onClick={() => handleReportClick(clip)}
                    >
                      Report
                    </Button>}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-base"
                    onClick={() => setTrimmingClip(clip)}
                  >
                    ✂️ Trim
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            className="px-2 sm:px-3 py-1 text-xs sm:text-base"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-blue-900 font-semibold text-xs sm:text-base">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="px-2 sm:px-3 py-1 text-xs sm:text-base"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {trimmingClip && (
        <Dialog open={!!trimmingClip} onOpenChange={() => setTrimmingClip(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Trim Clip</DialogTitle>
              <DialogDescription>Adjust the start and end time before trimming.</DialogDescription>
            </DialogHeader>
            <VideoTrimmer
              videoFileUrl={`${URL}/mockvideos/${trimmingClip.clip}`}
              onClose={() => setTrimmingClip(null)}
            />
          </DialogContent>
        </Dialog>
      )}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Add to Playlist</h2>

            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Select or create playlist
            </label>
            <select
              className="w-full border px-3 py-2 rounded mb-2"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            >
              <option value="">-- Select Playlist --</option>
              {Object.keys(playlists).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="__new__">➕ Create New Playlist</option>
            </select>

            {playlistName === "__new__" && (
              <input
                type="text"
                placeholder="Enter New Playlist Name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full border px-3 py-2 rounded mb-4"
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowPlaylistModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  handleAddToPlaylist(
                    playlistName === "__new__" ? newPlaylistName : playlistName
                  )
                }
                disabled={
                  playlistName === "" ||
                  (playlistName === "__new__" && !newPlaylistName.trim())
                }
              >
                ➕ Add
              </Button>
            </div>
          </div>
        </div>
      )}
      {isDeleteMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>

            <p className="mb-4 text-gray-700">
              Are you sure you want to delete this clip?
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className='text-white bg-red-500 border border-red-300 hover:bg-red-600 text-xs sm:text-base'
                onClick={() => handleDelete(selectedClip)} // your delete function
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function EditClipForm({ clip, onSave }) {
  const [form, setForm] = useState({ ...clip })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSave = () => {
    onSave(form)
  }

  return (
    <div className="space-y-4">
      <Input name="batsman" value={form.batsman} onChange={handleChange} placeholder="Batsman" />
      <Input name="bowler" value={form.bowler} onChange={handleChange} placeholder="Bowler" />
      <Input name="event" value={form.event} onChange={handleChange} placeholder="Event" />
      <Input name="over" value={form.over} onChange={handleChange} placeholder="Over" />
      <Button onClick={handleSave}>Save</Button>
    </div>
  )
}

function matchesWithSynonyms(clipValue, filterValue, key) {
  console.log(clipValue, filterValue, key)
  if (key == "isCleanBowled") {
    return clipValue?.toLowerCase().includes("bowled!")
  }
  if (!clipValue || !filterValue) return false;
  const normalizedClip = String(clipValue).toLowerCase();
  const normalizedFilter = String(filterValue).toLowerCase();

  // Exclusion logic for specific keys/values

  // Exclude if any exclusion phrase is present
  if (exclusionMap[key] && exclusionMap[key][filterValue]) {
    const exclusions = exclusionMap[key][filterValue];
    for (const phrase of exclusions) {
      if (normalizedClip.includes(phrase?.toLowerCase())) return false;
    }
  }

  // Whole word/phrase match
  const wordRegex = new RegExp(`\\b${normalizedFilter}\\b`, 'i');
  if (wordRegex.test(normalizedClip)) return true;

  // Synonym match (whole word/phrase)
  const synonyms = cricketSynonyms[key]?.[filterValue] || [];
  return synonyms.some(syn => {
    // Exclude if synonym is part of an exclusion phrase
    if (exclusionMap[key] && exclusionMap[key][filterValue]) {
      const exclusions = exclusionMap[key][filterValue];
      for (const phrase of exclusions) {
        if (normalizedClip.includes(phrase)) return false;
      }
    }
    const synRegex = new RegExp(`\\b${syn.toLowerCase()}\\b`, 'i');
    return synRegex.test(normalizedClip);
  });
}
