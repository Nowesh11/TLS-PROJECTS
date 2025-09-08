// Scroll Animation System for Card-Based Design

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Add stagger animation for cards in the same container
            const container = entry.target.closest('.features-grid, .footer-cards, .team-grid');
            if (container) {
                const cards = container.querySelectorAll('.gradient-card, .footer-card, .feature-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('in-view');
                    }, index * 100);
                });
            }
        }
    });
}, observerOptions);

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add animate-on-scroll class to all cards
    const cards = document.querySelectorAll('.gradient-card, .footer-card, .feature-card, .card');
    cards.forEach(card => {
        card.classList.add('animate-on-scroll');
        animateOnScroll.observe(card);
    });

    // Add interactive hover effects to clickable cards
    const interactiveCards = document.querySelectorAll('.gradient-card, .footer-card, .feature-card');
    interactiveCards.forEach(card => {
        // Add interactive class for enhanced hover effects
        if (card.querySelector('a') || card.onclick || card.getAttribute('data-link')) {
            card.classList.add('card-interactive');
        }

        // Add click handler for cards with data-link attribute
        const link = card.getAttribute('data-link');
        if (link) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = link;
            });
        }
    });

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add floating animation to hero elements
    const heroElements = document.querySelectorAll('.hero-content h1, .hero-content .subtitle');
    heroElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('floating');
        }, index * 200);
    });

    // Parallax effect for hero sections
    const heroSections = document.querySelectorAll('.hero-section');
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        heroSections.forEach(hero => {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    });

    // Add loading shimmer effect to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.complete) {
            img.classList.add('loading');
            img.addEventListener('load', () => {
                img.classList.remove('loading');
            });
        }
    });

    // Enhanced button interactions
    const buttons = document.querySelectorAll('.btn, .hero-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(0) scale(0.98)';
        });
        
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'translateY(-2px) scale(1)';
        });
    });

    // Add pulse animation to important elements
    const importantElements = document.querySelectorAll('.cta-button, .primary-btn');
    importantElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            element.style.animation = 'pulse 1s ease-in-out';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.animation = '';
        });
    });

    console.log('Scroll animations initialized successfully');
});

// Performance optimization: throttle scroll events
function throttle(func, wait) {
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { animateOnScroll, throttle };
}