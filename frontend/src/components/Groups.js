import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Calendar, MapPin, ArrowLeft, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Groups({ user }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

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

  const handleCreateGroup = async (name, description) => {
    setLoading(true);
    try {
      await axios.post(`${API}/groups`, { name, description }, {
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
      window.location.reload(); // Reload to update user's groups
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
      alert('Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Cleanup Groups</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            data-testid="create-group-button"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Groups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.group_id}
                  group={group}
                  isMember={true}
                  onLeave={() => handleLeaveGroup(group.group_id)}
                  onViewDetails={() => setSelectedGroup(group)}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Groups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.filter(g => !(user?.joined_groups || []).includes(g.group_id)).map((group) => (
              <GroupCard
                key={group.group_id}
                group={group}
                isMember={false}
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
        />
      )}
    </div>
  );
}

function GroupCard({ group, isMember, onJoin, onLeave, onViewDetails, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow" data-testid="group-card">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
          <p className="text-sm text-gray-600">{group.member_ids?.length || 0} members</p>
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Points: {group.total_points || 0}</span>
        <span className="text-sm text-gray-600">Weekly: {group.weekly_points || 0}</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={onViewDetails}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          View Details
        </button>
        {isMember ? (
          <button
            onClick={onLeave}
            disabled={loading}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 text-sm"
            data-testid="leave-group-button"
          >
            Leave Group
          </button>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(name, description);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
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
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
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

function GroupDetailsModal({ group, onClose, isMember }) {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadGroupDetails();
    loadCurrentUser();
  }, [group.group_id]);

  const loadCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setCurrentUserId(response.data.user_id);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadGroupDetails = async () => {
    try {
      const [eventsRes, membersRes] = await Promise.all([
        axios.get(`${API}/groups/${group.group_id}/events`, { withCredentials: true }),
        axios.get(`${API}/groups/${group.group_id}/members`, { withCredentials: true })
      ]);
      setEvents(eventsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await axios.post(`${API}/groups/${group.group_id}/events`, eventData, {
        withCredentials: true
      });
      setShowCreateEvent(false);
      loadGroupDetails();
    } catch (error) {
      alert('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`${API}/groups/${group.group_id}/events/${eventId}`, {
        withCredentials: true
      });
      loadGroupDetails();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete event');
    }
  };

  const isAdmin = currentUserId && group.admin_ids && group.admin_ids.includes(currentUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {group.description && (
          <p className="text-gray-600 mb-6">{group.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{members.length}</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{group.total_points || 0}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{group.weekly_points || 0}</div>
            <div className="text-sm text-gray-600">Weekly Points</div>
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Members</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                {member.picture && (
                  <img src={member.picture} alt={member.name} className="w-10 h-10 rounded-full" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.total_points || 0} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            {isMember && (
              <button
                onClick={() => setShowCreateEvent(true)}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
              >
                Create Event
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            ) : (
              events.map((event) => (
                <div key={event.event_id} className="p-3 bg-gray-50 rounded-lg relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.event_date).toLocaleString()}
                        </span>
                        {event.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            Location set
                          </span>
                        )}
                      </div>
                    </div>
                    {(isAdmin || currentUserId === event.created_by) && (
                      <button
                        onClick={() => handleDeleteEvent(event.event_id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                        title="Delete event"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showCreateEvent && (
          <CreateEventForm
            onClose={() => setShowCreateEvent(false)}
            onCreate={handleCreateEvent}
          />
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState({ lat: 52.520008, lng: 13.404954 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      event_date: new Date(eventDate).toISOString(),
      location
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Event</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex space-x-2">
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

export default Groups;