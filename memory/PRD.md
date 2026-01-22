# UnTrash Berlin - Product Requirements Document

## Original Problem Statement
Build a Progressive Web App called "UnTrash Berlin" - a community-driven platform for reporting and collecting trash in Berlin. Users can report litter locations with photos, collect reported trash for points, and compete on leaderboards. Features AI verification of trash photos, gamification with medals, group cleanups, and admin moderation.

## User Personas
1. **Regular User**: Berlin resident who wants to report or collect trash for points
2. **Group Organizer**: User who creates cleanup groups and events
3. **Admin** (`stephanj.thurm@gmail.com`): Moderates content, bans users, approves area cleanings

## Core Requirements

### Authentication
- Google OAuth via Emergent infrastructure
- Session-based auth with 7-day expiry
- Admin role for `stephanj.thurm@gmail.com`

### Trash Reporting & Collection
- Report trash with photo + location (10 points)
- Collect trash with proof photo (30-50 points based on AI verification)
- AI verification using OpenAI Vision via Emergent LLM Key
- Collected reports hidden from map after 7 days

### Area Cleaning (Admin Approval Required)
- Users can report cleaned areas without prior trash report
- Requires admin approval before points awarded
- Points based on area size (5 pts per 100m², min 25 pts)
- Green zones visible on map for 7 days after approval

### Groups & Events
- Create/join cleanup groups
- Create events within groups
- Event deletion by creator, group admin, or app admin
- Mock notifications for new events

## Gamification

### Point Values (Reduced)
- **Report trash:** 5 points
- **Collect trash (AI verified):** 25 points
- **Collect trash (not verified):** 15 points
- **Area cleaning:** 2 points per 100m² (minimum 10)

### Medal Thresholds (Monthly)
- **Bronze:** 30 points
- **Silver:** 75 points
- **Gold:** 150 points
- **Platinum:** 300 points
- **Diamond:** 500 points

### Features
- Weekly leaderboards for users and groups
- Animated medal cards with shimmer and glow effects
- Progress bars showing progress to next medal
- Social sharing for medals and achievements

### Admin Panel (`/admin`)
- View/ban/unban users
- Delete trash reports
- Approve/reject area cleanings with point awards

### Dashboard
- Total points display
- Berlin-wide weekly statistics
- Upcoming group events
- Recent medals

## Technology Stack
- **Frontend**: React, Tailwind CSS, Leaflet.js
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Image Storage**: Cloudinary (unsigned upload preset "UnTrash")
- **AI**: OpenAI Vision via Emergent LLM Key
- **Auth**: Google OAuth via Emergent

## What's Been Implemented (as of 2026-01-22)

### Completed Features
- [x] Google OAuth authentication
- [x] Map view with trash pins (Leaflet/OpenStreetMap)
- [x] Trash reporting with photo upload (Cloudinary)
- [x] Trash collection with AI verification
- [x] Area cleaning with admin approval workflow
- [x] Points system (total, monthly, weekly)
- [x] Medal system based on monthly points
- [x] Groups with join/leave/create
- [x] Group events with create/delete
- [x] Weekly leaderboards (users & groups)
- [x] Heatmap layer for trash density
- [x] Admin panel with user management
- [x] Admin can delete trash reports
- [x] Admin can approve/reject area cleanings
- [x] Dashboard with weekly Berlin stats
- [x] Dashboard shows upcoming group events
- [x] Social sharing for medals
- [x] User profile with medals display
- [x] Notification preferences (mock implementation)
- [x] Auto-cleanup of old collected reports (7 days)

### Fixed Issues (2026-01-22)
- [x] Issue 1: Admin rights not visible - Fixed `is_admin` flag in database
- [x] Issue 2: Admin panel functionality - All sections working
- [x] Issue 3: Admin delete trash photos - Delete button functional
- [x] Issue 4: Event deletion - Fixed to check app admin status
- [x] Issue 5: Dashboard upcoming events - API working correctly
- [x] Group owner can delete their group
- [x] Non-owner members can leave groups
- [x] Owner cannot leave (must delete instead)
- [x] Admin verification required for trash collections before points awarded
- [x] Delete trash reports deducts points from reporter and collector
- [x] Admin panel shows pending verifications with notification badge
- [x] Ban/unban user functionality working
- [x] Test data filtered from frontend map (placeholder/test images hidden)
- [x] Points scaled back (Report: 5, Collect: 15-25, Area: 2/100m²)
- [x] Admin can reset user points via modal
- [x] Beautiful animated medals with shimmer/glow effects

## API Endpoints

### Authentication
- `GET /api/auth/session?session_id=` - Exchange session for user data
- `GET /api/auth/me` - Get current user (includes `is_admin`)
- `POST /api/auth/logout` - Logout user

