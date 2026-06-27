-- ============================================================
--  AWARDS & CERTIFICATES — Supabase Setup SQL
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the awards table
CREATE TABLE IF NOT EXISTS awards (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    issuer      TEXT NOT NULL,
    year        INTEGER,
    description TEXT,
    image_url   TEXT,
    verify_url  TEXT,
    featured    BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- 3. Public read access (anyone visiting the portfolio can see awards)
CREATE POLICY "Public can read awards"
    ON awards FOR SELECT
    USING (true);

-- 4. Anon insert/update/delete (your admin panel uses the anon key)
--    If you want tighter security, switch to a service_role key in admin.js instead.
CREATE POLICY "Anon can insert awards"
    ON awards FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anon can update awards"
    ON awards FOR UPDATE
    USING (true);

CREATE POLICY "Anon can delete awards"
    ON awards FOR DELETE
    USING (true);

-- 5. Optional: seed your IBM certificate right away
--    Replace the image_url and verify_url with your actual values.
-- INSERT INTO awards (title, issuer, year, description, image_url, verify_url, featured)
-- VALUES (
--     'IBM Full Stack Software Developer',
--     'IBM / Coursera',
--     2026,
--     'Professional Certificate covering 15 courses across full-stack development, cloud native apps, DevOps, containers, Python, Django, React, Node.js, and Kubernetes.',
--     'https://YOUR_SUPABASE_URL/storage/v1/object/public/project-media/awards/ibm-cert.jpg',
--     'https://coursera.org/verify/professional-cert/1RK07HK3R2GH',
--     true
-- );

-- ============================================================
--  STORAGE NOTE
--  Make sure your Supabase Storage bucket "project-media"
--  already exists (created when you set up projects).
--  Awards images will be uploaded to the "awards/" folder
--  inside that same bucket automatically.
-- ============================================================
