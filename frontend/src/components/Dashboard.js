import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Trophy, User, LogOut, Award, Settings, Calendar, Shield, Bell, Menu, X, HelpCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [weeklyStats, setWeeklyStats] = useState({ reports: 0, collections: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadWeeklyStats();
    loadUpcomingEvents();
    if (user?.is_admin) {
      loadPendingCount();
    }
  }, [user]);

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

  const loadPendingCount = async () => {
    try {
      const response = await fetch(`${API}/admin/pending-count`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.total_pending || 0);
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const navItems = [
    { path: '/map', icon: MapPin, label: 'Map', testId: 'nav-map-button' },
    { path: '/groups', icon: Users, label: 'Groups', testId: 'nav-groups-button' },
    { path: '/rankings', icon: Trophy, label: 'Rankings', testId: 'nav-rankings-button' },
    { path: '/profile', icon: User, label: 'Profile', testId: 'nav-profile-button' },
    { path: '/how-it-works', icon: HelpCircle, label: 'How It Works', testId: 'nav-how-button' },
    { path: '/settings', icon: Settings, label: 'Settings', testId: 'nav-settings-button' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              <span className="text-lg md:text-2xl font-bold text-gray-900">UnTrash Berlin</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              {navItems.map(({ path, icon: Icon, label, testId }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                  data-testid={testId}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
              {user?.is_admin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors relative"
                  data-testid="nav-admin-button"
                >
                  <Shield className="w-5 h-5" />
                  <span className="hidden lg:inline">Admin</span>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse" data-testid="admin-pending-badge">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-green-600 transition-colors"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="container mx-auto px-4 py-2">
              {navItems.map(({ path, icon: Icon, label, testId }) => (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className="flex items-center space-x-3 w-full py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg px-3 transition-colors"
                  data-testid={`mobile-${testId}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
              {user?.is_admin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="flex items-center space-x-3 w-full py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 transition-colors relative"
                  data-testid="mobile-nav-admin-button"
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}
              <hr className="my-2" />
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center space-x-3 w-full py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 transition-colors"
                data-testid="mobile-logout-button"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-4 md:mb-6" data-testid="welcome-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full"
              />
            )}
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1" data-testid="welcome-message">
                Welcome, {user?.name}!
              </h1>
              <p className="text-sm md:text-base text-gray-600">Let&apos;s make Berlin cleaner together</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-3xl md:text-4xl font-bold text-green-600" data-testid="user-points">{user?.total_points || 0}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </div>

        {/* User Medals Section - Only show if user has medals */}
        {user?.medals && Object.keys(user.medals).length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6" data-testid="medals-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-600" />
                My Medals
              </h2>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {Object.entries(user.medals).flatMap(([month, medalList]) =>
                medalList.map((medal, idx) => (
                  <div
                    key={`${month}-${medal}-${idx}`}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      medal === 'diamond' ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 text-white' :
                      medal === 'platinum' ? 'bg-gradient-to-r from-slate-300 to-blue-200 text-gray-800' :
                      medal === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-800' :
                      medal === 'silver' ? 'bg-gradient-to-r from-gray-300 to-slate-300 text-gray-800' :
                      'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    }`}
                    data-testid="medal-badge"
                  >
                    <span>
                      {medal === 'diamond' && '💎'}
                      {medal === 'platinum' && '⭐'}
                      {medal === 'gold' && '🥇'}
                      {medal === 'silver' && '🥈'}
                      {medal === 'bronze' && '🥉'}
                    </span>
                    <span className="capitalize">{medal}</span>
                    <span className="text-xs opacity-75">({month})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" data-testid="weekly-reports-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Weekly Reports</h3>
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{weeklyStats.reports}</p>
            <p className="text-xs text-gray-500">Berlin-wide</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" data-testid="weekly-collections-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Weekly Cleanups</h3>
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{weeklyStats.collections}</p>
            <p className="text-xs text-gray-500">Berlin-wide</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" data-testid="monthly-points-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Monthly Points</h3>
              <Award className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{user?.monthly_points || 0}</p>
            <p className="text-xs text-gray-500">Your progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6" data-testid="groups-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">My Groups</h3>
              <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{user?.joined_groups?.length || 0}</p>
            <p className="text-xs text-gray-500">Active memberships</p>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6" data-testid="upcoming-events-card">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
              Upcoming Group Events
            </h2>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.event_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{event.title}</p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">{event.group_name}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs md:text-sm font-medium text-blue-600">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {upcomingEvents.length > 3 && (
              <button
                onClick={() => navigate('/groups')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {upcomingEvents.length} events →
              </button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/map')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              data-testid="quick-report-button"
            >
              <MapPin className="w-8 h-8 md:w-10 md:h-10 text-red-600 mb-2" />
              <span className="text-sm md:text-base font-semibold text-gray-900">Report Trash</span>
              <span className="text-xs text-gray-600">+5 points</span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              data-testid="quick-collect-button"
            >
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-green-600 mb-2" />
              <span className="text-sm md:text-base font-semibold text-gray-900">Collect Trash</span>
              <span className="text-xs text-gray-600">+15-25 points</span>
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              data-testid="quick-groups-button"
            >
              <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mb-2" />
              <span className="text-sm md:text-base font-semibold text-gray-900">Join Groups</span>
              <span className="text-xs text-gray-600">Team up</span>
            </button>
            <button
              onClick={() => navigate('/rankings')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              data-testid="quick-rankings-button"
            >
              <Award className="w-8 h-8 md:w-10 md:h-10 text-purple-600 mb-2" />
              <span className="text-sm md:text-base font-semibold text-gray-900">Leaderboard</span>
              <span className="text-xs text-gray-600">See rankings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
