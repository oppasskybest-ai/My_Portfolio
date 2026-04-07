// ============================================================
//  OPEYEMI JOHN PORTFOLIO — script.js
//  Supabase-powered: projects, reviews, contact form
// ============================================================

// ============================================================
//  SUPABASE CONFIG
//  → Replace these with your second Supabase project credentials
//  → Go to: https://supabase.com → New Project → Settings → API
// ============================================================
const SUPABASE_URL = 'https://xeqbxhtczgkvyggcueyi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TU-RVJG_7PNxLevM7uSOJg_YomlVPH_';

// Google Apps Script URL (your existing contact form backend)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxL7Aiq3DrQwJ2YxZXT2eE3WhKeKDqYm-DQe6eN1Yw73tZiLKIB-XXVIeyphb7HbemN3A/exec';

// ============================================================
//  SUPABASE HELPERS
// ============================================================
async function supabaseQuery(table, options = {}) {
    const { method = 'GET', filter = '', body = null, select = '*' } = options;
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
    if (filter) url += `&${filter}`;

    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(url, config);
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : [];
}

// Check if Supabase is configured
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// ============================================================
//  FALLBACK PROJECTS (shown until Supabase is set up)
// ============================================================
const FALLBACK_PROJECTS = [
    {
        id: 1,
        title: 'OutReachFlow',
        description: 'Bulk Gmail campaign manager and store link tracker. Helps outreach teams send campaigns at scale with Gmail rotation, CSV imports, and campaign analytics. Live at outreachfl.vercel.app',
        category: 'webapp',
        techs: ['React', 'TypeScript', 'Vite', 'Supabase', 'Tailwind', 'Vercel'],
        status: 'live',
        live_url: 'https://outreachfl.vercel.app',
        github_url: 'https://github.com/oppasskybest-ai/outreachflow-web',
        image_url: '',
        featured: true
    },
    {
        id: 2,
        title: 'Bitdrip',
        description: 'Bitcoin DCA (Dollar Cost Averaging) platform on Starknet blockchain. Built with Next.js 14, full TypeScript, Framer Motion animations. Live on Vercel.',
        category: 'fullstack',
        techs: ['Next.js 14', 'TypeScript', 'Starknet', 'Framer Motion', 'Zod'],
        status: 'live',
        live_url: 'https://bitdripport.vercel.app',
        github_url: 'https://github.com/oppasskybest-ai/Bitdrip_rephrase',
        image_url: '',
        featured: false
    },
    {
        id: 3,
        title: 'ZENVORA',
        description: '190-product e-commerce site with 7 categories, vanilla JS + Tailwind CSS. Multi-page with product filtering, blog, and full navigation.',
        category: 'frontend',
        techs: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS'],
        status: 'completed',
        live_url: '',
        github_url: 'https://github.com/oppasskybest-ai/ZENVORA',
        image_url: '',
        featured: false
    },
    {
        id: 4,
        title: 'Developer Portfolio',
        description: 'This very portfolio — built from scratch with pure HTML, CSS, and JavaScript. Features dark/light mode, Supabase-powered projects and reviews, and an admin panel.',
        category: 'frontend',
        techs: ['HTML5', 'CSS3', 'JavaScript', 'Supabase'],
        status: 'live',
        live_url: 'https://opeyemjohn.vercel.app',
        github_url: 'https://github.com/oppasskybest-ai/My_Portfolio',
        image_url: '',
        featured: false
    }
];

// ============================================================
//  LOAD PROJECTS
// ============================================================
async function loadProjects() {
    const grid = document.getElementById('projects-grid');
    const loading = document.getElementById('projects-loading');
    if (!grid || !loading) return;

    let projects = [];

    try {
        if (isSupabaseConfigured()) {
            projects = await supabaseQuery('projects', {
                filter: 'order=featured.desc,created_at.desc'
            });
        }
    } catch (e) {
        console.warn('Supabase not configured, using fallback projects');
    }

    if (projects.length === 0) projects = FALLBACK_PROJECTS;

    loading.style.display = 'none';

    if (projects.length === 0) {
        document.getElementById('projects-empty').style.display = 'block';
        return;
    }

    // Update stats counter
    const counter = document.getElementById('projectCount');
    if (counter) counter.textContent = projects.length + '+';

    renderProjects(projects, 'all');
    setupDragScroll(document.getElementById('projects-grid'));
    setupCarouselArrows('projects-grid', 'projArrowLeft', 'projArrowRight');

    // Store for filter
    window._allProjects = projects;
}

