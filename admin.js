// ============================================================
//  ADMIN PANEL — admin.js
//  Manage projects (with Supabase Storage uploads) and reviews
// ============================================================

// ---- CHANGE THIS PASSWORD ----
const ADMIN_PASSWORD = 'oppa12345678*#';

// Supabase Storage bucket name (create this in Supabase Dashboard → Storage)
const STORAGE_BUCKET = 'project-media';

// Accepted file types and size limits
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================
//  LOGIN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('adminAuth') === 'true';
    if (isLoggedIn) showDashboard();

    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('adminPassword')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuth');
        location.reload();
    });
});

function handleLogin() {
    const pw = document.getElementById('adminPassword')?.value;
    const err = document.getElementById('loginError');
    if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true');
        showDashboard();
    } else {
        if (err) err.textContent = 'Incorrect password. Try again.';
        document.getElementById('adminPassword').value = '';
    }
}

function showDashboard() {
    document.getElementById('loginGate').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'grid';
    setupAdminPanels();
    setupProjectForm();
    setupMediaUpload();
    setupShareLink();
    loadAdminProjects();
    loadAdminReviews('pending');
}

// ============================================================
//  PANEL SWITCHING
// ============================================================
function setupAdminPanels() {
    document.querySelectorAll('.sidebar-btn[data-panel]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-btn[data-panel]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${this.dataset.panel}`)?.classList.add('active');

            if (this.dataset.panel === 'visitors') {
                loadVisitorAnalytics();
                document.getElementById('visitorFilter')?.addEventListener('change', function() {
                    _currentVisitorDays = this.value === 'all' ? 'all' : parseInt(this.value);
                    loadVisitorAnalytics();
                });
                document.getElementById('refreshVisitors')?.addEventListener('click', loadVisitorAnalytics);
            }
        });
    });

    document.querySelectorAll('.review-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.review-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            loadAdminReviews(this.dataset.tab);
        });
    });
}

// ============================================================
//  MEDIA UPLOAD SYSTEM
// ============================================================
function setupMediaUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('mediaFileInput');
    const toggleUpload = document.getElementById('toggleUpload');
    const toggleUrl = document.getElementById('toggleUrl');
    const uploadMode = document.getElementById('uploadMode');
    const urlMode = document.getElementById('urlMode');
    const urlInput = document.getElementById('projMediaUrl');
    const removeBtn = document.getElementById('removeMediaBtn');

    // Toggle between upload and URL modes
    toggleUpload?.addEventListener('click', () => {
        toggleUpload.classList.add('active');
        toggleUrl.classList.remove('active');
        uploadMode.style.display = 'block';
        urlMode.style.display = 'none';
        clearMediaUrl();
    });

    toggleUrl?.addEventListener('click', () => {
        toggleUrl.classList.add('active');
        toggleUpload.classList.remove('active');
        urlMode.style.display = 'block';
        uploadMode.style.display = 'none';
        clearUploadPreview();
    });

    // Click on drop zone opens file picker
    dropZone?.addEventListener('click', () => fileInput?.click());

    // Drag and drop
    dropZone?.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelected(file);
    });

    // File input change
    fileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleFileSelected(file);
    });

    // URL input — preview on paste/type
    urlInput?.addEventListener('input', () => {
        const url = urlInput.value.trim();
        if (url) {
            const isVideo = isVideoUrl(url);
            document.getElementById('projFinalMediaUrl').value = url;
            document.getElementById('projMediaType').value = isVideo ? 'video' : 'image';
            showUrlPreview(url, isVideo);
        } else {
            document.getElementById('urlPreview').style.display = 'none';
            document.getElementById('projFinalMediaUrl').value = '';
        }
    });

    // Remove uploaded media
    removeBtn?.addEventListener('click', () => {
        clearUploadPreview();
        if (fileInput) fileInput.value = '';
    });
}

