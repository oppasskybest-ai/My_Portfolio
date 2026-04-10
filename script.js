// ============================================================
//  OPEYEMI JOHN PORTFOLIO — script.js
//  Supabase-powered: projects, reviews, contact form
// ============================================================

// ============================================================
//  SUPABASE CONFIG
//  → Replace these with your second Supabase project credentials
//  → Go to: https://supabase.com → New Project → Settings → API
// ============================================================
window.SUPABASE_URL =  'https://xeqbxhtczgkvyggcueyi.supabase.co';
window.SUPABASE_ANON_KEY =  'sb_publishable_TU-RVJG_7PNxLevM7uSOJg_YomlVPH_';

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

    // Store projects globally for modal access
    window._projectsMap = {};
    projects.forEach(p => { window._projectsMap[p.id] = p; });

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
            ? `<a href="${p.live_url}" target="_blank" class="project-link primary" onclick="event.stopPropagation()"><i class="bi bi-play-circle"></i> Live Demo</a>`
            : '';

        const githubBtn = p.github_url
            ? `<a href="${p.github_url}" target="_blank" class="project-link secondary" onclick="event.stopPropagation()"><i class="bi bi-github"></i></a>`
            : '';

        return `
        <div class="project-card ${p.featured ? 'featured' : ''}" data-category="${p.category}" data-id="${p.id}" onclick="handleProjectClick(this)">
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
                <div class="project-view-btn">
                    <i class="bi bi-arrow-down-circle"></i> View Details
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
//  ABOUT TABS
// ============================================================
function setupAboutTabs() {
    const tabs = document.querySelectorAll('.about-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.about-tab-content').forEach(c => c.classList.remove('active'));

            // Activate clicked
            this.classList.add('active');
            const target = document.getElementById(`tab-${this.dataset.tab}`);
            if (target) target.classList.add('active');
        });
    });
}

// ============================================================
//  TYPEWRITER EFFECT — hero accent title
// ============================================================
function setupTypewriter() {
    setupAccentTypewriter();
    setupDescTypewriter();
}

function setupAccentTypewriter() {
    const el = document.getElementById('typewriter-accent');
    if (!el) return;

    const phrases = [
        'Digital Things',
        'Web Experiences',
        'Shopify Stores',
        'React Apps',
        'Real Solutions',
        'Fast Websites',
        'SaaS Products',
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    // Add cursor right after accent span
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.textContent = '|';
    el.insertAdjacentElement('afterend', cursor);

    function tick() {
        const current = phrases[phraseIndex];
        if (!deleting) {
            el.textContent = current.slice(0, charIndex + 1);
            charIndex++;
            if (charIndex === current.length) {
                deleting = true;
                setTimeout(tick, 1800);
                return;
            }
        } else {
            el.textContent = current.slice(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(tick, 300);
                return;
            }
        }
        setTimeout(tick, deleting ? 45 : 80);
    }
    setTimeout(tick, 1200);
}

function setupDescTypewriter() {
    const el = document.getElementById('typewriter-desc');
    const cursor = document.querySelector('.desc-cursor');
    if (!el) return;

    const fullText = "I'm Opeyemi John, a frontend developer and Shopify expert specializing in building fast, accessible, and high-converting web experiences. I work with e-commerce brands to improve their online presence through optimized store design, seamless user experience, and data-driven conversion strategies. My focus is not just on how a website looks, but how well it performs in turning visitors into paying customers.";

    let charIndex = 0;

    function tick() {
        if (charIndex < fullText.length) {
            el.textContent = fullText.slice(0, charIndex + 1);
            charIndex++;
            setTimeout(tick, 28);
        } else {
            // Done — hide cursor after a short pause
            setTimeout(() => {
                if (cursor) cursor.style.display = 'none';
            }, 1200);
        }
    }
    setTimeout(tick, 1600);
}

// ============================================================
//  PROJECT MODAL
// ============================================================
function setupProjectModal() {
    const overlay = document.getElementById('projectModal');
    const closeBtn = document.getElementById('projModalClose');
    if (!overlay) return;

    // Close on button click
    closeBtn?.addEventListener('click', closeModal);

    // Close on overlay background click
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
}

function handleProjectClick(cardEl) {
    const id = cardEl.dataset.id;
    // For fallback projects (no Supabase), id is a number from FALLBACK_PROJECTS
    const project = (window._projectsMap && window._projectsMap[id])
        || (window._allProjects || []).find(p => String(p.id) === String(id));
    if (project) openProjectModal(project);
}

function openProjectModal(project) {
    const overlay = document.getElementById('projectModal');
    if (!overlay) return;

    const techs = Array.isArray(project.techs)
        ? project.techs
        : (project.techs || '').split(',').map(t => t.trim()).filter(Boolean);

    const categoryLabel = {
        frontend: 'Frontend', fullstack: 'Full Stack',
        webapp: 'Web App', mobile: 'Mobile', shopify: 'Shopify'
    }[project.category] || project.category;

    const statusLabel = {
        live: 'Live', completed: 'Completed', 'in-progress': 'In Progress'
    }[project.status] || project.status;

    const isVideo = project.media_type === 'video' ||
        /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(project.image_url || '');

    // Media
    const mediaEl = document.getElementById('projModalMedia');
    if (project.image_url) {
        mediaEl.innerHTML = isVideo
            ? `<video src="${project.image_url}" muted autoplay loop playsinline style="width:100%;height:100%;object-fit:cover"></video>`
            : `<img src="${project.image_url}" alt="${project.title}">`;
    } else {
        mediaEl.innerHTML = `<div class="proj-modal-media-placeholder"><i class="bi bi-code-square"></i></div>`;
    }

    document.getElementById('projModalCategory').textContent = categoryLabel;
    document.getElementById('projModalCategory').className = 'project-category-badge';
    document.getElementById('projModalStatus').textContent = statusLabel;
    document.getElementById('projModalStatus').className = `project-status-badge ${project.status}`;
    document.getElementById('projModalTitle').textContent = project.title;
    document.getElementById('projModalDesc').textContent = project.description;

    document.getElementById('projModalTechs').innerHTML = techs
        .map(t => `<span class="project-tech">${t}</span>`).join('');

    const liveBtn = project.live_url
        ? `<a href="${project.live_url}" target="_blank" class="project-link primary"><i class="bi bi-play-circle"></i> Live Demo</a>` : '';
    const githubBtn = project.github_url
        ? `<a href="${project.github_url}" target="_blank" class="project-link secondary"><i class="bi bi-github"></i> GitHub</a>` : '';
    document.getElementById('projModalLinks').innerHTML = liveBtn + githubBtn;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('projectModal');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
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
    setupTypewriter();
    setupAboutTabs();
    setupProjectModal();

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