function renderProjects(projects, filter) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '';
        document.getElementById('projects-empty').style.display = 'block';
        return;
    }

    document.getElementById('projects-empty').style.display = 'none';

    grid.innerHTML = filtered.map(p => {
        const techs = Array.isArray(p.techs)
            ? p.techs
            : (p.techs || '').split(',').map(t => t.trim()).filter(Boolean);

        const categoryLabel = {
            frontend: 'Frontend',
            fullstack: 'Full Stack',
            webapp: 'Web App',
            mobile: 'Mobile'
        }[p.category] || p.category;

        const statusLabel = {
            live: 'Live',
            completed: 'Completed',
            'in-progress': 'In Progress'
        }[p.status] || p.status;

        const isVideo = p.media_type === 'video' || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(p.image_url || '');
        const imgHtml = p.image_url
            ? (isVideo
                ? `<video src="${p.image_url}" muted autoplay loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>`
                : `<img src="${p.image_url}" alt="${p.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=project-img-placeholder><i class=bi-code-square></i></div>'">`)
            : `<div class="project-img-placeholder"><i class="bi bi-code-square"></i></div>`;

        const liveBtn = p.live_url
            ? `<a href="${p.live_url}" target="_blank" class="project-link primary"><i class="bi bi-play-circle"></i> Live Demo</a>`
            : '';

        const githubBtn = p.github_url
            ? `<a href="${p.github_url}" target="_blank" class="project-link secondary"><i class="bi bi-github"></i></a>`
            : '';

        return `
        <div class="project-card ${p.featured ? 'featured' : ''}" data-category="${p.category}">
            <div class="project-img-wrap">
                ${imgHtml}
                <span class="project-category-badge">${categoryLabel}</span>
                <span class="project-status-badge ${p.status}">${statusLabel}</span>
            </div>
            <div class="project-body">
                <h3 class="project-title">${p.title}</h3>
                <p class="project-desc">${p.description}</p>
                <div class="project-techs">
                    ${techs.map(t => `<span class="project-tech">${t}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${liveBtn}
                    ${githubBtn}
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
//  PROJECT FILTERS
// ============================================================
function setupProjectFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderProjects(window._allProjects || FALLBACK_PROJECTS, this.dataset.filter);
        });
    });
}

// ============================================================
//  LOAD REVIEWS
// ============================================================
async function loadReviews() {
    const grid = document.getElementById('reviews-grid');
    const loading = document.getElementById('reviews-loading');
    if (!grid || !loading) return;

    let reviews = [];

    try {
        if (isSupabaseConfigured()) {
            reviews = await supabaseQuery('reviews', {
                filter: 'status=eq.approved&order=created_at.desc'
            });
        }
    } catch (e) {
        console.warn('Could not load reviews');
    }

    loading.style.display = 'none';

    // Update review count stat
    const counter = document.getElementById('reviewCount');
    if (counter) counter.textContent = reviews.length;

    if (reviews.length === 0) {
        document.getElementById('reviews-empty').style.display = 'block';
        return;
    }

    document.getElementById('reviews-empty').style.display = 'none';

    grid.innerHTML = reviews.map(r => {
        const stars = Array.from({length: 5}, (_, i) =>
            `<i class="bi ${i < r.rating ? 'bi-star-fill' : 'bi-star'}"></i>`
        ).join('');

        const initials = (r.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const avatarHtml = r.photo_url
            ? `<img src="${r.photo_url}" alt="${r.name}" onerror="this.parentElement.innerHTML='${initials}'">`
            : initials;

        const date = r.created_at
            ? new Date(r.created_at).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
            : '';

        return `
        <div class="review-card">
            <div class="review-stars">${stars}</div>
            <p class="review-text">${r.review_text}</p>
            <div class="review-author">
                <div class="review-avatar">${avatarHtml}</div>
                <div>
                    <div class="review-author-name">${r.name}</div>
                    <div class="review-author-meta">
                        ${r.country ? `<span><i class="bi bi-geo-alt"></i> ${r.country}</span>` : ''}
                        ${date ? `<span>${date}</span>` : ''}
                    </div>
                    ${r.role ? `<div class="review-author-meta" style="margin-top:2px">${r.role}</div>` : ''}
                    ${r.project_type ? `<span class="review-project-type">${r.project_type}</span>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');

    setupDragScroll(grid);
    setupCarouselArrows('reviews-grid', 'revArrowLeft', 'revArrowRight');
}

// ============================================================
//  CONTACT FORM
// ============================================================
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateContactForm()) return;

        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const spinner = document.getElementById('submitSpinner');
        const success = document.getElementById('successAlert');
        const error = document.getElementById('errorAlert');

        success.classList.add('d-none');
        error.classList.add('d-none');
        submitText.textContent = 'Sending...';
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;

        const data = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim(),
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            success.classList.remove('d-none');
            form.reset();
        } catch (err) {
            error.classList.remove('d-none');
        } finally {
            submitText.textContent = 'Send Message';
            spinner.classList.add('d-none');
            submitBtn.disabled = false;
            setTimeout(() => {
                success.classList.add('d-none');
                error.classList.add('d-none');
            }, 6000);
        }
    });
}

