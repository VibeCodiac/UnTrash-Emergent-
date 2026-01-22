# Troubleshooting Guide - UnTrash Berlin

## Photo Uploads Not Working?

### Step 1: Are you signed in?
**You MUST sign in with Google before you can upload photos or report trash!**

1. Go to https://ecoberlin-map.preview.emergentagent.com
2. Click "Sign in with Google"
3. After signing in, you'll be redirected to the Dashboard
4. NOW you can report trash and upload photos!

### Step 2: Test the Upload Flow
1. Go to Map view (click Map in navigation)
2. Click "Report Trash" button (red button)
3. Fill in location (you can use default: 52.520008, 13.404954)
4. Click "Choose File" and select an image
5. You should see image preview
6. Click "Report Trash"
7. Wait for upload (shows "Uploading..." then success)

### Common Issues:

**Issue: "Not authenticated" error**
- Solution: Sign in with Google first

**Issue: Can't click "Report Trash" button**
- Solution: Make sure you're on the Map page, not Dashboard

**Issue: Upload takes too long**
- Solution: Use smaller images (< 5MB works best)

**Issue: No pins appear on map**
- Solution: After reporting, refresh the map or navigate away and back

**Issue: "Failed to upload image"**
- Check: Internet connection
- Check: Image format (use JPG, PNG, or WEBP)
- Check: File size (keep under 10MB)

### Testing Without Real Data:
You can test by creating a test report:
1. Sign in
2. Go to Map
3. Report trash at coordinates: 52.520008, 13.404954 (Berlin center)
4. Upload any photo
5. Pin should appear on map!

## Pins Not Appearing on Map?

### Possible Causes:
1. **Not signed in** - Sign in first!
2. **No reports yet** - Create your first report
3. **Map not loading** - Check internet connection
4. **Wrong zoom level** - Zoom in to Berlin (map starts centered there)

### How to Verify:
1. Open browser console (F12)
2. Go to Map page
3. Check for any error messages
4. Should see trash reports loading

## Still Having Issues?

Check the browser console (F12 → Console tab) for error messages and let me know what you see!
