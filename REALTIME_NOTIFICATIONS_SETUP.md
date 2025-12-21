# Real-Time Notifications Setup Guide

This guide will help you enable real-time order notifications in your Supabase project.

## Problem

If test notifications work but real order notifications don't, it's likely because **Supabase Realtime** is not enabled for the `orders` table.

## Solution: Enable Realtime in Supabase

**Note:** The "Replication" section in Supabase Dashboard is for external data replication, NOT for real-time subscriptions. Supabase Realtime uses PostgreSQL publications and needs to be enabled via SQL.

### Step 1: Go to Supabase SQL Editor

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the SQL to Enable Realtime

Copy and paste this SQL into the editor:

```sql
-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

5. Click **Run** to execute the query
6. You should see a success message: "Success. No rows returned"

### Step 3: Verify Realtime is Enabled (Optional)

Run this query to verify the orders table is in the realtime publication:

```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'orders';
```

You should see a row with the orders table listed.

### Step 3: Verify Realtime is Working

1. Open your admin dashboard in the browser
2. Open the browser console (F12)
3. Look for the message: `"Successfully subscribed to orders changes"`
4. If you see `"Subscription status: SUBSCRIBED"`, real-time is working!

### Step 4: Test Real-Time Notifications

1. Make sure notification permission is granted (click "Test Notification" button)
2. Place a test order from another device/browser
3. You should see a notification appear immediately on the admin dashboard

## Troubleshooting

### Issue: SQL Error "publication does not exist"

**Solution:**
If you get an error that `supabase_realtime` publication doesn't exist, create it first:

```sql
CREATE PUBLICATION supabase_realtime FOR TABLE orders;
```

Then try adding the table again.

### Issue: Still seeing "CHANNEL_ERROR" or "CLOSED" status

**Solution:**
1. Verify the orders table is in the realtime publication (run the verification query above)
2. Check that your Supabase project has Realtime enabled (should be enabled by default)
3. Check browser console for any CORS or network errors
4. Try refreshing the admin dashboard
5. Check if your Supabase project is on a plan that supports Realtime (all plans should support it)

### Issue: Notifications work on laptop but not on phone

**Possible causes:**
1. **Android**: Make sure the browser has notification permissions enabled
   - Go to browser settings → Site settings → Notifications → Allow
2. **iOS**: Notifications only work when the app is installed as PWA (added to home screen)
   - Add the site to home screen
   - Open from home screen icon (not browser)
3. **Browser**: Some browsers block notifications
   - Try Chrome or Firefox
   - Make sure "Do Not Disturb" mode is off

### Issue: Real-time subscription keeps closing

**Solution:**
- The code now has automatic retry logic
- It will retry every 5 seconds if the subscription fails
- Check Supabase dashboard to ensure Realtime is enabled
- Check your network connection

### Issue: Polling works but real-time doesn't

**Solution:**
- Real-time is the primary mechanism (instant notifications)
- Polling is a fallback (checks every 10 seconds)
- If polling works, notifications will still appear, just with a slight delay
- To fix real-time, enable it in Supabase Dashboard as described above

## How It Works

1. **Real-Time Subscription** (Primary):
   - Listens for new `INSERT` events on the `orders` table
   - Triggers notification immediately when a new order is placed
   - Requires Realtime to be enabled in Supabase

2. **Polling Fallback** (Secondary):
   - Checks for new orders every 10 seconds
   - Shows notifications if real-time fails
   - Ensures notifications work even if real-time is unavailable

## Verification Checklist

- [ ] Realtime enabled for `orders` table in Supabase Dashboard
- [ ] Browser console shows "Subscription status: SUBSCRIBED"
- [ ] Notification permission granted (check browser settings)
- [ ] Test notification works
- [ ] Real order triggers notification

## Support

If you're still having issues after following this guide:

1. Check the browser console for error messages
2. Verify Supabase Realtime is enabled
3. Test on different browsers/devices
4. Check network connectivity
5. Review Supabase project settings for any restrictions

