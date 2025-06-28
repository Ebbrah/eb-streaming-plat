'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import MovieManagement from './components/MovieManagement';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isSuperAdmin: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [activeTab, setActiveTab] = useState<'users' | 'movies'>('users');
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, user, activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        router.push('/');
        return;
      }

      const response = await fetch('/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.message || 'Error fetching users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        router.push('/');
        return;
      }

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newAdmin,
          role: 'admin',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Admin created successfully');
        setNewAdmin({ email: '', password: '', name: '' });
        fetchUsers();
      } else {
        toast.error(data.message || 'Error creating admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Error creating admin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        router.push('/');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEditRole = (user: User) => {
    setEditingRoleUserId(user._id);
    setNewRole(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        router.push('/');
        return;
      }
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Role updated successfully');
        setEditingRoleUserId(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Error updating role');
      }
    } catch (error) {
      toast.error('Error updating role');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-900 tracking-tight">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-b-4 border-purple-500 text-purple-600 bg-gray-50'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-400'
              } whitespace-nowrap py-3 px-4 font-bold text-lg rounded-t-lg transition`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`${
                activeTab === 'movies'
                  ? 'border-b-4 border-purple-500 text-purple-600 bg-gray-50'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-400'
              } whitespace-nowrap py-3 px-4 font-bold text-lg rounded-t-lg transition`}
            >
              Movies
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="pt-2">
          {activeTab === 'users' ? (
            <>
              {/* Create Admin Form */}
              {user?.isSuperAdmin && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Admin</h2>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                      Create Admin
                    </button>
                  </form>
                </div>
              )}

              {/* Users List */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((userRow) => (
                        <tr key={userRow._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{userRow.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{userRow.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userRow.isSuperAdmin
                                ? 'bg-purple-100 text-purple-800'
                                : userRow.role === 'admin'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userRow.isSuperAdmin ? 'Super Admin' : userRow.role}
                            </span>
                            {/* Edit Role UI in Role column for super admin */}
                            {!userRow.isSuperAdmin && user?.isSuperAdmin && (
                              editingRoleUserId === userRow._id ? (
                                <div className="mt-2 flex items-center space-x-2">
                                  <select
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value as 'user' | 'admin')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button
                                    onClick={() => handleSaveRole(userRow._id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRoleUserId(null)}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditRole(userRow)}
                                  className="ml-2 text-purple-600 hover:text-purple-800"
                                >
                                  Edit Role
                                </button>
                              )
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userRow.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!userRow.isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteUser(userRow._id)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <MovieManagement />
          )}
        </div>
      </div>
    </div>
  );
} 