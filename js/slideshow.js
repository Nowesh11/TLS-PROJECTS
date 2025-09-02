/**
 * Hero Slideshow Manager
 * Handles automatic slideshow functionality for hero sections
 */

class HeroSlideshow {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoPlay: true,
            interval: 5000,
            showControls: true,
            showIndicators: true,
            pauseOnHover: true,
            ...options
        };
        
        this.currentSlide = 0;
        this.slides = [];
        this.isPlaying = this.options.autoPlay;
        this.intervalId = null;
        
        this.init();
    }
    
    init() {
        this.createSlideshowStructure();
        this.loadSlides();
        this.setupEventListeners();
        
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
    }
    
    createSlideshowStructure() {
        // Create slideshow container
        const slideshowHtml = `
            <div class="hero-slideshow">
                <div class="slideshow-container">
                    <!-- Slides will be added here -->
                </div>
                ${this.options.showControls ? `
                    <button class="slideshow-controls prev-btn" aria-label="Previous slide">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="slideshow-controls next-btn" aria-label="Next slide">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                ` : ""}
                ${this.options.showIndicators ? `
                    <div class="slideshow-indicators">
                        <!-- Indicators will be added here -->
                    </div>
                ` : ""}
            </div>
        `;
        
        // Insert slideshow before hero-background
        const heroBackground = this.container.querySelector(".hero-background");
        if (heroBackground) {
            heroBackground.insertAdjacentHTML("beforebegin", slideshowHtml);
        } else {
            this.container.insertAdjacentHTML("afterbegin", slideshowHtml);
        }
        
        this.slideshowContainer = this.container.querySelector(".slideshow-container");
        this.prevBtn = this.container.querySelector(".prev-btn");
        this.nextBtn = this.container.querySelector(".next-btn");
        this.indicatorsContainer = this.container.querySelector(".slideshow-indicators");
    }
    
    async loadSlides() {
        try {
            // Try to load custom slideshow images from API
            const customSlides = await this.loadCustomSlides();
            
            if (customSlides && customSlides.length > 0) {
                this.slides = customSlides;
            } else {
                // Use default gradient slides
                this.slides = this.getDefaultSlides();
            }
            
            this.createSlides();
            this.createIndicators();
            this.showSlide(0);
            
        } catch (error) {
            console.warn("Failed to load custom slides, using defaults:", error);
            this.slides = this.getDefaultSlides();
            this.createSlides();
            this.createIndicators();
            this.showSlide(0);
        }
    }
    
    async loadCustomSlides() {
        try {
            // Try to load from API
            const response = await fetch("/api/slideshow/images");
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.length > 0) {
                    return result.data.map(slide => ({
                        type: "image",
                        url: slide.url,
                        alt: slide.alt || "Slideshow image",
                        title: slide.title || "",
                        id: slide.id
                    }));
                }
            }
        } catch (error) {
            console.warn("Could not load slideshow images from API:", error);
        }
        
        // Fallback: Check for stored slideshow images
        const storedSlides = localStorage.getItem("heroSlideshowImages");
        if (storedSlides) {
            try {
                return JSON.parse(storedSlides);
            } catch (error) {
                console.warn("Could not parse stored slideshow images:", error);
            }
        }
        
        return null;
    }
    
    getDefaultSlides() {
        return [
            {
                type: "gradient",
                class: "default-1",
                alt: "Tamil Culture Heritage"
            },
            {
                type: "gradient", 
                class: "default-2",
                alt: "Tamil Literature"
            },
            {
                type: "gradient",
                class: "default-3", 
                alt: "Tamil Language Learning"
            },
            {
                type: "gradient",
                class: "default-4",
                alt: "Tamil Community"
            },
            {
                type: "gradient",
                class: "default-5",
                alt: "Tamil Traditions"
            }
        ];
    }
    
    createSlides() {
        this.slideshowContainer.innerHTML = "";
        
        this.slides.forEach((slide, index) => {
            const slideElement = document.createElement("div");
            slideElement.className = "slide";
            slideElement.setAttribute("data-slide", index);
            // Remove aria-label from div elements as they don't have a valid role
            // slideElement.setAttribute("aria-label", slide.alt || `Slide ${index + 1}`);
            
            if (slide.type === "image" && slide.url) {
                slideElement.style.backgroundImage = `url(${slide.url})`;
                slideElement.style.backgroundSize = "cover";
                slideElement.style.backgroundPosition = "center";
                slideElement.style.backgroundRepeat = "no-repeat";
            } else if (slide.type === "gradient" && slide.class) {
                slideElement.classList.add(slide.class);
            }
            
            this.slideshowContainer.appendChild(slideElement);
        });
    }
    
    createIndicators() {
        if (!this.indicatorsContainer) return;
        
        this.indicatorsContainer.innerHTML = "";
        
        this.slides.forEach((_, index) => {
            const indicator = document.createElement("button");
            indicator.className = "indicator";
            indicator.setAttribute("data-slide", index);
            indicator.setAttribute("aria-label", `Go to slide ${index + 1}`);
            
            indicator.addEventListener("click", () => {
                this.goToSlide(index);
            });
            
            this.indicatorsContainer.appendChild(indicator);
        });
    }
    
    setupEventListeners() {
        // Control buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener("click", () => this.previousSlide());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener("click", () => this.nextSlide());
        }
        
        // Pause on hover
        if (this.options.pauseOnHover) {
            this.container.addEventListener("mouseenter", () => this.pauseAutoPlay());
            this.container.addEventListener("mouseleave", () => {
                if (this.options.autoPlay) {
                    this.startAutoPlay();
                }
            });
        }
        
        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (this.container.matches(":hover")) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    this.previousSlide();
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    this.nextSlide();
                }
            }
        });
        
        // Touch/swipe support
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        this.container.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        this.container.addEventListener("touchend", (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Only trigger if horizontal swipe is more significant than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
        }, { passive: true });
    }
    
    showSlide(index) {
        // Remove active class from all slides and indicators
        this.container.querySelectorAll(".slide").forEach(slide => {
            slide.classList.remove("active");
        });
        
        this.container.querySelectorAll(".indicator").forEach(indicator => {
            indicator.classList.remove("active");
        });
        
        // Add active class to current slide and indicator
        const currentSlide = this.container.querySelector(`[data-slide="${index}"]`);
        if (currentSlide) {
            currentSlide.classList.add("active");
        }
        
        const currentIndicator = this.indicatorsContainer?.querySelector(`[data-slide="${index}"]`);
        if (currentIndicator) {
            currentIndicator.classList.add("active");
        }
        
        this.currentSlide = index;
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
    
    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.showSlide(index);
        }
    }
    
    startAutoPlay() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, this.options.interval);
        
        this.isPlaying = true;
    }
    
    pauseAutoPlay() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isPlaying = false;
    }
    
    resumeAutoPlay() {
        if (this.options.autoPlay && !this.isPlaying) {
            this.startAutoPlay();
        }
    }
    
    destroy() {
        this.pauseAutoPlay();
        
        // Remove slideshow elements
        const slideshowElement = this.container.querySelector(".hero-slideshow");
        if (slideshowElement) {
            slideshowElement.remove();
        }
    }
    
    // Public API methods
    addSlide(slide) {
        this.slides.push(slide);
        this.createSlides();
        this.createIndicators();
    }
    
    removeSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.slides.splice(index, 1);
            this.createSlides();
            this.createIndicators();
            
            // Adjust current slide if necessary
            if (this.currentSlide >= this.slides.length) {
                this.currentSlide = this.slides.length - 1;
            }
            this.showSlide(this.currentSlide);
        }
    }
    
    updateSlides(newSlides) {
        this.slides = newSlides;
        this.createSlides();
        this.createIndicators();
        this.showSlide(0);
    }
}

// Initialize slideshows on page load
document.addEventListener("DOMContentLoaded", function() {
    // Initialize slideshow for all hero sections (except login/signup pages)
    const heroSections = document.querySelectorAll(".hero");
    const currentPage = window.location.pathname.split("/").pop();
    
    // Skip slideshow on login and signup pages
    if (currentPage === "login.html" || currentPage === "signup.html") {
        return;
    }
    
    heroSections.forEach(hero => {
        // Create slideshow instance
        const slideshow = new HeroSlideshow(hero, {
            autoPlay: true,
            interval: 6000,
            showControls: true,
            showIndicators: true,
            pauseOnHover: true
        });
        
        // Store reference for potential later use
        hero.slideshowInstance = slideshow;
    });
});

// Export for use in other scripts
if (typeof window !== "undefined") {
    window.HeroSlideshow = HeroSlideshow;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = HeroSlideshow;
}