function handleFileSelected(file) {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
    const msg = document.getElementById('projectMsg');

    if (!isImage && !isVideo) {
        showMsg(msg, `Unsupported file type: ${file.type}. Use JPG, PNG, WebP, GIF, SVG, MP4, WebM, or MOV.`, 'error');
        return;
    }

    const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const limitLabel = isVideo ? '50MB' : '5MB';
    if (file.size > limit) {
        showMsg(msg, `File too large. ${isVideo ? 'Videos' : 'Images'} must be under ${limitLabel}.`, 'error');
        return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    showUploadPreview(objectUrl, isVideo, file.name);

    // Store file reference for actual upload at save time
    window._pendingUploadFile = file;
    window._pendingUploadType = isVideo ? 'video' : 'image';
    document.getElementById('projMediaType').value = isVideo ? 'video' : 'image';
}

async function uploadFileToSupabase(file) {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured. Add your credentials to script.js first.');
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `projects/${fileName}`;

    // Show progress bar
    const progress = document.getElementById('uploadProgress');
    const fill = document.getElementById('uploadProgressFill');
    const text = document.getElementById('uploadProgressText');
    progress.style.display = 'flex';

    // Simulate progress (Supabase doesn't give real-time progress via REST)
    let pct = 0;
    const fakeProgress = setInterval(() => {
        pct = Math.min(pct + 8, 85);
        fill.style.width = pct + '%';
        text.textContent = `Uploading... ${pct}%`;
    }, 150);

    try {
        const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': file.type,
                'x-upsert': 'true'
            },
            body: file
        });

        clearInterval(fakeProgress);

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Upload failed: ${err}`);
        }

        fill.style.width = '100%';
        text.textContent = 'Upload complete!';
        setTimeout(() => { progress.style.display = 'none'; }, 1500);

        // Return the public URL
        return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

    } catch (err) {
        clearInterval(fakeProgress);
        progress.style.display = 'none';
        throw err;
    }
}

function showUploadPreview(url, isVideo, fileName) {
    const preview = document.getElementById('mediaPreview');
    const inner = document.getElementById('mediaPreviewInner');
    const nameEl = document.getElementById('mediaFileName');

    inner.innerHTML = isVideo
        ? `<video src="${url}" muted autoplay loop playsinline style="width:100%;max-height:200px;object-fit:cover"></video>`
        : `<img src="${url}" alt="Preview" style="width:100%;max-height:200px;object-fit:cover">`;

    if (nameEl) nameEl.textContent = fileName || '';
    preview.style.display = 'block';
}

function showUrlPreview(url, isVideo) {
    const preview = document.getElementById('urlPreview');
    const inner = document.getElementById('urlPreviewInner');

    inner.innerHTML = isVideo
        ? `<video src="${url}" muted autoplay loop playsinline style="width:100%;max-height:200px;object-fit:cover"></video>`
        : `<img src="${url}" alt="Preview" style="width:100%;max-height:200px;object-fit:cover" onerror="this.parentElement.innerHTML='<p style=padding:16px;color:var(--text-3)>Could not load image from URL</p>'">`;

    preview.style.display = 'block';
}

function clearUploadPreview() {
    document.getElementById('mediaPreview').style.display = 'none';
    document.getElementById('mediaPreviewInner').innerHTML = '';
    document.getElementById('projFinalMediaUrl').value = '';
    window._pendingUploadFile = null;
    window._pendingUploadType = null;
}

function clearMediaUrl() {
    const urlInput = document.getElementById('projMediaUrl');
    if (urlInput) urlInput.value = '';
    document.getElementById('urlPreview').style.display = 'none';
    document.getElementById('projFinalMediaUrl').value = '';
}

function isVideoUrl(url) {
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

// ============================================================
//  PROJECTS ADMIN
// ============================================================
function setupProjectForm() {
    document.getElementById('openAddProjectBtn')?.addEventListener('click', () => {
        clearProjectForm();
        document.getElementById('projectFormCard').style.display = 'block';
        document.getElementById('projectFormTitle').textContent = 'Add New Project';
    });

    document.getElementById('cancelProjectBtn')?.addEventListener('click', () => {
        document.getElementById('projectFormCard').style.display = 'none';
        clearProjectForm();
    });

    document.getElementById('saveProjectBtn')?.addEventListener('click', saveProject);
}

function clearProjectForm() {
    ['projTitle', 'projDesc', 'projTech', 'projLiveUrl', 'projGithubUrl',
     'projMediaUrl', 'projFinalMediaUrl', 'editProjectId'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const cat = document.getElementById('projCategory');
    if (cat) cat.value = 'frontend';
    const status = document.getElementById('projStatus');
    if (status) status.value = 'live';
    const featured = document.getElementById('projFeatured');
    if (featured) featured.checked = false;
    const mediaType = document.getElementById('projMediaType');
    if (mediaType) mediaType.value = 'image';

    clearUploadPreview();
    clearMediaUrl();
    window._pendingUploadFile = null;

    // Reset to upload mode
    document.getElementById('toggleUpload')?.classList.add('active');
    document.getElementById('toggleUrl')?.classList.remove('active');
    document.getElementById('uploadMode').style.display = 'block';
    document.getElementById('urlMode').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
}

async function saveProject() {
    const title = document.getElementById('projTitle')?.value.trim();
    const desc = document.getElementById('projDesc')?.value.trim();
    const msg = document.getElementById('projectMsg');
    const btn = document.getElementById('saveProjectBtn');

    if (!title || !desc) {
        showMsg(msg, 'Title and description are required.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured yet. Add your credentials to script.js first.');
        }

        // If there's a pending file upload, upload it first
        let finalMediaUrl = document.getElementById('projFinalMediaUrl')?.value || '';
        let mediaType = document.getElementById('projMediaType')?.value || 'image';

        if (window._pendingUploadFile) {
            btn.textContent = 'Uploading media...';
            finalMediaUrl = await uploadFileToSupabase(window._pendingUploadFile);
            mediaType = window._pendingUploadType || 'image';
            window._pendingUploadFile = null;
        }

        const data = {
            title,
            description: desc,
            category: document.getElementById('projCategory')?.value,
            techs: document.getElementById('projTech')?.value
                .split(',').map(t => t.trim()).filter(Boolean),
            status: document.getElementById('projStatus')?.value,
            live_url: document.getElementById('projLiveUrl')?.value.trim() || null,
            github_url: document.getElementById('projGithubUrl')?.value.trim() || null,
            image_url: finalMediaUrl || null,
            media_type: mediaType,
            featured: document.getElementById('projFeatured')?.checked || false,
        };

        const editId = document.getElementById('editProjectId')?.value;

        if (editId) {
            await supabaseAdmin('projects', 'PATCH', data, `id=eq.${editId}`);
            showMsg(msg, 'Project updated successfully!', 'success');
        } else {
            await supabaseAdmin('projects', 'POST', data);
            showMsg(msg, 'Project added successfully!', 'success');
        }

        clearProjectForm();
        document.getElementById('projectFormCard').style.display = 'none';
        loadAdminProjects();

    } catch(err) {
        showMsg(msg, err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Project';
    }
}

async function loadAdminProjects() {
    const container = document.getElementById('admin-projects-list');
    const loading = document.getElementById('admin-projects-loading');
    if (!container) return;

    loading.style.display = 'block';

    if (!isSupabaseConfigured()) {
        loading.style.display = 'none';
        container.innerHTML = `
            <div style="padding:28px;text-align:center;color:var(--text-3)">
                <p style="margin-bottom:12px">Supabase not configured yet.</p>
                <p>Add your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to <strong>script.js</strong>.</p>
                <p style="margin-top:12px;font-size:0.82rem">See SETUP_GUIDE.md for step-by-step instructions.</p>
            </div>`;
        return;
    }

    try {
        const projects = await supabaseQuery('projects', {filter: 'order=created_at.desc'});
        loading.style.display = 'none';

        if (!projects.length) {
            container.innerHTML = '<p style="padding:24px;color:var(--text-3)">No projects yet. Add your first one!</p>';
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead><tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                </tr></thead>
                <tbody>
                    ${projects.map(p => {
                        const thumb = p.image_url
                            ? (p.media_type === 'video'
                                ? `<video src="${p.image_url}" muted autoplay loop playsinline style="width:60px;height:40px;object-fit:cover;border-radius:6px"></video>`
                                : `<img src="${p.image_url}" style="width:60px;height:40px;object-fit:cover;border-radius:6px" alt="">`)
                            : `<div style="width:60px;height:40px;background:var(--bg-input);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:0.7rem">No img</div>`;
                        return `
                        <tr>
                            <td>${thumb}</td>
                            <td class="table-title">${p.title}</td>
                            <td>${p.category}</td>
                            <td><span class="status-pill ${p.status}">${p.status}</span></td>
                            <td>${p.featured ? '⭐' : ''}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="table-btn edit" onclick="editProject(${p.id})">Edit</button>
                                    <button class="table-btn delete" onclick="deleteProject(${p.id}, '${p.title.replace(/'/g, "\\'")}')">Delete</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
    } catch(err) {
        loading.style.display = 'none';
        container.innerHTML = `<p style="color:#e53e3e;padding:16px">Error: ${err.message}</p>`;
    }
}

