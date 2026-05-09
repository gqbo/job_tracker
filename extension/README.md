# JobTrackr Browser Extension

Save job postings to JobTrackr with one click. The extension reads the current tab's HTML, sends it to the Vercel Function for AI extraction, lets you review/edit the result, then saves it to Supabase.

## Requirements

- Chrome 116+ (Manifest V3)
- A deployed JobTrackr instance (Vercel deployment)
- Node.js 18+ for building

## Environment Variables (set before building)

The extension reads Supabase credentials at build time via Vite `define()`:

```bash
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
export VITE_API_BASE_URL=https://your-vercel-deploy.vercel.app
```

Or create an `extension/.env.local` file with those three variables (gitignored).

## Build

```bash
cd extension
npm install
npm run build
# Output: extension/dist/
```

## Sideload in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist/` directory

The JobTrackr icon should appear in your Chrome toolbar.

## Connect to Your Account

The extension needs your Supabase session once to work:

1. Open the JobTrackr web app and sign in
2. Click **Connect Extension** in the sidebar (bottom, below your email)
3. Your session JSON is copied to the clipboard automatically
4. Click the JobTrackr extension icon in Chrome
5. Paste the JSON into the "Paste session JSON" textarea
6. The extension is now connected — you stay connected until your refresh token expires (~30 days)

If the session expires: repeat steps 2–6.

## Usage

1. Navigate to a job posting (LinkedIn, Indeed, Greenhouse, Lever, etc.)
2. Click the JobTrackr extension icon
3. Click **Extract Job**
4. Review/edit the 6 extracted fields (company, role, modality, location, salary, source)
5. Click **Save**
6. The job appears in your JobTrackr dashboard on next refresh

## Running Tests

```bash
cd extension
npm run test
```

Tests cover the `clean-html.ts` utility (pure function, no Chrome APIs needed).

## Extension Permissions

- `activeTab` — read the current tab's DOM when you click Extract
- `storage` — store your Supabase session (so you only need to paste it once)
- `scripting` — inject the content script to read the page HTML

No `host_permissions`. No broad network access patterns.
