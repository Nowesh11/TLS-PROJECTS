// Main JavaScript functionality for Tamil Language Society website

// DOM Elements
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const notificationDot = document.getElementById('notification-dot');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeAnimations();
    initializeCounters();
    initializeScrollEffects();
    initializeNotifications();
    initializeForms();
    initializeParticles();
    
    // Show welcome notification after page load
    setTimeout(() => {
        showNotification('வணக்கம்! Welcome to Tamil Language Society');
    }, 2000);
});

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close mobile menu when clicking on nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = 'var(--shadow-lg)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Active nav link highlighting
    highlightActiveNavLink();
}

function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html') ||
            (currentPage === 'index.html' && linkHref === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Animation initialization
function initializeAnimations() {
    // Add animation classes to elements
    const animatedElements = document.querySelectorAll('.feature-card');
    animatedElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
        element.classList.add('animate-fadeInUp');
    });
    
    // Hero animations
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroText) {
        heroText.classList.add('animate-fadeInLeft');
    }
    
    if (heroImage) {
        heroImage.classList.add('animate-fadeInRight');
    }
    
    // Stagger animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
}

// Counter animation for statistics
function initializeCounters() {
    const counters = document.querySelectorAll('[data-target]');
    
    const countUp = (element, target, duration = 2000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.floor(current).toLocaleString();
            
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            }
        }, 16);
    };
    
    // Intersection Observer for counter animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                countUp(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Scroll effects and animations
function initializeScrollEffects() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll-triggered animations
    const scrollElements = document.querySelectorAll('.scroll-animate');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    scrollElements.forEach(element => {
        scrollObserver.observe(element);
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Notification system
function initializeNotifications() {
    // Show notification dot if there are unread notifications
    const unreadCount = getUnreadNotificationCount();
    if (unreadCount > 0) {
        notificationDot.classList.add('show');
    }
    
    // Check for new notifications periodically
    setInterval(checkForNewNotifications, 30000); // Check every 30 seconds
}

function getUnreadNotificationCount() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => !n.read).length;
}

function checkForNewNotifications() {
    // Simulate checking for new notifications
    const hasNewNotification = Math.random() < 0.1; // 10% chance
    
    if (hasNewNotification) {
        const newNotification = {
            id: Date.now(),
            title: 'New Tamil Learning Resource Available',
            message: 'புதிய தமிழ் கற்றல் வளம் கிடைக்கிறது',
            timestamp: new Date(),
            read: false,
            type: 'info'
        };
        
        addNotification(newNotification);
        showNotification(newNotification.message);
        notificationDot.classList.add('show');
    }
}

function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function showNotification(message, type = 'info', duration = 5000) {
    const toast = document.getElementById('notification-toast');
    const messageElement = toast.querySelector('.toast-message');
    
    messageElement.textContent = message;
    toast.classList.add('show');
    
    // Auto-hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function closeNotification() {
    const toast = document.getElementById('notification-toast');
    toast.classList.remove('show');
}

// Form handling
function initializeForms() {
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        const input = newsletterForm.querySelector('.newsletter-input');
        const button = newsletterForm.querySelector('.newsletter-btn');
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const email = input.value.trim();
            
            if (email && isValidEmail(email)) {
                showNotification('நன்றி! Thank you for subscribing to our newsletter');
                input.value = '';
            } else {
                showNotification('Please enter a valid email address', 'error');
                input.classList.add('animate-shake');
                setTimeout(() => input.classList.remove('animate-shake'), 600);
            }
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                button.click();
            }
        });
    }
    
    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginForm);
    }
    
    // Signup form handling
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupForm);
    }
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    if (name && email && message && isValidEmail(email)) {
        // Simulate form submission
        showNotification('உங்கள் செய்தி அனுப்பப்பட்டது! Your message has been sent successfully');
        e.target.reset();
        
        // Show thank you message
        setTimeout(() => {
            showThankYouMessage();
        }, 1000);
    } else {
        showNotification('Please fill in all fields correctly', 'error');
    }
}

function handleLoginForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (email && password && isValidEmail(email)) {
        // Simulate login
        localStorage.setItem('user', JSON.stringify({
            email: email,
            name: 'Tamil User',
            loginTime: new Date()
        }));
        
        showNotification('வணக்கம்! Login successful');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleSignupForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (name && email && password && isValidEmail(email)) {
        // Simulate signup
        localStorage.setItem('user', JSON.stringify({
            name: name,
            email: email,
            signupTime: new Date()
        }));
        
        showNotification('வணக்கம்! Account created successfully');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showNotification('Please fill in all fields correctly', 'error');
    }
}

function showThankYouMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'thank-you-message';
    messageDiv.innerHTML = `
        <div class="thank-you-content">
            <i class="fas fa-check-circle"></i>
            <h3>நன்றி! Thank You!</h3>
            <p>Your message has been received. We'll get back to you soon.</p>
            <p class="tamil-text">உங்கள் செய்தி பெறப்பட்டது. நாங்கள் விரைவில் உங்களைத் தொடர்பு கொள்வோம்.</p>
        </div>
    `;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = messageDiv.querySelector('.thank-you-content');
    content.style.cssText = `
        background: white;
        padding: 3rem;
        border-radius: 1rem;
        text-align: center;
        max-width: 500px;
        animation: scaleIn 0.5s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 4000);
    
    messageDiv.addEventListener('click', function(e) {
        if (e.target === messageDiv) {
            document.body.removeChild(messageDiv);
        }
    });
}

// Particle background effect
function initializeParticles() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-background';
    heroSection.appendChild(particleContainer);
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        
        particleContainer.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 25000);
    }
    
    // Create initial particles
    for (let i = 0; i < 20; i++) {
        setTimeout(createParticle, i * 200);
    }
    
    // Continue creating particles
    setInterval(createParticle, 1000);
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other files
window.TamilSociety = {
    showNotification,
    closeNotification,
    addNotification,
    getUnreadNotificationCount,
    isValidEmail,
    formatDate
};

// Performance optimization
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Initialize non-critical features
        console.log('Tamil Language Society website loaded successfully');
    });
}

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
