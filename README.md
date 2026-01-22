# UnTrash Berlin 🗑️🌱

A Progressive Web App for community-driven cleanup efforts in Berlin. Report litter, collect trash, and compete for medals while making Berlin cleaner!

## 🌟 Features

### Core Functionality
- **Interactive Map**: OpenStreetMap-powered map showing trash reports across Berlin
- **Trash Reporting**: Report litter with photos and location
- **Collection System**: Collect reported trash with proof photos
- **AI Verification**: OpenAI Vision automatically verifies trash presence
- **Area Cleaning**: Mark large areas as cleaned and watch them turn green on the map
- **Gamification**: Earn points and monthly medals (Bronze, Silver, Gold, Platinum, Diamond)

### Community Features
- **Cleanup Groups**: Join or create groups for collective cleanup efforts
- **Group Events**: Organize and schedule cleanup events
- **Weekly Rankings**: Compete with individuals and groups
- **Heat Map**: Visualize the cleanest and trashiest parts of Berlin

### User Features
- **Google OAuth**: Secure authentication via Google
- **User Profile**: Track your points, medals, and progress
- **Monthly Medals**: Earn badges based on monthly performance
- **Progressive Web App**: Install on mobile devices for native-like experience

## 🎯 Point System

| Action | Points |
|--------|--------|
| Report trash | 10 points |
| Collect reported trash (AI verified) | 50 points |
| Collect trash without report | 30 points |
| Clean area | 5 points per 100 m² (minimum 25 points) |

## 🏅 Medal Thresholds (Monthly)

- 🥉 **Bronze**: 100 points
- 🥈 **Silver**: 300 points
- 🥇 **Gold**: 600 points
- ⭐ **Platinum**: 1,000 points
- 💎 **Diamond**: 2,000 points

## 🛠️ Tech Stack

### Frontend
- React 19
- React Router v7
- Leaflet & React-Leaflet (OpenStreetMap)
- Tailwind CSS
- Axios
- Lucide Icons

### Backend
- FastAPI
- MongoDB with Motor (async driver)
- OpenAI Vision (via Emergent LLM key)
- Cloudinary (image storage)
- Emergent Google Auth
- Python 3.11

### Integrations
- **Emergent Google OAuth**: Hassle-free authentication
- **OpenAI GPT-5.2 Vision**: AI-powered trash verification
- **Cloudinary**: Scalable image storage and CDN
- **OpenStreetMap**: Free, open-source mapping

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # FastAPI application with all endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables (Cloudinary, LLM key)
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main application router
│   │   ├── components/
│   │   │   ├── Login.js           # Landing page with Google OAuth
│   │   │   ├── AuthCallback.js   # OAuth callback handler
│   │   │   ├── Dashboard.js      # User dashboard
│   │   │   ├── MapView.js        # Interactive map with trash pins
│   │   │   ├── Groups.js         # Group management
│   │   │   ├── Rankings.js       # Weekly leaderboards
│   │   │   └── Profile.js        # User profile with medals
│   │   ├── App.css        # Custom styles
│   │   └── index.css      # Tailwind imports
│   ├── public/
│   │   └── manifest.json  # PWA manifest
│   └── package.json       # Node dependencies
├── auth_testing.md        # Authentication testing guide
└── image_testing.md       # Image integration testing guide
```

## 🚀 API Endpoints

### Authentication
- `GET /api/auth/session?session_id=...` - Exchange session ID for user session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user

### Trash Management
- `POST /api/trash/report` - Report new trash location
- `POST /api/trash/collect/{report_id}` - Collect trash with proof
- `GET /api/trash/list?status=...` - List trash reports
- `GET /api/trash/{report_id}` - Get specific report

### Area Cleaning
- `POST /api/areas/clean` - Mark area as cleaned
- `GET /api/areas/active` - Get active cleaned areas (green zones)

### Groups
- `POST /api/groups` - Create new group
- `GET /api/groups` - List all groups
- `GET /api/groups/{group_id}` - Get group details
- `POST /api/groups/{group_id}/join` - Join a group
- `POST /api/groups/{group_id}/leave` - Leave a group
- `GET /api/groups/{group_id}/members` - Get group members
- `POST /api/groups/{group_id}/events` - Create group event
- `GET /api/groups/{group_id}/events` - Get group events

### Rankings
- `GET /api/rankings/weekly/users` - Weekly user rankings
- `GET /api/rankings/weekly/groups` - Weekly group rankings

### Heatmap
- `GET /api/heatmap/data` - Get heatmap data for visualization

### Cloudinary
- `GET /api/cloudinary/signature` - Get signed upload parameters

### User
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/{user_id}` - Get user by ID

## 🗄️ Database Schema

### Collections

**users**
- user_id (string, custom UUID)
- email, name, picture
- total_points, monthly_points, weekly_points
- medals (object: {"2025-01": ["bronze", "silver"]})
- joined_groups (array of group_ids)
- created_at

**user_sessions**
- user_id, session_token
- expires_at (7 days)
- created_at

**trash_reports**
- report_id
- location {lat, lng, address}
- image_url, thumbnail_url
- status (reported/collected)
- reporter_id, collector_id
- ai_verified, points_awarded
- created_at, collected_at

**area_cleanings**
- area_id
- user_id
- center_location, polygon_coords
- area_size, image_url
- ai_verified, points_awarded
- expires_at (green zone duration: 7 days)
- created_at

**groups**
- group_id
- name, description
- admin_ids[], member_ids[]
- total_points, weekly_points
- created_at

**group_events**
- event_id
- group_id, title, description
- location, event_date
- created_by, created_at

## 🔐 Security & Privacy

- **GDPR Compliant**: User data is stored securely with MongoDB
- **Secure Authentication**: Google OAuth via Emergent Auth (7-day sessions)
- **Image Security**: Signed uploads to Cloudinary (no direct public access)
- **API Protection**: All protected endpoints require authentication
- **AI Verification**: Photos are analyzed server-side, never exposed to clients

## 🌍 Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Integration
EMERGENT_LLM_KEY=sk-emergent-...
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://ecoberlin-map.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 📱 Progressive Web App

The app includes a PWA manifest for installation on mobile devices:
- Standalone display mode
- Custom theme colors (green)
- Portrait orientation
- Installable on iOS and Android

## 🧪 Testing

Testing playbooks are provided:
- `/app/auth_testing.md` - Authentication flow testing
- `/app/image_testing.md` - Image upload and AI verification testing

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Map updates after trash reports/collections
- **Interactive Map**: Click markers to see details and collect trash
- **Green Zones**: Cleaned areas display as green polygons for 7 days
- **Medal Animations**: Gradient backgrounds for medal display
- **Loading States**: Smooth loading indicators throughout
- **Error Handling**: User-friendly error messages

## 🚦 How to Use

1. **Sign in** with your Google account
2. **View the map** to see reported trash across Berlin
3. **Report trash** by clicking "Report Trash" and uploading a photo
4. **Collect trash** by clicking on red markers and uploading proof
5. **Join groups** to participate in organized cleanups
6. **Track progress** in your profile and compete on leaderboards

## 🎯 Future Enhancements

- Push notifications for nearby trash reports
- Mobile app (React Native)
- Expansion to other German cities
- Partnerships with local governments
- Corporate sponsorships for high scorers
- Environmental impact metrics
- Social media integration

## 📄 License

Built with ❤️ for a cleaner Berlin

---

**Live URL**: https://ecoberlin-map.preview.emergentagent.com
