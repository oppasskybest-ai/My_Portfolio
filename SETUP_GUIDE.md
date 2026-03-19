# PORTFOLIO SUPABASE SETUP GUIDE
## Setting up your second Supabase project for projects + reviews

---

## STEP 1 — Create a New Supabase Project

1. Go to: https://supabase.com
2. Sign in with a DIFFERENT email (your second free account)
3. Click "New Project"
4. Name it: "portfolio"
5. Set a strong database password (save it!)
6. Choose: Frankfurt or closest region to you
7. Wait ~2 minutes for it to spin up

---

## STEP 2 — Create the Tables

Go to your Supabase Dashboard → SQL Editor → click "New Query"
Copy and run this SQL:

```sql
-- PROJECTS TABLE
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('frontend', 'fullstack', 'webapp', 'mobile')),
  techs TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('live', 'completed', 'in-progress')),
  live_url TEXT,
  github_url TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS TABLE
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  role TEXT,
  project_type TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to READ approved reviews and all projects (public)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT USING (true);

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can submit a review"
  ON reviews FOR INSERT WITH CHECK (true);

-- Allow admin (anon key) to manage all records
CREATE POLICY "Anon can manage projects"
  ON projects FOR ALL USING (true);

CREATE POLICY "Anon can manage reviews"
  ON reviews FOR ALL USING (true);
```

Click "Run" → You should see "Success, no rows returned"

---

## STEP 3 — Add Your First Projects (Optional SQL)

You can add your real projects here via SQL, OR use the admin panel:

```sql
INSERT INTO projects (title, description, category, techs, status, live_url, github_url, featured) VALUES
(
  'OutReachFlow',
  'Bulk Gmail campaign manager and store link tracker. Helps outreach teams send campaigns at scale with Gmail rotation, CSV imports, and campaign analytics.',
  'webapp',
  ARRAY['React', 'TypeScript', 'Vite', 'Supabase', 'Tailwind CSS', 'Vercel'],
  'live',
  'https://outreachfl.vercel.app',
  'https://github.com/oppasskybest-ai/outreachflow-web',
  TRUE
),
(
  'Bitdrip',
  'Bitcoin DCA (Dollar Cost Averaging) platform on Starknet blockchain. Built with Next.js 14, full TypeScript, Framer Motion animations.',
  'fullstack',
  ARRAY['Next.js 14', 'TypeScript', 'Starknet', 'Framer Motion', 'Zod'],
  'live',
  'https://bitdripport.vercel.app',
  'https://github.com/oppasskybest-ai/Bitdrip_rephrase',
  FALSE
),
(
  'ZENVORA',
  '190-product e-commerce site with 7 categories, vanilla JS + Tailwind CSS. Multi-page with product filtering, blog, and full navigation.',
  'frontend',
  ARRAY['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS'],
  'completed',
  NULL,
  'https://github.com/oppasskybest-ai/ZENVORA',
  FALSE
);
```

---

## STEP 4 — Get Your API Keys

In your Supabase Dashboard:
1. Go to: Settings → API
2. Copy:
   - **Project URL** (looks like: https://xxxx.supabase.co)
   - **anon public key** (long string starting with "eyJ...")

---

## STEP 5 — Update script.js

Open your `script.js` file and replace these two lines at the top:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your real values:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...your-anon-key...';
```

---

## STEP 6 — Change Admin Password

Open `admin.js` and change line 8:

```js
const ADMIN_PASSWORD = 'opeyemi2024admin';
```

Set something strong that only you know!

---

## STEP 7 — Deploy to Vercel

1. Push all files to your GitHub repo
2. Go to vercel.com → Import project → Select your portfolio repo
3. Deploy (no build settings needed — it's pure HTML/CSS/JS)
4. Your portfolio is live!

---

## HOW THE REVIEW SYSTEM WORKS

**Flow 1 — After job completion:**
1. You finish a client's project
2. Go to: yourportfolio.com/admin.html
3. Click "Share Review Link" in the sidebar
4. Copy the link or use WhatsApp/Email template
5. Send to client
6. Client fills in their review
7. You see it in admin panel under "Pending Reviews"
8. You click "Approve" → it appears on your portfolio

**Flow 2 — Direct portfolio visits:**
- The "Leave a Review" button is visible on your portfolio's testimonials section
- Anyone who worked with you can click it and submit

---

## ADDING NEW PROJECTS (No code needed!)

1. Go to: yourportfolio.com/admin.html
2. Login with your admin password
3. Click "Add New Project"
4. Fill in the details
5. Click Save
6. It instantly appears on your portfolio — NO code, NO GitHub push needed!

---

## TABLE REFERENCE

### projects
| Column | Type | Description |
|--------|------|-------------|
| title | TEXT | Project name |
| description | TEXT | What it does |
| category | TEXT | frontend/fullstack/webapp/mobile |
| techs | TEXT[] | Array of tech names |
| status | TEXT | live/completed/in-progress |
| live_url | TEXT | URL to live site |
| github_url | TEXT | GitHub repo URL |
| image_url | TEXT | Screenshot URL (use imgur.com) |
| featured | BOOLEAN | Shows as larger card |

### reviews
| Column | Type | Description |
|--------|------|-------------|
| name | TEXT | Client name |
| country | TEXT | Their country |
| role | TEXT | Their role/company |
| project_type | TEXT | What you built for them |
| review_text | TEXT | Their review (20-500 chars) |
| rating | INTEGER | 1-5 stars |
| photo_url | TEXT | Their photo URL (optional) |
| status | TEXT | pending/approved/rejected |
