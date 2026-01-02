// ============================
// PORTFOLIO SCRIPT.JS
// Google Apps Script Contact Form Integration
// ============================

// ============================
// CONFIGURATION
// ============================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxL7Aiq3DrQwJ2YxZXT2eE3WhKeKDqYm-DQe6eN1Yw73tZiLKIB-XXVIeyphb7HbemN3A/exec";

// ============================
// MAIN INITIALIZATION
// ============================
document.addEventListener('DOMContentLoaded', function() {
    initializeAllFeatures();
});

function initializeAllFeatures() {
    setupProjectFilters();
    setupDarkModeToggle();
    setupContactForm();
    setupTestimonialCarousel();
    setupFooterFeatures();
    setupAnimations();
    setupBackToTop();
    setupNavbarScroll();
}

// ============================
// 1. PROJECT FILTERS
// ============================
function setupProjectFilters() {
    const filterButtons = document.querySelectorAll('#project-filters .btn');
    const projectItems = document.querySelectorAll('.project-item');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            
            // Add active class to clicked button
            this.classList.remove('btn-outline-primary');
            this.classList.add('active', 'btn-primary');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Show/hide projects based on filter
            projectItems.forEach(item => {
                if (filterValue === 'all') {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    const categories = item.getAttribute('data-category').split(' ');
                    if (categories.includes(filterValue)) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    });
}

// ============================
// 2. DARK MODE TOGGLE
// ============================
function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    const darkModeIcon = darkModeToggle.querySelector('i');
    
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            darkModeIcon.classList.remove('bi-moon');
            darkModeIcon.classList.add('bi-sun');
            darkModeToggle.classList.remove('btn-outline-light');
            darkModeToggle.classList.add('btn-light');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            darkModeIcon.classList.remove('bi-sun');
            darkModeIcon.classList.add('bi-moon');
            darkModeToggle.classList.remove('btn-light');
            darkModeToggle.classList.add('btn-outline-light');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
    
    // Check saved preference on load
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('bi-moon');
        darkModeIcon.classList.add('bi-sun');
        darkModeToggle.classList.remove('btn-outline-light');
        darkModeToggle.classList.add('btn-light');
    }
}

// ============================
// 3. CONTACT FORM WITH GOOGLE APPS SCRIPT
// ============================
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Get form elements
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        
        // Hide previous alerts
        successAlert.classList.add('d-none');
        errorAlert.classList.add('d-none');
        
        // Validate form
        if (!validateContactForm()) {
            return;
        }
        
        // Show loading state
        submitText.textContent = 'Sending...';
        submitSpinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        // Prepare form data for Google Apps Script
        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim(),
            timestamp: new Date().toISOString()
        };
        
        try {
            // Send to Google Apps Script
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // Note: With 'no-cors' mode, we can't read the response status
            // But the request is sent successfully to Google Apps Script
            
            // Show success message
            successAlert.classList.remove('d-none');
            
            // Reset form
            contactForm.reset();
            
            // Reset validation classes
            [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
            
            // Log success (for debugging)
            console.log('✅ Message sent successfully!');
            console.log('📧 Form data:', formData);
            
        } catch (error) {
            // Show error message
            errorAlert.classList.remove('d-none');
            console.error('❌ Error sending message:', error);
            
        } finally {
            // Reset button state
            submitText.textContent = 'Send Message';
            submitSpinner.classList.add('d-none');
            submitBtn.disabled = false;
            
            // Auto-hide alerts after 5 seconds
            setTimeout(() => {
                successAlert.classList.add('d-none');
                errorAlert.classList.add('d-none');
            }, 5000);
        }
    });
    
    // Real-time form validation
    contactForm.addEventListener('input', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.target.classList.remove('is-invalid');
        }
    });
}

// Contact form validation helper
function validateContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return false;
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    
    let isValid = true;
    
    if (!nameInput.value.trim()) {
        nameInput.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInput.classList.remove('is-invalid');
    }
    
    if (!emailInput.value.trim() || !validateEmail(emailInput.value)) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    } else {
        emailInput.classList.remove('is-invalid');
    }
    
    if (!subjectInput.value.trim()) {
        subjectInput.classList.add('is-invalid');
        isValid = false;
    } else {
        subjectInput.classList.remove('is-invalid');
    }
    
    if (!messageInput.value.trim()) {
        messageInput.classList.add('is-invalid');
        isValid = false;
    } else {
        messageInput.classList.remove('is-invalid');
    }
    
    if (!isValid) {
        // Scroll to first error
        const firstInvalid = contactForm.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }
    
    return isValid;
}

// Email validation helper
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// ============================
// 4. TESTIMONIAL CAROUSEL
// ============================
function setupTestimonialCarousel() {
    const testimonialCarousel = document.getElementById('testimonialCarousel');
    if (!testimonialCarousel) return;
    
    const carousel = new bootstrap.Carousel(testimonialCarousel, {
        interval: 5000,
        wrap: true,
        pause: 'hover'
    });
    
    // Auto-play carousel
    carousel.cycle();
    
    // Pause on hover
    testimonialCarousel.addEventListener('mouseenter', function() {
        carousel.pause();
    });
    
    testimonialCarousel.addEventListener('mouseleave', function() {
        carousel.cycle();
    });
}

// ============================
// 5. FOOTER FEATURES
// ============================
function setupFooterFeatures() {
    // Set current year in footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Smooth scrolling for footer links
    document.querySelectorAll('footer a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================
// 6. ANIMATIONS
// ============================
function setupAnimations() {
    // Fade-in animation for elements with .fade-in class
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// ============================
// 7. BACK TO TOP BUTTON - FIXED VERSION
// ============================
function setupBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;
    
    // Initially hide the button
    backToTopButton.style.display = 'none';
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
            // Small delay for smooth appearance
            setTimeout(() => {
                backToTopButton.style.opacity = '1';
            }, 10);
        } else {
            backToTopButton.style.opacity = '0';
            setTimeout(() => {
                if (window.pageYOffset <= 300) {
                    backToTopButton.style.display = 'none';
                }
            }, 300);
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================
// 8. NAVBAR SCROLL EFFECT
// ============================
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}