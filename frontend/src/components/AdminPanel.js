import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Trash2, AlertCircle, Ban, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [trashReports, setTrashReports] = useState([]);
  const [pendingAreas, setPendingAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [usersRes, trashRes, areasRes] = await Promise.all([
        axios.get(`${API}/admin/users?limit=100`, { withCredentials: true }),
        axios.get(`${API}/trash/list?limit=100`, { withCredentials: true }),
        axios.get(`${API}/admin/areas/pending`, { withCredentials: true })
      ]);
      setUsers(usersRes.data);
      setTrashReports(trashRes.data);
      setPendingAreas(areasRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;
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

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`${API}/admin/trash/${reportId}`, { withCredentials: true });
      setMessage({ type: 'success', text: 'Report deleted successfully' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete report' });
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
        <div className="mb-8 flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Users Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          </div>
          
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.user_id} className={`p-4 rounded-lg border ${u.is_banned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {u.picture && <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full" />}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {u.name} {u.is_admin && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded ml-2">ADMIN</span>}
                        {u.is_banned && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded ml-2">BANNED</span>}
                      </p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-xs text-gray-500">Points: {u.total_points || 0} | Groups: {u.joined_groups?.length || 0}</p>
                    </div>
                  </div>
                  {!u.is_admin && (
                    <div className="flex space-x-2">
                      {u.is_banned ? (
                        <button
                          onClick={() => handleUnbanUser(u.user_id)}
                          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Unban</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(u.user_id)}
                          className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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

        {/* Trash Reports Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Trash Reports Management</h2>
          </div>
          
          <div className="space-y-3">
            {trashReports.map((report) => (
              <div key={report.report_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3">
                    <img src={report.image_url} alt="Trash" className="w-20 h-20 object-cover rounded" />
                    <div>
                      <p className={`font-semibold ${report.status === 'collected' ? 'text-green-600' : 'text-red-600'}`}>
                        Status: {report.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                      </p>
                      {report.location.address && (
                        <p className="text-sm text-gray-600">{report.location.address}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Reported: {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      {report.collected_at && (
                        <p className="text-xs text-gray-500">
                          Collected: {new Date(report.collected_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.report_id)}
                    className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
