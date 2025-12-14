# Database Connection Troubleshooting Guide

## Current Setup Status

✅ Your `.env.local` contains:
- `VITE_SUPABASE_URL`: https://nmvqzzbyeksjhisishiu.supabase.co
- `VITE_SUPABASE_ANON_KEY`: sb_publishable_psqetFJfLvd-7-Qv1Zm7fA_ILtiU8xg
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: sb_secret_7Jiqxwn4EQwHlaxkalwJdQ_VxZQI595

## Testing Steps

### Step 1: Test Database Connection (IMPORTANT - DO THIS FIRST!)

Open `test-db.html` in your browser:
```
file:///C:/Users/1/Desktop/xxx/test-db.html
```

This will:
1. Connect to Supabase
2. Try to read existing logs
3. Try to insert a test log

**What to look for:**
- ✅ Green text = Success
- ❌ Red text = Error (screenshot and send to me)

### Step 2: Check Browser Console

1. Open your Kiosk app: http://localhost:5173
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Click the avatar to start a conversation
5. Speak something simple like "Hello"

**What you should see in the console:**
```
🔍 Fetching logs from Supabase...
✅ Fetched X logs from database
🎤 Sending audio to /api/conversation...
✅ API Response received in XXXms
📝 User: [your text]
🤖 AI: [AI response]
💾 Attempting to save to Supabase...
✅ Successfully saved to Supabase!
```

**If you see errors instead:**
- ❌ Red error messages = Copy the FULL error and send to me

### Step 3: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/nmvqzzbyeksjhisishiu
2. Click "Table Editor" on the left
3. Find the "logs" table
4. Check if new rows appear after you speak to the avatar

## Common Issues & Fixes

### Issue: "relation 'logs' does not exist"
**Fix:** Run the SQL schema again in Supabase SQL Editor

### Issue: "JWT expired" or "unauthorized"
**Fix:** Check that your ANON_KEY in `.env.local` matches the one in Supabase Dashboard > Settings > API

### Issue: "Failed to fetch"
**Fix:** Make sure `npm run api` is running (backend on port 3000)

### Issue: Nothing happens when speaking
**Fix:** 
1. Check microphone permissions in browser
2. Make sure backend API is running: `npm run api`
3. Check console for errors

## Current Running Services

You should have 2 terminals open:
1. **Terminal 1**: `npm run dev` (Frontend on port 5173)
2. **Terminal 2**: `npm run api` (Backend API on port 3000)

## Next Steps

1. Open `test-db.html` and screenshot the result
2. Open the app and try speaking
3. Check browser console for the emoji logs (🎤 🤖 💾 etc.)
4. Tell me what you see!
