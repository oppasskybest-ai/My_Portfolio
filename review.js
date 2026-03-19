// ============================================================
//  REVIEW PAGE — review.js
//  Submits reviews to Supabase (pending approval)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    setupStarRating();
    setupCharCount();
    setupReviewForm();
});

// ---- STAR RATING ----
function setupStarRating() {
    const stars = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('ratingValue');
    const starLabel = document.getElementById('starLabel');

    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            highlightStars(val);
            if (starLabel) starLabel.textContent = labels[val];
        });

        star.addEventListener('mouseleave', () => {
            const current = parseInt(ratingInput?.value || 0);
            highlightStars(current);
            if (starLabel) starLabel.textContent = current ? labels[current] : 'Click to rate';
        });

        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.value);
            if (ratingInput) ratingInput.value = val;
            highlightStars(val);
            if (starLabel) starLabel.textContent = labels[val];
            document.getElementById('starSelector')?.closest('.form-group')?.classList.remove('has-error');
        });
    });
}

function highlightStars(value) {
    document.querySelectorAll('.star-btn').forEach((star, i) => {
        const icon = star.querySelector('i');
        if (i < value) {
            icon.className = 'bi bi-star-fill';
            star.classList.add('active');
        } else {
            icon.className = 'bi bi-star';
            star.classList.remove('active');
        }
    });
}

// ---- CHAR COUNT ----
function setupCharCount() {
    const textarea = document.getElementById('reviewText');
    const counter = document.getElementById('charCount');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = `${len} / 500`;
        if (len > 500) {
            textarea.value = textarea.value.slice(0, 500);
            counter.textContent = '500 / 500';
        }
    });
}

// ---- REVIEW FORM ----
function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateReviewForm()) return;

        const btn = document.getElementById('reviewSubmitBtn');
        const text = document.getElementById('reviewSubmitText');
        const spinner = document.getElementById('reviewSpinner');

        text.textContent = 'Submitting...';
        spinner?.classList.remove('d-none');
        btn.disabled = true;

        const reviewData = {
            name: document.getElementById('reviewName').value.trim(),
            country: document.getElementById('reviewCountry').value,
            role: document.getElementById('reviewRole').value.trim() || null,
            project_type: document.getElementById('reviewProject').value,
            review_text: document.getElementById('reviewText').value.trim(),
            rating: parseInt(document.getElementById('ratingValue').value),
            photo_url: document.getElementById('reviewPhoto').value.trim() || null,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        try {
            if (isSupabaseConfigured()) {
                await submitReviewToSupabase(reviewData);
            } else {
                // Simulate success when Supabase not configured yet
                await new Promise(r => setTimeout(r, 800));
                console.log('Review data (Supabase not configured yet):', reviewData);
            }

            // Show success
            document.getElementById('reviewFormCard').style.display = 'none';
            document.getElementById('reviewSuccess').style.display = 'block';
            window.scrollTo({top: 0, behavior: 'smooth'});

        } catch (err) {
            console.error(err);
            text.textContent = 'Error — please try again';
            btn.disabled = false;
            spinner?.classList.add('d-none');
            setTimeout(() => {
                text.textContent = 'Submit Review';
            }, 3000);
        }
    });
}

async function submitReviewToSupabase(data) {
    const url = `${SUPABASE_URL}/rest/v1/reviews`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to submit: ${res.status}`);
}

function validateReviewForm() {
    let valid = true;

    // Rating
    const rating = parseInt(document.getElementById('ratingValue')?.value || 0);
    const ratingGroup = document.getElementById('starSelector')?.closest('.form-group');
    if (rating < 1) {
        ratingGroup?.classList.add('has-error');
        valid = false;
    } else {
        ratingGroup?.classList.remove('has-error');
    }

    // Text fields
    const fields = [
        {id: 'reviewName', errId: 'reviewNameError'},
        {id: 'reviewCountry', errId: 'reviewCountryError'},
        {id: 'reviewProject', errId: 'reviewProjectError'},
        {
            id: 'reviewText',
            errId: 'reviewTextError',
            validator: v => v.length >= 20
        }
    ];

    fields.forEach(f => {
        const el = document.getElementById(f.id);
        const group = el?.closest('.form-group');
        const val = el?.value.trim();
        const ok = f.validator ? f.validator(val) : val && val.length > 0;
        if (!ok) {
            group?.classList.add('has-error');
            valid = false;
        } else {
            group?.classList.remove('has-error');
        }
    });

    // Consent
    const consent = document.getElementById('reviewConsent');
    const consentGroup = consent?.closest('.form-group');
    if (!consent?.checked) {
        consentGroup?.classList.add('has-error');
        valid = false;
    } else {
        consentGroup?.classList.remove('has-error');
    }

    return valid;
}
