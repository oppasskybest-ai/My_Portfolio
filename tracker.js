// ============================================================
//  VISITOR TRACKER — tracker.js
//  Fingerprints each device, tracks session time, writes to
//  Supabase, and sends an email alert via Google Apps Script
// ============================================================

(function () {
    // ---- Session start time ----
    const SESSION_START = Date.now();

    // ---- Generate device fingerprint ----
    function generateFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.hardwareConcurrency || '',
            navigator.deviceMemory || '',
            navigator.platform || '',
        ].join('|');

        // Simple hash
        let hash = 0;
        for (let i = 0; i < components.length; i++) {
            const char = components.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'fp_' + Math.abs(hash).toString(36);
    }

    // ---- Parse user agent ----
    function parseUA() {
        const ua = navigator.userAgent;

        let device = 'Desktop';
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
            device = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
        }

        let browser = 'Unknown';
        if (/Edg\//i.test(ua)) browser = 'Edge';
        else if (/OPR\//i.test(ua)) browser = 'Opera';
        else if (/Chrome\//i.test(ua)) browser = 'Chrome';
        else if (/Firefox\//i.test(ua)) browser = 'Firefox';
        else if (/Safari\//i.test(ua)) browser = 'Safari';

        let os = 'Unknown';
        if (/Windows NT/i.test(ua)) os = 'Windows';
        else if (/Mac OS X/i.test(ua)) os = 'macOS';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        return { device, browser, os };
    }

    // ---- Get IP & geo from free API ----
    async function getGeoData() {
        try {
            const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
            const data = await res.json();
            return {
                ip: data.ip || null,
                country: data.country_name || null,
                country_code: data.country_code || null,
                city: data.city || null,
                region: data.region || null,
                timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                org: data.org || null,
            };
        } catch {
            return {
                ip: null,
                country: null,
                country_code: null,
                city: null,
                region: null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                org: null,
            };
        }
    }

    // ---- Track scroll depth ----
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
        const scrolled = Math.round(
            ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
        );
        if (scrolled > maxScrollDepth) maxScrollDepth = Math.min(scrolled, 100);
    });

    // ---- Track sections visited ----
    const sectionsVisited = new Set();
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) sectionsVisited.add(entry.target.id);
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

    // ---- Send email alert via Google Apps Script ----
    async function sendEmailAlert(visitorData, geo) {
        const GOOGLE_SCRIPT_URL = window.GOOGLE_SCRIPT_URL ||
            document.querySelector('script[data-gscript]')?.dataset?.gscript || null;

        if (!GOOGLE_SCRIPT_URL) return;

        const subject = `New Portfolio Visitor — ${geo.country || 'Unknown'} | ${visitorData.device}`;
        const body = `
New visitor on your portfolio!

📍 Location: ${geo.city || '?'}, ${geo.region || '?'}, ${geo.country || 'Unknown'}
🌐 IP: ${geo.ip || 'Hidden'}
📱 Device: ${visitorData.device} | ${visitorData.os} | ${visitorData.browser}
🖥️ Screen: ${visitorData.screen_resolution}
🕐 Time: ${new Date().toLocaleString()}
🌍 Timezone: ${geo.timezone}
🔗 Referrer: ${visitorData.referrer || 'Direct'}
🔑 Fingerprint: ${visitorData.fingerprint}
        `.trim();

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'visitor_alert',
                    subject,
                    message: body,
                    name: 'Portfolio Tracker',
                    email: 'noreply@portfolio.com',
                    timestamp: new Date().toISOString()
                })
            });
        } catch { /* silent fail */ }
    }

    // ---- Write visitor to Supabase ----
    async function saveVisitor(visitorData) {
        if (!window.SUPABASE_URL || window.SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

        const url = `${window.SUPABASE_URL}/rest/v1/visitors`;
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(visitorData)
            });
        } catch { /* silent fail */ }
    }

    // ---- Upsert fingerprint (track return visits) ----
    async function upsertFingerprint(fp, country, device) {
        if (!window.SUPABASE_URL || window.SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

        // Try to get existing
        try {
            const getRes = await fetch(
                `${window.SUPABASE_URL}/rest/v1/visitor_fingerprints?fingerprint=eq.${fp}&select=id,visit_count`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                    }
                }
            );
            const existing = await getRes.json();

            if (existing && existing.length > 0) {
                // Update visit count + last seen
                await fetch(
                    `${window.SUPABASE_URL}/rest/v1/visitor_fingerprints?fingerprint=eq.${fp}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            visit_count: (existing[0].visit_count || 1) + 1,
                            last_seen: new Date().toISOString()
                        })
                    }
                );
            } else {
                // Insert new fingerprint
                await fetch(
                    `${window.SUPABASE_URL}/rest/v1/visitor_fingerprints`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            fingerprint: fp,
                            first_seen: new Date().toISOString(),
                            last_seen: new Date().toISOString(),
                            visit_count: 1,
                            country: country,
                            device: device
                        })
                    }
                );
            }
        } catch { /* silent fail */ }
    }

    // ---- Main tracking function ----
    async function track() {
        const fp = generateFingerprint();
        const { device, browser, os } = parseUA();
        const geo = await getGeoData();

        const visitorData = {
            fingerprint: fp,
            ip: geo.ip,
            country: geo.country,
            country_code: geo.country_code,
            city: geo.city,
            region: geo.region,
            timezone: geo.timezone,
            isp: geo.org,
            device: device,
            browser: browser,
            os: os,
            screen_resolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            referrer: document.referrer || null,
            landing_page: window.location.pathname,
            visited_at: new Date().toISOString(),
            // time_spent and scroll_depth are updated on page leave
            time_spent_seconds: 0,
            scroll_depth: 0,
            sections_visited: [],
        };

        // Save initial visit
        await saveVisitor(visitorData);

        // Update fingerprint record
        await upsertFingerprint(fp, geo.country, device);

        // Send email alert
        await sendEmailAlert(visitorData, geo);

        // On page leave — update time spent + scroll depth
        const updateOnLeave = async () => {
            const timeSpent = Math.round((Date.now() - SESSION_START) / 1000);
            const sections = Array.from(sectionsVisited);

            if (!window.SUPABASE_URL || window.SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

            // Update the most recent visitor row for this fingerprint+session
            try {
                // Get the latest visitor row for this fingerprint
                const getRes = await fetch(
                    `${window.SUPABASE_URL}/rest/v1/visitors?fingerprint=eq.${fp}&order=visited_at.desc&limit=1&select=id`,
                    {
                        headers: {
                            'apikey': window.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                        }
                    }
                );
                const rows = await getRes.json();
                if (rows && rows.length > 0) {
                    await fetch(
                        `${window.SUPABASE_URL}/rest/v1/visitors?id=eq.${rows[0].id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'apikey': window.SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                time_spent_seconds: timeSpent,
                                scroll_depth: maxScrollDepth,
                                sections_visited: sections
                            })
                        }
                    );
                }
            } catch { /* silent fail */ }
        };

        // Use both visibilitychange and beforeunload for best coverage
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') updateOnLeave();
        });
        window.addEventListener('beforeunload', updateOnLeave);
        window.addEventListener('pagehide', updateOnLeave);
    }

    // Start tracking after small delay so page loads first
    window.addEventListener('load', () => setTimeout(track, 800));

})();
