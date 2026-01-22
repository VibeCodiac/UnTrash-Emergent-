import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import { MapPin, X, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import L from 'leaflet';
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

function MapView({ user }) {
  const navigate = useNavigate();
  const [trashReports, setTrashReports] = useState([]);
  const [cleanedAreas, setCleanedAreas] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Berlin center coordinates
  const berlinCenter = [52.520008, 13.404954];

  useEffect(() => {
    loadTrashReports();
    loadCleanedAreas();
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
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to report trash. Please try again.' });
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
      setMessage({ 
        type: 'success', 
        text: `Trash collected! +${points} points ${ai_verified ? '(AI verified ✓)' : ''}` 
      });
      setShowCollectModal(false);
      setSelectedReport(null);
      loadTrashReports();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to collect trash.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">UnTrash Berlin - Map</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            data-testid="open-report-modal-button"
          >
            Report Trash
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
      const sigResponse = await axios.get(`${API}/cloudinary/signature?resource_type=image&folder=untrash/reports`, {
        withCredentials: true
      });
      const { signature, timestamp, cloud_name, api_key, folder } = sigResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
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
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="report-trash-modal">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
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
              placeholder="Latitude"
              value={location.lat}
              onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              data-testid="report-lat-input"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
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
      const sigResponse = await axios.get(`${API}/cloudinary/signature?resource_type=image&folder=untrash/collections`, {
        withCredentials: true
      });
      const { signature, timestamp, cloud_name, api_key, folder } = sigResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
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
      alert('Failed to upload proof image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="collect-trash-modal">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
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