import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Trash2, AlertCircle, Ban, CheckCircle, Bell, ImageIcon, MapPin, RotateCcw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [trashReports, setTrashReports] = useState([]);
  const [pendingAreas, setPendingAreas] = useState([]);
  const [pendingCollections, setPendingCollections] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ pending_collections: 0, pending_areas: 0, total_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [resetPointsModal, setResetPointsModal] = useState(null);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [usersRes, trashRes, areasRes, collectionsRes, countsRes] = await Promise.all([
        axios.get(`${API}/admin/users?limit=100`, { withCredentials: true }),
        axios.get(`${API}/trash/list?limit=100&include_test=true`, { withCredentials: true }),
        axios.get(`${API}/admin/areas/pending`, { withCredentials: true }),
        axios.get(`${API}/admin/collections/pending`, { withCredentials: true }),
        axios.get(`${API}/admin/pending-count`, { withCredentials: true })
      ]);
      setUsers(usersRes.data);
      setTrashReports(trashRes.data);
      setPendingAreas(areasRes.data);
      setPendingCollections(collectionsRes.data);
      setPendingCounts(countsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user? They will be logged out immediately.')) return;
    try {
      await axios.post(`${API}/admin/users/${userId}/ban`, {}, { withCredentials: true });
      setMessage({ type: 'success', text: 'User banned successfully' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to ban user' });
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/unban`, {}, { withCredentials: true });
      setMessage({ type: 'success', text: 'User unbanned successfully' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unban user' });
    }
  };

  const handleResetPoints = async (userId, data) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/reset-points`, data, { withCredentials: true });
      setMessage({ type: 'success', text: 'User points reset successfully' });
      setResetPointsModal(null);
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset points' });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? Points will be deducted from the reporter and collector.')) return;
    try {
      const response = await axios.delete(`${API}/admin/trash/${reportId}`, { withCredentials: true });
      const deductions = response.data.points_deducted?.join(', ') || 'None';
      setMessage({ type: 'success', text: `Report deleted. Points deducted: ${deductions}` });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete report' });
    }
  };

  const handleApproveArea = async (areaId) => {
    try {
      const response = await axios.post(`${API}/admin/areas/${areaId}/approve`, {}, { withCredentials: true });
      setMessage({ type: 'success', text: `Area approved! ${response.data.points} points awarded` });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve area' });
    }
  };

  const handleRejectArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to reject this area cleaning?')) return;
    try {
      await axios.delete(`${API}/admin/areas/${areaId}`, { withCredentials: true });
      setMessage({ type: 'success', text: 'Area cleaning rejected' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject area' });
    }
  };

  const handleApproveCollection = async (reportId) => {
    try {
      const response = await axios.post(`${API}/admin/collections/${reportId}/approve`, {}, { withCredentials: true });
      setMessage({ type: 'success', text: `Collection approved! ${response.data.points} points awarded` });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve collection' });
    }
  };

  const handleRejectCollection = async (reportId) => {
    if (!window.confirm('Are you sure you want to reject this collection? The report will revert to "reported" status.')) return;
    try {
      await axios.delete(`${API}/admin/collections/${reportId}`, { withCredentials: true });
      setMessage({ type: 'success', text: 'Collection rejected - report reverted to reported status' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject collection' });
    }
  };

  if (!user?.is_admin) {
    return null;
  }

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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            </div>
          </div>
          
          {/* Pending Notification Badge */}
          {pendingCounts.total_pending > 0 && (
            <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg" data-testid="pending-notification">
              <Bell className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">{pendingCounts.total_pending} Pending Verifications</span>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto text-sm underline">Dismiss</button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'pending' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-pending"
          >
            <Bell className="w-4 h-4" />
            <span>Pending Verifications</span>
            {pendingCounts.total_pending > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'pending' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
              }`}>
                {pendingCounts.total_pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'users' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-users"
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'reports' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-reports"
          >
            <Trash2 className="w-4 h-4" />
            <span>All Reports</span>
          </button>
        </div>

        {/* Pending Verifications Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {/* Pending Collections */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <ImageIcon className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending Trash Collections
                  {pendingCollections.length > 0 && (
                    <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {pendingCollections.length} awaiting review
                    </span>
                  )}
                </h2>
              </div>
              
              {pendingCollections.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending trash collections to verify</p>
              ) : (
                <div className="space-y-4">
                  {pendingCollections.map((collection) => (
                    <div key={collection.report_id} className="p-4 bg-orange-50 rounded-lg border border-orange-200" data-testid="pending-collection">
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-4">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Before (Reported)</p>
                              <img src={collection.image_url} alt="Before" className="w-24 h-24 object-cover rounded border" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">After (Collected)</p>
                              <img src={collection.collection_image_url} alt="After" className="w-24 h-24 object-cover rounded border" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="font-semibold text-gray-900">Trash Collection - Awaiting Verification</p>
                            <p className="text-sm text-gray-600">
                              Collector: {collection.collector_name} ({collection.collector_email})
                            </p>
                            <p className="text-sm text-gray-600">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {collection.location?.lat?.toFixed(4)}, {collection.location?.lng?.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Collected: {new Date(collection.collected_at).toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${collection.ai_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                AI: {collection.ai_verified ? 'Verified Clean' : 'Needs Review'}
                              </span>
                              <span className="text-sm font-semibold text-green-600">
                                Points to award: {collection.points_awarded}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveCollection(collection.report_id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                            data-testid={`approve-collection-${collection.report_id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectCollection(collection.report_id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                            data-testid={`reject-collection-${collection.report_id}`}
                          >
                            <Ban className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Area Cleanings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending Area Cleanings
                  {pendingAreas.length > 0 && (
                    <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      {pendingAreas.length} awaiting review
                    </span>
                  )}
                </h2>
              </div>
              
              {pendingAreas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending area cleanings to verify</p>
              ) : (
                <div className="space-y-4">
                  {pendingAreas.map((area) => (
                    <div key={area.area_id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200" data-testid="pending-area">
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-3">
                          <img src={area.image_url} alt="Cleaned area" className="w-24 h-24 object-cover rounded" />
                          <div>
                            <p className="font-semibold text-gray-900">Area Cleaning - Awaiting Approval</p>
                            <p className="text-sm text-gray-600">
                              User: {area.user_name} ({area.user_email})
                            </p>
                            <p className="text-sm text-gray-600">
                              Size: {Math.round(area.area_size)} m²
                            </p>
                            <p className="text-sm text-gray-600">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {area.center_location?.lat?.toFixed(4)}, {area.center_location?.lng?.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date(area.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              Points to award: {area.points_awarded}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveArea(area.area_id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                            data-testid={`approve-area-${area.area_id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectArea(area.area_id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                            data-testid={`reject-area-${area.area_id}`}
                          >
                            <Ban className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">User Management ({users.length} users)</h2>
            </div>
            
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.user_id} className={`p-4 rounded-lg border ${u.is_banned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`} data-testid="user-row">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {u.picture && <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full" />}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {u.name}
                          {u.is_admin && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded ml-2">ADMIN</span>}
                          {u.is_banned && <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded ml-2">BANNED</span>}
                        </p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-xs text-gray-500">
                          Points: {u.total_points || 0} (Monthly: {u.monthly_points || 0}, Weekly: {u.weekly_points || 0}) | Groups: {u.joined_groups?.length || 0}
                        </p>
                      </div>
                    </div>
                    {!u.is_admin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setResetPointsModal(u)}
                          className="flex items-center space-x-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          data-testid={`reset-points-${u.user_id}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Points</span>
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(u.user_id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            data-testid={`unban-${u.user_id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(u.user_id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            data-testid={`ban-${u.user_id}`}
                          >
                            <Ban className="w-4 h-4" />
                            <span>Ban</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Trash2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">All Trash Reports ({trashReports.length})</h2>
            </div>
            
            <div className="space-y-3">
              {trashReports.map((report) => (
                <div key={report.report_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200" data-testid="report-row">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-3">
                      <img src={report.image_url} alt="Trash" className="w-20 h-20 object-cover rounded" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`font-semibold ${report.status === 'collected' ? 'text-green-600' : 'text-red-600'}`}>
                            Status: {report.status}
                          </p>
                          {report.status === 'collected' && (
                            <span className={`text-xs px-2 py-1 rounded ${report.admin_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {report.admin_verified ? 'Verified' : 'Pending Verification'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Location: {report.location?.lat?.toFixed(4)}, {report.location?.lng?.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Reported: {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        {report.collected_at && (
                          <p className="text-xs text-gray-500">
                            Collected: {new Date(report.collected_at).toLocaleDateString()}
                          </p>
                        )}
                        {report.points_given && (
                          <p className="text-xs text-green-600">Points awarded: {report.points_awarded}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.report_id)}
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      data-testid={`delete-report-${report.report_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