async function editProject(id) {
    try {
        const projects = await supabaseQuery('projects', {filter: `id=eq.${id}`});
        const p = projects[0];
        if (!p) return;

        document.getElementById('editProjectId').value = p.id;
        document.getElementById('projTitle').value = p.title || '';
        document.getElementById('projDesc').value = p.description || '';
        document.getElementById('projCategory').value = p.category || 'frontend';
        document.getElementById('projTech').value = Array.isArray(p.techs) ? p.techs.join(', ') : (p.techs || '');
        document.getElementById('projStatus').value = p.status || 'live';
        document.getElementById('projLiveUrl').value = p.live_url || '';
        document.getElementById('projGithubUrl').value = p.github_url || '';
        document.getElementById('projFeatured').checked = p.featured || false;
        document.getElementById('projMediaType').value = p.media_type || 'image';
        document.getElementById('projFinalMediaUrl').value = p.image_url || '';

        // Show existing media in URL mode
        if (p.image_url) {
            document.getElementById('toggleUrl').click();
            const urlInput = document.getElementById('projMediaUrl');
            if (urlInput) urlInput.value = p.image_url;
            showUrlPreview(p.image_url, p.media_type === 'video');
        }

        document.getElementById('projectFormTitle').textContent = 'Edit Project';
        document.getElementById('projectFormCard').style.display = 'block';
        document.getElementById('projectFormCard').scrollIntoView({behavior: 'smooth'});
    } catch(err) {
        alert('Failed to load project: ' + err.message);
    }
}

