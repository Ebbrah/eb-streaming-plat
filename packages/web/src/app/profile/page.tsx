'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: user.preferences?.notifications || true,
          language: user.preferences?.language || 'en',
        },
      });
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            {isEditing && (
              <button
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full"
                onClick={() => document.getElementById('profilePicture')?.click()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <input
              type="file"
              id="profilePicture"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                // Handle profile picture upload
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-gray-600">Level {user?.level}</p>
            <div className="w-48 bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{
                  width: `${((user?.experience ?? 0) / ((user?.level ?? 1) * 100)) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {(user?.experience ?? 0)} / {(user?.level ?? 1) * 100} XP
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme</label>
              <select
                value={formData.preferences.theme}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, theme: e.target.value as 'light' | 'dark' },
                  })
                }
                className="input-field mt-1"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={formData.preferences.notifications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, notifications: e.target.checked },
                  })
                }
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                Enable notifications
              </label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Achievements</h2>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {user?.achievements?.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 