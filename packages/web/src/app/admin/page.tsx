'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import MovieManagement from './components/MovieManagement';
import AdminManagement from './components/AdminManagement';

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
  const [activeTab, setActiveTab] = useState<'users' | 'movies' | 'admins'>('users');

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
            {user?.isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`${
                  activeTab === 'admins'
                    ? 'border-b-4 border-purple-500 text-purple-600 bg-gray-50'
                    : 'border-b-4 border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-400'
                } whitespace-nowrap py-3 px-4 font-bold text-lg rounded-t-lg transition`}
              >
                Admin Management
              </button>
            )}
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userRow.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'admins' ? (
            <AdminManagement />
          ) : (
            <MovieManagement />
          )}
        </div>
      </div>
    </div>
  );
} 