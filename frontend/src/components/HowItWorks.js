import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Sparkles, Trophy, Users, MapPin, CheckCircle, Award } from 'lucide-react';

function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center space-x-3 md:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">How It Works</h1>
        </div>

        {/* Main Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 text-center">Getting Started</h2>
          
          <div className="space-y-6 md:space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">STEP 1</span>
                  <span className="text-green-600 font-semibold text-sm">+5 points</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Spot & Report Trash</h3>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  See litter on the streets of Berlin? Open the map, tap &quot;Report&quot;, take a photo of the trash, 
                  and mark its location. Your report will appear as a red pin on the map for others to see and collect.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">STEP 2</span>
                  <span className="text-green-600 font-semibold text-sm">+15-25 points</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Clean & Verify</h3>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Find a red pin on the map? Go there, collect the trash, and take a photo of the now-clean spot. 
                  Our AI will verify that the area is clean. After admin approval, you&apos;ll earn your points!
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">STEP 3</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Earn Monthly Medals</h3>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Accumulate points each month to earn medals. The more you clean, the higher tier medal you&apos;ll earn. 
                  Medals reset monthly, so there&apos;s always a new challenge!
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">STEP 4</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Join Cleanup Groups</h3>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Team up with other Berliners! Join or create cleanup groups, organize events, and compete 
                  together on the group leaderboard. Cleaning is more fun with friends!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medal Tiers */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2 text-yellow-600" />
            Monthly Medal Tiers
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Earn points throughout the month to unlock medals. Your monthly points reset at the start of each month.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow">
              <span className="text-3xl md:text-4xl">🥉</span>
              <p className="font-bold text-gray-900 mt-1">Bronze</p>
              <p className="text-sm text-gray-600">30 points</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow">
              <span className="text-3xl md:text-4xl">🥈</span>
              <p className="font-bold text-gray-900 mt-1">Silver</p>
              <p className="text-sm text-gray-600">75 points</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow">
              <span className="text-3xl md:text-4xl">🥇</span>
              <p className="font-bold text-gray-900 mt-1">Gold</p>
              <p className="text-sm text-gray-600">150 points</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow">
              <span className="text-3xl md:text-4xl">⭐</span>
              <p className="font-bold text-gray-900 mt-1">Platinum</p>
              <p className="text-sm text-gray-600">300 points</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow col-span-2 md:col-span-1">
              <span className="text-3xl md:text-4xl">💎</span>
              <p className="font-bold text-gray-900 mt-1">Diamond</p>
              <p className="text-sm text-gray-600">500 points</p>
            </div>
          </div>
        </div>

        {/* Point System */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
            Point System
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Report trash location</span>
              </div>
              <span className="font-bold text-green-600">+5 points</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Collect trash (AI verified)</span>
              </div>
              <span className="font-bold text-green-600">+25 points</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Collect trash (manual review)</span>
              </div>
              <span className="font-bold text-green-600">+15 points</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Clean an area (per 100m²)</span>
              </div>
              <span className="font-bold text-green-600">+2 points</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * All collections require admin verification before points are awarded
          </p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-2xl shadow-lg p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">💡 Tips for Success</h2>
          <ul className="space-y-2 text-sm md:text-base text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Take clear photos that show the trash or clean area clearly</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Make sure GPS is enabled for accurate location marking</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Join a group to participate in organized cleanup events</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Check the leaderboard to see how you rank against others</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Share your medals on social media to inspire others!</span>
            </li>
          </ul>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/map')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Start Cleaning Now →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
