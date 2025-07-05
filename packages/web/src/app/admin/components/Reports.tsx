'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ReportData {
  totalUsers: number;
  totalAdmins: number;
  totalMovies: number;
  monthlySubscribers: number;
  totalRevenue: number;
  topViewedMovies: Array<{
    title: string;
    views: number;
  }>;
  userGrowth: Array<{
    month: string;
    newUsers: number;
  }>;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'overview' | 'subscribers' | 'financial' | 'viewers'>('overview');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      // For now, we'll simulate the data since we don't have the backend endpoints yet
      // In a real implementation, you would fetch this from your backend
      const mockData: ReportData = {
        totalUsers: 1250,
        totalAdmins: 8,
        totalMovies: 45,
        monthlySubscribers: 890,
        totalRevenue: 125000,
        topViewedMovies: [
          { title: "The Great Commission", views: 1250 },
          { title: "Walking in Faith", views: 980 },
          { title: "Kingdom Principles", views: 750 },
          { title: "Divine Purpose", views: 620 },
          { title: "Spiritual Growth", views: 580 }
        ],
        userGrowth: [
          { month: 'Jan', newUsers: 45 },
          { month: 'Feb', newUsers: 52 },
          { month: 'Mar', newUsers: 38 },
          { month: 'Apr', newUsers: 67 },
          { month: 'May', newUsers: 73 },
          { month: 'Jun', newUsers: 89 }
        ]
      };

      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Error fetching report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center py-8 text-gray-600">No report data available</div>;
  }

  return (
    <div className="space-y-8">
      {/* Report Navigation */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Reports Dashboard</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveReport('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeReport === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveReport('subscribers')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeReport === 'subscribers'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly Subscribers
          </button>
          <button
            onClick={() => setActiveReport('financial')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeReport === 'financial'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Financial Report
          </button>
          <button
            onClick={() => setActiveReport('viewers')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeReport === 'viewers'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Viewer Reports
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {activeReport === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.totalUsers}</div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.totalAdmins}</div>
                <div className="text-sm text-green-600">Total Admins</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{reportData.totalMovies}</div>
                <div className="text-sm text-purple-600">Total Movies</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.monthlySubscribers}</div>
                <div className="text-sm text-orange-600">Monthly Subscribers</div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'subscribers' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Subscribers Report</h3>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{reportData.monthlySubscribers}</div>
              <div className="text-blue-600 font-medium">Active Subscribers This Month</div>
              <div className="mt-4 text-sm text-blue-500">
                <div>• New subscribers this month: +{reportData.userGrowth[reportData.userGrowth.length - 1].newUsers}</div>
                <div>• Growth rate: +12.5% from last month</div>
                <div>• Average subscription duration: 8.5 months</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-3">Monthly Growth Trend</h4>
              <div className="space-y-2">
                {reportData.userGrowth.map((month, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{month.month}</span>
                    <span className="text-sm font-medium">{month.newUsers} new users</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeReport === 'financial' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">${reportData.totalRevenue.toLocaleString()}</div>
              <div className="text-green-600 font-medium">Total Revenue</div>
              <div className="mt-4 text-sm text-green-500">
                <div>• Monthly revenue: $12,500</div>
                <div>• Average revenue per user: $100</div>
                <div>• Revenue growth: +15.2% from last month</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-blue-600">$8,500</div>
                <div className="text-sm text-blue-600">Subscription Revenue</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-purple-600">$3,200</div>
                <div className="text-sm text-purple-600">Donation Revenue</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-orange-600">$800</div>
                <div className="text-sm text-orange-600">Other Revenue</div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'viewers' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Viewer Reports</h3>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">4,180</div>
              <div className="text-purple-600 font-medium">Total Views This Month</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-3">Top Viewed Movies</h4>
              <div className="space-y-3">
                {reportData.topViewedMovies.map((movie, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-purple-600 mr-3">#{index + 1}</span>
                      <span className="font-medium">{movie.title}</span>
                    </div>
                    <span className="text-sm text-gray-600">{movie.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-blue-600">2,450</div>
                <div className="text-sm text-blue-600">Unique Viewers</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-green-600">1.7</div>
                <div className="text-sm text-green-600">Average Views Per User</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 