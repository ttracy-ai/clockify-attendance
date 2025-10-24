# Clockify Attendance Tracker

A Next.js application to track student attendance using Clockify time entries. Built with TypeScript, Tailwind CSS, and featuring a Magic UI-inspired design.

## Features

- 🔐 Password-protected dashboard
- 📊 Real-time attendance checking via Clockify API
- 📁 CSV student list upload
- 📅 Date-based attendance reports
- ✨ Modern, gradient-based UI design
- 🚀 Fast and responsive

## Prerequisites

- Node.js 18+ installed
- A Clockify account with API access
- Student emails matching their Clockify workspace emails

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Clockify API Configuration
CLOCKIFY_API_KEY=your_clockify_api_key_here
CLOCKIFY_WORKSPACE_ID=your_workspace_id_here

# Authentication
AUTH_PASSWORD_HASH=your_bcrypt_password_hash_here
AUTH_SECRET=your-secret-key-min-32-characters-long
```

### 3. Get Your Clockify Credentials

#### API Key:
1. Log in to Clockify
2. Go to Settings → Profile Settings
3. Scroll down to find "API" section
4. Copy your API key

#### Workspace ID:
1. Go to your Clockify workspace
2. The URL will look like: `https://app.clockify.me/tracker/WORKSPACE_ID`
3. Copy the `WORKSPACE_ID` from the URL

Alternatively, run this command (replace YOUR_API_KEY):
```bash
curl -H "X-Api-Key: YOUR_API_KEY" https://api.clockify.me/api/v1/workspaces
```

### 4. Generate Password Hash

Run this command to generate a password hash (replace 'your_password' with your desired password):

```bash
node -e "console.log(require('bcryptjs').hashSync('your_password', 10))"
```

Copy the output and paste it as the value for `AUTH_PASSWORD_HASH` in `.env.local`.

### 5. Generate Auth Secret

Generate a random 32+ character string for `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quick Start with Desktop Shortcut (Windows)

For easy daily access, you can create a desktop shortcut to launch the app with a single click:

### Creating the Desktop Shortcut

1. **Right-click on your Desktop** → Select "New" → "Shortcut"

2. **For the location, paste this path:**
   ```
   "C:\Users\travi\OneDrive\Documents\Projects\Clockify Attendance\clockify-attendance\start-app.bat"
   ```
   *(Adjust the path if you installed the app in a different location)*

3. **Click "Next"**

4. **Name it:** `Clockify Attendance` (or whatever you prefer)

5. **Click "Finish"**

### Optional - Add Custom Icon

- Right-click the new shortcut → "Properties"
- Click "Change Icon"
- Browse to: `C:\Users\travi\OneDrive\Documents\Projects\Clockify Attendance\clockify-attendance\public\logo.png`
- Click "OK"

### How to Use the Shortcut

- **Start the app:** Double-click the desktop icon
- The terminal window will open and start the app automatically
- Your browser will open to http://localhost:3000
- **Keep the terminal window open** (minimize it if you want) - the app runs as long as that window is open
- **Stop the app:** Close the terminal window when you're done

This makes it easy to start your attendance tracker every day with just one click!

## Usage

### 1. Login

Use the password you set when generating the password hash.

### 2. Upload Student List

Prepare a CSV file with student emails. The CSV should have one of these formats:

**Option 1: Single column of emails**
```csv
student1@email.com
student2@email.com
student3@email.com
```

**Option 2: With header**
```csv
email
student1@email.com
student2@email.com
student3@email.com
```

**Option 3: Multiple columns (email will be auto-detected)**
```csv
name,email
John Doe,john@email.com
Jane Smith,jane@email.com
```

### 3. Select Date

Choose the date you want to check attendance for.

### 4. Check Attendance

Click "Check Attendance" to fetch data from Clockify and see:
- Total students
- Number present (logged time on Clockify)
- Number absent (no Clockify entries)
- Lists of present and absent students

## How It Works

The app compares your student list against Clockify time entries:

1. **Present**: Student has ANY time entry logged for the selected date
2. **Absent**: Student has NO time entries for the selected date

The comparison is done by email address (case-insensitive).

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard:
   - `CLOCKIFY_API_KEY`
   - `CLOCKIFY_WORKSPACE_ID`
   - `AUTH_PASSWORD_HASH`
   - `AUTH_SECRET`
6. Deploy!

Vercel will automatically deploy updates when you push to GitHub.

## Security Notes

⚠️ **Important Security Considerations:**

- Never commit `.env.local` to version control
- Keep your API key secure and never share it
- Use a strong password for the dashboard
- When deployed, ensure HTTPS is enabled (automatic on Vercel)
- Regularly rotate your API keys and passwords
- Only share access with authorized personnel

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: bcryptjs + cookies
- **CSV Parsing**: PapaParse
- **Date Handling**: date-fns

## Troubleshooting

### "Missing Clockify API credentials"
- Check that `.env.local` exists and has the correct variables
- Restart the development server after changing `.env.local`

### "Invalid password"
- Verify your password hash was generated correctly
- Make sure you're using the same password you hashed

### "Failed to check attendance"
- Verify your Clockify API key is valid
- Check that the workspace ID is correct
- Ensure students' emails match their Clockify workspace emails exactly

### Student emails not matching
- Clockify emails are case-insensitive, but must match exactly
- Check for extra spaces or different email formats
- Verify students are added to your Clockify workspace

## License

MIT

## Support

For issues or questions, please check:
- [Clockify API Documentation](https://docs.clockify.me/)
- [Next.js Documentation](https://nextjs.org/docs)
