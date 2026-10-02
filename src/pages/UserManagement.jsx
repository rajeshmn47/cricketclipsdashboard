import { useState, useEffect } from 'react';
import { API } from '../actions/userAction';
import { URL } from '../constants/userConstants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, Edit, Search, UserCheck, UserX, RefreshCw } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalPlaylists: 0, totalClips: 0 });
    const [editingUser, setEditingUser] = useState(null);
    const itemsPerPage = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${URL}/admin/user-stats`, {
                params: { page: currentPage, limit: itemsPerPage, search, role: roleFilter }
            });
            setUsers(res.data.users || []);
            setTotalPages(res.data.totalPages || 1);
            setStats(res.data.stats || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, search, roleFilter]);

    const handleDelete = async (userId) => {
        if (!confirm('Delete this user? This will also delete their playlists and clips.')) return;
        try {
            await API.delete(`${URL}/delete-user/${userId}`);
            fetchUsers();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleUpdate = async (updatedUser) => {
        try {
            const { _id, ...updates } = updatedUser;
            await API.put(`${URL}/update-user/${_id}`, updates);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await API.put(`${URL}/api/admin/users/${userId}`, { role: newRole });
            fetchUsers();
        } catch (err) {
            alert('Role update failed');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Management Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow border">
                    <div className="text-gray-500 text-sm">Total Users</div>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </div>
                <div className="bg-white p-4 rounded shadow border">
                    <div className="text-gray-500 text-sm">Active Users (30d)</div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                </div>
                <div className="bg-white p-4 rounded shadow border">
                    <div className="text-gray-500 text-sm">Total Playlists</div>
                    <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
                </div>
                <div className="bg-white p-4 rounded shadow border">
                    <div className="text-gray-500 text-sm">Total Clips</div>
                    <div className="text-2xl font-bold">{stats.totalClips}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search by name, email, phone"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 w-64"
                    />
                </div>
                <select
                    className="border rounded px-2 py-1"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <Button onClick={() => { setCurrentPage(1); fetchUsers(); }} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded shadow">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">User</th>
                                    <th className="p-2 text-left">Email / Phone</th>
                                    <th className="p-2 text-left">Role</th>
                                    <th className="p-2 text-left">Verified</th>
                                    <th className="p-2 text-left">Playlists</th>
                                    <th className="p-2 text-left">Clips</th>
                                    <th className="p-2 text-left">Active</th>
                                    <th className="p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} className="border-t hover:bg-gray-50">
                                        <td className="p-2">
                                            <div className="font-medium">{user.username || '—'}</div>
                                            <div className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-2">
                                            <div>{user.email}</div>
                                            <div className="text-xs text-gray-500">{user.phonenumber || '—'}</div>
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={user.role}
                                                onChange={e => handleRoleChange(user._id, e.target.value)}
                                                className="border rounded px-1 py-0.5 text-sm"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${user.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.verified ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">{user.playlistCount}</td>
                                        <td className="p-2 text-center">{user.clipCount}</td>
                                        <td className="p-2">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1 text-green-600"><UserCheck className="w-4 h-4" /> Active</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400"><UserX className="w-4 h-4" /> Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                            <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
                            <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                        </div>
                    )}
                </>
            )}

            {/* Edit User Modal (without wallet) */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Edit User</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    value={editingUser.username || ''}
                                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input value={editingUser.email} disabled />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Phone Number</label>
                                <Input
                                    value={editingUser.phonenumber || ''}
                                    onChange={e => setEditingUser({ ...editingUser, phonenumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingUser.verified || false}
                                        onChange={e => setEditingUser({ ...editingUser, verified: e.target.checked })}
                                    />
                                    Verified
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                            <Button onClick={() => handleUpdate(editingUser)}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}