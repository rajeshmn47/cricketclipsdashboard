import { useEffect, useState } from 'react';
import Filters from '../components/Filters';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { URL, NEW_URL } from '../constants/userConstants';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Flag, Scissors, ExternalLink } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { API } from '@/actions/userAction';
import { useDispatch, useSelector } from 'react-redux';
import EditClipForm from '@/components/EditClipForm';

export default function MatchClips() {
  const { matchId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user || {});
  const [clips, setClips] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [match, setMatch] = useState(null);
  const [deletingClipId, setDeletingClipId] = useState(null);
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [uploadingJson, setUploadingJson] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [createdCount, setCreatedCount] = useState(0);
  const [uploadText, setUploadText] = useState('');
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [videoLink, setVideoLink] = useState('');
  const [generatingClips, setGeneratingClips] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateFormData, setGenerateFormData] = useState({
    matchId: '',
    format: '',
    year: '',
    homeTeam: '',
    videoLink: ''
  });
  const [tasks, setTasks] = useState([]);
  const [showTasksSection, setShowTasksSection] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);

  // Resolve strength: prefer backend-provided `match.strength` when available.
  const resolveStrength = (matchObj, clipCount) => {
    // If backend returned an object with percent/label/color, use it directly
    const backend = matchObj?.strength;
    if (backend && typeof backend === 'object') {
      return {
        label: backend.label || (backend.percent > 0 ? 'Strong' : 'No Clips'),
        percent: Math.max(0, Math.min(100, Number(backend.percent || 0))),
        color: backend.color || (backend.percent > 70 ? 'bg-green-500' : backend.percent > 30 ? 'bg-amber-500' : 'bg-yellow-400')
      };
    }

    // If backend provided a numeric strength value (0-100)
    if (backend !== undefined && backend !== null && typeof backend !== 'object') {
      const p = Math.max(0, Math.min(100, Number(backend) || 0));
      const label = p === 0 ? 'No Clips' : p <= 30 ? 'Weak' : p <= 70 ? 'Moderate' : 'Strong';
      const color = p === 0 ? 'bg-gray-300' : p <= 30 ? 'bg-yellow-400' : p <= 70 ? 'bg-amber-500' : 'bg-green-500';
      return { label, percent: p, color };
    }

    // Fallback: compute from clip count
    const count = clipCount || 0;
    if (!count) return { label: 'No Clips', percent: 0, color: 'bg-gray-300' };
    if (count <= 3) return { label: 'Weak', percent: Math.min(30, Math.round((count / 5) * 100)), color: 'bg-yellow-400' };
    if (count <= 9) return { label: 'Moderate', percent: Math.min(70, Math.round((count / 15) * 100)), color: 'bg-amber-500' };
    return { label: 'Strong', percent: 100, color: 'bg-green-500' };
  };

  useEffect(() => {
    if (matchId) {
      fetchMatchAndClips();
      getTasks();
    }
  }, [matchId]);

  useEffect(() => {
    if (match) {
      const year = match.date ? new Date(match.date).getFullYear() : "";

      setGenerateFormData(prev => ({
        ...prev,
        matchId: matchId || "",
        format: match.format || "",
        year: year,
        teamHomeName: match?.teamHomeName,
      }));
    }
  }, [matchId, match]);


  const handleGenerateMatchClip = async () => {
    if (clips.length === 0) {
      alert('No clips available for this match');
      return;
    }

    try {
      setMerging(true);
      const clipFiles = clips.map(c => c.clip).filter(Boolean);

      const response = await fetch(`${NEW_URL}/auth/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clips: clipFiles, quality: '240p' }),
      });

      if (!response.ok) {
        throw new Error(`Merge failed: ${response.status}`);
      }

      const resJson = await response.json();
      const downloadUrl = `${NEW_URL}/mockvideos/${resJson.file}`;

      // Create and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.download = `match_${matchId}_highlights.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Error generating match clip:', err);
      alert('Failed to generate match clip. Please try again.');
    } finally {
      setMerging(false);
    }
  };

  const handleCreateTask = async () => {
    await API.post(`${URL}/tasks/create`, {
      ...generateFormData
    });
  }

  const getTasks = async () => {
    const { data } = await API.get(`${URL}/tasks/matchTasks/${matchId}`);
    setTasks([...data]);
  }

  const getClips = async () => {
    const res = await API.get(`${URL}/tasks/commentaryOutput/${matchId}`);
    setUploadText(res.data || []);
    setShowUploadSection(true);
  }

  const mergeClips = async () => {
    await API.post(`${URL}/tasks/mergeClips/${matchId}`);
  }

  const fetchMatchAndClips = async () => {
    setLoading(true);
    try {
      // Fetch match details
      const matchRes = await API.get(`${URL}/getmatch/${matchId}`);
      setMatch(matchRes.data.match);
      if (matchRes.data.livematch) {
        setLiveMatch(matchRes.data.livematch);
      }
      // Fetch clips for this match
      const clipsRes = await API.get(`${URL}/clips/getmatchclips/${matchId}`);
      setClips(clipsRes.data || []);
    } catch (err) {
      console.error('Error fetching match clips:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (task) => {
    try {
      await API.put(`${URL}/tasks/update/${task._id}`, {
        teamHomeName: task.teamHomeName,
        status: task.status,
      });
      getTasks()
      setEditTask(null);

    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  const filteredClips = clips
    .filter((clip) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        const clipValue = clip[key];
        //console.log(clipValue, key, value, 'clip value')
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
        if (key === 'innings') {
          console.log(value, 'innings value')
          if (value === "all") return true;
          if (value === "1") {
            return clip.clip?.endsWith("_1.mp4");
          }
          if (value === "2") {
            return clip.clip?.endsWith("_2.mp4");
          }
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

        if (key == "reported") {
          if (value === "reported") {
            return clip?.reported === true;
          }
          if (value === "notReported") {
            return !clip?.reported;
          }
          return true;
        }

        if (key === "flagged") {
          if (value === "flagged") {
            return clip?.flag?.isFlagged === true;
          } else if (value === "notFlagged") {
            return !clip?.flag?.isFlagged;
          }
          return true;
        }

        if (key === "flagReason") {
          if (!value) return true;
          return clip?.flag?.reason === value;
        }

        if (key === "reviewStatus") {
          if (!value) return true;
          return clip?.flag?.reviewStatus === value;
        }

        // Default: string includes (case-insensitive)
        //console.log(clipValue, key, value, 'clip value two')
        return clipValue && String(clipValue).toLowerCase().includes(String(value).toLowerCase());
      });
    }).filter((clip) => {
      if (!searchTerm) return true;
      return clip.commentary?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const isAdmin = user && user.role === "admin";

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleEditSave = async (updatedClip) => {
    try {
      const res = await API.put(`${URL}/clips/update-clip/${updatedClip._id}`, updatedClip)
      const saved = res.data
      setClips(prev => prev.map(c => (c._id === saved._id ? saved : c)))
    } catch (error) {
      console.error("Failed to update clip", error)
      alert("Failed to update clip")
    }
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

  const strength = resolveStrength(match, clips.length);

  return (
    <div className="p-4 space-y-6">
      {/* Filters Section */}
      <div className="mb-4">
        {!showFilters ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowFilters(true)}
          >
            Open Filters
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Search clips, players, events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border rounded p-2 text-sm w-64"
              />
              <button
                className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
                onClick={() => setShowFilters(false)}
              >
                Close Filters
              </button>
            </div>
            <Filters values={filterValues} onChange={(key, value) => setFilterValues(f => ({ ...f, [key]: value }))} clips={clips} />
          </div>
        )}
      </div>
      {/* Match Header */}
      {match && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{match.matchTitle}</h1>
              <div className="mt-1 text-sm text-gray-500">
                <span className="uppercase">{match.format}</span>
                {match.venue && <span> • {match.venue}</span>}
              </div>

              {/* ✅ Show match status (e.g., "Match abandoned due to rain (No toss)") */}
              {liveMatch?.status && (
                <div className="mt-1 text-sm font-medium text-red-600">
                  {liveMatch.status}
                </div>
              )}

              {/* Strength meter (unchanged) */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <div className="font-medium">Strength: {strength.label}</div>
                  <div className="text-gray-500">{clips.length} clips</div>
                </div>
                <div className="w-full h-2 rounded bg-gray-200 overflow-hidden">
                  <div className={`${strength.color} h-2`} style={{ width: `${strength.percent}%` }} />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center">
                  <img
                    src={match.teamHomeFlagUrl}
                    alt={match.teamHomeCode}
                    className="w-6 h-6 object-cover rounded-full"
                  />
                  <span className="ml-2 text-sm font-medium">{match.teamHomeName}</span>
                </div>
                <span className="text-sm text-gray-500">vs</span>
                <div className="flex items-center">
                  <img
                    src={match.teamAwayFlagUrl}
                    alt={match.teamAwayCode}
                    className="w-6 h-6 object-cover rounded-full"
                  />
                  <span className="ml-2 text-sm font-medium">{match.teamAwayName}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleGenerateMatchClip}
              disabled={merging || clips.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {merging ? 'Generating...' : 'Generate Match Highlights'}
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!showUploadSection && (
          <button
            onClick={() => setShowUploadSection(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            + Upload Clips from JSON
          </button>
        )}

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Generate Clips from Video
        </button>
        <button
          onClick={() => {
            setShowTasksSection(true)
            getTasks()
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          View Tasks
        </button>
        {/* Refresh Buttons */}
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const matchRes = await API.get(`${URL}/getmatch/${matchId}`);
              setMatch(matchRes.data.match);
              const clipsRes = await API.get(`${URL}/clips/getmatchclips/${matchId}`);
              setClips(clipsRes.data || []);
            } catch (err) {
              console.error('Error refreshing match/clips:', err);
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          title="Refresh Clips"
        >
          Refresh Clips
        </button>
        {/* Removed global Refresh Tasks button */}
      </div>
      {showTasksSection && tasks.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 shadow-sm">
          <div className='flex justify-between items-center'>
            <h2 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              ⚠️ Pending Tasks
            </h2>
            <button
              onClick={() => {
                setShowTasksSection(false)
              }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-3">
            {tasks.map((task, index) => (
              <li
                key={index}
                className="text-yellow-800 bg-white border border-yellow-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="font-medium capitalize">
                  Status: <span className="font-semibold">{task.status}</span>
                </div>

                <div className="font-medium capitalize">
                  Status: <span className="font-semibold">{task.teamHomeName}</span>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setEditTask(task)}
                    className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      // Optionally, you can fetch a single task by id if API supports, else just refresh all tasks
                      await getTasks();
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    title="Refresh this task"
                  >
                    Refresh
                  </button>
                </div>

                {task.status === "finished" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => getClips()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      View Clips
                    </button>

                    <button
                      onClick={() => mergeClips()}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      Merge Clips
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Generate Clips Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Generate Clips from Video</h2>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setVideoLink('');
                  setGenerateError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-row gap-8">
              {/* Left: Form */}

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column: match info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Match ID</label>
                    <input
                      type="text"
                      value={matchId}
                      readOnly
                      className="w-full border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={generateFormData.year}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, year: e.target.value })}
                      placeholder="2024"
                      className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <select
                      value={generateFormData.format}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, format: e.target.value })}
                      className="w-full border rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select format</option>
                      <option value="t20">T20</option>
                      <option value="odi">ODI</option>
                      <option value="test">Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                    <input
                      type="text"
                      value={generateFormData.teamHomeName}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, teamHomeName: e.target.value })}
                      placeholder="home team"
                      className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                {/* Right column: video link/upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Link</label>
                    <input
                      type="text"
                      value={generateFormData.videoLink}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, videoLink: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Video File</label>
                    <input
                      type="file"
                      accept="video/*"
                      className="w-full border rounded p-2 text-sm"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('video', file);
                        formData.append('matchId', matchId);
                        formData.append('videoName', matchId + '.mp4');
                        try {
                          setGeneratingClips(true);
                          setGenerateError('');
                          const res = await API.post(`http://localhost:5000/upload`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          // Optionally, set the videoLink field to the returned URL
                          if (res.data?.videoUrl) {
                            setGenerateFormData(f => ({ ...f, videoLink: res.data.videoUrl }));
                            alert('Video uploaded! Video link field updated.');
                          } else {
                            alert('Video uploaded!');
                          }
                        } catch (err) {
                          setGenerateError('Video upload failed.');
                        } finally {
                          setGeneratingClips(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {generateError && <div className="text-sm text-red-600">{generateError}</div>}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 justify-end mt-6">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setVideoLink('');
                    setGenerateError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    if (!generateFormData?.videoLink || !generateFormData?.videoLink.trim()) {
                      setGenerateError('Please enter a video link');
                      return;
                    }
                    setGeneratingClips(true);
                    setGenerateError('');
                    try {
                      //const payload = { matchId, videoLink };
                      console.log(generateFormData, 'form data')
                      const res = await API.post(`${URL}/tasks/create`, { ...generateFormData });
                      // Assuming backend returns created clips
                      const createdClips = res.data?.clips || res.data || [];
                      if (Array.isArray(createdClips) && createdClips.length > 0) {
                        setClips(prev => [...createdClips, ...prev]);
                      }
                      alert(`Successfully generated clips from video!`);
                      setShowGenerateModal(false);
                      setVideoLink('');
                      getTasks()
                      setShowTasksSection(true)
                    } catch (err) {
                      console.error('Generate clips failed', err);
                      setGenerateError(err.response?.data?.error || 'Failed to generate clips. Check the video link and try again.');
                    } finally {
                      setGeneratingClips(false);
                    }
                  }}
                  disabled={generatingClips || !generateFormData?.videoLink?.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {generatingClips ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
            {/* Right: Video Preview or Instructions */}
            <div className="flex-1 pl-6 flex flex-col items-center justify-center">
              {generateFormData.videoLink ? (
                <video
                  src={generateFormData.videoLink}
                  controls
                  className="w-full max-w-xs rounded shadow border"
                  style={{ minHeight: 200 }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <div className="mb-2 font-semibold">Video Preview</div>
                  <div className="text-xs">Paste a video link or upload a video file to preview it here.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showUploadSection && (
        <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Import Clips from JSON</h3>
            <button
              onClick={() => {
                setShowUploadSection(false);
                setUploadError('');
                setUploadPreview(null);
                setUploadText('');
              }}
              className="text-gray-500 hover:text-gray-700 text-lg font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload JSON (file)</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  setUploadError('');
                  setUploadPreview(null);
                  setCreatedCount(0);
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const parsed = JSON.parse(text);
                    // Expect either an array or { clips: [] }
                    const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.clips) ? parsed.clips : null);
                    if (!arr) {
                      setUploadError('JSON must be an array of clip objects or an object with a "clips" array');
                      return;
                    }
                    // Basic validation: ensure each item has at least clip or title
                    const validated = arr.map((it, idx) => ({
                      ...it,
                      _previewIndex: idx,
                    }));
                    setUploadPreview(validated);
                  } catch (err) {
                    console.error('Failed to parse JSON', err);
                    setUploadError('Invalid JSON file');
                  }
                }}
                className="ml-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Or paste JSON text</label>
              <textarea
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder='Paste array of clips or { "clips": [...] }'
                className="w-full border rounded p-2 text-sm h-24"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                  onClick={async () => {
                    setUploadError('');
                    setUploadPreview(null);
                    setCreatedCount(0);
                    if (!uploadText || !uploadText.trim()) {
                      setUploadError('Please paste JSON text first');
                      return;
                    }
                    try {
                      const parsed = JSON.parse(uploadText);
                      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.clips) ? parsed.clips : null);
                      if (!arr) {
                        setUploadError('JSON must be an array of clip objects or an object with a "clips" array');
                        return;
                      }
                      const validated = arr.map((it, idx) => ({ ...it, _previewIndex: idx }));
                      setUploadPreview(validated);
                      await API.post(`${URL}/clips/bulk-insert`, { clips: validated },
                        {
                          maxContentLength: Infinity,
                          maxBodyLength: Infinity
                        })
                      const clipsRes = await API.get(`${URL}/clips/getmatchclips/${matchId}`);
                      setClips(clipsRes.data || []);
                    } catch (err) {
                      console.error('Failed to parse pasted JSON', err);
                      setUploadError('Invalid JSON');
                    }
                  }}
                >
                  Upload
                </button>

                {uploadPreview && (
                  <div className="text-sm text-gray-600">{uploadPreview.length} items parsed</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )
      }

      {/* Select-all toolbar + Bulk delete */}
      <div className="flex items-center justify-between mt-3 mb-2">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4"
              checked={clips.length > 0 && selectedClipIds.length === clips.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedClipIds(clips.map(c => c._id));
                } else {
                  setSelectedClipIds([]);
                }
              }}
            />
            <span className="text-sm text-gray-700">Select all ({filteredClips.length})</span>
          </label>
          <span className="text-sm text-gray-500">{selectedClipIds.length} selected</span>
        </div>

        <div>
          <button
            disabled={selectedClipIds.length === 0 || deletingMultiple}
            onClick={async () => {
              if (selectedClipIds.length === 0) return;
              if (!confirm(`Delete ${selectedClipIds.length} selected clip(s)? This cannot be undone.`)) return;
              setDeletingMultiple(true);
              try {
                // Try bulk delete endpoint first
                try {
                  await API.post(`${URL}/clips/delete-multiple`, { ids: selectedClipIds });
                } catch (err) {
                  // Fallback: delete one by one
                  for (const id of selectedClipIds) {
                    try {
                      await API.delete(`${URL}/clips/delete-clip/${id}`);
                    } catch (err2) {
                      try {
                        await API.post(`${URL}/clips/delete`, { id });
                      } catch (e) {
                        console.error('Failed to delete clip', id, e);
                      }
                    }
                  }
                }

                // Remove from UI
                setClips(prev => prev.filter(c => !selectedClipIds.includes(c._id)));
                setSelectedClipIds([]);
              } catch (err) {
                console.error('Bulk delete failed', err);
                alert('Failed to delete selected clips. See console for details.');
              } finally {
                setDeletingMultiple(false);
              }
            }}
            className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            {deletingMultiple ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {filteredClips.map((clip) => (
          <div
            key={clip._id}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100"
          >
            {/* Video Preview */}
            <div className="relative aspect-video bg-black">
              <video
                src={`${URL}/mockvideos/${clip.clip}`}
                className="w-full h-full object-contain"
                controls
                preload="metadata"
              />

              {/* Selection Checkbox - top-left overlay */}
              <div className="absolute top-2 left-2 z-10">
                <label className="flex items-center justify-center w-6 h-6 bg-white/80 backdrop-blur-sm rounded-md shadow-sm cursor-pointer hover:bg-white transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={selectedClipIds.includes(clip._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClipIds(prev => [...prev, clip._id]);
                      } else {
                        setSelectedClipIds(prev => prev.filter(id => id !== clip._id));
                      }
                    }}
                  />
                </label>
              </div>

              {/* Event Badge (bottom-left) */}
              {clip.event && (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                  {clip.event}
                </div>
              )}

              {/* Over info (bottom-right) */}
              {clip.over && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                  Over {clip.over}
                </div>
              )}
            </div>

            {/* Clip Info */}
            <div className="p-3 space-y-2">
              {/* Title / Commentary */}
              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                {clip.title || clip.commentary || 'Untitled Clip'}
              </div>
              {clip.commentary && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {clip.commentary}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {/* External link */}
                <a
                  href={`${URL}/mockvideos/${clip.clip}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                  title="Open clip in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Admin-only actions */}
                {isAdmin && (
                  <>
                    {/* Edit */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                          title="Edit clip"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-lg md:max-w-2xl">
                        <EditClipForm clip={clip} onSave={handleEditSave} fetchMatchPlayers={fetchMatchPlayers} />
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(clip)}
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                      title="Delete clip"
                    >
                      <Trash className="w-4 h-4" />
                    </button>

                    {/* Report */}
                    {clip?.reported ? (
                      <button
                        disabled
                        className="p-1.5 text-gray-400 rounded-md cursor-not-allowed"
                        title="Already reported"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReportClick(clip)}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                        title="Report clip"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}

                    {/* Trim */}
                    <button
                      onClick={() => setTrimmingClip(clip)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                      title="Trim clip"
                    >
                      <Scissors className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {
        editTask && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white p-6 rounded-xl w-[95%] max-w-md space-y-4">

              <h2 className="text-lg font-bold">Edit Task</h2>

              <input
                className="w-full border p-2 rounded"
                value={editTask.teamHomeName || ""}
                onChange={(e) =>
                  setEditTask({ ...editTask, teamHomeName: e.target.value })
                }
                placeholder="Team Name"
              />

              {(() => {
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
                return (
                  <select
                    className="w-full border p-2 rounded"
                    value={editTask.status}
                    onChange={e => setEditTask({ ...editTask, status: e.target.value })}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                );
              })()}

              <div className="flex justify-between pt-3">
                <button
                  onClick={() => setEditTask(null)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => updateTask(editTask)}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Save
                </button>
              </div>

            </div>
          </div>
        )
      }

      {
        clips.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No clips available for this match yet.
          </div>
        )
      }
    </div >
  );
}
