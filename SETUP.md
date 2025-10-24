# Quick Setup Guide

Follow these steps to get your Clockify Attendance Tracker up and running.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Generate Your Password Hash

Run the password generator script:

```bash
node scripts/generate-password.js
```

Enter your desired password when prompted. Copy the generated hash.

## Step 3: Generate Auth Secret

Run the secret generator script:

```bash
node scripts/generate-secret.js
```

Copy the generated secret key.

## Step 4: Get Your Clockify Credentials

### Get API Key:
1. Log into [Clockify](https://app.clockify.me)
2. Click your profile picture → Profile settings
3. Scroll to the "API" section at the bottom
4. Copy your API key

### Get Workspace ID:
**Method 1 (Easy):**
1. Open your Clockify workspace
2. Look at the URL in your browser
3. The URL format is: `https://app.clockify.me/tracker/XXXXXXXXXXXXXXXX`
4. Copy the `XXXXXXXXXXXXXXXX` part - that's your Workspace ID

**Method 2 (Using API):**
```bash
curl -H "X-Api-Key: YOUR_API_KEY" https://api.clockify.me/api/v1/workspaces
```

Look for the `"id"` field in the response.

## Step 5: Create .env.local File

Create a file named `.env.local` in the root directory and paste:

```env
# Clockify API Configuration
CLOCKIFY_API_KEY=paste_your_api_key_here
CLOCKIFY_WORKSPACE_ID=paste_your_workspace_id_here

# Authentication (from step 2 and 3)
AUTH_PASSWORD_HASH=paste_hash_from_step_2_here
AUTH_SECRET=paste_secret_from_step_3_here
```

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Login

Use the password you entered in Step 2 (NOT the hash - the actual password).

## Step 8: Prepare Your Student List

Create a CSV file with your students' emails. Example:

```csv
email
john.doe@school.edu
jane.smith@school.edu
bob.johnson@school.edu
```

**Important:** The emails in your CSV must EXACTLY match the emails your students use in Clockify.

## Step 9: Use the App

1. Click "Choose File" and upload your student CSV
2. Select the date you want to check
3. Click "Check Attendance"
4. View who's absent and who's present

## Common Issues

### Issue: "Missing Clockify API credentials"
**Solution:** Make sure your `.env.local` file exists and has all required variables. Restart the dev server after creating/editing `.env.local`.

### Issue: "Invalid password"
**Solution:**
- Make sure you're entering the PASSWORD (not the hash)
- The password should be the same one you used in Step 2
- Try regenerating the hash with `node scripts/generate-password.js`

### Issue: "Failed to check attendance"
**Solution:**
- Verify your Clockify API key is correct
- Check that the Workspace ID matches your workspace
- Make sure your students are members of your Clockify workspace
- Ensure students' emails in CSV match their Clockify emails exactly

### Issue: All students showing as absent
**Solution:**
- Check that students actually logged time in Clockify for the selected date
- Verify emails match exactly (case-insensitive, but spelling must match)
- Ensure you're checking the correct workspace
- Try testing with your own email to verify the integration works

## Next Steps

### For Production Deployment:

1. Push your code to GitHub (make sure `.env.local` is NOT committed!)
2. Create a Vercel account at [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel project settings
5. Deploy!

See the main [README.md](README.md) for full documentation.

## Need Help?

- [Clockify API Docs](https://docs.clockify.me/)
- [Next.js Docs](https://nextjs.org/docs)
- Check that all prerequisites are met (Node.js 18+, valid Clockify account, etc.)
