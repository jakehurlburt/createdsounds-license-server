# Bloom License Server — Complete Beginner Guide

**Read this whole intro once, then do ONLY Step 1. When Step 1 works, do Step 2. Do not skip ahead.**

You are building a small website-backend that:
- Creates a license key when someone buys Bloom on Shopify
- Emails them the key
- Checks the key when they open Bloom (you'll connect Bloom later)

**You do NOT need to know programming.** You will copy and paste commands and click buttons.

**Time:** Plan 2–4 hours spread over a day or two. Take breaks.

**Cost:** About $5/month for hosting after Railway's trial.

---

## Words you'll see (quick dictionary)

| Word | Meaning |
|------|---------|
| **Terminal** | A text window on your Mac where you type commands |
| **Server** | A program running 24/7 on the internet that answers requests |
| **Database** | A spreadsheet-like storage for keys and activations |
| **API** | URLs your plugin calls, like `/licenses/activate` |
| **Webhook** | Shopify automatically calling your server when someone pays |
| **Environment variable** | A secret setting (password, API key) stored on the server — not in your code |
| **Deploy** | Put your code on the internet so it's always running |
| **localhost** | "This Mac only" — for testing before going live |

---

## What you'll create accounts for

1. **Railway** — runs your server + database online
2. **Resend** — sends license key emails
3. **GitHub** — stores your server code so Railway can deploy it (free)

You already have **Shopify** for your store.

---

# STEP 1 — Install Node.js

**Goal:** Install the tool that runs the server code on your Mac.

### 1.1 Open Safari (or Chrome)

Go to: **https://nodejs.org**

### 1.2 Download

Click the big green button that says **LTS** (recommended).

A file like `node-v20.x.x.pkg` downloads.

### 1.3 Install

1. Open your **Downloads** folder
2. Double-click the `.pkg` file
3. Click **Continue** → **Continue** → **Agree** → **Install**
4. Enter your Mac password if asked
5. Click **Close** when done

### 1.4 Open Terminal

1. Press **Command + Space** (opens Spotlight search)
2. Type: `Terminal`
3. Press **Enter**

A window opens with a blinking cursor. This is Terminal.

### 1.5 Check Node installed

Click inside Terminal. Copy this entire line, paste it (Command+V), press **Enter**:

```bash
node --version
```

**✅ Success looks like:** `v20.11.0` (any v20 or v22 number is fine)

**❌ If it says "command not found":**
- Quit Terminal completely (Terminal menu → Quit Terminal)
- Open Terminal again
- Try `node --version` again
- If still broken, restart your Mac and try again

### 1.6 Check npm (comes with Node)

```bash
npm --version
```

**✅ Success:** A number like `10.2.4`

**STOP HERE.** Step 1 is done when both commands show version numbers.

---

# STEP 2 — Open the license server folder and install

**Goal:** Download the small libraries the server needs.

### 2.1 Go to the folder in Terminal

Copy and paste this **entire** line into Terminal, press **Enter**:

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
```

**What this does:** "Change directory" to your license server folder. The quotes are required because your folder name has spaces.

**✅ Success:** No error message. The prompt might change slightly.

**❌ If "no such file or directory":** The folder path is wrong. In Finder, go to `Documents → juce projects → test june 7 → Distribution → license-server`. Drag the `license-server` folder into Terminal — it will paste the correct path. Type `cd ` before the path.

### 2.2 Install libraries

```bash
npm install
```

**✅ Success:** Takes 10–30 seconds. Ends quietly or says `added X packages`. A new folder called `node_modules` appears (you can ignore it).

**❌ Red error text:** Copy the error and ask for help. Common fix: make sure Step 1 worked.

**STOP HERE.** Step 2 is done when `npm install` finishes without errors.

---

# STEP 3 — Create your Railway account and database

**Goal:** Create the online database where license keys will be stored.

### 3.1 Sign up for Railway

1. Go to **https://railway.app**
2. Click **Login** or **Start a New Project**
3. Choose **Login with GitHub**
4. If you don't have GitHub, see **Step 3A** at the bottom of this file first, then come back

### 3.2 Create a new project

1. Click **New Project**
2. Click **Provision PostgreSQL**

You now have a project with a **Postgres** box on screen. That's your database.

### 3.3 Copy the database connection string

1. Click the **Postgres** box (not empty space — the actual Postgres service)
2. Click the **Variables** tab at the top
3. Find **`DATABASE_URL`**
4. Click the **copy** icon next to the value (or click the value to reveal and copy)

It looks like:
```
postgresql://postgres:somepassword@containers-us-west-xxx.railway.app:6543/railway
```

**Keep this somewhere safe temporarily** (Notes app). This is a password — don't post it publicly.

### 3.4 Create your `.env` file on your Mac

The `.env` file holds secrets for local testing.

**3.4a — Copy the template**

In Terminal (still in the license-server folder):

```bash
cp .env.example .env
```

**3.4b — Open the file in TextEdit**

```bash
open -a TextEdit .env
```

TextEdit opens with several lines.

**3.4c — Edit DATABASE_URL**

Find the line:
```
DATABASE_URL=postgresql://user:password@host:5432/railway
```

Delete everything after the `=` and paste your real Railway `DATABASE_URL` from step 3.3.

Example:
```
DATABASE_URL=postgresql://postgres:realpassword@containers-us-west-123.railway.app:6543/railway
```

**Leave the other lines alone for now.** We'll fill them in later steps.

**3.4d — Save**

TextEdit: **File → Save**, then close TextEdit.

### 3.5 Create the database tables

Back in Terminal:

```bash
npm run init-db
```

**✅ Success:** `Database tables created (or already exist).`

**❌ Connection error:** Your `DATABASE_URL` in `.env` is wrong. Open `.env` again and re-copy from Railway.

**STOP HERE.** Step 3 is done when `init-db` succeeds.

---

# STEP 4 — Test the server on your Mac (no internet deploy yet)

**Goal:** Prove activate/validate works before involving Shopify.

### 4.1 Add a fake test license to the database

**What this does:** Adds one pretend key so you can test Bloom activation later.

**You do NOT need Railway's SQL screen.** Run one command in Terminal.

**4.1a — Open Terminal**

Command + Space → `Terminal` → Enter

**4.1b — Go to the folder**

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
```

**4.1c — Run this**

```bash
npm run seed-test-license
```

**✅ Success:**

```
  Test license ready!
  Key:   BLOOM-TEST-1111-AAAA
```

You're done with 4.1. Go to 4.2.

**❌ "relation licenses does not exist"** → Run `npm run init-db` (Step 3.5), then try again.

---

<details>
<summary><strong>Optional: run SQL inside Railway instead (click to expand)</strong></summary>

Only use this if you prefer the website over Terminal.

1. Browser → **railway.app** → your project
2. Click the **Postgres** service (database icon/box)
3. Top of the page — click tabs one by one: **Data**, **Query**, or **Connect**
4. **Data tab:** Sometimes shows tables. Click `licenses` if you see it — some Railway versions have a **Query** button here.
5. **Query tab:** If you see a big text box, paste:

```sql
INSERT INTO licenses (license_key, email, shopify_order_id, product_name)
VALUES ('BLOOM-TEST-1111-AAAA', 'you@youremail.com', 'test-order-1', 'Bloom');
```

6. Press **Run** / **Execute**

**Can't find any SQL box?** That's fine. Use `npm run seed-test-license` — it does the same thing.

</details>

### 4.2 Start the server on your Mac

In Terminal (license-server folder):

```bash
npm start
```

**✅ Success:**
```
License server listening on port 3000
```

**The Terminal window must stay open.** The server is running. Don't close this window.

### 4.3 Test activation (second Terminal window)

**4.3a — Open a NEW Terminal window**

- Terminal menu → **Shell → New Window**  
  (or Command+N)

**4.3b — Run the test command**

Copy this entire block, paste, press Enter:

```bash
curl -X POST http://localhost:3000/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"my-laptop-123"}'
```

**✅ Success looks exactly like:**
```json
{"success":true,"message":"Bloom is activated. Thank you for your purchase!"}
```

**❌ "Connection refused":** The server isn't running. Go back to the first Terminal — is `npm start` still running?

**❌ `"success":false` with invalid key:** The test license wasn't inserted in the database. Redo Step 4.1.

### 4.4 Test validate

In the same (second) Terminal:

```bash
curl -X POST http://localhost:3000/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"my-laptop-123"}'
```

**✅ Success:** `"success":true` again.

### 4.5 Stop the local server

Click the **first** Terminal window (where `npm start` is running).

Press **Control + C** on your keyboard.

Server stops. You'll do this whenever you're done testing locally.

**STOP HERE.** Step 4 is done when activate and validate both return success.

**🎉 This is a big milestone.** The brain of your licensing works.

---

# STEP 5 — Put your code on GitHub

**Goal:** Railway needs your code on GitHub to deploy it to the internet.

### 5.1 Create a GitHub account (skip if you have one)

**What is GitHub?**
GitHub is a free website that stores your code online — like Google Drive, but for code files.

**Why do you need it?**
Railway (where your server runs) does **not** read files from your Mac directly. It pulls your code **from GitHub**. So you upload the license-server files to GitHub once, then Railway grabs them from there.

**You are NOT learning git commands for this.** Step 5.3 uses drag-and-drop in the browser.

---

**Do you already have GitHub?**

- If you signed up for **Railway using "Login with GitHub"** in Step 3 — **you already have an account.** Skip to **Step 5.2**.
- If you're not sure, go to **https://github.com** and try to log in.

---

**If you need a new account:**

1. Open your browser
2. Go to **https://github.com/signup**
3. Enter your **email address** (use one you check regularly)
4. Choose a **password**
5. Pick a **username** (example: `jakehurlburt` or `createdsounds` — anything not taken)
6. Solve the puzzle if it asks
7. Check your email and click GitHub's **verify** link
8. Answer the short setup questions (you can skip most — choose "Free" plan)

**✅ You're done with 5.1 when:** You can log in at github.com and see the GitHub homepage (your profile icon top-right).

**You do NOT need to create a repository yet — that's Step 5.2.**

### 5.2 Create a new empty repository

1. GitHub → click **+** (top right) → **New repository**
2. Name: `createdsounds-license-server`
3. Leave it **Public** or **Private** (either works)
4. **Do NOT** check "Add README"
5. Click **Create repository**

GitHub shows a page with setup instructions. Keep it open.

### 5.3 Upload the license-server files to GitHub

**Easiest method — GitHub website (no git commands):**

1. On your new repo page, click **uploading an existing file**
2. Open Finder → go to:
   `Documents → juce projects → test june 7 → Distribution → license-server`
3. Select **everything inside** license-server EXCEPT `node_modules`:
   - `package.json`
   - `package-lock.json` (if it exists)
   - `.env.example`
   - `.gitignore`
   - `SETUP.md`
   - `SETUP_FROM_ZERO.md`
   - the whole `src` folder
4. Drag those into the GitHub upload area
5. **Do NOT upload `.env`** (has secrets) — it should be gitignored anyway
6. **Do NOT upload `node_modules`** (huge folder)
7. Scroll down → Commit message: `Initial license server`
8. Click **Commit changes**

**✅ Success:** You see your files on GitHub in the browser.

---

# STEP 6 — Deploy the server to Railway (make it live on the internet)

**Goal:** Your server runs 24/7 at a public URL.

### 6.1 Add the web service

1. Railway → your project (same one with Postgres)
2. Click **New** or **+ Create**
3. Choose **GitHub Repo**
4. If asked, **authorize Railway** to access GitHub
5. Select **`createdsounds-license-server`** (the repo you just made)

Railway starts building. Wait 1–3 minutes.

### 6.2 Tell Railway how to start

1. Click the **new service** (not Postgres — the one named like your repo)
2. **Settings** tab
3. Find **Start Command** or **Deploy** section
4. Set start command to:
   ```
   npm start
   ```
5. Save if there's a Save button

### 6.3 Connect the database to the web service

1. Still on the web service → **Variables** tab
2. Click **New Variable** or **Add Reference**
3. Add `DATABASE_URL` — Railway often lets you **reference** the Postgres service's `DATABASE_URL`. Use that if offered (recommended).
4. If not, manually paste the same `DATABASE_URL` from Postgres Variables

### 6.4 Add other variables (temporary placeholders OK)

Add these variables one by one on the web service:

| Name | Value (for now) |
|------|-----------------|
| `BLOOM_PRODUCT_MATCH` | `Bloom` |
| `SHOPIFY_WEBHOOK_SECRET` | `temporary-placeholder` |
| `RESEND_API_KEY` | leave empty or skip for now |
| `EMAIL_FROM` | `Bloom <onboarding@resend.dev>` |

We'll fix Shopify and Resend in later steps.

### 6.5 Create tables on the LIVE database

Your Mac might have used the same DATABASE_URL — if so, tables already exist. To be safe, run once on your Mac:

```bash
cd "/Users/jakehurlburt/Documents/juce projects/test june 7/Distribution/license-server"
npm run init-db
```

(Same `.env` with production DATABASE_URL — that's fine.)

### 6.6 Get your public URL

1. Web service → **Settings** → **Networking** (or **Public Networking**)
2. Click **Generate Domain**
3. Railway gives you a URL like:
   `https://createdsounds-license-server-production.up.railway.app`

**Copy this URL.** Write it down. You'll use it many times.

### 6.7 Test the live server

In Terminal:

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Replace with your real URL.

**✅ Success:**
```json
{"ok":true,"service":"createdsounds-license-server"}
```

**❌ Error / timeout:**
- Wait 2 more minutes — first deploy can be slow
- Railway → web service → **Deployments** → check for red "Failed" — click it for error logs

### 6.8 Test activate on the LIVE server

Insert the test license in the database again if needed (Step 4.1 SQL).

Then:

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{"license_key":"BLOOM-TEST-1111-AAAA","machine_id":"my-laptop-123"}'
```

**✅ Success:** `"success":true`

**STOP HERE.** Step 6 is done when `/health` and `/licenses/activate` work on the Railway URL.

---

# STEP 7 — Set up email (Resend)

**Goal:** Customers automatically get their key by email.

### 7.1 Create Resend account

1. Go to **https://resend.com**
2. Sign up (free)

### 7.2 Create an API key

1. Resend dashboard → **API Keys**
2. **Create API Key**
3. Name it `bloom-licenses`
4. Copy the key (starts with `re_`) — **you only see it once**

### 7.3 Add key to Railway

1. Railway → web service → **Variables**
2. Add or edit: `RESEND_API_KEY` = `re_your_key_here`
3. Railway redeploys automatically (wait ~1 min)

### 7.4 Verify your domain (so emails aren't spam)

**This is the hardest step.** You need access to where you bought `createdsounds.com` (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.).

1. Resend → **Domains** → **Add Domain**
2. Type: `createdsounds.com`
3. Resend shows DNS records (TXT, MX, etc.)
4. Log into your domain registrar → **DNS settings**
5. Add each record Resend shows exactly
6. Back in Resend → **Verify** — can take 5 minutes to 48 hours

**While waiting on DNS**, you can still test — Resend lets you send to **your own email** from `onboarding@resend.dev` in dev mode.

### 7.5 Set EMAIL_FROM in Railway

Once domain verified:
```
EMAIL_FROM=Bloom <licenses@createdsounds.com>
```

Before verified, use:
```
EMAIL_FROM=Bloom <onboarding@resend.dev>
```

---

# STEP 8 — Connect Shopify

**Goal:** When someone pays, Shopify tells your server to create a key.

### 8.1 Find webhooks in Shopify

1. **Shopify Admin** (your store dashboard)
2. **Settings** (gear icon, bottom left)
3. **Notifications**
4. Scroll down to **Webhooks**
5. Click **Create webhook**

### 8.2 Fill in the webhook

| Field | What to enter |
|-------|----------------|
| Event | **Order payment** (or "Orders paid") |
| Format | **JSON** |
| URL | `https://YOUR-RAILWAY-URL.up.railway.app/shopify/order-paid` |

Replace `YOUR-RAILWAY-URL` with your real Railway domain from Step 6.6.

Click **Save**.

### 8.3 Copy the webhook signing secret

After saving, Shopify shows a **signing secret** or **webhook secret**.

It might be under the webhook details when you click the webhook you just created.

Copy it.

### 8.4 Put secret in Railway

1. Railway → web service → **Variables**
2. Edit `SHOPIFY_WEBHOOK_SECRET` — replace `temporary-placeholder` with the real secret
3. Wait for redeploy

### 8.5 Make sure your product name matches

In Railway variables, confirm:
```
BLOOM_PRODUCT_MATCH=Bloom
```

Your Shopify product title must contain the word **Bloom** (capital B doesn't matter).

If your product is called "Bloom Plugin" — fine.  
If it's called "Created Sounds Bloom" — fine.  
If it's called "CS-101" with no "Bloom" — change `BLOOM_PRODUCT_MATCH` to part of your product name or SKU.

---

# STEP 9 — Test a real (fake) purchase

**Goal:** End-to-end test before touching Bloom.

### 9.1 Enable Shopify test payments

1. Shopify Admin → **Settings** → **Payments**
2. If not on a real payment provider yet, enable **Shopify Payments test mode** or **Bogus Gateway** for testing

(Search Shopify Help for "test orders" if your screen looks different.)

### 9.2 Place a test order

1. Open your store as a customer would
2. Add Bloom to cart
3. Checkout with test card info Shopify provides
4. Complete the order

### 9.3 Check it worked (3 places)

**Check 1 — Railway logs**
1. Railway → web service → **Deployments** or **Logs**
2. Look for: `created license BLOOM-XXXX` and the customer email

**Check 2 — Email**
- Customer email should have the license key
- If no email: check spam; check `RESEND_API_KEY`; check Railway logs for email errors

**Check 3 — Database**
- Railway → Postgres → run:
  ```sql
  SELECT * FROM licenses ORDER BY created_at DESC LIMIT 5;
  ```
- You should see the new key

**✅ Step 9 done when:** Test order → key in database → email received.

---

# STEP 10 — Connect Bloom (do this LAST)

**Only after Steps 1–9 work.**

You'll add back to Bloom:
- Activation screen (paste key)
- Calls to `https://YOUR-RAILWAY-URL/licenses/activate`
- Calls to `https://YOUR-RAILWAY-URL/licenses/validate`
- Save key locally after success

Say "add licensing to Bloom" when you're ready and we'll do it together.

---

# STEP 3A — Create GitHub account (if you skipped it)

1. Go to **https://github.com/signup**
2. Enter email, password, username
3. Verify email
4. Continue to Step 5.2

---

# When something goes wrong

| Problem | What to try |
|---------|-------------|
| `command not found: node` | Redo Step 1, restart Mac |
| `command not found: npm` | Same |
| `npm install` fails | Screenshot error, ask for help |
| `init-db` connection error | Re-copy DATABASE_URL into `.env` |
| curl "Connection refused" | Run `npm start` first |
| Railway deploy failed | Click failed deployment → read red error text |
| `/health` doesn't work | Wait 2 min, check Start Command is `npm start` |
| Shopify webhook 401 | Wrong `SHOPIFY_WEBHOOK_SECRET` |
| Order paid, no license | Check Railway logs; check product name has "Bloom" |
| No email | Add `RESEND_API_KEY`; check spam folder |

---

# Your progress checklist

Print this or copy to Notes. Check off as you go.

- [ ] **Step 1** — Node installed (`node --version` works)
- [ ] **Step 2** — `npm install` finished
- [ ] **Step 3** — Railway Postgres + `npm run init-db` worked
- [ ] **Step 4** — Local `npm start` + curl activate = success
- [ ] **Step 5** — Code on GitHub
- [ ] **Step 6** — Live Railway URL + `/health` works
- [ ] **Step 7** — Resend API key in Railway
- [ ] **Step 8** — Shopify webhook created + secret in Railway
- [ ] **Step 9** — Test order → email with key
- [ ] **Step 10** — Bloom plugin connected

---

# What to do RIGHT NOW

**Only Step 1.**

1. Install Node from nodejs.org
2. Open Terminal
3. Run `node --version`

Reply with what you see (e.g. `v20.11.0` or an error) and we'll do Step 2 together.
