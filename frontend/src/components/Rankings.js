import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Rankings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [userRankings, setUserRankings] = useState([]);
  const [groupRankings, setGroupRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRankings();
  }, [activeTab]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await axios.get(`${API}/rankings/weekly/users`, {
          withCredentials: true
        });
        setUserRankings(response.data);
      } else {
        const response = await axios.get(`${API}/rankings/weekly/groups`, {
          withCredentials: true
        });
        setGroupRankings(response.data);
      }
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8 flex items-center space-x-3 md:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Weekly Rankings</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-4 md:mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 md:px-6 py-3 md:py-4 font-semibold transition-colors text-sm md:text-base ${
                activeTab === 'users'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              data-testid="users-tab"
            >
              <div className="flex items-center justify-center space-x-1 md:space-x-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Individual Users</span>
                <span className="sm:hidden">Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-3 md:px-6 py-3 md:py-4 font-semibold transition-colors text-sm md:text-base ${
                activeTab === 'groups'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              data-testid="groups-tab"
            >
              <div className="flex items-center justify-center space-x-1 md:space-x-2">
                <Users className="w-5 h-5" />
                <span>Groups</span>
              </div>
            </button>
          </div>
        </div>

        {/* Rankings List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rankings...</p>
            </div>
          ) : activeTab === 'users' ? (
            <UserRankingsList rankings={userRankings} />
          ) : (
            <GroupRankingsList rankings={groupRankings} />
          )}
        </div>
      </div>
    </div>
  );
}

function UserRankingsList({ rankings }) {
  const getMedalForRank = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="space-y-3" data-testid="user-rankings-list">
      {rankings.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No rankings yet this week</p>
      ) : (
        rankings.map((user, index) => (
          <div
            key={user.user_id}
            className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
              index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            data-testid="ranking-user-item"
          >
            <div className="w-12 text-center">
              {getMedalForRank(index + 1) ? (
                <span className="text-3xl">{getMedalForRank(index + 1)}</span>
              ) : (
                <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
              )}
            </div>
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.weekly_points || 0} points this week</p>
            </div>
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
        ))
      )}
    </div>
  );
}

function GroupRankingsList({ rankings }) {
  const getMedalForRank = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="space-y-3" data-testid="group-rankings-list">
      {rankings.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No group rankings yet this week</p>
      ) : (
        rankings.map((group, index) => (
          <div
            key={group.group_id}
            className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
              index < 3 ? 'bg-gradient-to-r from-purple-50 to-purple-100' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            data-testid="ranking-group-item"
          >
            <div className="w-12 text-center">
              {getMedalForRank(index + 1) ? (
                <span className="text-3xl">{getMedalForRank(index + 1)}</span>
              ) : (
                <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-600">{group.weekly_points || 0} points this week</p>
            </div>
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
        ))
      )}
    </div>
  );
}

export default Rankings;