/**
 * Enhanced Image Manager for Books
 * Handles image loading, fallbacks, lazy loading, and optimization
 */

class ImageManager {
    constructor() {
        this.defaultImages = {
            book: "/assets/default-book-cover.svg",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        };
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        // Set up intersection observer for lazy loading
        this.setupLazyLoading();
        
        // Preload default images
        this.preloadDefaults();
    }

    setupLazyLoading() {
        if ("IntersectionObserver" in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: "50px"
            });
        }
    }

    preloadDefaults() {
        // Preload default book image
        const defaultImg = new Image();
        defaultImg.src = this.defaultImages.book;
    }

    /**
     * Enhanced image processing with multiple fallbacks
     */
    static processImageUrl(imageValue, options = {}) {
        const {
            width = null,
            height = null,
            quality = 85,
            format = "webp",
            fallback = "/assets/default-book-cover.svg"
        } = options;

        if (!imageValue) {
            return fallback;
        }

        let imageUrl = imageValue;
        const backendUrl = "http://127.0.0.1:8080";

        // Handle different URL formats
        if (!imageValue.startsWith("http")) {
            if (imageValue.startsWith("/uploads/") || imageValue.startsWith("uploads/")) {
                // Backend uploads - use backend URL
                const cleanPath = imageValue.startsWith("/") ? imageValue : `/${imageValue}`;
                imageUrl = `${backendUrl}${cleanPath}`;
            } else if (imageValue.startsWith("/assets/") || imageValue.startsWith("assets/")) {
                // Frontend assets - use frontend URL
                const cleanPath = imageValue.startsWith("/") ? imageValue : `/${imageValue}`;
                imageUrl = `${window.location.origin}${cleanPath}`;
            } else if (imageValue.startsWith("/")) {
                // Other absolute paths - check if it's assets or uploads
                if (imageValue.includes("assets")) {
                    imageUrl = `${window.location.origin}${imageValue}`;
                } else {
                    imageUrl = `${backendUrl}${imageValue}`;
                }
            } else if (imageValue.includes("data:image")) {
                // Handle base64 images
                return imageValue;
            } else {
                // Assume it's a filename in uploads/books
                imageUrl = `${backendUrl}/uploads/books/${imageValue}`;
            }
        }

        // Add optimization parameters for supported formats
        if (width || height || quality !== 85) {
            try {
                const url = new URL(imageUrl);
                if (width) url.searchParams.set("w", width);
                if (height) url.searchParams.set("h", height);
                if (quality !== 85) url.searchParams.set("q", quality);
                if (format !== "webp") url.searchParams.set("f", format);
                imageUrl = url.toString();
            } catch (e) {
                console.warn("Failed to add optimization parameters:", e);
            }
        }

        return imageUrl;
    }

    /**
     * Create optimized image element with fallbacks
     */
    createBookImage(book, options = {}) {
        const {
            size = "medium",
            lazy = true,
            className = "book-image",
            alt = book.title || "Book cover"
        } = options;

        const container = document.createElement("div");
        container.className = `${className}-container`;

        const img = document.createElement("img");
        img.className = className;
        img.alt = alt;
        img.loading = lazy ? "lazy" : "eager";

        // Set up image sources
        const coverImage = this.processImageUrl(book.coverImage, size);
        const fallbackImages = book.images ? book.images.map(url => this.processImageUrl(url, size)) : [];

        if (coverImage) {
            if (lazy && this.observer) {
                img.dataset.src = coverImage;
                img.dataset.fallbacks = JSON.stringify(fallbackImages);
                this.observer.observe(img);
            } else {
                this.loadImageWithFallbacks(img, coverImage, fallbackImages);
            }
        } else {
            this.setDefaultImage(img, book);
        }

        container.appendChild(img);
        return container;
    }

    /**
     * Load image with lazy loading support
     */
    loadImage(img) {
        const src = img.dataset.src || img.src;
        const fallbacks = img.dataset.fallbacks ? JSON.parse(img.dataset.fallbacks) : [];
        
        this.loadImageWithFallbacks(img, src, fallbacks);
    }

    /**
     * Load image with fallback chain
     */
    async loadImageWithFallbacks(img, primarySrc, fallbacks = []) {
        const sources = [primarySrc, ...fallbacks].filter(Boolean);
        
        for (const src of sources) {
            try {
                await this.loadSingleImage(img, src);
                return; // Success, exit
            } catch (error) {
                console.warn(`Failed to load image: ${src}`, error);
                continue; // Try next fallback
            }
        }

        // All sources failed, use default
        this.setDefaultImage(img);
    }

    /**
     * Load a single image with retry logic
     */
    loadSingleImage(img, src) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.imageCache.has(src)) {
                const cached = this.imageCache.get(src);
                if (cached.success) {
                    img.src = src;
                    img.classList.add("loaded");
                    resolve();
                } else {
                    reject(new Error("Cached failure"));
                }
                return;
            }

            // Check if already loading
            if (this.loadingImages.has(src)) {
                // Wait for existing load
                const checkLoading = () => {
                    if (!this.loadingImages.has(src)) {
                        if (this.imageCache.get(src)?.success) {
                            img.src = src;
                            img.classList.add("loaded");
                            resolve();
                        } else {
                            reject(new Error("Load failed"));
                        }
                    } else {
                        setTimeout(checkLoading, 100);
                    }
                };
                checkLoading();
                return;
            }

            this.loadingImages.add(src);
            
            const tempImg = new Image();
            tempImg.onload = () => {
                this.loadingImages.delete(src);
                this.imageCache.set(src, { success: true, timestamp: Date.now() });
                img.src = src;
                img.classList.add("loaded");
                resolve();
            };

            tempImg.onerror = () => {
                this.loadingImages.delete(src);
                const retries = this.retryAttempts.get(src) || 0;
                
                if (retries < this.maxRetries) {
                    this.retryAttempts.set(src, retries + 1);
                    setTimeout(() => {
                        this.loadSingleImage(img, src).then(resolve).catch(reject);
                    }, 1000 * (retries + 1)); // Exponential backoff
                } else {
                    this.imageCache.set(src, { success: false, timestamp: Date.now() });
                    reject(new Error("Max retries exceeded"));
                }
            };

            tempImg.src = src;
        });
    }

    /**
     * Set default image or gradient background
     */
    setDefaultImage(img, book = null) {
        img.classList.add("default-image");
        
        // Try to use default book image
        if (this.defaultImages.book) {
            img.src = this.defaultImages.book;
            img.alt = "Default book cover";
        } else {
            // Use gradient background
            img.style.background = this.defaultImages.gradient;
            img.style.minHeight = "200px";
            img.alt = book ? book.title : "Book cover";
        }
    }

    /**
     * Create image gallery for book details
     */
    createImageGallery(book, options = {}) {
        const {
            showThumbnails = true,
            allowZoom = true,
            className = "book-gallery"
        } = options;

        const gallery = document.createElement("div");
        gallery.className = className;

        const mainImageContainer = document.createElement("div");
        mainImageContainer.className = "main-image-container";

        const mainImage = this.createBookImage(book, {
            size: "large",
            lazy: false,
            className: "main-book-image"
        });

        mainImageContainer.appendChild(mainImage);
        gallery.appendChild(mainImageContainer);

        if (showThumbnails && book.images && book.images.length > 1) {
            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.className = "thumbnail-container";

            book.images.forEach((imageUrl, index) => {
                const thumbnail = this.createBookImage(
                    { ...book, coverImage: imageUrl },
                    {
                        size: "small",
                        className: "thumbnail-image"
                    }
                );

                thumbnail.addEventListener("click", () => {
                    const newMainImage = this.createBookImage(
                        { ...book, coverImage: imageUrl },
                        {
                            size: "large",
                            lazy: false,
                            className: "main-book-image"
                        }
                    );
                    mainImageContainer.replaceChild(newMainImage, mainImageContainer.firstChild);
                });

                thumbnailContainer.appendChild(thumbnail);
            });

            gallery.appendChild(thumbnailContainer);
        }

        if (allowZoom) {
            this.addZoomFunctionality(mainImageContainer);
        }

        return gallery;
    }

    /**
     * Add zoom functionality to images
     */
    addZoomFunctionality(container) {
        container.addEventListener("click", (e) => {
            if (e.target.tagName === "IMG") {
                this.openImageModal(e.target.src);
            }
        });
    }

    /**
     * Open image in modal for zooming
     */
    openImageModal(src) {
        const modal = document.createElement("div");
        modal.className = "image-modal";
        modal.innerHTML = `
            <div class="image-modal-content">
                <span class="image-modal-close">&times;</span>
                <img src="${src}" alt="Zoomed book image">
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector(".image-modal-close");
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener("keydown", function escapeHandler(e) {
            if (e.key === "Escape") {
                closeModal();
                document.removeEventListener("keydown", escapeHandler);
            }
        });
    }

    /**
     * Clear image cache (useful for memory management)
     */
    clearCache() {
        this.imageCache.clear();
        this.retryAttempts.clear();
    }

    /**
     * Preload images for better performance
     */
    preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            if (!this.imageCache.has(url) && !this.loadingImages.has(url)) {
                const img = new Image();
                img.src = this.processImageUrl(url);
            }
        });
    }
}

// Initialize global image manager
window.ImageManager = new ImageManager();

// Add CSS styles
const styles = `
.book-image-container {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.book-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
}

.book-image.loaded {
    opacity: 1;
}

.book-image.default-image {
    opacity: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.book-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.main-image-container {
    position: relative;
    cursor: zoom-in;
}

.thumbnail-container {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.5rem 0;
}

.thumbnail-image {
    width: 60px;
    height: 80px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
}

.thumbnail-image:hover {
    border-color: #007bff;
}

.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.image-modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.image-modal-content img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.image-modal-close {
    position: absolute;
    top: -40px;
    right: 0;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    z-index: 10001;
}

.image-modal-close:hover {
    opacity: 0.7;
}

@media (max-width: 768px) {
    .thumbnail-container {
        justify-content: center;
    }
    
    .thumbnail-image {
        width: 50px;
        height: 70px;
    }
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);