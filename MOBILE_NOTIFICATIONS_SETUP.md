# Mobile Notifications Setup Guide

This guide will help you enable notifications on Android and iOS devices.

## Android Setup

### Step 1: Grant Browser Notification Permission

1. Open the admin dashboard in Chrome or Firefox on your Android device
2. Tap the **three dots menu** (⋮) in the browser
3. Go to **Settings** → **Site settings** → **Notifications**
4. Find your site in the list
5. Tap it and select **Allow**
6. Alternatively, when you first visit the site, you'll see a permission prompt - tap **Allow**

### Step 2: Test Notifications

1. Click the **"Test Notification"** button in the admin dashboard
2. You should see a notification appear
3. If it doesn't work, check:
   - Phone is not in "Do Not Disturb" mode
   - Browser notifications are enabled in Android system settings
   - Try a different browser (Chrome or Firefox work best)

### Step 3: Keep Browser Open

- For notifications to work, the browser tab should be open (can be in background)
- Some browsers may require the tab to be active

## iOS Setup

### Important: iOS Requires PWA Installation

iOS Safari does NOT support notifications for regular websites. You MUST install the app as a Progressive Web App (PWA).

### Step 1: Add to Home Screen

1. Open the admin dashboard in **Safari** (not Chrome or other browsers)
2. Tap the **Share button** (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if needed (e.g., "RCA Admin")
5. Tap **"Add"**

### Step 2: Open from Home Screen

1. Close Safari completely
2. Open the app from the **home screen icon** (not from Safari)
3. The app should open in standalone mode (no browser UI)

### Step 3: Grant Notification Permission

1. While in the PWA (opened from home screen), click **"Test Notification"** button
2. You'll see a permission prompt - tap **"Allow"**
3. Notifications should now work!

### Step 4: Keep App Open

- The PWA should be running (can be in background)
- iOS may limit background notifications, so keep the app active

## Troubleshooting

### Android: Notifications Not Appearing

**Check:**
1. Browser notification permission is granted
2. Android system notification settings allow browser notifications
3. Phone is not in silent/Do Not Disturb mode
4. Browser tab is open (can be in background)
5. Try refreshing the page

**Solution:**
- Go to Android Settings → Apps → [Your Browser] → Notifications → Enable
- Make sure "Show notifications" is ON

### iOS: Notifications Not Working

**Common Issues:**

1. **"Notifications not supported" error**
   - **Cause:** App not installed as PWA
   - **Solution:** Follow Step 1 above to add to home screen

2. **Permission prompt doesn't appear**
   - **Cause:** Opening from Safari instead of home screen icon
   - **Solution:** Close Safari, open from home screen icon

3. **Permission denied**
   - **Cause:** User denied permission
   - **Solution:** Go to iOS Settings → Safari → [Your Site] → Allow Notifications

4. **Notifications work but stop after a while**
   - **Cause:** iOS background limitations
   - **Solution:** Keep the PWA active, don't force-close it

### Both Platforms: Duplicate Notifications

**If you see the same notification multiple times:**
- This has been fixed in the latest update
- Clear browser cache and refresh
- The system now tracks notified orders to prevent duplicates

### Both Platforms: Test Notification Works But Real Orders Don't

**Check:**
1. Real-time subscription is enabled (see REALTIME_NOTIFICATIONS_SETUP.md)
2. Browser console for errors
3. Network connection is stable
4. Supabase realtime publication is enabled

## Best Practices

1. **Android:**
   - Use Chrome or Firefox
   - Keep browser tab open
   - Grant notification permission when prompted

2. **iOS:**
   - Always open from home screen icon (PWA)
   - Don't open from Safari browser
   - Keep the PWA running in background

3. **Both:**
   - Test notifications first using "Test Notification" button
   - Check browser console for error messages
   - Ensure stable internet connection

## Verification Checklist

### Android:
- [ ] Browser notification permission granted
- [ ] Test notification works
- [ ] Browser tab is open
- [ ] Real order triggers notification

### iOS:
- [ ] App added to home screen
- [ ] Opening from home screen icon (not Safari)
- [ ] Notification permission granted
- [ ] Test notification works
- [ ] Real order triggers notification

## Support

If notifications still don't work after following this guide:

1. Check browser console for error messages
2. Verify notification permission status
3. Test on different browser/device
4. Check network connectivity
5. Verify Supabase realtime is enabled


