# CreatedSounds License Server — Step-by-Step Setup

> **New to this? Start here instead:** [SETUP_FROM_ZERO.md](./SETUP_FROM_ZERO.md)  
> That guide assumes zero prior knowledge and walks through every click.

This folder is a **complete starter** for your Bloom license server.
You do **not** need prior backend experience. Follow the steps in order.

---

## What you are building (big picture)

```
Customer pays on Shopify
        ↓
Shopify tells YOUR server "order paid"
        ↓
Your server creates a license key, saves it, emails the customer
        ↓
Customer opens Bloom, pastes the key
        ↓
Bloom asks YOUR server "is this key OK on this computer?"
        ↓
Server says yes → Bloom saves the key and works
```

**Three pieces:**
1. **This server** (runs on the internet 24/7)
2. **A database** (stores keys and which computers used them)
3. **Bloom** (you'll add activation UI later — not in this folder yet)

---

## What you need before starting

- A Mac (you have one)
- Your Shopify store (createdsounds.com)
- About 2–3 hours for first-time setup
- A credit card for hosting (~$5/month on Railway after free trial)

**Accounts to create:**
1. [Railway](https://railway.app) — hosts your server + database
2. [Resend](https://resend.com) — sends license key emails (free tier is fine)

---

# PART 1 — Install Node.js on your Mac

Node.js runs the server code on your computer (for testing) and on Railway (for real).

1. Go to https://nodejs.org
2. Download the **LTS** version (20 or newer)
3. Install it (double-click the installer)
4. Open **Terminal** and check:

```bash
node --version
npm --version
```

You should see version numbers (e.g. `v20.x.x`). If not, quit Terminal and reopen it.

---

# PART 2 — Run the server on your Mac (local test)

## Step 2.1 — Open the project folder

In Terminal:

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
```

## Step 2.2 — Install dependencies

```bash
npm install
```

This downloads the libraries the server needs (Express, database driver, etc.).

## Step 2.3 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` in a text editor. You'll fill it in gradually.

For **local testing only**, you can use Railway's database URL later.
For now, skip to Part 3 to create Railway + database first, then come back.

---

# PART 3 — Create Railway project + database

Railway is where your server lives on the internet.

## Step 3.1 — Sign up

1. Go to https://railway.app
2. Sign up with GitHub (easiest)

## Step 3.2 — New project

1. Click **New Project**
2. Choose **Provision PostgreSQL** (this is your database)
3. Click the Postgres service → **Variables** tab
4. Copy **`DATABASE_URL`** — it looks like:
   `postgresql://postgres:password@something.railway.app:5432/railway`

## Step 3.3 — Create and open the `.env` file on your Mac

The `.env` file is a **settings file** on your Mac. It stores your database password.
Files that start with a dot (`.env`) are **hidden in Finder** by default — that's why this step is confusing.

### 3.3a — Create the file (if you haven't yet)

1. Open **Terminal** (Command + Space → type `Terminal` → Enter)
2. Copy and paste this line, press **Enter**:

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
```

3. Copy and paste this line, press **Enter**:

```bash
cp .env.example .env
```

This creates `.env` by copying the template. You only do this **once**.

### 3.3b — Open the file in TextEdit (easiest way)

**Still in Terminal**, copy and paste this line, press **Enter**:

```bash
open -a TextEdit .env
```

**TextEdit opens** with a document showing several lines of settings. That **is** your `.env` file.

### 3.3c — Paste your database URL

1. In TextEdit, find the line that starts with `DATABASE_URL=`
2. Click at the end of that line (after the `=`)
3. **Delete** the fake placeholder text after `=`
4. **Paste** the real `DATABASE_URL` you copied from Railway in Step 3.2

It should look like one long line, for example:

```
DATABASE_URL=postgresql://postgres:somepassword@containers-us-west-123.railway.app:6543/railway
```

5. **File → Save** in TextEdit
6. Close TextEdit

**Leave the other lines alone for now.**

### Alternative — open via Finder (if you prefer)

1. Open **Finder**
2. Press **Command + Shift + G** (Go to Folder)
3. Paste this path and press **Enter**:

```
/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server
```

4. Press **Command + Shift + .** (period) — this **shows hidden files**
5. You should now see a file named **`.env`**
6. Right-click `.env` → **Open With** → **TextEdit**

If you **don't** see `.env`, go back to step 3.3a and run `cp .env.example .env` in Terminal first.

## Step 3.4 — Create database tables

Back in Terminal (in the license-server folder):

```bash
npm run init-db
```

You should see: `Database tables created (or already exist).`

**What just happened:** Two tables were created:
- `licenses` — every key you generate
- `activations` — which computers used each key

---

# PART 4 — Test activation locally (no Shopify yet)

## Step 4.1 — Insert a fake test license

**What this does:** Puts one pretend license key (`BLOOM-TEST-1111-AAAA`) in your database so you can test activation.

**You do NOT need to find a SQL screen in Railway.** Use Terminal instead.

### 4.1a — Open Terminal

Command + Space → type `Terminal` → Enter

### 4.1b — Go to the license-server folder

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
```

### 4.1c — Run this one command

```bash
npm run seed-test-license
```

**✅ Success looks like:**

```
  Test license ready!
  -------------------
  Key:   BLOOM-TEST-1111-AAAA
  Email: test@createdsounds.com
```

That means the fake key is now in your database. **Continue to Step 4.2.**

**❌ "relation licenses does not exist"** → Run `npm run init-db` first (Step 3.4), then try again.

**❌ Database connection error** → Your `.env` file `DATABASE_URL` is wrong. Redo Step 3.3.

---

### Optional — if you really want to use Railway's website instead

Railway's layout changes, but usually:

1. Go to **https://railway.app** and open your project
2. Click the **Postgres** box (the database — not your web app)
3. Look at the top tabs: try **Data**, then **Query**
4. If you see a text box for SQL, paste:

```sql
INSERT INTO licenses (license_key, email, shopify_order_id, product_name)
VALUES ('BLOOM-TEST-1111-AAAA', 'you@example.com', 'test-order-1', 'Bloom');
```

5. Click **Run** or **Execute**

If you **don't** see any way to run SQL, that's normal — just use `npm run seed-test-license` above. It's easier.

## Step 4.2 — Start the server

```bash
npm start
```

You should see: `License server listening on port 3000`

Leave this Terminal window open.

## Step 4.3 — Test with curl (open a NEW Terminal window)

```bash
curl -X POST http://localhost:3000/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"my-laptop-123"}'
```

**Expected response:**
```json
{"success":true,"message":"Bloom is activated. Thank you for your purchase!"}
```

## Step 4.4 — Test validate

```bash
curl -X POST http://localhost:3000/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"my-laptop-123"}'
```

Should also return `"success": true`.

## Step 4.5 — Test "too many computers"

```bash
curl -X POST http://localhost:3000/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"different-computer-456"}'
```

First time: success (2nd machine allowed).

Run again with a **third** machine id:

```bash
curl -X POST http://localhost:3000/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"third-computer-789"}'
```

Should return failure — too many activations.

**If all of this works, your core logic is correct.**

---

# PART 5 — Deploy to the internet (Railway)

Now put the server online so Bloom and Shopify can reach it.

## Step 5.1 — Put your code on GitHub

Railway deploys from GitHub — it can't see the files on your Mac. You need to upload your license-server folder to GitHub first.

> **Using SETUP_FROM_ZERO.md?** Step 5 there is broken into 5.1 (account), 5.2 (create repo), 5.3 (upload files). This section covers all of that.

### Do you already have GitHub?

If you logged into Railway with **GitHub** in Step 3, you already have an account — skip to **"Create the repository"** below.

### Create a GitHub account (only if needed)

1. Go to **https://github.com/signup**
2. Email → password → username → verify email
3. Choose the **Free** plan

### Create the repository

1. Log in at **https://github.com**
2. Click **+** (top right) → **New repository**
3. Name: `createdsounds-license-server`
4. Public or Private — either is fine
5. **Do NOT** check "Add a README file"
6. Click **Create repository**

### Upload your files (drag and drop — no git commands)

1. On the new repo page, click **uploading an existing file**
2. In Finder, open:
   `Documents → juce projects → test june 7 → Distribution → license-server`
3. Drag these into GitHub:
   - `package.json`
   - `package-lock.json` (if you see it)
   - `.env.example`
   - `.gitignore`
   - `SETUP.md`, `SETUP_FROM_ZERO.md`
   - the entire **`src`** folder
4. **Do NOT upload:**
   - `.env` (secrets)
   - `node_modules` (huge folder — skip it)
5. Scroll down → commit message: `Initial license server`
6. Click **Commit changes**

**✅ Success:** Refresh the repo page — you see `src`, `package.json`, etc.

### Alternative — deploy from your Bloom repo without a separate GitHub repo

In Railway: New Service → GitHub Repo → select your Bloom repo → set **Root Directory** to `Distribution/license-server`

## Step 5.2 — Add the server service on Railway

1. In your Railway project, click **New** → **GitHub Repo**
2. Select the repo with this license-server code
3. Railway will detect Node.js and start building

## Step 5.3 — Set environment variables

Click your **web service** (not Postgres) → **Variables** tab.

Add these (same as your `.env`):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Copy from Postgres service (or reference it) |
| `SHOPIFY_WEBHOOK_SECRET` | You'll get this in Part 6 |
| `RESEND_API_KEY` | From Part 7 |
| `EMAIL_FROM` | e.g. `Bloom <licenses@createdsounds.com>` |
| `BLOOM_PRODUCT_MATCH` | `Bloom` |
| `PORT` | Railway sets this automatically — usually don't need to |

## Step 5.4 — Set start command

In Railway service settings, ensure **Start Command** is:

```
npm start
```

## Step 5.5 — Get your public URL

1. Click your web service → **Settings** → **Networking**
2. Click **Generate Domain**
3. You'll get something like: `https://createdsounds-license-server-production.up.railway.app`

## Step 5.6 — Test live server

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return: `{"ok":true,"service":"createdsounds-license-server"}`

## Step 5.7 — Run init-db on production

In Railway, open your web service → **Settings** → run a one-off command, OR locally with production DATABASE_URL:

```bash
DATABASE_URL="your-production-url" npm run init-db
```

---

# PART 6 — Connect Shopify

When someone pays, Shopify must notify your server.

## Step 6.1 — Create the webhook in Shopify

1. Shopify Admin → **Settings** → **Notifications**
2. Scroll to **Webhooks** → **Create webhook**
3. Set:
   - **Event:** Order payment
   - **Format:** JSON
   - **URL:** `https://YOUR-RAILWAY-URL.up.railway.app/shopify/order-paid`
4. Save

## Step 6.2 — Copy the webhook signing secret

After creating the webhook, Shopify shows a **signing secret** (or find it in the webhook details).

Put it in Railway variables:

```
SHOPIFY_WEBHOOK_SECRET=the-secret-from-shopify
```

Redeploy if needed.

## Step 6.3 — Match your product name

In `.env` / Railway:

```
BLOOM_PRODUCT_MATCH=Bloom
```

The server only creates a key if the order contains a product whose **title** or **SKU** includes "Bloom" (case-insensitive). Change this to match your exact Shopify product name.

## Step 6.4 — Test with a Shopify test order

1. Shopify Admin → enable **test mode** or use Bogus Gateway
2. Place an order for Bloom
3. Check Railway **Logs** — you should see `created license BLOOM-...`
4. Check your email for the key
5. Check database — new row in `licenses` table

---

# PART 7 — Set up email (Resend)

## Step 7.1 — Create Resend account

1. Go to https://resend.com
2. Sign up

## Step 7.2 — Verify your domain (recommended)

1. In Resend → **Domains** → Add `createdsounds.com`
2. Add the DNS records Resend gives you (in your domain registrar)
3. Wait for verification

Until verified, you can use Resend's test address for development only.

## Step 7.3 — Create API key

1. Resend → **API Keys** → Create
2. Copy the key (starts with `re_`)
3. Add to Railway: `RESEND_API_KEY=re_...`
4. Set `EMAIL_FROM=Bloom <licenses@createdsounds.com>`

---

# PART 8 — Custom domain (optional but professional)

Instead of `something.up.railway.app`, use:

```
https://api.createdsounds.com
```

1. In Railway → your service → **Custom Domain** → add `api.createdsounds.com`
2. In your domain DNS, add the CNAME record Railway shows
3. Wait for SSL (automatic)

Use this URL everywhere instead of the Railway default.

---

# PART 9 — Connect Bloom (later)

When the server works end-to-end, add licensing back to Bloom:

1. Bloom sends `POST https://api.createdsounds.com/licenses/activate`
2. Bloom sends `POST https://api.createdsounds.com/licenses/validate`
3. Request body both times:
   ```json
   { "license_key": "...", "machine_id": "..." }
   ```
4. Save the key locally after success
5. Mute audio until licensed

We removed licensing from Bloom earlier — you'll add it back when the server is live.

---

# Quick reference — API endpoints

| Endpoint | Who calls it | Purpose |
|----------|--------------|---------|
| `GET /health` | You (testing) | Check server is alive |
| `POST /licenses/activate` | Bloom | First activation on a computer |
| `POST /licenses/validate` | Bloom | Re-check on plugin open |
| `POST /shopify/order-paid` | Shopify | Create key when order is paid |

---

# Troubleshooting

**"Database connection failed"**
- Check `DATABASE_URL` is correct in Railway variables
- Run `npm run init-db` again

**Shopify webhook returns 401**
- `SHOPIFY_WEBHOOK_SECRET` doesn't match Shopify's signing secret

**No email received**
- Check Railway logs for errors
- Verify Resend API key and domain
- Without `RESEND_API_KEY`, the server still creates keys but only logs them

**Order paid but no license**
- Check Railway logs
- Confirm product title contains "Bloom" (or whatever `BLOOM_PRODUCT_MATCH` is)
- Confirm webhook URL is correct and HTTPS

---

# Monthly cost estimate

| Service | Cost |
|---------|------|
| Railway (server + Postgres) | ~$5–10/month |
| Resend | Free for low volume |
| Custom domain | You already have this |

---

# Your checklist (in order)

- [ ] Install Node.js
- [ ] `npm install` in license-server folder
- [ ] Create Railway + Postgres
- [ ] Set `DATABASE_URL`, run `npm run init-db`
- [ ] Insert test license, test with curl locally
- [ ] Deploy to Railway, test `/health`
- [ ] Set up Resend, add `RESEND_API_KEY`
- [ ] Create Shopify webhook, add `SHOPIFY_WEBHOOK_SECRET`
- [ ] Place test order, receive email with key
- [ ] Add licensing UI back to Bloom
- [ ] End-to-end test in Ableton

---

When you're ready for Part 9 (Bloom plugin side), say the word and we can add the activation screen back to match this server exactly.
