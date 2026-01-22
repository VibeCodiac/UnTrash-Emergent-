import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, Smartphone, Save, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Settings({ user }) {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: false,
    notify_new_events: true,
    notify_nearby_trash: false,
    notify_group_updates: true
  });
  const [mockNotifications, setMockNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
    loadMockNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/notifications`, {
        withCredentials: true
      });
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications/mock`, {
        withCredentials: true
      });
      setMockNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings/notifications`, preferences, {
        withCredentials: true
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-2">
            <p className="text-gray-700"><strong>Name:</strong> {user?.name}</p>
            <p className="text-gray-700"><strong>Email:</strong> {user?.email}</p>
            <p className="text-gray-700"><strong>Member since:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                saved 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:bg-gray-400`}
              data-testid="save-settings-button"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Testing Mode - Mock Notifications</p>
                <p>Notifications are currently simulated for testing. When events are created, you'll see mock notifications below instead of receiving real emails. You can upgrade to real email notifications later!</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('email_notifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email_notifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
                data-testid="toggle-email"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Browser/mobile notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('push_notifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.push_notifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
                data-testid="toggle-push"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.push_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* New Events */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">New Group Events</p>
                  <p className="text-sm text-gray-600">Notify when events are created in your groups</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notify_new_events')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_new_events ? 'bg-green-600' : 'bg-gray-300'
                }`}
                data-testid="toggle-events"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_new_events ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Group Updates */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Group Updates</p>
                  <p className="text-sm text-gray-600">Notify about group announcements</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notify_group_updates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_group_updates ? 'bg-green-600' : 'bg-gray-300'
                }`}
                data-testid="toggle-updates"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_group_updates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Nearby Trash (Future feature) */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-75">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Nearby Trash Reports</p>
                  <p className="text-sm text-gray-600">Notify about trash near you (coming soon)</p>
                </div>
              </div>
              <button
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 cursor-not-allowed"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Mock Notification Log */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications (Testing)</h2>
          
          {mockNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">When someone creates an event in your groups, you'll see it here!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockNotifications.map((notif, idx) => (
                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
