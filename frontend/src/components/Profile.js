import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Award, Share2, Copy, CheckCircle } from 'lucide-react';

function Profile({ user }) {
  const navigate = useNavigate();
  const [shareStatus, setShareStatus] = useState(null);

  const getMedalIcon = (medal) => {
    switch (medal) {
      case 'diamond':
        return '💎';
      case 'platinum':
        return '⭐';
      case 'gold':
        return '🥇';
      case 'silver':
        return '🥈';
      case 'bronze':
        return '🥉';
      default:
        return '🏆';
    }
  };

  const getMedalColor = (medal) => {
    switch (medal) {
      case 'diamond':
        return 'from-cyan-400 to-blue-600';
      case 'platinum':
        return 'from-gray-300 to-gray-500';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-400';
      case 'bronze':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  const medals = user?.medals || {};
  const allMedals = Object.entries(medals).flatMap(([month, medalList]) =>
    medalList.map((medal) => ({ month, medal }))
  );

  const shareProfile = async () => {
    const shareData = {
      title: 'UnTrash Berlin - My Impact',
      text: `🌱 I've earned ${user?.total_points || 0} points cleaning up Berlin! Check out my ${allMedals.length} medals on UnTrash Berlin! Join me in making our city cleaner! 🗑️♻️`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('shared');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareStatus('copied');
      }
      setTimeout(() => setShareStatus(null), 3000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const shareMedal = async (medal, month) => {
    const medalEmoji = getMedalIcon(medal);
    const shareData = {
      title: `UnTrash Berlin - ${medal.charAt(0).toUpperCase() + medal.slice(1)} Medal`,
      text: `${medalEmoji} I just earned a ${medal.toUpperCase()} medal for ${month} on UnTrash Berlin! Cleaning up Berlin one piece of trash at a time! Join me! 🌱`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus(`shared-${medal}-${month}`);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareStatus(`copied-${medal}-${month}`);
      }
      setTimeout(() => setShareStatus(null), 2000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          </div>
          <button
            onClick={shareProfile}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="share-profile-button"
          >
            {shareStatus === 'shared' || shareStatus === 'copied' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{shareStatus === 'shared' ? 'Shared!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                <span>Share My Impact</span>
              </>
            )}
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-6">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="profile-name">{user?.name}</h2>
              <p className="text-gray-600" data-testid="profile-email">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Member since {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Points</h3>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="profile-total-points">{user?.total_points || 0}</p>
            <p className="text-sm text-gray-500 mt-2">All-time points earned</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Monthly Points</h3>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="profile-monthly-points">{user?.monthly_points || 0}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Medals</h3>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900" data-testid="profile-medal-count">{allMedals.length}</p>
            <p className="text-sm text-gray-500 mt-2">Achievements earned</p>
          </div>
        </div>

        {/* Medals Gallery - Prominent Display */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="w-8 h-8 mr-3 text-yellow-500" />
            My Medal Collection
          </h2>

          {allMedals.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No medals earned yet</p>
              <p className="text-sm text-gray-400 mb-6">Collect trash to earn monthly medals!</p>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Medal Requirements</h3>
                <div className="space-y-2 text-left">
                  <p className="text-sm text-gray-600">🥉 <strong>Bronze:</strong> 100 points/month</p>
                  <p className="text-sm text-gray-600">🥈 <strong>Silver:</strong> 300 points/month</p>
                  <p className="text-sm text-gray-600">🥇 <strong>Gold:</strong> 600 points/month</p>
                  <p className="text-sm text-gray-600">⭐ <strong>Platinum:</strong> 1,000 points/month</p>
                  <p className="text-sm text-gray-600">💎 <strong>Diamond:</strong> 2,000 points/month</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="medals-container">
              {allMedals.map(({ month, medal }, index) => (
                <div
                  key={`${month}-${medal}-${index}`}
                  className="relative group"
                  data-testid="medal-item"
                >
                  <div
                    className={`bg-gradient-to-br ${getMedalColor(medal)} p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition-all cursor-pointer`}
                  >
                    <div className="text-5xl mb-2">{getMedalIcon(medal)}</div>
                    <p className="text-white font-bold capitalize">{medal}</p>
                    <p className="text-white text-xs mt-1 opacity-90">{month}</p>
                  </div>
                  
                  {/* Share button on hover */}
                  <button
                    onClick={() => shareMedal(medal, month)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Share this medal"
                  >
                    {shareStatus === `shared-${medal}-${month}` || shareStatus === `copied-${medal}-${month}` ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Share2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress to Next Medal */}
        {user?.monthly_points !== undefined && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">This Month's Progress</h3>
            <div className="space-y-4">
              {[
                { name: 'Bronze', points: 100, icon: '🥉' },
                { name: 'Silver', points: 300, icon: '🥈' },
                { name: 'Gold', points: 600, icon: '🥇' },
                { name: 'Platinum', points: 1000, icon: '⭐' },
                { name: 'Diamond', points: 2000, icon: '💎' },
              ].map((medal) => {
                const progress = Math.min(100, (user.monthly_points / medal.points) * 100);
                const achieved = user.monthly_points >= medal.points;
                return (
                  <div key={medal.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {medal.icon} {medal.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {user.monthly_points}/{medal.points} points
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          achieved ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
