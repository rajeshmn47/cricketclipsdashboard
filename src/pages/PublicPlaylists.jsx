import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../actions/userAction';
import { URL } from '../constants/userConstants';
import { Button } from '@/components/ui/button';
import { Play, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PublicPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPlaylists();
  }, [currentPage]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await API.get(`${URL}/playlists/public`, {
        params: { page: currentPage, limit: itemsPerPage }
      });
      setPlaylists(res.data.playlists || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCoverImage = (playlist) => {
    // If playlist has a coverImage field, use it; otherwise fallback to placeholder
    if (playlist.coverImage) return playlist.coverImage;
    // Could also use first video's thumbnail if available
    return `${URL}/images/playlist-placeholder.jpg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-video bg-gray-300"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <Button onClick={fetchPlaylists} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Playlists</h1>
          <p className="text-gray-500 mt-1">Discover curated cricket clips from the community</p>
        </div>

        {/* Playlist Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No public playlists yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/playlist/${playlist._id}`}
                className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Thumbnail / Cover */}
                <div className="relative aspect-video bg-gray-900">
                  <img
                    src={getCoverImage(playlist)}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = `${URL}/images/playlist-placeholder.jpg`;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    <span>{playlist.videoCount || playlist.videos?.length || 0} clips</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                    {playlist.title}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {playlist.createdBy?.username || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(playlist.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}