### Trash
- `POST /api/trash/report` - Report trash
- `POST /api/trash/collect/{report_id}` - Collect trash
- `GET /api/trash/list` - List reports (filtered by status)
- `GET /api/trash/{report_id}` - Get specific report

### Areas
- `POST /api/areas/clean` - Submit area cleaning
- `GET /api/areas/active` - Get approved green zones

### Groups
- `GET/POST /api/groups` - List/create groups
- `GET /api/groups/{group_id}` - Get group details
- `DELETE /api/groups/{group_id}` - Delete group (owner only)
- `POST /api/groups/{group_id}/join` - Join group
- `POST /api/groups/{group_id}/leave` - Leave group (non-owner only)
- `GET /api/groups/{group_id}/members` - List members
- `GET/POST /api/groups/{group_id}/events` - List/create events
- `DELETE /api/groups/{group_id}/events/{event_id}` - Delete event

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/{user_id}/ban` - Ban user (deletes all sessions)
- `POST /api/admin/users/{user_id}/unban` - Unban user
- `DELETE /api/admin/trash/{report_id}` - Delete trash report (deducts points)
- `PUT /api/admin/trash/{report_id}` - Update trash report
- `GET /api/admin/areas/pending` - List pending area cleanings
- `POST /api/admin/areas/{area_id}/approve` - Approve area cleaning
- `DELETE /api/admin/areas/{area_id}` - Reject area cleaning
- `GET /api/admin/collections/pending` - List pending trash collections
- `POST /api/admin/collections/{report_id}/approve` - Approve collection
- `DELETE /api/admin/collections/{report_id}` - Reject collection (reverts to reported)
- `GET /api/admin/pending-count` - Get counts of all pending verifications

### Other
- `GET /api/events/upcoming` - User's upcoming group events
- `GET /api/stats/weekly` - Berlin-wide weekly stats
- `GET /api/rankings/weekly/users` - User leaderboard
- `GET /api/rankings/weekly/groups` - Group leaderboard
- `GET /api/heatmap/data` - Heatmap data

## Database Schema

### users
```json
{
  "user_id": "user_xxx",
  "email": "string",
  "name": "string",
  "picture": "url",
  "total_points": 0,
  "monthly_points": 0,
  "weekly_points": 0,
  "medals": {"2026-01": ["bronze", "silver"]},
  "joined_groups": ["group_xxx"],
  "is_admin": false,
  "is_banned": false,
  "created_at": "datetime"
}
```

### trash_reports
```json
{
  "report_id": "trash_xxx",
  "location": {"lat": 0, "lng": 0, "address": ""},
  "image_url": "url",
  "status": "reported|collected",
  "reporter_id": "user_xxx",
  "collector_id": "user_xxx",
  "ai_verified": false,
  "points_awarded": 0,
  "created_at": "datetime",
  "collected_at": "datetime"
}
```

### area_cleanings
```json
{
  "area_id": "area_xxx",
  "user_id": "user_xxx",
  "center_location": {"lat": 0, "lng": 0},
  "polygon_coords": [[lat, lng], ...],
  "area_size": 100,
  "image_url": "url",
  "ai_verified": false,
  "admin_approved": false,
  "points_awarded": 0,
  "expires_at": "datetime",
  "created_at": "datetime"
}
```

### groups
```json
{
  "group_id": "group_xxx",
  "name": "string",
  "description": "string",
  "admin_ids": ["user_xxx"],
  "member_ids": ["user_xxx"],
  "total_points": 0,
  "weekly_points": 0,
  "created_at": "datetime"
}
```

### group_events
```json
{
  "event_id": "event_xxx",
  "group_id": "group_xxx",
  "title": "string",
  "description": "string",
  "location": {"lat": 0, "lng": 0},
  "event_date": "datetime",
  "created_by": "user_xxx",
  "created_at": "datetime"
}
```

## Prioritized Backlog

### P0 - Critical (None currently)
All critical issues have been resolved.

### P1 - High Priority
- [ ] Implement real email notifications (replace mock)
- [ ] Implement push notifications (replace mock)

### P2 - Medium Priority
- [ ] Refine heatmap visualization based on feedback
- [ ] Extract modal components from MapView.js
- [ ] Delete obsolete `/app/frontend/src/utils/imageUpload.js`

### P3 - Low Priority
- [ ] PWA configuration review
- [ ] GDPR compliance review
- [ ] Weekly points reset scheduler

## Notes
- **Notifications**: Currently MOCKED - logs to console and stores in `mock_notifications` collection
- **Admin Email**: `stephanj.thurm@gmail.com` is hardcoded as admin
- **Cloudinary**: Uses unsigned upload preset "UnTrash" for client-side uploads
