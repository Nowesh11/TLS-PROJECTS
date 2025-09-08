/**
 * Rating System for Books
 * Handles star-based rating functionality
 */

class RatingSystem {
    constructor() {
        this.apiBaseUrl = "http://localhost:8080/api";
        this.init();
    }

    init() {
        this.attachEventListeners();
    }

    /**
     * Attach event listeners for rating interactions
     */
    attachEventListeners() {
        document.addEventListener("click", (e) => {
            if (e.target.closest(".star-rating")) {
                this.handleStarClick(e);
            }
        });

        document.addEventListener("mouseover", (e) => {
            if (e.target.closest(".star-rating .star")) {
                this.handleStarHover(e);
            }
        });

        document.addEventListener("mouseout", (e) => {
            if (e.target.closest(".star-rating")) {
                this.handleStarMouseOut(e);
            }
        });
    }

    /**
     * Handle star click for rating
     */
    async handleStarClick(e) {
        const star = e.target.closest(".star");
        if (!star) return;

        const ratingContainer = star.closest(".star-rating");
        const bookId = ratingContainer.dataset.bookId;
        const rating = parseInt(star.dataset.rating);

        // Check if user is authenticated
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            this.showAuthRequiredMessage();
            return;
        }

        try {
            await this.submitRating(bookId, rating);
            this.updateStarDisplay(ratingContainer, rating);
            this.showSuccessMessage("Rating submitted successfully!");
        } catch (error) {
            console.error("Error submitting rating:", error);
            this.showErrorMessage("Failed to submit rating. Please try again.");
        }
    }

    /**
     * Handle star hover effect
     */
    handleStarHover(e) {
        const star = e.target.closest(".star");
        if (!star) return;

        const ratingContainer = star.closest(".star-rating");
        const rating = parseInt(star.dataset.rating);
        
        this.highlightStars(ratingContainer, rating);
    }

    /**
     * Handle mouse out to restore original rating
     */
    handleStarMouseOut(e) {
        const ratingContainer = e.target.closest(".star-rating");
        if (!ratingContainer) return;

        const currentRating = parseFloat(ratingContainer.dataset.currentRating) || 0;
        this.updateStarDisplay(ratingContainer, currentRating);
    }

    /**
     * Highlight stars up to the given rating
     */
    highlightStars(container, rating) {
        const stars = container.querySelectorAll(".star");
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add("highlighted");
                star.classList.remove("empty");
            } else {
                star.classList.remove("highlighted");
                star.classList.add("empty");
            }
        });
    }

    /**
     * Update star display with current rating
     */
    updateStarDisplay(container, rating) {
        const stars = container.querySelectorAll(".star");
        stars.forEach((star, index) => {
            star.classList.remove("highlighted", "empty", "half");
            
            if (index < Math.floor(rating)) {
                star.classList.add("filled");
            } else if (index < rating && rating % 1 !== 0) {
                star.classList.add("half");
            } else {
                star.classList.add("empty");
            }
        });
        
        container.dataset.currentRating = rating;
    }

    /**
     * Submit rating to the API
     */
    async submitRating(bookId, rating) {
        const response = await fetch(`${this.apiBaseUrl}/books/${bookId}/rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.getAuthToken()}`
            },
            credentials: "include",
            body: JSON.stringify({ rating })
        });

        if (!response.ok) {
            throw new Error("Failed to submit rating");
        }

        return response.json();
    }

    /**
     * Check if user is authenticated
     */
    async checkAuthentication() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.getAuthToken()}`
                },
                credentials: "include"
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem("token") || 
               sessionStorage.getItem("token") || 
               this.getCookie("token");
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    /**
     * Generate star rating HTML
     */
    generateStarRating(bookId, currentRating = 0, isInteractive = true) {
        const interactiveClass = isInteractive ? "interactive" : "readonly";
        
        return `
            <div class="star-rating ${interactiveClass}" data-book-id="${bookId}" data-current-rating="${currentRating}">
                ${Array.from({length: 5}, (_, i) => {
                    const starNumber = i + 1;
                    let starClass = "star empty";
                    
                    if (starNumber <= Math.floor(currentRating)) {
                        starClass = "star filled";
                    } else if (starNumber <= currentRating && currentRating % 1 !== 0) {
                        starClass = "star half";
                    }
                    
                    return `<span class="${starClass}" data-rating="${starNumber}">★</span>`;
                }).join("")}
                <span class="rating-text">(${currentRating.toFixed(1)})</span>
            </div>
        `;
    }

    /**
     * Show authentication required message
     */
    showAuthRequiredMessage() {
        this.showNotification("Please sign in to rate books", "warning");
        
        // Redirect to login after a delay
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showNotification(message, "success");
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showNotification(message, "error");
    }

    /**
     * Show notification
     */
    showNotification(message, type = "info") {
        // Create notification element
        const notification = document.createElement("div");
        notification.className = `rating-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize rating system
window.RatingSystem = new RatingSystem();

// Add CSS for rating system
const ratingStyle = document.createElement("style");
ratingStyle.textContent = `
    .star-rating {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin: 0.5rem 0;
    }

    .star-rating.interactive .star {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .star-rating.interactive .star:hover {
        transform: scale(1.1);
    }

    .star {
        font-size: 1.2rem;
        color: var(--gray-300);
        transition: color 0.2s ease;
    }

    .star.filled {
        color: var(--accent-gold);
    }

    .star.half {
        background: linear-gradient(90deg, var(--accent-gold) 50%, var(--gray-300) 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .star.highlighted {
        color: var(--theme-secondary);
    }

    .star.empty {
        color: var(--gray-300);
    }

    .rating-text {
        margin-left: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-primary);
        font-weight: 500;
    }

    .rating-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease-out;
    }

    .rating-notification.success {
        background: var(--accent-gold);
        color: white;
    }

    .rating-notification.error {
        background: var(--theme-primary);
        color: white;
    }

    .rating-notification.warning {
        background: var(--theme-secondary);
        color: white;
    }

    .rating-notification.info {
        background: var(--theme-primary);
        color: white;
    }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        margin-left: 1rem;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(ratingStyle);