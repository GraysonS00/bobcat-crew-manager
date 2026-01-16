# Bobcat Crew Manager

A Progressive Web App (PWA) for managing construction crews, equipment, and job reports.

## Features

- **Role-based access**: Admin, Supervisor, and Foreman roles with different permissions
- **Employee roster management**: Add, edit, and track all employees
- **Crew composition**: Foremen can manage their own crew membership
- **Equipment tracking**: Photo uploads, serial numbers, service status
- **Job reporting**: Digital job reports with employee attendance tracking
- **Works on iPad**: Add to home screen for app-like experience

---

## Setup Instructions

### Step 1: Create a Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Give it a name (e.g., "bobcat-crew-manager")
4. Set a secure database password (save this somewhere!)
5. Choose a region close to you
6. Click "Create new project" and wait ~2 minutes

### Step 2: Set Up the Database (5 minutes)

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the ENTIRE contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is correct!

### Step 3: Get Your API Keys

1. In Supabase, click **Settings** (gear icon) in the left sidebar
2. Click **API** under "Project Settings"
3. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this (long string starting with `eyJ...`)

### Step 4: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in (or create free account)
2. Click the **+** in the top right → **New repository**
3. Name it `bobcat-crew-manager`
4. Keep it **Public** (required for free Vercel hosting)
5. Click **Create repository**

### Step 5: Upload the Code to GitHub

1. On your new repo page, click **"uploading an existing file"**
2. Drag ALL the files from this project folder into the upload area:
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `index.html`
   - `src/` folder (with all files inside)
   - `public/` folder (with all files inside)
3. Click **Commit changes**

### Step 6: Deploy to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New...** → **Project**
3. Find and select your `bobcat-crew-manager` repository
4. Before clicking Deploy, expand **Environment Variables**
5. Add these two variables:
   - Name: `VITE_SUPABASE_URL` → Value: your Project URL from Step 3
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your anon key from Step 3
6. Click **Deploy**
7. Wait ~1-2 minutes for the build to complete
8. You'll get a URL like `bobcat-crew-manager.vercel.app` - this is your app!

### Step 7: Create Your Admin Account

1. Go back to Supabase → **Authentication** (left sidebar)
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: your email
   - Password: a secure password
4. Click **Create user**
5. Now go to **Table Editor** → **profiles**
6. Find your user row and click to edit
7. Change `role` from `foreman` to `admin`
8. Update the `name` to your name

### Step 8: Test It!

1. Open your Vercel URL on any device
2. Log in with the admin account you just created
3. Try adding employees, creating crews, etc.

---

## Creating Additional Users

### For Supervisors:
1. Supabase → Authentication → Add user
2. Table Editor → profiles → change their role to `supervisor`

### For Foremen:
1. Supabase → Authentication → Add user
2. Their role defaults to `foreman`
3. Create a crew in the app and assign them as foreman

---

## Adding to iPad Home Screen

1. Open Safari on the iPad
2. Go to your Vercel URL
3. Tap the Share button (square with arrow)
4. Scroll down and tap **Add to Home Screen**
5. Tap **Add**

The app will now appear as an icon and open full-screen like a native app!

---

## Making Changes

When you want to update the app:

1. Come back to Claude and describe what you want changed
2. I'll give you updated code
3. Go to your GitHub repository
4. Navigate to the file that needs updating
5. Click the pencil icon (Edit)
6. Paste the new code
7. Click **Commit changes**
8. Vercel automatically redeploys in ~60 seconds

Your data stays safe - only the interface changes!

---

## Troubleshooting

**Login not working?**
- Double-check your environment variables in Vercel
- Make sure you created the user in Supabase Authentication

**Can't see any data?**
- Make sure you ran the SQL schema in Step 2
- Check that the user has the correct role in the profiles table

**Photos not uploading?**
- The storage bucket should be created by the SQL schema
- Check Supabase → Storage to verify the `equipment-photos` bucket exists

---

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **PWA**: Works offline, installable on devices