async function deleteProject(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
        await supabaseAdmin('projects', 'DELETE', null, `id=eq.${id}`);
        loadAdminProjects();
    } catch(err) {
        alert('Error: ' + err.message);
    }
}

// ============================================================
//  REVIEWS ADMIN
// ============================================================
async function loadAdminReviews(status) {
    const container = document.getElementById('admin-reviews-list');
    const loading = document.getElementById('admin-reviews-loading');
    if (!container) return;

    loading.style.display = 'block';
    container.innerHTML = '';

    if (!isSupabaseConfigured()) {
        loading.style.display = 'none';
        container.innerHTML = `<p style="padding:24px;color:var(--text-3)">Configure Supabase to manage reviews.</p>`;
        return;
    }

    try {
        const reviews = await supabaseQuery('reviews', {filter: `status=eq.${status}&order=created_at.desc`});
        loading.style.display = 'none';

        if (status === 'pending') {
            const count = document.getElementById('pendingCount');
            if (count) count.textContent = `${reviews.length} pending`;
        }

        if (!reviews.length) {
            container.innerHTML = `<p style="padding:24px;color:var(--text-3)">No ${status} reviews.</p>`;
            return;
        }

        container.innerHTML = reviews.map(r => {
            const stars = '⭐'.repeat(r.rating);
            const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
            const actions = status === 'pending' ? `
                <button class="table-btn approve" onclick="moderateReview(${r.id}, 'approved')">Approve</button>
                <button class="table-btn reject" onclick="moderateReview(${r.id}, 'rejected')">Reject</button>
            ` : status === 'approved' ? `
                <button class="table-btn delete" onclick="deleteReview(${r.id})">Remove</button>
            ` : `
                <button class="table-btn approve" onclick="moderateReview(${r.id}, 'approved')">Approve</button>
            `;

            return `
            <div class="admin-review-item">
                <div class="admin-review-body">
                    <div class="admin-review-header">
                        <span class="admin-review-name">${r.name}</span>
                        <span style="color:var(--text-3);font-size:0.8rem">${r.country || ''}</span>
                        <span>${stars}</span>
                        <span class="status-pill ${r.status}">${r.status}</span>
                    </div>
                    <p class="admin-review-text">"${r.review_text}"</p>
                    <div class="admin-review-meta">
                        ${r.project_type ? `<span>Project: ${r.project_type}</span>` : ''}
                        ${r.role ? `<span>Role: ${r.role}</span>` : ''}
                        <span>${date}</span>
                    </div>
                </div>
                <div class="admin-review-actions">${actions}</div>
            </div>`;
        }).join('');
    } catch(err) {
        loading.style.display = 'none';
        container.innerHTML = `<p style="color:#e53e3e;padding:16px">Error: ${err.message}</p>`;
    }
}

