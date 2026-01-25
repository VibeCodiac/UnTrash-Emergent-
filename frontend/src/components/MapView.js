import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { MapPin, X, Upload, Loader, CheckCircle, AlertCircle, Layers, Trash2, Sparkles, Share2, Camera, Package } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom blue marker for trash (trash bag icon)
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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
  const location = useLocation();
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
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [openCameraOnMount, setOpenCameraOnMount] = useState(false);

  // Berlin center coordinates
  const berlinCenter = [52.520008, 13.404954];

  useEffect(() => {
    loadTrashReports();
    loadCleanedAreas();
    loadHeatMapData();
    
    // Check if navigated from dashboard with camera action
    if (location.state?.openCamera || location.state?.action === 'report') {
      setOpenCameraOnMount(true);
      setShowReportModal(true);
    }
  }, [location.state]);

  // Get user's current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      setGettingLocation(true);
      setLocationError(null);
      
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        setGettingLocation(false);
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(location);
          setGettingLocation(false);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred getting your location.';
          }
          setLocationError(errorMessage);
          setGettingLocation(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

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
      setMessage({ type: 'success', text: 'Trash reported successfully! It will appear on the map for others to collect.' });
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
      await axios.post(`${API}/areas/clean`, data, {
        withCredentials: true
      });
      setMessage({ type: 'success', text: 'Area cleaning submitted! Awaiting admin verification for points.' });
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
      const { points_pending } = response.data;
      setLastCollectionPoints(points_pending);
      setMessage({ 
        type: 'success', 
        text: 'Trash collected! Awaiting admin verification for points.' 
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
      {/* Header - Mobile Responsive */}
      <div className="bg-white shadow-lg p-2 md:p-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          <h1 className="text-base md:text-xl font-bold text-gray-900 hidden sm:block">UnTrash Berlin</h1>
          <h1 className="text-base font-bold text-gray-900 sm:hidden">Map</h1>
        </div>
        <div className="flex items-center space-x-1 md:space-x-3">
          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg transition-colors ${
              showHeatMap 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="toggle-heatmap-button"
            title="Toggle Heat Map"
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs md:text-sm font-medium hidden sm:inline">Heat Map</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-1 md:space-x-2 bg-blue-600 text-white px-2 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            data-testid="open-report-modal-button"
            title="Report Trash"
          >
            <Package className="w-4 h-4" />
            <span className="text-xs md:text-sm hidden sm:inline">Report</span>
          </button>
          <button
            onClick={() => setShowCleanAreaModal(true)}
            className="flex items-center space-x-1 md:space-x-2 bg-green-600 text-white px-2 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            data-testid="open-clean-area-button"
            title="Clean Area"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs md:text-sm hidden sm:inline">Clean</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-2 md:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs md:text-sm"
            title="Back to Dashboard"
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-2 md:p-4 z-10 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
              <span data-testid="message-banner" className="text-sm md:text-base">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-600 hover:text-gray-800">
              <X className="w-4 h-4 md:w-5 md:h-5" />
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
              icon={report.status === 'collected' ? greenIcon : blueIcon}
            >
              <Popup>
                <div className="p-2">
                  <img src={report.image_url} alt="Trash" className="w-40 h-40 object-cover rounded mb-2" />
                  <p className="text-sm font-semibold mb-1">
                    Status: <span className={report.status === 'collected' ? 'text-green-600' : 'text-blue-600'}>
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
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 w-full"
                      data-testid="collect-trash-popup-button"
                    >
                      Collect This Trash
                    </button>
                  )}
                  {user?.is_admin && (
                    <button
                      onClick={() => handleDeleteTrashReport(report.report_id)}
                      className="mt-2 w-full flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      data-testid={`delete-report-${report.report_id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Report</span>
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
                  {user?.is_admin && (
                    <button
                      onClick={() => handleDeleteCleanedArea(area.area_id)}
                      className="mt-2 w-full flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      data-testid={`delete-area-${area.area_id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Area</span>
                    </button>
                  )}
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>

        {/* Floating Report Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="absolute bottom-6 right-6 z-[1000] w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 flex items-center justify-center"
          data-testid="floating-report-button"
          title="Report Trash"
        >
          <Package className="w-8 h-8" />
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportTrashModal
          onClose={() => {
            setShowReportModal(false);
            setOpenCameraOnMount(false);
          }}
          onSubmit={handleReportTrash}
          loading={loading}
          getCurrentLocation={getCurrentLocation}
          userLocation={userLocation}
          locationError={locationError}
          gettingLocation={gettingLocation}
          autoOpenCamera={openCameraOnMount}
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

function ReportTrashModal({ onClose, onSubmit, loading, getCurrentLocation, userLocation, locationError, gettingLocation, autoOpenCamera }) {
  const [location, setLocation] = useState(userLocation || { lat: 52.520008, lng: 13.404954, address: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [locationStatus, setLocationStatus] = useState(userLocation ? 'found' : 'pending');
  const fileInputRef = useRef(null);

  // Auto-get location when modal opens
  useEffect(() => {
    if (!userLocation) {
      handleGetLocation();
    }
    
    // Auto-trigger camera if coming from dashboard
    if (autoOpenCamera && fileInputRef.current) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 500);
    }
  }, [autoOpenCamera]);

  const handleGetLocation = async () => {
    setLocationStatus('getting');
    try {
      const loc = await getCurrentLocation();
      setLocation({ lat: loc.lat, lng: loc.lng, address: '', accuracy: loc.accuracy });
      setLocationStatus('found');
    } catch (error) {
      setLocationStatus('error');
    }
  };

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
        CLOUDINARY_UPLOAD_URL,
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
    if (locationStatus !== 'found') {
      alert('Please get your location first');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in" data-testid="report-trash-modal">
      <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in pb-safe">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Report Trash</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
            
            {locationStatus === 'getting' && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Getting your location...</span>
              </div>
            )}
            
            {locationStatus === 'found' && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Location found!</span>
                </div>
                <p className="text-xs text-gray-600">
                  Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                </p>
              </div>
            )}
            
            {locationStatus === 'error' && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Location Error</span>
                </div>
                <p className="text-xs text-red-600 mb-2">{locationError}</p>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {locationStatus === 'pending' && (
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span>Get My Location</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo of Trash</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
              data-testid="report-image-input"
              id="report-image-input"
              required
            />
            {!imagePreview ? (
              <label
                htmlFor="report-image-input"
                className="flex items-center justify-center space-x-2 w-full p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Camera className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-blue-600">Take Photo</span>
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <label
                  htmlFor="report-image-input"
                  className="absolute bottom-2 right-2 flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Retake</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || loading || locationStatus !== 'found'}
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
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [locationError, setLocationError] = useState(null);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      setLocationStatus('error');
      return;
    }

    setGettingLocation(true);
    setLocationError(null);
    setLocationStatus('getting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenterLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('found');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Could not get your location. Please enter manually.');
        setLocationStatus('error');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Auto-get location when modal opens
  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

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
      formData.append('upload_preset', 'UnTrash');
      formData.append('folder', 'untrash/cleanings');

      const uploadResponse = await axios.post(
        CLOUDINARY_UPLOAD_URL,
        formData
      );

      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const generatePolygon = (center, size) => {
    const offset = Math.sqrt(size) / 111000;
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
          {/* Location with GPS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
            
            {/* Location Status */}
            <div className="mb-3 p-3 rounded-lg bg-gray-50">
              {locationStatus === 'getting' && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Getting your location...</span>
                </div>
              )}
              {locationStatus === 'found' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Location found!</span>
                </div>
              )}
              {locationStatus === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{locationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}
              {locationStatus === 'pending' && (
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Get My Location</span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-2">Coordinates: {centerLocation.lat.toFixed(6)}, {centerLocation.lng.toFixed(6)}</p>
            
            <div className="flex space-x-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={centerLocation.lat}
                onChange={(e) => setCenterLocation({ ...centerLocation, lat: parseFloat(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={centerLocation.lng}
                onChange={(e) => setCenterLocation({ ...centerLocation, lng: parseFloat(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area Size: {areaSize} m² (Points: {Math.max(5, Math.floor(areaSize / 100 * 1))})
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
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
              id="clean-area-image-input"
              required
            />
            {!imagePreview ? (
              <label
                htmlFor="clean-area-image-input"
                className="flex items-center justify-center space-x-2 w-full p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              >
                <Camera className="w-6 h-6 text-green-600" />
                <span className="font-medium text-green-600">Take Photo</span>
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <label
                  htmlFor="clean-area-image-input"
                  className="absolute bottom-2 right-2 flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Retake</span>
                </label>
              </div>
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
        CLOUDINARY_UPLOAD_URL,
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
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
              data-testid="collect-proof-image-input"
              id="collect-proof-image-input"
              required
            />
            {!proofPreview ? (
              <label
                htmlFor="collect-proof-image-input"
                className="flex items-center justify-center space-x-2 w-full p-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              >
                <Camera className="w-6 h-6 text-green-600" />
                <span className="font-medium text-green-600">Take Photo</span>
              </label>
            ) : (
              <div className="relative">
                <img src={proofPreview} alt="Proof" className="w-full h-48 object-cover rounded-lg" />
                <label
                  htmlFor="collect-proof-image-input"
                  className="absolute bottom-2 right-2 flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Retake</span>
                </label>
              </div>
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
