import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { URL, NEW_URL } from '../constants/userConstants';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash } from 'lucide-react';
import { API } from '@/actions/userAction';

export default function MatchClips() {
  const { matchId } = useParams();
  const [clips, setClips] = useState([]);
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

  const strength = resolveStrength(match, clips.length);

  return (
    <div className="p-4 space-y-6">
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
              {/* Strength meter */}
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

      /* Upload Toggle Button */
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
          onClick={() => setShowTasksSection(true)}
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
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full mx-4">
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

            <div className="space-y-4">
              {/* Match ID (auto-filled, read-only) */}
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
                  onChange={(e) => setGenerateFormData(e.target.value)}
                  placeholder="2024"
                  className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={generateFormData.format}
                  onChange={(e) => setGenerateFormData(e.target.value)}
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

              {/* Video Link Input */}
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
                      await getClips();
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

          {uploadError && <div className="text-sm text-red-600">{uploadError}</div>}

          {uploadPreview && (
            <div className="bg-white border border-gray-200 rounded p-2 max-h-48 overflow-auto">
              {uploadPreview.slice(0, 20).map((it, i) => (
                <div key={i} className="text-sm text-gray-700 py-1 border-b last:border-b-0">
                  <div className="font-medium">{it.title || it.commentary || `Item ${i + 1}`}</div>
                  <div className="text-xs text-gray-500">clip: {String(it.clip || '—')}</div>
                </div>
              ))}
              {uploadPreview.length > 20 && <div className="text-xs text-gray-500 py-1">And {uploadPreview.length - 20} more...</div>}
            </div>
          )}
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
            <span className="text-sm text-gray-700">Select all ({clips.length})</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip) => (
          <div
            key={clip._id}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
          >
            {/* Video Preview */}
            <div className="aspect-video bg-gray-100 relative">
              <video
                src={`${URL}/mockvideos/${clip.clip}`}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            </div>

            {/* Clip Info */}
            <div className="p-3 space-y-2">
              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                {clip.title || clip.commentary || 'Untitled Clip'}
              </div>

              {clip.commentary && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {clip.commentary}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-500">
                  {clip.over && <span>Over {clip.over}</span>}
                  {clip.event && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">{clip.event}</span>}
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`${URL}/mockvideos/${clip.clip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                    title="Open clip"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={async () => {
                      if (!confirm('Delete this clip? This action cannot be undone.')) return;
                      try {
                        setDeletingClipId(clip._id);
                        // Primary attempt: DELETE /clips/:id
                        await API.delete(`${URL}/clips/delete-clip/${clip._id}`);
                        // remove from UI
                        setClips(prev => prev.filter(c => c._id !== clip._id));
                      } catch (err) {
                        console.error('Failed to delete clip via DELETE, trying fallback', err);
                        try {
                          // Fallback: POST /clips/delete { id }
                          await API.post(`${URL}/clips/delete`, { id: clip._id });
                          setClips(prev => prev.filter(c => c._id !== clip._id));
                        } catch (err2) {
                          console.error('Delete failed', err2);
                          alert('Failed to delete clip. Check server endpoint or console for details.');
                        }
                      } finally {
                        setDeletingClipId(null);
                      }
                    }}
                    disabled={deletingClipId === clip._id}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    title="Delete clip"
                  >
                    {deletingClipId === clip._id ? (
                      <span className="text-xs">Deleting...</span>
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {/* Checkbox overlay */}
                  <label className="bg-white/80 rounded px-1">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4"
                      checked={selectedClipIds.includes(clip._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClipIds(prev => Array.from(new Set([...prev, clip._id])));
                        } else {
                          setSelectedClipIds(prev => prev.filter(id => id !== clip._id));
                        }
                      }}
                    />
                  </label>
                </div>
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
