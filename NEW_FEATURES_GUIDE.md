# New Features Guide - UnTrash Berlin

## ✅ What's New

### 1. Upcoming Group Events on Dashboard
**Location:** Main Dashboard → "Upcoming Group Events" section

**Features:**
- Shows next 5 upcoming events from YOUR groups
- Displays event title, description, date/time, and group name
- Quick view without navigating to groups page
- "View All Groups →" link to see more

**How it works:**
- Automatically loads events from groups you've joined
- Shows events in chronological order (soonest first)
- Only appears if you have upcoming events

---

### 2. Account Settings Page
**Access:** Dashboard → Click "Settings" in navigation

**What you can control:**
- ✉️ **Email Notifications** - Toggle on/off
- 📱 **Push Notifications** - Toggle on/off (browser-based)
- 🔔 **New Group Events** - Get notified when events are created
- 📢 **Group Updates** - Get notified about group announcements
- 📍 **Nearby Trash** - (Coming soon) Notifications for trash near you

**Features:**
- Save preferences with one click
- See confirmation when saved
- View your account information
- See mock notification log (testing mode)

---

### 3. Mock Notification System
**What it does:**
- Simulates email/push notifications for testing
- Logs all notifications that WOULD be sent
- View notification history in Settings page

**When notifications are triggered:**
- ✅ Someone creates an event in your group
- ✅ Group announcements (future)
- ✅ Nearby trash reports (future)

**How to see them:**
1. Go to Settings page
2. Scroll to "Recent Notifications (Testing)"
3. See all mock notifications received

**Example notification:**
```
Title: "New Event in Berlin Cleanup Crew"
Message: "John Doe created a new event: 'Weekend Cleanup' on March 15, 2025"
```

---

## 🎯 How Everything Works

### Creating an Event (and triggering notifications):
1. Go to Groups → Select a group → View Details
2. Click "Create Event"
3. Fill in event details (title, date, description)
4. Click "Create"
5. **All group members get notified** (if they have notifications enabled)
6. Check Settings to see the mock notification log

### Viewing Upcoming Events:
1. **Dashboard Method:** Go to Dashboard → See "Upcoming Group Events"
2. **Groups Method:** Go to Groups → Select group → View Details → Events tab

### Managing Notification Preferences:
1. Go to Settings
2. Toggle any preference on/off
3. Click "Save Changes"
4. See "Saved!" confirmation

---

## 📸 Photo Upload Issue - SOLUTION

### Why photos might not upload:

**MUST BE SIGNED IN FIRST!**

The app requires Google authentication before you can:
- Report trash
- Upload photos
- Collect trash
- Create groups
- Create events

### Step-by-step fix:

1. **Sign in with Google:**
   - Go to https://bln-cleanup.preview.emergentagent.com
   - Click "Sign in with Google"
   - Complete Google auth
   - You'll be redirected to Dashboard

2. **Now you can report trash:**
   - Click "Map" in navigation
   - Click "Report Trash" (red button)
   - Fill location: 52.520008, 13.404954
   - Click "Choose File" → Select image
   - See image preview
   - Click "Report Trash"
   - Wait for "Uploading..." → Success!

3. **Check if it worked:**
   - Pin should appear on map
   - Refresh page if needed
   - Zoom in to Berlin center

### Testing tips:
- Use coordinates: 52.520008, 13.404954 (Brandenburg Gate area)
- Use JPG or PNG images
- Keep images under 5MB
- Check browser console (F12) for any errors

---

## 🔧 Mock vs Real Notifications

### Current Setup (Mock):
- ✅ Notifications are logged in database
- ✅ Visible in Settings page
- ✅ No actual emails sent
- ✅ Perfect for testing
- ✅ No email service needed
- ✅ No extra costs

**What gets logged:**
- Event creation notifications
- User who created it
- Event details
- Timestamp

### Future Upgrade (Real):
When you're ready for real emails, you can:
1. Get SendGrid API key (free tier available)
2. Add key to backend .env
3. Update notification service
4. Real emails will be sent!

**Advantages of starting with mock:**
- Test everything without setup
- No API keys needed
- See exactly what notifications would look like
- Free and instant
- Upgrade later when ready

---

## 🎨 What You'll See

### Dashboard with Events:
```
┌─────────────────────────────────────┐
│ Upcoming Group Events               │
├─────────────────────────────────────┤
│ 📅 Weekend Park Cleanup             │
│    Saturday, Mar 15 at 10:00 AM     │
│    👥 Berlin Cleanup Crew           │
├─────────────────────────────────────┤
│ 📅 River Cleanup                    │
│    Sunday, Mar 16 at 2:00 PM        │
│    👥 Eco Warriors Berlin           │
└─────────────────────────────────────┘
```

### Settings Notification Preferences:
```
┌─────────────────────────────────────┐
│ ✉️  Email Notifications      [ON]  │
│ 📱 Push Notifications         [OFF] │
│ 🔔 New Group Events           [ON]  │
│ 📢 Group Updates              [ON]  │
└─────────────────────────────────────┘
```

### Mock Notification Log:
```
┌─────────────────────────────────────┐
│ Recent Notifications (Testing)      │
├─────────────────────────────────────┤
│ 🔔 New Event in Berlin Cleanup Crew │
│    John created event: Weekend      │
│    Cleanup on March 15, 2025        │
│    2 hours ago                      │
└─────────────────────────────────────┘
```

---

## ✅ Complete Feature Checklist

**Navigation:**
- ✅ Settings link in Dashboard navigation
- ✅ Easy access to all features

**Dashboard:**
- ✅ Upcoming Group Events section
- ✅ Weekly Berlin stats
- ✅ Personal stats
- ✅ Latest medals
- ✅ Quick actions

**Settings:**
- ✅ Account information display
- ✅ Notification preferences with toggles
- ✅ Save functionality with confirmation
- ✅ Mock notification log
- ✅ Info banner explaining testing mode

**Notifications:**
- ✅ Mock notification system working
- ✅ Triggered on event creation
- ✅ Respects user preferences
- ✅ Logged in database
- ✅ Visible in Settings

**Events:**
- ✅ Display on Dashboard
- ✅ Chronological order
- ✅ Group name shown
- ✅ Date/time formatting
- ✅ Link to full groups page

---

## 🚀 Next Steps

1. **Sign in** with Google first
2. **Join or create** a group
3. **Create an event** in the group
4. **Check Settings** to see the mock notification
5. **Test preferences** by toggling them on/off
6. **View upcoming events** on Dashboard

---

## 🆘 Still Having Issues?

### Photo uploads still not working?
1. Make sure you're signed in (see your name in Dashboard)
2. Check browser console for errors (F12)
3. Try a different image (JPG, under 5MB)
4. Refresh the page and try again

### Events not showing?
1. Make sure you've joined a group
2. Make sure event date is in the future
3. Refresh Dashboard
4. Check groups page to verify event exists

### Notifications not appearing?
1. Create an event in a group you're in
2. Go to Settings page
3. Scroll to "Recent Notifications"
4. Should see notification there

### Settings not saving?
1. Click "Save Changes" button
2. Should see "Saved!" confirmation
3. Refresh page to verify persistence

---

**Everything is working and ready to test!** 🎉