async function moderateReview(id, status) {
    try {
        await supabaseAdmin('reviews', 'PATCH', {status}, `id=eq.${id}`);
        const activeTab = document.querySelector('.review-tab.active')?.dataset.tab || 'pending';
        loadAdminReviews(activeTab);
    } catch(err) {
        alert('Error: ' + err.message);
    }
}

async function deleteReview(id) {
    if (!confirm('Remove this review permanently?')) return;
    try {
        await supabaseAdmin('reviews', 'DELETE', null, `id=eq.${id}`);
        loadAdminReviews('approved');
    } catch(err) {
        alert('Error: ' + err.message);
    }
}

// ============================================================
//  SHARE LINK PANEL
// ============================================================
function setupShareLink() {
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');
    const reviewUrl = baseUrl + 'review.html';

    const input = document.getElementById('reviewLinkInput');
    if (input) input.value = reviewUrl;

    const template = document.getElementById('emailTemplate');
    if (template) template.textContent = template.textContent.replace('[REVIEW_LINK]', reviewUrl);

    document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(reviewUrl);
        const btn = document.getElementById('copyLinkBtn');
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy', 2000);
    });

    document.getElementById('copyEmailTemplate')?.addEventListener('click', () => {
        const text = document.getElementById('emailTemplate')?.textContent || '';
        navigator.clipboard.writeText(text);
        const btn = document.getElementById('copyEmailTemplate');
        btn.textContent = '✓ Template Copied!';
        setTimeout(() => btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy Template', 2000);
    });

    document.getElementById('shareWhatsapp')?.addEventListener('click', () => {
        const msg = encodeURIComponent(`Hi! I'd love if you could leave me a quick review here: ${reviewUrl}`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    });

    document.getElementById('shareEmail')?.addEventListener('click', () => {
        const subject = encodeURIComponent('Could you leave me a review?');
        const body = encodeURIComponent(`Hi,\n\nI'd really appreciate if you could leave me a review here:\n\n${reviewUrl}\n\nThank you!\nOpeyemi John`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
}

// ============================================================
//  SUPABASE HELPERS
// ============================================================
async function supabaseAdmin(table, method, body = null, filter = '') {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    if (filter) url += `?${filter}`;

    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(url, config);
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json().catch(() => null);
}

function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `admin-msg ${type}`;
    setTimeout(() => { if (el) el.className = 'admin-msg'; }, 6000);
}

// ============================================================
//  VISITOR ANALYTICS
// ============================================================
let _currentVisitorMode = 'all';
let _currentVisitorDays = 30;

function setVisitorViewMode(mode) {
    _currentVisitorMode = mode;
    document.getElementById('viewModeAll')?.classList.toggle('approve', mode === 'all');
    document.getElementById('viewModeUnique')?.classList.toggle('approve', mode === 'unique');
    document.getElementById('viewModeAll')?.classList.toggle('edit', mode !== 'all');
    document.getElementById('viewModeUnique')?.classList.toggle('edit', mode !== 'unique');
    loadVisitorTable();
}

async function loadVisitorAnalytics() {
    if (!isSupabaseConfigured()) {
        document.getElementById('visitors-loading').style.display = 'none';
        document.getElementById('visitors-table').innerHTML = `
            <div style="padding:28px;text-align:center;color:var(--text-3)">
                <p>Configure Supabase to see visitor analytics.</p>
                <p style="margin-top:8px;font-size:0.82rem">Also run the visitors SQL from SETUP_GUIDE.md first.</p>
            </div>`;
        return;
    }

    const days = _currentVisitorDays;
    const since = days === 'all' ? null : new Date(Date.now() - days * 86400000).toISOString();
    const filter = since ? `visited_at=gte.${since}` : '';

    try {
        const [visitors, fingerprints] = await Promise.all([
            supabaseQuery('visitors', { filter: filter ? filter + '&order=visited_at.desc' : 'order=visited_at.desc' }),
            supabaseQuery('visitor_fingerprints', { filter: 'order=visit_count.desc' })
        ]);

        renderVisitorStats(visitors, fingerprints);
        renderTopCountries(visitors);
        renderTopSources(visitors);
        renderTopDevices(visitors);
        renderVisitorTable(visitors, fingerprints);

    } catch (err) {
        document.getElementById('visitors-loading').style.display = 'none';
        document.getElementById('visitors-table').innerHTML =
            `<p style="color:#e53e3e;padding:16px">Error: ${err.message}</p>`;
    }
}

function renderVisitorStats(visitors, fingerprints) {
    const today = new Date().toISOString().slice(0, 10);
    const todayVisits = visitors.filter(v => v.visited_at?.slice(0, 10) === today).length;
    const uniqueDevices = new Set(visitors.map(v => v.fingerprint).filter(Boolean)).size;
    const avgTime = visitors.length
        ? Math.round(visitors.reduce((s, v) => s + (v.time_spent_seconds || 0), 0) / visitors.length)
        : 0;
    const avgScroll = visitors.length
        ? Math.round(visitors.reduce((s, v) => s + (v.scroll_depth || 0), 0) / visitors.length)
        : 0;
    const mobileCount = visitors.filter(v => v.device === 'Mobile').length;
    const mobilePct = visitors.length ? Math.round((mobileCount / visitors.length) * 100) : 0;

    document.getElementById('statTotalVisits').textContent = visitors.length.toLocaleString();
    document.getElementById('statUniqueVisitors').textContent = uniqueDevices.toLocaleString();
    document.getElementById('statToday').textContent = todayVisits.toLocaleString();
    document.getElementById('statAvgTime').textContent = avgTime >= 60
        ? Math.floor(avgTime / 60) + 'm ' + (avgTime % 60) + 's'
        : avgTime + 's';
    document.getElementById('statAvgScroll').textContent = avgScroll + '%';
    document.getElementById('statMobile').textContent = mobilePct + '%';
}

function renderTopCountries(visitors) {
    const counts = {};
    visitors.forEach(v => {
        if (v.country) counts[v.country] = (counts[v.country] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = sorted[0]?.[1] || 1;

    document.getElementById('topCountriesList').innerHTML = sorted.length
        ? sorted.map(([country, count]) => `
            <div class="insight-row">
                <div class="insight-row-label">
                    <span>${country}</span>
                </div>
                <div class="insight-bar-wrap">
                    <div class="insight-bar" style="width:${Math.round((count/max)*100)}%"></div>
                </div>
                <span class="insight-count">${count}</span>
            </div>`).join('')
        : '<p style="color:var(--text-3);font-size:0.82rem">No data yet</p>';
}

function renderTopSources(visitors) {
    const counts = {};
    visitors.forEach(v => {
        let source = 'Direct';
        if (v.referrer) {
            try {
                const hostname = new URL(v.referrer).hostname.replace('www.', '');
                if (hostname.includes('google')) source = 'Google';
                else if (hostname.includes('linkedin')) source = 'LinkedIn';
                else if (hostname.includes('twitter') || hostname.includes('x.com')) source = 'Twitter/X';
                else if (hostname.includes('github')) source = 'GitHub';
                else if (hostname.includes('whatsapp')) source = 'WhatsApp';
                else source = hostname;
            } catch { source = 'Direct'; }
        }
        counts[source] = (counts[source] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = sorted[0]?.[1] || 1;

    document.getElementById('topSourcesList').innerHTML = sorted.length
        ? sorted.map(([source, count]) => `
            <div class="insight-row">
                <div class="insight-row-label"><span>${source}</span></div>
                <div class="insight-bar-wrap">
                    <div class="insight-bar" style="width:${Math.round((count/max)*100)}%"></div>
                </div>
                <span class="insight-count">${count}</span>
            </div>`).join('')
        : '<p style="color:var(--text-3);font-size:0.82rem">No data yet</p>';
}

function renderTopDevices(visitors) {
    const counts = { Mobile: 0, Desktop: 0, Tablet: 0 };
    visitors.forEach(v => { if (v.device && counts[v.device] !== undefined) counts[v.device]++; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    const icons = { Mobile: 'bi-phone', Desktop: 'bi-laptop', Tablet: 'bi-tablet' };

    document.getElementById('topDevicesList').innerHTML = sorted.map(([device, count]) => `
        <div class="insight-row">
            <div class="insight-row-label">
                <i class="bi ${icons[device] || 'bi-display'}"></i>
                <span>${device}</span>
            </div>
            <div class="insight-bar-wrap">
                <div class="insight-bar" style="width:${max ? Math.round((count/max)*100) : 0}%"></div>
            </div>
            <span class="insight-count">${count}</span>
        </div>`).join('');
}

function renderVisitorTable(visitors, fingerprints) {
    document.getElementById('visitors-loading').style.display = 'none';
    const container = document.getElementById('visitors-table');

    if (!visitors.length) {
        container.innerHTML = '<p style="padding:24px;color:var(--text-3)">No visitors recorded yet. Make sure tracker.js is added to index.html and Supabase tables are created.</p>';
        return;
    }

    const fpMap = {};
    fingerprints.forEach(f => { fpMap[f.fingerprint] = f; });

    if (_currentVisitorMode === 'unique') {
        // Group by fingerprint
        const grouped = {};
        visitors.forEach(v => {
            if (!grouped[v.fingerprint]) grouped[v.fingerprint] = [];
            grouped[v.fingerprint].push(v);
        });

        const rows = Object.entries(grouped)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([fp, sessions]) => {
                const latest = sessions[0];
                const fpData = fpMap[fp];
                const visitCount = fpData?.visit_count || sessions.length;
                const firstSeen = fpData?.first_seen
                    ? new Date(fpData.first_seen).toLocaleDateString() : '—';
                const lastSeen = fpData?.last_seen
                    ? new Date(fpData.last_seen).toLocaleDateString() : '—';
                const avgTime = Math.round(sessions.reduce((s, v) => s + (v.time_spent_seconds || 0), 0) / sessions.length);

                return `<tr>
                    <td><span class="visitor-fp-badge">${fp.slice(0, 12)}...</span>${visitCount > 1 ? `<span class="visitor-return-badge" style="margin-left:6px">↩ ${visitCount}x</span>` : ''}</td>
                    <td>${latest.country || '—'}<br><span class="visitor-time">${latest.city || ''}</span></td>
                    <td>${latest.device || '—'}<br><span class="visitor-time">${latest.os || ''} · ${latest.browser || ''}</span></td>
                    <td>${latest.screen_resolution || '—'}</td>
                    <td>${avgTime >= 60 ? Math.floor(avgTime/60)+'m '+avgTime%60+'s' : avgTime+'s'}</td>
                    <td><span class="visitor-time">${firstSeen}</span><br><span class="visitor-time">Last: ${lastSeen}</span></td>
                </tr>`;
            }).join('');

        container.innerHTML = `
            <table class="admin-table">
                <thead><tr>
                    <th>Fingerprint</th><th>Location</th><th>Device</th>
                    <th>Screen</th><th>Avg Time</th><th>First / Last Seen</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    } else {
        // All sessions
        const rows = visitors.map(v => {
            const fpData = fpMap[v.fingerprint];
            const visitCount = fpData?.visit_count || 1;
            const timeSpent = v.time_spent_seconds || 0;
            const timeStr = timeSpent >= 60
                ? Math.floor(timeSpent/60) + 'm ' + timeSpent%60 + 's'
                : timeSpent + 's';
            const visitedAt = v.visited_at
                ? new Date(v.visited_at).toLocaleString() : '—';
            const sections = Array.isArray(v.sections_visited)
                ? v.sections_visited.join(', ') : '—';

            return `<tr>
                <td>${visitedAt}</td>
                <td>${v.country || '—'}<br><span class="visitor-time">${v.city || ''} ${v.region || ''}</span></td>
                <td>${v.device || '—'}<br><span class="visitor-time">${v.os || ''} · ${v.browser || ''}</span></td>
                <td>${v.ip || '—'}<br><span class="visitor-time">${v.timezone || ''}</span></td>
                <td>${timeStr}<br><span class="visitor-time">Scroll: ${v.scroll_depth || 0}%</span></td>
                <td style="max-width:140px;font-size:0.75rem;color:var(--text-3)">${sections}</td>
                <td>${visitCount > 1 ? `<span class="visitor-return-badge">↩ ${visitCount}x</span>` : '<span style="color:var(--text-3);font-size:0.78rem">New</span>'}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <table class="admin-table">
                <thead><tr>
                    <th>Time</th><th>Location</th><th>Device</th>
                    <th>IP / Timezone</th><th>Time & Scroll</th><th>Sections</th><th>Return?</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    }
}

async function loadVisitorTable() {
    document.getElementById('visitors-loading').style.display = 'block';
    document.getElementById('visitors-table').innerHTML = '';
    await loadVisitorAnalytics();
}
