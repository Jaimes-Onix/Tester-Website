# Connecting the contact form to Google Sheets

The contact form under the hero posts to the Express backend (`server.js`), which
appends each submission as a row in a Google Sheet. This guide wires that up.

> **You can skip this for now.** Without credentials, the backend still accepts
> submissions and runs the full redirect flow — it just logs them to the console
> instead of saving them. Fill these in when you're ready to actually capture leads.

---

## What each submission becomes

One row per submission, appended to the sheet:

| A (Timestamp) | B (Name) | C (Email) | D (Message) |
| --- | --- | --- | --- |
| 2026-06-04T18:22:01.512Z | Ada Lovelace | ada@example.com | Loved the demo! |

---

## Step 1 — Create the Google Sheet

1. Go to <https://sheets.google.com> and create a blank spreadsheet.
2. (Optional) Put headers in row 1: `Timestamp`, `Name`, `Email`, `Message`.
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_ID`**`/edit`
   → paste it into `GOOGLE_SHEET_ID` in `.env.local`.

## Step 2 — Create a Google Cloud project + enable the Sheets API

1. Open <https://console.cloud.google.com> and create a project (or pick one).
2. Go to **APIs & Services → Library**, search **Google Sheets API**, click **Enable**.

## Step 3 — Create a service account + key

1. **APIs & Services → Credentials → Create credentials → Service account**.
2. Give it a name (e.g. `tester-contact-form`) and create it. No roles are needed.
3. Open the service account → **Keys → Add key → Create new key → JSON**. A `.json`
   file downloads. **Keep it private — never commit it.**

The JSON contains two values you need:
- `client_email`  → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key`   → `GOOGLE_PRIVATE_KEY`

## Step 4 — Share the Sheet with the service account

The service account is its own "user". Open your Sheet → **Share** → paste the
`client_email` address → give it **Editor** access → Send. Without this you'll get
a `403 PERMISSION_DENIED`.

## Step 5 — Put the credentials in `.env.local`

`.env.local` is gitignored, so secrets never reach GitHub. Fill in:

```env
PORT=5000
GOOGLE_SHEET_ID=1AbC...the-id-from-the-url
GOOGLE_SERVICE_ACCOUNT_EMAIL=tester-contact-form@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_RANGE=Sheet1!A:D
```

### About `GOOGLE_PRIVATE_KEY`
The key in the JSON file already contains `\n` escape sequences. Copy the whole
`private_key` value **including the quotes and the `\n`s** onto a single line.
`server.js` converts the `\n`s back into real newlines at runtime.

If your tab isn't named `Sheet1`, update `GOOGLE_SHEET_RANGE` (e.g. `Leads!A:D`).

---

## Running it

Two terminals (dev):

```bash
npm run server   # Express API on http://localhost:5000  (reads .env.local)
npm run dev      # Vite front-end on http://localhost:3000 (proxies /api → :5000)
```

Open <http://localhost:3000>, scroll to the contact form, and submit. Check the
console — on success you'll either see the row saved or, if creds are missing, the
logged submission. Confirm a new row in your Sheet.

### Verify the backend sees your config
```bash
curl http://localhost:5000/api/health
# { "ok": true, "sheets": true }   ← "sheets": true means credentials loaded
```

## Production

```bash
npm run build    # outputs dist/
npm start        # Express serves dist/ + public/ AND /api on one port (5000)
```

Then the whole site + form runs from `http://localhost:5000` with no proxy needed.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `403 PERMISSION_DENIED` | You didn't share the Sheet with the service-account email (Step 4). |
| `error:1E08010C ... DECODER routines` | `GOOGLE_PRIVATE_KEY` newlines are wrong — keep the `\n`s and wrap in `"`. |
| `Unable to parse range` | Tab name in `GOOGLE_SHEET_RANGE` doesn't match your sheet. |
| Form says "couldn't save" | Check the `npm run server` terminal for the real error. |
| `"sheets": false` at `/api/health` | One of the three env vars is empty. |
