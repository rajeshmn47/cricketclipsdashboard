import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { API } from '@/actions/userAction';
import { URL } from '../constants/userConstants';

export default function Tasks() {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editTask, setEditTask] = useState(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
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
	});

	const fetchTasks = async () => {
		setLoading(true);
		try {
			const { data } = await API.get(`${URL}/tasks/alltasks`);
			setTasks(data || []);
		} catch (err) {
			console.error('Error fetching tasks:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, []);

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

	const handleCreate = async () => {
		try {
			await API.post(`${URL}/tasks/create`, createForm);
			setShowCreateModal(false);
			setCreateForm({ matchId: '', teamHomeName: '', status: 'pending', format: '', year: '' });
			fetchTasks();
		} catch (err) {
			alert('Failed to create task');
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Tasks</h1>
				<div className="flex gap-2">
					<Button onClick={fetchTasks} className="bg-blue-600 text-white">Refresh</Button>
					<Button onClick={() => setShowCreateModal(true)} className="bg-green-600 text-white">+ Create Task</Button>
				</div>
			</div>
			{loading ? (
				<div>Loading...</div>
			) : (
				<table className="min-w-full bg-white border rounded shadow">
					<thead>
						<tr className="bg-gray-100">
							<th className="p-2 text-left">Match ID</th>
							<th className="p-2 text-left">Home Team</th>
							<th className="p-2 text-left">Status</th>
							<th className="p-2 text-left">Format</th>
							<th className="p-2 text-left">Year</th>
							<th className="p-2 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{tasks.map((task) => (
							<tr key={task._id} className="border-t">
								<td className="p-2">{task.matchId}</td>
								<td className="p-2">{task.teamHomeName}</td>
								<td className="p-2 capitalize">{task.status}</td>
								<td className="p-2">{task.format}</td>
								<td className="p-2">{task.year}</td>
								<td className="p-2">
									<Button onClick={() => handleEdit(task)} className="bg-yellow-500 text-white">Edit</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
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
									      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
									    ))}
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
									      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
									    ))}
									  </select>
						<div className="flex justify-between pt-3">
							<Button onClick={() => setShowCreateModal(false)} className="bg-gray-400 text-white">Cancel</Button>
							<Button onClick={handleCreate} className="bg-green-600 text-white">Create</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
