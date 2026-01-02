// Project Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('#project-filters .btn');
    const projectItems = document.querySelectorAll('.project-item');
    
    // Filter projects
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active', 'btn-primary'));
            filterButtons.forEach(btn => btn.classList.add('btn-outline-primary'));
            
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
    
    // Dark Mode Toggle - FIXED
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const darkModeIcon = darkModeToggle.querySelector('i');
        
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                darkModeIcon.classList.remove('bi-moon');
                darkModeIcon.classList.add('bi-sun');
                darkModeToggle.classList.remove('btn-outline-light');
                darkModeToggle.classList.add('btn-light');
            } else {
                darkModeIcon.classList.remove('bi-sun');
                darkModeIcon.classList.add('bi-moon');
                darkModeToggle.classList.remove('btn-light');
                darkModeToggle.classList.add('btn-outline-light');
            }
        });
    }
    
    // Contact Form Validation and Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
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
            let isValid = true;
            
            if (!nameInput.value.trim()) {
                nameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                nameInput.classList.remove('is-invalid');
                nameInput.classList.add('is-valid');
            }
            
            if (!emailInput.value.trim() || !validateEmail(emailInput.value)) {
                emailInput.classList.add('is-invalid');
                isValid = false;
            } else {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            }
            
            if (!subjectInput.value.trim()) {
                subjectInput.classList.add('is-invalid');
                isValid = false;
            } else {
                subjectInput.classList.remove('is-invalid');
                subjectInput.classList.add('is-valid');
            }
            
            if (!messageInput.value.trim()) {
                messageInput.classList.add('is-invalid');
                isValid = false;
            } else {
                messageInput.classList.remove('is-invalid');
                messageInput.classList.add('is-valid');
            }
            
            if (!isValid) {
                // Scroll to first error
                const firstInvalid = contactForm.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
            
            // Show loading state
            submitText.textContent = 'Sending...';
            submitSpinner.classList.remove('d-none');
            submitBtn.disabled = true;
            
            // Prepare form data
            const formData = {
                name: nameInput.value,
                email: emailInput.value,
                subject: subjectInput.value,
                message: messageInput.value,
                timestamp: new Date().toISOString()
            };
            
            // Simulate email sending (temporary)
            setTimeout(() => {
                // Show success message
                successAlert.classList.remove('d-none');
                
                // Reset form
                contactForm.reset();
                
                // Reset validation classes
                [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
                
                // Reset button state
                submitText.textContent = 'Send Message';
                submitSpinner.classList.add('d-none');
                submitBtn.disabled = false;
                
                // Scroll to success message
                successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                console.log('Form submitted (simulated)');
            }, 1500);
        });
    }
    
    // Email validation helper function
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    // Initialize testimonial carousel
    const testimonialCarousel = document.getElementById('testimonialCarousel');
    if (testimonialCarousel) {
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
    
    // ============ FOOTER FUNCTIONALITY ============
    // Set current year in footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    // Back to Top Button functionality
    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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
    
}); // END OF DOMContentLoaded