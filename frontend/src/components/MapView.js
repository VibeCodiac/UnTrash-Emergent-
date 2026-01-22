import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { MapPin, X, Upload, Loader, CheckCircle, AlertCircle, Layers, Trash2, Sparkles, Share2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for trash
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom green marker for collected
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Heat map layer component
function HeatMapLayer({ data, show }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!show) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Create heat points
    const heatPoints = data.map(point => [point.lat, point.lng, point.intensity || 0.5]);

    // Remove old layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create new heat layer
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 35,
      maxZoom: 13,
      max: 1.0,
      gradient: {
        0.0: 'green',
        0.5: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, data, show]);

  return null;
}

function MapView({ user }) {
  const navigate = useNavigate();
  const [trashReports, setTrashReports] = useState([]);
  const [cleanedAreas, setCleanedAreas] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCleanAreaModal, setShowCleanAreaModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapData, setHeatMapData] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastCollectionPoints, setLastCollectionPoints] = useState(0);

  // Berlin center coordinates
  const berlinCenter = [52.520008, 13.404954];

  useEffect(() => {
    loadTrashReports();
    loadCleanedAreas();
    loadHeatMapData();
  }, []);

  const loadTrashReports = async () => {
    try {
      const response = await axios.get(`${API}/trash/list`, {
        withCredentials: true
      });
      setTrashReports(response.data);
    } catch (error) {
      console.error('Error loading trash reports:', error);
    }
  };

  const loadCleanedAreas = async () => {
    try {
      const response = await axios.get(`${API}/areas/active`, {
        withCredentials: true
      });
      setCleanedAreas(response.data);
    } catch (error) {
      console.error('Error loading cleaned areas:', error);
    }
  };

  const loadHeatMapData = async () => {
    try {
      const response = await axios.get(`${API}/heatmap/data`, {
        withCredentials: true
      });
      const combined = [
        ...response.data.trash_points,
        ...response.data.clean_areas
      ];
      setHeatMapData(combined);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    }
  };

  const handleReportTrash = async (data) => {
    setLoading(true);
    setMessage(null);
    try {
      await axios.post(`${API}/trash/report`, data, {
        withCredentials: true
      });
      setMessage({ type: 'success', text: 'Trash reported successfully! +10 points' });
      setShowReportModal(false);
      loadTrashReports();
      loadHeatMapData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to report trash. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanArea = async (data) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post(`${API}/areas/clean`, data, {
        withCredentials: true
      });
      setMessage({ type: 'success', text: `Area cleaned! +${response.data.points_awarded} points` });
      setShowCleanAreaModal(false);
      loadCleanedAreas();
      loadHeatMapData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to mark area as cleaned.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectTrash = async (reportId, proofImageUrl) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post(`${API}/trash/collect/${reportId}`, {
        proof_image_url: proofImageUrl
      }, {
        withCredentials: true
      });
      const { points, ai_verified } = response.data;
      setLastCollectionPoints(points);
      setMessage({ 
        type: 'success', 
        text: `Trash collected! +${points} points ${ai_verified ? '(AI verified ✓)' : ''}` 
      });
      setShowCollectModal(false);
      setSelectedReport(null);
      setShowShareModal(true); // Show share modal after successful collection
      loadTrashReports();
      loadHeatMapData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to collect trash.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCleanedArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to delete this cleaned area?')) return;
    
    try {
      await axios.delete(`${API}/admin/areas/${areaId}`, {
        withCredentials: true
      });
      setMessage({ type: 'success', text: 'Cleaned area deleted successfully' });
      loadCleanedAreas();
      loadHeatMapData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete area' });
    }
  };

  const handleDeleteTrashReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this trash report? Points will be deducted from the users.')) return;
    
    try {
      await axios.delete(`${API}/admin/trash/${reportId}`, {
        withCredentials: true
      });
      setMessage({ type: 'success', text: 'Trash report deleted successfully' });
      loadTrashReports();
      loadHeatMapData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete report' });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">UnTrash Berlin - Map</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showHeatMap 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="toggle-heatmap-button"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Heat Map</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            data-testid="open-report-modal-button"
          >
            <Trash2 className="w-4 h-4" />
            <span>Report Trash</span>
          </button>
          <button
            onClick={() => setShowCleanAreaModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            data-testid="open-clean-area-button"
          >
            <Sparkles className="w-4 h-4" />
            <span>Clean Area</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 z-10 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span data-testid="message-banner">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-600 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={berlinCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          data-testid="map-container"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Heat map layer */}
          <HeatMapLayer data={heatMapData} show={showHeatMap} />

          {/* Trash markers */}
          {trashReports.map((report) => (
            <Marker
              key={report.report_id}
              position={[report.location.lat, report.location.lng]}
              icon={report.status === 'collected' ? greenIcon : redIcon}
            >
              <Popup>
                <div className="p-2">
                  <img src={report.image_url} alt="Trash" className="w-40 h-40 object-cover rounded mb-2" />
                  <p className="text-sm font-semibold mb-1">
                    Status: <span className={report.status === 'collected' ? 'text-green-600' : 'text-red-600'}>
                      {report.status}
                    </span>
                  </p>
                  {report.location.address && (
                    <p className="text-xs text-gray-600 mb-2">{report.location.address}</p>
                  )}
                  {report.status === 'reported' && (
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowCollectModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 w-full"
                      data-testid="collect-trash-popup-button"
                    >
                      Collect This Trash
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Cleaned area polygons */}
          {cleanedAreas.map((area) => (
            <Polygon
              key={area.area_id}
              positions={area.polygon_coords}
              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="p-2">
                  <p className="text-sm font-semibold text-green-600 mb-1">Cleaned Area</p>
                  <p className="text-xs text-gray-600">Size: {Math.round(area.area_size)} m²</p>
                  <p className="text-xs text-gray-600">Points: {area.points_awarded}</p>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportTrashModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportTrash}
          loading={loading}
        />
      )}

      {/* Clean Area Modal */}
      {showCleanAreaModal && (
        <CleanAreaModal
          onClose={() => setShowCleanAreaModal(false)}
          onSubmit={handleCleanArea}
          loading={loading}
        />
      )}

      {/* Collect Modal */}
      {showCollectModal && selectedReport && (
        <CollectTrashModal
          report={selectedReport}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedReport(null);
          }}
          onSubmit={handleCollectTrash}
          loading={loading}
        />
      )}

      {/* Share Success Modal */}
      {showShareModal && (
        <ShareSuccessModal
          points={lastCollectionPoints}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

function ShareSuccessModal({ points, onClose }) {
  const [shareStatus, setShareStatus] = useState(null);

  const handleShare = async () => {
    const shareData = {
      title: 'UnTrash Berlin - I Made a Difference!',
      text: `🌱 I just collected trash in Berlin and earned ${points} points on UnTrash Berlin! Join me in making our city cleaner! 🗑️♻️`,
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
      setTimeout(() => {
        setShareStatus(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="share-success-modal">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Awesome!</h2>
        <p className="text-lg text-gray-700 mb-4">You earned <span className="font-bold text-green-600">+{points} points</span></p>
        <p className="text-gray-600 mb-6">Share your achievement with friends!</p>
        
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
            data-testid="share-achievement-button"
          >
            {shareStatus === 'shared' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Shared!</span>
              </>
            ) : shareStatus === 'copied' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                <span>Share My Achievement</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportTrashModal({ onClose, onSubmit, loading }) {
  const [location, setLocation] = useState({ lat: 52.520008, lng: 13.404954, address: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash'); // Your unsigned upload preset
      formData.append('folder', 'untrash/reports');

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/dx9sbx0lc/image/upload`,
        formData
      );

      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(image);
      await onSubmit({
        location,
        image_url: imageUrl,
        thumbnail_url: imageUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="report-trash-modal">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Report Trash</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="number"
              step="any"
              placeholder="Latitude (e.g., 52.520008)"
              value={location.lat}
              onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              data-testid="report-lat-input"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude (e.g., 13.404954)"
              value={location.lng}
              onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              data-testid="report-lng-input"
              required
            />
            <input
              type="text"
              placeholder="Address (optional)"
              value={location.address}
              onChange={(e) => setLocation({ ...location, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="report-address-input"
            />
            <p className="text-xs text-gray-500 mt-1">💡 Tip: Right-click on the map to get coordinates</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo of Trash</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
              data-testid="report-image-input"
              required
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || loading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              data-testid="submit-report-button"
            >
              {(uploading || loading) ? (
                <><Loader className="w-5 h-5 animate-spin mr-2" /> Uploading...</>
              ) : (
                'Report Trash'
              )}
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

function CleanAreaModal({ onClose, onSubmit, loading }) {
  const [centerLocation, setCenterLocation] = useState({ lat: 52.520008, lng: 13.404954 });
  const [areaSize, setAreaSize] = useState(500);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash'); // Your unsigned upload preset
      formData.append('folder', 'untrash/cleanings');

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/dx9sbx0lc/image/upload`,
        formData
      );

      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const generatePolygon = (center, size) => {
    // Create a square polygon around center point
    const offset = Math.sqrt(size) / 111000; // Rough conversion to degrees
    return [
      [center.lat + offset, center.lng - offset],
      [center.lat + offset, center.lng + offset],
      [center.lat - offset, center.lng + offset],
      [center.lat - offset, center.lng - offset]
    ];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert('Please upload a photo of the cleaned area');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(image);
      await onSubmit({
        center_location: centerLocation,
        polygon_coords: generatePolygon(centerLocation, areaSize),
        area_size: areaSize,
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="clean-area-modal">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Mark Area as Cleaned</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Center Location</label>
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={centerLocation.lat}
              onChange={(e) => setCenterLocation({ ...centerLocation, lat: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={centerLocation.lng}
              onChange={(e) => setCenterLocation({ ...centerLocation, lng: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area Size: {areaSize} m² (Points: {Math.max(25, Math.floor(areaSize / 100 * 5))})
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={areaSize}
              onChange={(e) => setAreaSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo of Cleaned Area</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
              required
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
            >
              {(uploading || loading) ? (
                <><Loader className="w-5 h-5 animate-spin mr-2" /> Processing...</>
              ) : (
                'Mark as Cleaned'
              )}
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

function CollectTrashModal({ report, onClose, onSubmit, loading }) {
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'UnTrash'); // Your unsigned upload preset
      formData.append('folder', 'untrash/collections');

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/dx9sbx0lc/image/upload`,
        formData
      );

      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofImage) {
      alert('Please upload proof photo');
      return;
    }

    setUploading(true);
    try {
      const proofUrl = await uploadToCloudinary(proofImage);
      await onSubmit(report.report_id, proofUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload proof image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="collect-trash-modal">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Collect Trash</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Original report:</p>
          <img src={report.image_url} alt="Original trash" className="w-full h-48 object-cover rounded-lg" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proof Photo (after cleaning)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
              data-testid="collect-proof-image-input"
              required
            />
            {proofPreview && (
              <img src={proofPreview} alt="Proof" className="mt-2 w-full h-48 object-cover rounded-lg" />
            )}
          </div>

          <p className="text-sm text-gray-600">
            💡 Upload a photo showing the area is now clean. AI will verify your collection!
          </p>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              data-testid="submit-collect-button"
            >
              {(uploading || loading) ? (
                <><Loader className="w-5 h-5 animate-spin mr-2" /> Processing...</>
              ) : (
                'Collect Trash'
              )}
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

export default MapView;
