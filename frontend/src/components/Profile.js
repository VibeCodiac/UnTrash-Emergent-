import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Award, Share2, CheckCircle, Sparkles } from 'lucide-react';

// Medal thresholds (updated to match backend)
const MEDAL_THRESHOLDS = {
  bronze: 30,
  silver: 75,
  gold: 150,
  platinum: 300,
  diamond: 500
};

function Profile({ user }) {
  const navigate = useNavigate();
  const [shareStatus, setShareStatus] = useState(null);
  const [newMedalAnimation, setNewMedalAnimation] = useState(null);

  const medals = user?.medals || {};
  const allMedals = Object.entries(medals).flatMap(([month, medalList]) =>
    medalList.map((medal) => ({ month, medal }))
  );

  // Check for new medal achievement
  useEffect(() => {
    if (user?.monthly_points) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthMedals = medals[currentMonth] || [];
      
      // Check if user just earned a medal
      Object.entries(MEDAL_THRESHOLDS).forEach(([medal, threshold]) => {
        if (user.monthly_points >= threshold && !monthMedals.includes(medal)) {
          // Show animation for newly achievable medal
          setNewMedalAnimation(medal);
          setTimeout(() => setNewMedalAnimation(null), 3000);
        }
      });
    }
  }, [user?.monthly_points, medals]);

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
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareStatus('copied');
      }
      setTimeout(() => setShareStatus(null), 3000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const shareMedal = async (medal, month) => {
    const shareData = {
      title: `UnTrash Berlin - ${medal.charAt(0).toUpperCase() + medal.slice(1)} Medal`,
      text: `✨ I just earned a ${medal.toUpperCase()} medal for ${month} on UnTrash Berlin! Cleaning up Berlin one piece of trash at a time! Join me! 🌱`,
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
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          </div>
          <button
            onClick={shareProfile}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
            data-testid="share-profile-button"
          >
            {shareStatus === 'shared' || shareStatus === 'copied' ? (
              <>
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span>{shareStatus === 'shared' ? 'Shared!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                <span>Share My Impact</span>
              </>
            )}
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2" data-testid="profile-name">{user?.name}</h2>
              <p className="text-sm md:text-base text-gray-600" data-testid="profile-email">{user?.email}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                Member since {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
              <h3 className="text-xs md:text-lg font-semibold text-gray-700 text-center">Total</h3>
              <Trophy className="w-5 h-5 md:w-8 md:h-8 text-yellow-500 hidden md:block" />
            </div>
            <p className="text-xl md:text-4xl font-bold text-gray-900 text-center" data-testid="profile-total-points">{user?.total_points || 0}</p>
            <p className="text-xs text-gray-500 mt-1 md:mt-2 text-center hidden md:block">All-time points</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
              <h3 className="text-xs md:text-lg font-semibold text-gray-700 text-center">Monthly</h3>
              <Trophy className="w-5 h-5 md:w-8 md:h-8 text-green-500 hidden md:block" />
            </div>
            <p className="text-xl md:text-4xl font-bold text-gray-900 text-center" data-testid="profile-monthly-points">{user?.monthly_points || 0}</p>
            <p className="text-xs text-gray-500 mt-1 md:mt-2 text-center hidden md:block">This month</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
              <h3 className="text-xs md:text-lg font-semibold text-gray-700 text-center">Medals</h3>
              <Award className="w-5 h-5 md:w-8 md:h-8 text-purple-500 hidden md:block" />
            </div>
            <p className="text-xl md:text-4xl font-bold text-gray-900 text-center" data-testid="profile-medal-count">{allMedals.length}</p>
            <p className="text-xs text-gray-500 mt-1 md:mt-2 text-center hidden md:block">Achievements</p>
          </div>
        </div>
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

        {/* Medal Collection */}
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
                <h3 className="font-semibold text-gray-900 mb-3">Medal Requirements (Monthly)</h3>
                <div className="space-y-2 text-left">
                  <MedalRequirementRow medal="bronze" points={MEDAL_THRESHOLDS.bronze} />
                  <MedalRequirementRow medal="silver" points={MEDAL_THRESHOLDS.silver} />
                  <MedalRequirementRow medal="gold" points={MEDAL_THRESHOLDS.gold} />
                  <MedalRequirementRow medal="platinum" points={MEDAL_THRESHOLDS.platinum} />
                  <MedalRequirementRow medal="diamond" points={MEDAL_THRESHOLDS.diamond} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="medals-container">
              {allMedals.map(({ month, medal }, index) => (
                <MedalCard
                  key={`${month}-${medal}-${index}`}
                  medal={medal}
                  month={month}
                  onShare={shareMedal}
                  shareStatus={shareStatus}
                  isNew={newMedalAnimation === medal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress to Next Medal */}
        {user?.monthly_points !== undefined && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">This Month's Progress</h3>
            <div className="space-y-4">
              {Object.entries(MEDAL_THRESHOLDS).map(([name, points]) => {
                const progress = Math.min(100, (user.monthly_points / points) * 100);
                const achieved = user.monthly_points >= points;
                return (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <MedalIcon medal={name} size="small" />
                        <span className="ml-2 capitalize">{name}</span>
                        {achieved && <Sparkles className="w-4 h-4 ml-1 text-yellow-500" />}
                      </span>
                      <span className="text-sm text-gray-600">
                        {user.monthly_points}/{points} points
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          achieved ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
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

      {/* New Medal Animation Overlay */}
      {newMedalAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="text-center animate-bounceIn">
            <div className="relative">
              <MedalIcon medal={newMedalAnimation} size="xlarge" animated />
              <div className="absolute inset-0 animate-ping opacity-30">
                <MedalIcon medal={newMedalAnimation} size="xlarge" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-6 animate-slideUp">
              {newMedalAnimation.toUpperCase()} Medal Earned!
            </h2>
            <p className="text-white text-lg mt-2 opacity-80">Congratulations!</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }
        @keyframes rotate3d {
          0% { transform: perspective(500px) rotateY(0deg); }
          100% { transform: perspective(500px) rotateY(360deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-bounceIn { animation: bounceIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out 0.3s both; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-rotate3d { animation: rotate3d 4s linear infinite; }
      `}</style>
    </div>
  );
}

function MedalIcon({ medal, size = 'medium', animated = false }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-32 h-32'
  };

  const gradients = {
    bronze: 'from-amber-600 via-orange-400 to-amber-700',
    silver: 'from-gray-300 via-white to-gray-400',
    gold: 'from-yellow-400 via-yellow-300 to-yellow-600',
    platinum: 'from-slate-300 via-blue-100 to-slate-400',
    diamond: 'from-cyan-300 via-blue-200 to-indigo-400'
  };

  const glowColors = {
    bronze: 'shadow-orange-400/50',
    silver: 'shadow-gray-300/50',
    gold: 'shadow-yellow-400/50',
    platinum: 'shadow-blue-300/50',
    diamond: 'shadow-cyan-400/50'
  };

  return (
    <div className={`${sizeClasses[size]} relative ${animated ? 'animate-rotate3d' : ''}`}>
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${gradients[medal]} shadow-lg ${glowColors[medal]} ${animated ? 'animate-glow' : ''} flex items-center justify-center border-2 border-white/30`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/20 to-white/40"></div>
        <span className={`relative z-10 ${size === 'xlarge' ? 'text-6xl' : size === 'large' ? 'text-4xl' : size === 'medium' ? 'text-2xl' : 'text-base'}`}>
          {medal === 'bronze' && '🥉'}
          {medal === 'silver' && '🥈'}
          {medal === 'gold' && '🥇'}
          {medal === 'platinum' && '⭐'}
          {medal === 'diamond' && '💎'}
        </span>
      </div>
    </div>
  );
}

function MedalCard({ medal, month, onShare, shareStatus, isNew }) {
  const gradients = {
    bronze: 'from-amber-500 to-orange-600',
    silver: 'from-gray-400 to-slate-500',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-slate-400 to-blue-500',
    diamond: 'from-cyan-400 to-indigo-500'
  };

  return (
    <div
      className={`relative group ${isNew ? 'animate-bounceIn' : ''}`}
      data-testid="medal-item"
    >
      <div
        className={`bg-gradient-to-br ${gradients[medal]} p-6 rounded-xl shadow-lg text-center transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${isNew ? 'animate-glow' : ''}`}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 animate-shimmer opacity-30"></div>
        </div>
        
        <div className="relative z-10">
          <MedalIcon medal={medal} size="medium" />
          <p className="text-white font-bold capitalize mt-3 text-shadow">{medal}</p>
          <p className="text-white text-xs mt-1 opacity-80">{month}</p>
        </div>
        
        {/* Sparkle effect on hover */}
        <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="absolute bottom-2 right-2 w-4 h-4 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Share button on hover */}
      <button
        onClick={() => onShare(medal, month)}
        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        title="Share this medal"
      >
        {shareStatus === `shared-${medal}-${month}` || shareStatus === `copied-${medal}-${month}` ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Share2 className="w-4 h-4 text-blue-600" />
        )}
      </button>
    </div>
  );
}

function MedalRequirementRow({ medal, points }) {
  return (
    <div className="flex items-center space-x-2">
      <MedalIcon medal={medal} size="small" />
      <span className="text-sm text-gray-600">
        <strong className="capitalize">{medal}:</strong> {points} points/month
      </span>
    </div>
  );
}

export default Profile;
