import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, Calendar, MapPin, ArrowLeft, X, Trash2, Camera, Link, MessageCircle, Edit2, ExternalLink } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

function Groups({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  // Handle navigation state to open specific group
  useEffect(() => {
    if (location.state?.openGroupId && groups.length > 0) {
      const group = groups.find(g => g.group_id === location.state.openGroupId);
      if (group) {
        setSelectedGroup(group);
      }
    }
  }, [location.state, groups]);

  const loadGroups = async () => {
    try {
      const response = await axios.get(`${API}/groups`, {
        withCredentials: true
      });
      setGroups(response.data);
      const userGroupIds = user?.joined_groups || [];
      setMyGroups(response.data.filter(g => userGroupIds.includes(g.group_id)));
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    setLoading(true);
    try {
      await axios.post(`${API}/groups`, groupData, {
        withCredentials: true
      });
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/groups/${groupId}/join`, {}, {
        withCredentials: true
      });
      loadGroups();
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    setLoading(true);
    try {
      await axios.post(`${API}/groups/${groupId}/leave`, {}, {
        withCredentials: true
      });
      loadGroups();
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to DELETE this group? This will remove all members and events. This action cannot be undone.')) return;
    setLoading(true);
    try {
      await axios.delete(`${API}/groups/${groupId}`, {
        withCredentials: true
      });
      loadGroups();
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const isGroupOwner = (group) => {
    return group.admin_ids && group.admin_ids[0] === user?.user_id;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Cleanup Groups</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm md:text-base w-full sm:w-auto justify-center"
            data-testid="create-group-button"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>Create Group</span>
          </button>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-4 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">My Groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.group_id}
                  group={group}
                  isMember={true}
                  isOwner={isGroupOwner(group)}
                  onLeave={() => handleLeaveGroup(group.group_id)}
                  onDelete={() => handleDeleteGroup(group.group_id)}
                  onViewDetails={() => setSelectedGroup(group)}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">All Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {groups.filter(g => !(user?.joined_groups || []).includes(g.group_id)).map((group) => (
              <GroupCard
                key={group.group_id}
                group={group}
                isMember={false}
                isOwner={false}
                onJoin={() => handleJoinGroup(group.group_id)}
                onViewDetails={() => setSelectedGroup(group)}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
          loading={loading}
        />
      )}

      {selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          isMember={(user?.joined_groups || []).includes(selectedGroup.group_id)}
          currentUser={user}
          onGroupUpdated={loadGroups}
        />
      )}
    </div>
  );
}

function GroupCard({ group, isMember, isOwner, onJoin, onLeave, onDelete, onViewDetails, onSetPrime, isPrime, loading, latestEvent }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow ${isPrime ? 'ring-2 ring-yellow-400' : ''}`} data-testid="group-card">
      <div className="flex items-center space-x-3 mb-3">
        {group.picture ? (
          <img src={group.picture} alt={group.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{group.name}</h3>
            {isPrime && <span className="text-yellow-500 text-lg">⭐</span>}
            {isOwner && (
              <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">Owner</span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{group.member_ids?.length || 0} members</p>
        </div>
      </div>

      {group.description && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
      )}

      {/* Latest Event Preview */}
      {latestEvent && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2 text-xs text-blue-700">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium truncate">{latestEvent.title}</span>
          </div>
          <p className="text-xs text-blue-600 mt-1 ml-5">
            {new Date(latestEvent.event_date).toLocaleDateString()} at {new Date(latestEvent.event_date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </p>
          {latestEvent.location_name && (
            <p className="text-xs text-gray-500 mt-0.5 ml-5 truncate">
              📍 {latestEvent.location_name}
            </p>
          )}
        </div>
      )}

      {/* External Links */}
      {(group.website_url || group.chat_url) && (
        <div className="flex space-x-2 mb-3">
          {group.website_url && (
            <a
              href={group.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Link className="w-3 h-3" />
              <span>Website</span>
            </a>
          )}
          {group.chat_url && (
            <a
              href={group.chat_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-800"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Chat</span>
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3 text-xs sm:text-sm text-gray-600">
        <span>Points: {group.total_points || 0}</span>
        <span>Weekly: {group.weekly_points || 0}</span>
      </div>

      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
            data-testid="view-group-details-button"
          >
            Details
          </button>
          {isMember && (
            <button
              onClick={onSetPrime}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                isPrime 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isPrime ? 'Remove from dashboard' : 'Set as prime group'}
              data-testid="set-prime-button"
            >
              {isPrime ? '⭐' : '☆'}
            </button>
          )}
        </div>
        {isMember ? (
          isOwner ? (
            <button
              onClick={onDelete}
              disabled={loading}
              className="w-full text-red-600 hover:text-red-700 text-xs py-1 transition-colors disabled:text-gray-400 flex items-center justify-center space-x-1"
              data-testid="delete-group-button"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Group</span>
            </button>
          ) : (
            <button
              onClick={onLeave}
              disabled={loading}
              className="w-full text-red-600 hover:text-red-700 text-xs py-1 transition-colors disabled:text-gray-400"
              data-testid="leave-group-button"
            >
            >
              Leave Group
            </button>
          )
        ) : (
          <button
            onClick={onJoin}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 text-sm"
            data-testid="join-group-button"
          >
            Join Group
          </button>
        )}
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [picture, setPicture] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [chatUrl, setChatUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash');
      formData.append('folder', 'untrash/groups');

      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setPicture(response.data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      name,
      description,
      picture,
      website_url: websiteUrl || null,
      chat_url: chatUrl || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in pb-safe">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Picture (optional)</label>
            <div className="flex items-center space-x-4">
              {picture ? (
                <img src={picture} alt="Group" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 text-sm">
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="group-name-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              data-testid="group-description-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              Website URL (optional)
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourgroup.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Chat/Discord Link (optional)
            </label>
            <input
              type="url"
              value={chatUrl}
              onChange={(e) => setChatUrl(e.target.value)}
              placeholder="https://t.me/yourgroup or discord.gg/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              data-testid="submit-create-group-button"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupDetailsModal({ group, onClose, isMember, currentUser, onGroupUpdated }) {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const isGroupAdmin = group.admin_ids?.includes(currentUser?.user_id);
  const isAppAdmin = currentUser?.is_admin;
  const canDeleteEvents = isGroupAdmin || isAppAdmin;

  useEffect(() => {
    loadEvents();
    loadMembers();
  }, [group.group_id]);

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API}/groups/${group.group_id}/events`, {
        withCredentials: true
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadMembers = async () => {
    if (group.member_ids?.length > 0) {
      try {
        const memberPromises = group.member_ids.slice(0, 10).map(id =>
          axios.get(`${API}/users/${id}`, { withCredentials: true }).catch(() => null)
        );
        const results = await Promise.all(memberPromises);
        setMembers(results.filter(r => r?.data).map(r => r.data));
      } catch (error) {
        console.error('Error loading members:', error);
      }
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await axios.post(`${API}/groups/${group.group_id}/events`, eventData, {
        withCredentials: true
      });
      setShowCreateEvent(false);
      loadEvents();
    } catch (error) {
      alert('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      await axios.put(`${API}/groups/${group.group_id}/events/${editingEvent.event_id}`, eventData, {
        withCredentials: true
      });
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API}/groups/${group.group_id}/events/${eventId}`, {
        withCredentials: true
      });
      loadEvents();
    } catch (error) {
      alert('Failed to delete event');
    }
  };

  const handleUpdateGroup = async (groupData) => {
    try {
      await axios.put(`${API}/groups/${group.group_id}`, groupData, {
        withCredentials: true
      });
      setShowEditGroup(false);
      onGroupUpdated();
      onClose();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update group');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-2xl sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {group.picture ? (
              <img src={group.picture} alt={group.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{group.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{group.member_ids?.length || 0} members</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(isGroupAdmin || isAppAdmin) && (
              <button
                onClick={() => setShowEditGroup(true)}
                className="text-purple-600 hover:text-purple-800 p-2"
                title="Edit Group"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {group.description && (
          <p className="text-sm sm:text-base text-gray-600 mb-4">{group.description}</p>
        )}

        {/* External Links */}
        {(group.website_url || group.chat_url) && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {group.website_url && (
              <a
                href={group.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs sm:text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
            {group.chat_url && (
              <a
                href={group.chat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs sm:text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 p-3 bg-gray-50 rounded-lg">
          <span>Total: <strong>{group.total_points || 0}</strong> pts</span>
          <span>Weekly: <strong>{group.weekly_points || 0}</strong> pts</span>
        </div>

        {/* Members Preview */}
        {members.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Members</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-2 sm:px-3 py-1">
                  <img src={member.picture} alt={member.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                  <span className="text-xs sm:text-sm text-gray-700">{member.name}</span>
                </div>
              ))}
              {group.member_ids?.length > 10 && (
                <span className="text-xs sm:text-sm text-gray-500 px-3 py-1">+{group.member_ids.length - 10} more</span>
              )}
            </div>
          </div>
        )}

        {/* Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            {isMember && (
              <button
                onClick={() => setShowCreateEvent(true)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                data-testid="create-event-button"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.event_id} className="p-3 bg-gray-50 rounded-lg relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.event_date).toLocaleString()}
                        </span>
                        {event.location_name && (
                          <span className="flex items-center text-blue-600">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {/* Edit button - only for event creator */}
                      {currentUser?.user_id === event.created_by && (
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit event"
                          data-testid={`edit-event-${event.event_id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button - for admin, group admin, or creator */}
                      {(canDeleteEvents || currentUser?.user_id === event.created_by) && (
                        <button
                          onClick={() => handleDeleteEvent(event.event_id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete event"
                          data-testid={`delete-event-${event.event_id}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateEvent && (
        <CreateEventForm
          onClose={() => setShowCreateEvent(false)}
          onCreate={handleCreateEvent}
        />
      )}

      {editingEvent && (
        <EditEventForm
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdate={handleUpdateEvent}
        />
      )}

      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
          onUpdate={handleUpdateGroup}
        />
      )}
    </div>
  );
}

function CreateEventForm({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [locationName, setLocationName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      event_date: new Date(eventDate).toISOString(),
      location_name: locationName
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-scale-in pb-safe">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Create Event</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Mauerpark, Alexanderplatz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventForm({ event, onClose, onUpdate }) {
  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [eventDate, setEventDate] = useState(
    event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : ''
  );
  const [locationName, setLocationName] = useState(event.location_name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      title,
      description,
      event_date: new Date(eventDate).toISOString(),
      location_name: locationName
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-scale-in pb-safe">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Edit Event</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Mauerpark, Alexanderplatz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditGroupModal({ group, onClose, onUpdate }) {
  const [name, setName] = useState(group.name || '');
  const [description, setDescription] = useState(group.description || '');
  const [picture, setPicture] = useState(group.picture || '');
  const [websiteUrl, setWebsiteUrl] = useState(group.website_url || '');
  const [chatUrl, setChatUrl] = useState(group.chat_url || '');
  const [uploading, setUploading] = useState(false);

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash');
      formData.append('folder', 'untrash/groups');

      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setPicture(response.data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      name,
      description,
      picture,
      website_url: websiteUrl || null,
      chat_url: chatUrl || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-scale-in pb-safe">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Edit Group</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Picture</label>
            <div className="flex items-center space-x-4">
              {picture ? (
                <img src={picture} alt="Group" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 text-sm">
                {uploading ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Link className="w-4 h-4 inline mr-1" />
              Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourgroup.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Chat/Discord Link
            </label>
            <input
              type="url"
              value={chatUrl}
              onChange={(e) => setChatUrl(e.target.value)}
              placeholder="https://t.me/yourgroup"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm disabled:bg-gray-400"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Groups;
