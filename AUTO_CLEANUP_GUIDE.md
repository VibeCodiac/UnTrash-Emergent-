# Automatic Trash Cleanup - UnTrash Berlin

## ✅ Feature Implemented

Collected trash now **automatically disappears** from the map after **7 days**, while reported trash stays visible until collected.

---

## 🎯 How It Works

### Map Display Logic:

**Red Pins (Reported Trash):**
- ✅ Shows ALL reported trash
- ✅ Stays visible indefinitely
- ✅ Until someone collects it
- 🎨 Red marker icon

**Green Pins (Collected Trash):**
- ✅ Shows for 7 days after collection
- ✅ Automatically hidden after 1 week
- ✅ Keeps map clean
- 🎨 Green marker icon (temporary)

---

## 📊 Visual Timeline

```
Day 0: Trash Reported
  └─> 🔴 Red pin appears (stays forever)
  
Day X: Trash Collected
  └─> 🟢 Green pin replaces red (shows success)
  
Day X+7: Auto-cleanup
  └─> 🟢 Green pin disappears (after 1 week)
```

---

## 🔧 Technical Implementation

### Backend Logic (`/api/trash/list`):

```javascript
Query Logic:
- Show ALL trash with status="reported" (no time limit)
- Show ONLY collected trash where collected_at >= 7 days ago
- Hide collected trash older than 7 days
```

### Database Query:
```javascript
{
  $or: [
    { status: "reported" },           // All reported trash
    { 
      status: "collected",
      collected_at: { $gte: week_ago }  // Only recent collections
    }
  ]
}
```

---

## 📅 Example Scenarios

### Scenario 1: Uncollected Trash
```
Reported: January 1st
Status: Still "reported"
Visible: ✅ Yes (shows forever as red pin)
```

### Scenario 2: Recently Collected
```
Reported: January 1st
Collected: January 10th
Status: "collected"
Today: January 15th (5 days after collection)
Visible: ✅ Yes (shows as green pin for 2 more days)
```

### Scenario 3: Old Collection
```
Reported: January 1st
Collected: January 10th
Status: "collected"
Today: January 20th (10 days after collection)
Visible: ❌ No (automatically hidden after 7 days)
```

---

## 🎨 User Experience

### What Users See:

**Active Trash (Red Pins):**
- Trash that needs to be collected
- Could be reported yesterday or months ago
- Stays until someone collects it
- Clear call to action

**Recent Collections (Green Pins):**
- Shows community progress
- Visible for 1 week as positive feedback
- Then disappears to keep map clean
- Prevents clutter

**Clean Map:**
- No old collected trash cluttering the view
- Focus on what needs action (red pins)
- Recent success stories visible (green pins)
- Automatic maintenance

---

## 💡 Why 7 Days?

**Benefits:**
- ✅ **Recognition Period** - Collectors see their work for a week
- ✅ **Prevents Clutter** - Old collections don't crowd the map
- ✅ **Focus on Active** - Highlights trash that needs collection
- ✅ **Community Feedback** - Shows recent activity
- ✅ **Automatic** - No manual cleanup needed

**Alternative Options** (if you want to change):
- 3 days - Faster cleanup, less clutter
- 14 days - Longer recognition period
- 30 days - Monthly cycle

---

## 🔄 Automatic Cleanup Process

### How It Works:
1. Trash collected → `collected_at` timestamp saved
2. Every time map loads → Backend checks dates
3. Collected trash > 7 days old → Filtered out
4. Only recent collections + all reported trash shown
5. Users see clean, relevant map

### No Manual Action Required:
- ✅ Automatic filtering on every load
- ✅ No cron jobs needed
- ✅ No database cleanup needed
- ✅ Data preserved (still in database)
- ✅ Can be retrieved if needed

---

## 📊 Data Retention

### What's Kept in Database:
- ✅ **All reports** (reported and collected)
- ✅ **All timestamps** (created_at, collected_at)
- ✅ **All images** (in Cloudinary)
- ✅ **All points awarded**
- ✅ **All user data**

### What's Hidden on Map:
- ❌ Collected trash older than 7 days
- ✅ BUT still in database for:
  - Statistics
  - User history
  - Analytics
  - Historical data

---

## 🎯 Testing the Feature

### Test Auto-Cleanup:

**Method 1: Time Travel (Testing)**
If you want to test without waiting 7 days, you can manually update a document:

```javascript
// In MongoDB (for testing only)
db.trash_reports.updateOne(
  { report_id: "your_report_id" },
  { 
    $set: { 
      collected_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    }
  }
)
```

Then reload the map - that pin should be gone!

**Method 2: Natural Testing**
1. Collect a trash report
2. See green pin on map
3. Wait 7 days
4. Check map - pin should be gone
5. Check database - record still there

---

## 🔍 Verifying It Works

### Check Current State:
1. Go to Map
2. Look at pins:
   - 🔴 Red = Needs collection
   - 🟢 Green = Collected recently (< 7 days)
3. Green pins older than 7 days won't show

### Database Query to Check:
```javascript
// Count all collected trash
db.trash_reports.countDocuments({ status: "collected" })

// Count visible collected trash (< 7 days)
db.trash_reports.countDocuments({ 
  status: "collected",
  collected_at: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
})
```

If first count > second count, auto-cleanup is working!

---

## 🎨 Pin Lifecycle Summary

```
📍 REPORTED TRASH (Red)
   ↓
   Visible FOREVER (until collected)
   ↓
   Someone collects it
   ↓
   
📍 COLLECTED TRASH (Green)
   ↓
   Visible for 7 DAYS
   ↓
   Day 1-7: Shows as success
   ↓
   After Day 7: Auto-hidden
   ↓
   
✅ CLEAN MAP
```

---

## 📝 API Endpoint Behavior

### `/api/trash/list` (Updated)

**Default (no status parameter):**
```
Returns:
- All reported trash (any age)
- Collected trash from last 7 days only
```

**With status="reported":**
```
Returns:
- Only reported trash
- All ages included
```

**With status="collected":**
```
Returns:
- Only collected trash
- All ages included (override 7-day filter)
- Useful for statistics
```

---

## 🚀 Benefits

**For Users:**
- ✅ Clean, uncluttered map
- ✅ Focus on actionable items
- ✅ See recent community progress
- ✅ Better user experience

**For System:**
- ✅ Automatic maintenance
- ✅ No manual cleanup needed
- ✅ Preserves all data
- ✅ Scalable solution

**For Community:**
- ✅ Shows active areas
- ✅ Highlights what needs action
- ✅ Celebrates recent success
- ✅ Keeps motivation high

---

## ⚙️ Customization Options

Want to change the 7-day period? Easy!

**Change to 3 days:**
```python
week_ago = datetime.now(timezone.utc) - timedelta(days=3)
```

**Change to 14 days:**
```python
week_ago = datetime.now(timezone.utc) - timedelta(days=14)
```

**Change to 1 month:**
```python
week_ago = datetime.now(timezone.utc) - timedelta(days=30)
```

---

## ✅ Complete Feature Status

**What's Working:**
- ✅ Red pins for reported trash (stay forever)
- ✅ Green pins for collected trash (7 days)
- ✅ Auto-hide after 7 days
- ✅ Data preserved in database
- ✅ Automatic on every map load
- ✅ No manual intervention needed

**The map stays clean automatically!** 🎉