function validateContactForm() {
    const fields = [
        {id: 'name', errId: 'nameError', msg: 'Please enter your name'},
        {id: 'email', errId: 'emailError', msg: 'Please enter a valid email', validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)},
        {id: 'subject', errId: 'subjectError', msg: 'Please enter a subject'},
        {id: 'message', errId: 'messageError', msg: 'Please write a message'}
    ];

    let valid = true;
    fields.forEach(f => {
        const el = document.getElementById(f.id);
        const group = el?.closest('.form-group');
        const val = el?.value.trim();
        const ok = f.validator ? f.validator(val) : val.length > 0;
        if (!ok) {
            group?.classList.add('has-error');
            valid = false;
        } else {
            group?.classList.remove('has-error');
        }
    });

    return valid;
}

// ============================================================
//  DARK MODE
// ============================================================
function setupDarkMode() {
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!toggle) return;

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);

    applyTheme(isDark ? 'dark' : 'light', icon);

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, icon);
        localStorage.setItem('theme', next);
    });
}

function applyTheme(theme, icon) {
    document.documentElement.setAttribute('data-theme', theme);
    if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
}

// ============================================================
//  NAVBAR
// ============================================================
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Hamburger toggle
    hamburger?.addEventListener('click', () => {
        navLinks?.classList.toggle('open');
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinkEls = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinkEls.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
                });
            }
        });
    }, {threshold: 0.35});

    sections.forEach(s => observer.observe(s));

    // Close mobile nav on link click
    navLinkEls.forEach(a => {
        a.addEventListener('click', () => navLinks?.classList.remove('open'));
    });
}

// ============================================================
//  BACK TO TOP
// ============================================================
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
    btn.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
}

// ============================================================
//  SKILL BAR ANIMATIONS
// ============================================================
function setupSkillBars() {
    const bars = document.querySelectorAll('.skill-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                bar.style.width = bar.dataset.width + '%';
                observer.unobserve(bar);
            }
        });
    }, {threshold: 0.2});

    bars.forEach(bar => observer.observe(bar));
}

// ============================================================
//  SCROLL REVEAL
// ============================================================
function setupScrollReveal() {
    const els = document.querySelectorAll('[data-reveal], [data-reveal-right]');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('revealed'), i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, {threshold: 0.1});

    els.forEach(el => observer.observe(el));
}

// ============================================================
//  FOOTER YEAR
// ============================================================
function setupFooter() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupDarkMode();
    setupNavbar();
    setupBackToTop();
    setupFooter();
    setupContactForm();
    setupProjectFilters();
    setupSkillBars();
    setupScrollReveal();

    // Load dynamic data
    loadProjects();
    loadReviews();
});

// ============================================================
//  CAROUSEL ARROW BUTTONS
// ============================================================
function setupCarouselArrows(gridId, leftBtnId, rightBtnId) {
    const grid = document.getElementById(gridId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);
    if (!grid || !leftBtn || !rightBtn) return;

    // Scroll by roughly one card width
    const scrollAmount = () => grid.firstElementChild
        ? grid.firstElementChild.offsetWidth + 24
        : 360;

    leftBtn.addEventListener('click', () => {
        grid.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
        grid.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    // Update arrow disabled state on scroll
    const updateArrows = () => {
        leftBtn.disabled = grid.scrollLeft <= 10;
        rightBtn.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 10;
    };

    grid.addEventListener('scroll', updateArrows);
    // Initial state
    setTimeout(updateArrows, 100);
}

// ============================================================
//  DRAG TO SCROLL (projects + reviews carousels)
// ============================================================
function setupDragScroll(el) {
    if (!el) return;
    let isDown = false, startX, scrollLeft;

    el.addEventListener('mousedown', e => {
        isDown = true;
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        el.style.cursor = 'grabbing';
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mouseup', () => { isDown = false; el.style.cursor = 'grab'; });
    el.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        el.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
}
