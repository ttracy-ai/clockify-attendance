# Vercel Deployment Quick Start Guide

This is a simplified guide to get your Clockify Attendance Tracker online in about 10 minutes.

## What You'll Need

From your `.env.local` file, you'll need these values:
- `CLOCKIFY_API_KEY`: YzY0ZjU3MzEtYzFlMy00OWNmLThiYjctZTdhMGY5YTBkZDFk
- `CLOCKIFY_WORKSPACE_1ST_HOUR`: 68ab4631cdd3100648caf4ed
- `CLOCKIFY_WORKSPACE_2ND_HOUR`: 68ab4b8ee201a71118cd502b
- `CLOCKIFY_WORKSPACE_3RD_HOUR`: 68ab4d83d138cb5f24c57310
- `CLOCKIFY_WORKSPACE_4TH_HOUR`: 68ab4e24e201a71118cd5084
- `AUTH_PASSWORD_HASH`: $2b$10$AkkeJjF2dA0iVsTfQA2PueMtUZiODi0.oRVWEDGdfHTeXUzfd5eF6
- `AUTH_SECRET`: 32e213782993697e70dda7e6c5084dfcd00ef6a9afb3146bca1db058d37e2121

Your login password is: **Travis3923!**

---

## Step 1: Push to GitHub (5 minutes)

### 1.1 Commit your code
Open Git Bash or terminal in your project folder and run:

```bash
git add .
git commit -m "Ready for Vercel deployment"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `clockify-attendance-tracker`
3. **Set to PRIVATE** (important for student data security)
4. **DO NOT** check "Add a README file"
5. Click "Create repository"

### 1.3 Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/clockify-attendance-tracker.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username and run the commands.

---

## Step 2: Deploy to Vercel (3 minutes)

### 2.1 Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access GitHub

### 2.2 Import Your Project

1. Click "Add New..." → "Project"
2. Find "clockify-attendance-tracker" in the list
3. Click "Import"
4. Click "Deploy" (it will fail - that's expected!)

The build will fail because we haven't added environment variables yet.

---

## Step 3: Add Environment Variables (2 minutes)

### 3.1 Go to Project Settings

1. Click "Settings" in the top menu
2. Click "Environment Variables" in the left sidebar

### 3.2 Add Each Variable

Add these one by one (click "Add Another" after each):

| Key | Value |
|-----|-------|
| `CLOCKIFY_API_KEY` | `YzY0ZjU3MzEtYzFlMy00OWNmLThiYjctZTdhMGY5YTBkZDFk` |
| `CLOCKIFY_WORKSPACE_1ST_HOUR` | `68ab4631cdd3100648caf4ed` |
| `CLOCKIFY_WORKSPACE_2ND_HOUR` | `68ab4b8ee201a71118cd502b` |
| `CLOCKIFY_WORKSPACE_3RD_HOUR` | `68ab4d83d138cb5f24c57310` |
| `CLOCKIFY_WORKSPACE_4TH_HOUR` | `68ab4e24e201a71118cd5084` |
| `AUTH_PASSWORD_HASH` | `$2b$10$AkkeJjF2dA0iVsTfQA2PueMtUZiODi0.oRVWEDGdfHTeXUzfd5eF6` |
| `AUTH_SECRET` | `32e213782993697e70dda7e6c5084dfcd00ef6a9afb3146bca1db058d37e2121` |

**Important:** For each variable, make sure all three environments are selected:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Step 4: Redeploy

1. Click "Deployments" in the top menu
2. Find the failed deployment at the top
3. Click the three dots (...) on the right
4. Click "Redeploy"
5. Wait 1-2 minutes for the build to complete

---

## Step 5: Access Your App! 🎉

Once deployment succeeds, you'll see a "Visit" button. Click it or go to:

```
https://clockify-attendance-tracker.vercel.app
```

(The exact URL will be shown in your Vercel dashboard)

**Login with:**
- Password: `Travis3923!`

---

## Security Checklist ✅

Before sharing the URL with anyone:

- [ ] GitHub repository is set to PRIVATE
- [ ] All environment variables are added in Vercel
- [ ] `.env.local` is NOT in your GitHub repository
- [ ] You can successfully log in with your password
- [ ] The app loads and shows your class hours

---

## What's Protected?

Your app is already secure:

1. **Password Protection**: Anyone visiting the URL must log in
2. **Session-Based Auth**: Users stay logged in, but sessions expire
3. **HTTPS Enabled**: All traffic is encrypted (automatic on Vercel)
4. **Private Repository**: Only you can see the source code on GitHub
5. **Environment Variables**: API keys are stored securely in Vercel

---

## Updating Your App Later

When you make changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

Vercel automatically deploys the update within 1-2 minutes!

---

## Troubleshooting

### "Build Failed"
- Check the build logs in Vercel dashboard
- Ensure all environment variables are added
- Try redeploying

### "Can't Log In"
- Make sure `AUTH_PASSWORD_HASH` and `AUTH_SECRET` are set correctly
- Use password: `Travis3923!`
- Clear browser cookies and try again

### "Missing Clockify Data"
- Verify all `CLOCKIFY_WORKSPACE_*` variables are set
- Check that `CLOCKIFY_API_KEY` is correct
- Make sure variables are set for "Production" environment

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/help

---

## Your Deployment URLs

After deployment, save these:

- **Production URL**: https://your-project.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**That's it! Your attendance tracker is now live and accessible from any device! 🚀**
