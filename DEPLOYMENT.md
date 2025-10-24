# Deployment Guide

This guide covers deploying your Clockify Attendance Tracker to Vercel (free hosting).

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com) - it's free)
- Your Clockify API credentials
- Your environment variables ready

## Step 1: Push to GitHub

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Clockify Attendance Tracker"
   ```

2. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it (e.g., "clockify-attendance-tracker")
   - Choose "Private" for student data security
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

**⚠️ IMPORTANT:** Make sure `.env.local` is NOT pushed to GitHub (it's in .gitignore by default).

## Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Your Project:**
   - Click "Add New" → "Project"
   - Find your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (should be auto-detected)
   - **Root Directory:** `./` (leave as default)
   - Click "Deploy" (it will fail first - that's expected)

## Step 3: Add Environment Variables

After the first deployment attempt:

1. Go to your project settings on Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:

   | Name | Value |
   |------|-------|
   | `CLOCKIFY_API_KEY` | Your Clockify API key |
   | `CLOCKIFY_WORKSPACE_ID` | Your workspace ID |
   | `AUTH_PASSWORD_HASH` | Your password hash |
   | `AUTH_SECRET` | Your auth secret |

4. Make sure to select "Production", "Preview", and "Development" for each variable

## Step 4: Redeploy

1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

## Step 5: Access Your App

Once deployed, you'll get a URL like:
```
https://your-project-name.vercel.app
```

Visit this URL and login with your password!

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment

## Custom Domain (Optional)

To use your own domain (e.g., attendance.yourschool.com):

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Security Checklist

Before going live, ensure:

- [ ] `.env.local` is in `.gitignore` and NOT in your repository
- [ ] Repository is set to Private on GitHub
- [ ] Strong password is used (at least 12 characters)
- [ ] Clockify API key is kept secret
- [ ] Only authorized personnel have the login password
- [ ] HTTPS is enabled (automatic on Vercel)

## Updating Your App

To update your deployed app:

1. Make changes locally
2. Test thoroughly with `npm run dev`
3. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Vercel automatically deploys the update

## Troubleshooting Deployment

### Build Failed
**Check:**
- Run `npm run build` locally first
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### App Loads but Shows Errors
**Check:**
- All environment variables are set correctly in Vercel
- No typos in environment variable names
- Environment variables are set for Production environment

### "Missing Clockify API credentials"
**Check:**
- Environment variables are added in Vercel dashboard
- Variables are set for the correct environment (Production)
- You redeployed after adding environment variables

### Authentication Not Working
**Check:**
- `AUTH_PASSWORD_HASH` is correctly set
- `AUTH_SECRET` is set (minimum 32 characters)
- You're using the correct password (the one you hashed, not the hash itself)

## Monitoring

**Vercel Analytics:**
- Enable in Project Settings → Analytics
- Track page views, performance, etc.

**Error Monitoring:**
- Check "Functions" tab in Vercel dashboard
- View real-time logs for API routes

## Costs

**Free Tier Includes:**
- Unlimited deployments
- 100GB bandwidth per month
- Custom domains
- HTTPS certificates
- Preview deployments

This should be sufficient for classroom use. If you exceed limits, Vercel will notify you.

## Backup Strategy

**Recommended:**
1. Keep your `.env.local` backed up securely (offline, encrypted)
2. Export student lists regularly
3. Document any custom changes you make

## Support

If you encounter issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Production Best Practices

1. **Test First:**
   - Test with a small student list first
   - Verify attendance checking works correctly
   - Test on different dates

2. **Communicate:**
   - Inform students about the attendance tracking
   - Ensure they know their Clockify entries are being monitored
   - Provide clear guidelines on logging time

3. **Regular Checks:**
   - Check attendance daily during class hours
   - Follow up with absent students promptly
   - Keep records of attendance patterns

4. **Maintenance:**
   - Update dependencies regularly: `npm update`
   - Monitor Vercel dashboard for issues
   - Rotate API keys and passwords periodically

Congratulations! Your attendance tracker is now live! 🎉
