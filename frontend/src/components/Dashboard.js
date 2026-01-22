import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Trophy, User, LogOut, Award, Share2, Settings, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [weeklyStats, setWeeklyStats] = useState({ reports: 0, collections: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyStats();
    loadUpcomingEvents();
  }, []);

  const loadWeeklyStats = async () => {
    try {
      const response = await fetch(`${API}/stats/weekly`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWeeklyStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const response = await fetch(`${API}/events/upcoming`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">UnTrash Berlin</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/map')}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                data-testid="nav-map-button"
              >
                <MapPin className="w-5 h-5" />
                <span>Map</span>
              </button>
              <button
                onClick={() => navigate('/groups')}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                data-testid="nav-groups-button"
              >
                <Users className="w-5 h-5" />
                <span>Groups</span>
              </button>
              <button
                onClick={() => navigate('/rankings')}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                data-testid="nav-rankings-button"
              >
                <Trophy className="w-5 h-5" />
                <span>Rankings</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                data-testid="nav-profile-button"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 mt-1">You've earned {user?.total_points || 0} points total</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Points</h3>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="total-points">{user?.total_points || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Keep collecting to earn more!</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Monthly Points</h3>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="monthly-points">{user?.monthly_points || 0}</p>
            <p className="text-sm text-gray-500 mt-2">This month's progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Weekly Points</h3>
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="weekly-points">{user?.weekly_points || 0}</p>
            <p className="text-sm text-gray-500 mt-2">This week's progress</p>
          </div>
        </div>

        {/* Berlin-wide Weekly Stats */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <MapPin className="w-8 h-8 mr-3" />
            This Week in Berlin
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Trash Reports</span>
                  <span className="text-xs bg-red-500 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-5xl font-bold" data-testid="weekly-reports">{weeklyStats.reports}</p>
                <p className="text-sm opacity-75 mt-2">Locations reported this week</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">Trash Collected</span>
                  <span className="text-xs bg-green-500 px-2 py-1 rounded">Verified</span>
                </div>
                <p className="text-5xl font-bold" data-testid="weekly-collections">{weeklyStats.collections}</p>
                <p className="text-sm opacity-75 mt-2">Items collected this week</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/map')}
              className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              data-testid="report-trash-button"
            >
              Report Trash
            </button>
            <button
              onClick={() => navigate('/map')}
              className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              data-testid="collect-trash-button"
            >
              Collect Trash
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              data-testid="join-group-button"
            >
              Join a Group
            </button>
          </div>
        </div>

        {/* My Recent Medals */}
        {user?.medals && Object.keys(user.medals).length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-600" />
                My Latest Medals
              </h2>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {Object.entries(user.medals).slice(-3).reverse().flatMap(([month, medalList]) =>
                medalList.map((medal, idx) => (
                  <div
                    key={`${month}-${medal}-${idx}`}
                    className="flex-shrink-0 bg-white rounded-lg p-4 shadow-md text-center min-w-[120px]"
                  >
                    <div className="text-4xl mb-2">
                      {medal === 'diamond' && '💎'}
                      {medal === 'platinum' && '⭐'}
                      {medal === 'gold' && '🥇'}
                      {medal === 'silver' && '🥈'}
                      {medal === 'bronze' && '🥉'}
                    </div>
                    <p className="font-semibold text-gray-900 capitalize">{medal}</p>
                    <p className="text-xs text-gray-500">{month}</p>
                  </div>
                ))
              ).slice(0, 3)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;