import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, Smartphone, Save, CheckCircle, Info, User, Camera, Globe } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

function Settings({ user }) {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
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
  
  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState(user?.picture || '');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    loadSettings();
    loadMockNotifications();
    if (user) {
      setDisplayName(user.name || '');
      setProfilePicture(user.picture || '');
    }
  }, [user]);

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

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash');
      formData.append('folder', 'untrash/profiles');

      const uploadResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setProfilePicture(uploadResponse.data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/users/profile`, {
        name: displayName.trim(),
        picture: profilePicture
      }, {
        withCredentials: true
      });
      setProfileSaved(true);
      setEditingProfile(false);
      setTimeout(() => setProfileSaved(false), 3000);
      // Reload page to update user data
      window.location.reload();
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">{t('account_settings')}</h1>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('language')}</h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                language === 'en' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="lang-en-button"
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
            <button
              onClick={() => setLanguage('de')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                language === 'de' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="lang-de-button"
            >
              <span>🇩🇪</span>
              <span>Deutsch</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">{t('edit_profile')}</h2>
            </div>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                data-testid="edit-profile-button"
              >
                Edit
              </button>
            )}
          </div>

          {profileSaved && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {editingProfile ? (
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={profilePicture || 'https://via.placeholder.com/80'}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="hidden"
                      data-testid="profile-picture-input"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('profile_picture')}</p>
                  {uploadingPicture && <p className="text-xs text-blue-600">Uploading...</p>}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('display_name')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your display name"
                  maxLength={100}
                  data-testid="display-name-input"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || uploadingPicture}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                  data-testid="save-profile-button"
                >
                  {saving ? t('saving') : t('save_profile')}
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setDisplayName(user?.name || '');
                    setProfilePicture(user?.picture || '');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <img
                  src={user?.picture || 'https://via.placeholder.com/60'}
                  alt={user?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('member_since')}: {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('notification_preferences')}</h2>
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
                  <span>{t('saved')}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{saving ? t('saving') : t('save_changes')}</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">{t('testing_mode')}</p>
                <p>{t('notifications_simulated')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{t('email_notifications')}</p>
                  <p className="text-sm text-gray-600">{t('receive_updates_email')}</p>
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
                  <p className="font-medium text-gray-900">{t('push_notifications')}</p>
                  <p className="text-sm text-gray-600">{t('browser_notifications')}</p>
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
                  <p className="font-medium text-gray-900">{t('new_group_events')}</p>
                  <p className="text-sm text-gray-600">{t('notify_events_created')}</p>
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
                  <p className="font-medium text-gray-900">{t('group_updates')}</p>
                  <p className="text-sm text-gray-600">{t('notify_announcements')}</p>
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
                  <p className="font-medium text-gray-900">{t('nearby_trash_reports')}</p>
                  <p className="text-sm text-gray-600">{t('notify_trash_near')}</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('recent_notifications')}</h2>
          
          {mockNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{t('no_notifications_yet')}</p>
              <p className="text-sm mt-1">{t('notifications_appear_here')}</p>
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
