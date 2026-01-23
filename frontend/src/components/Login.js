import React from 'react';
import { MapPin, Sparkles, Trophy, Users, Camera } from 'lucide-react';

function Login() {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-full mb-4 md:mb-6">
              <MapPin className="w-8 h-8 md:w-12 md:h-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
              UnTrash Berlin
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              A community-powered app to keep Berlin clean. Report litter, collect trash, earn points and medals!
            </p>
          </div>

          {/* How It Works - Step by Step */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
            
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-6 md:max-w-3xl md:mx-auto">
              {/* Step 1 */}
              <div className="flex md:flex-col items-start md:items-center md:text-center">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4 md:mr-0 md:mb-3">
                  <Camera className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-semibold mb-1">STEP 1</div>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">Spot & Report</h3>
                  <p className="text-xs md:text-sm text-gray-600">See trash? Take a photo and your location is automatically detected.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex md:flex-col items-start md:items-center md:text-center">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mr-4 md:mr-0 md:mb-3">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-green-600 font-semibold mb-1">STEP 2</div>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">Clean & Verify</h3>
                  <p className="text-xs md:text-sm text-gray-600">Collect the trash and upload a photo. AI verifies your cleanup.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex md:flex-col items-start md:items-center md:text-center">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4 md:mr-0 md:mb-3">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-purple-600 font-semibold mb-1">STEP 3</div>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">Earn Rewards</h3>
                  <p className="text-xs md:text-sm text-gray-600">Collect points and earn monthly medals from Bronze to Diamond!</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex md:flex-col items-start md:items-center md:text-center">
                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-amber-100 rounded-full flex items-center justify-center mr-4 md:mr-0 md:mb-3">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-amber-600 font-semibold mb-1">STEP 4</div>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">Join Groups</h3>
                  <p className="text-xs md:text-sm text-gray-600">Team up with others for cleanup events and compete together!</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Ready to make Berlin cleaner?</h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Sign in with your Google account to get started</p>
            <button
              onClick={handleGoogleLogin}
              data-testid="google-login-button"
              className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 bg-green-600 text-white text-base md:text-lg font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">Free to join • No credit card required</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
