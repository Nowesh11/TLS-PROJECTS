// Poster loader for Tamil Language Society
// Handles loading and displaying posters on the homepage

class PosterLoader {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/api';
        this.postersContainer = document.getElementById('posters-container');
        this.maxPosters = 6; // Maximum number of posters to display
    }

    async init() {
        if (this.postersContainer) {
            await this.loadPosters();
        }
    }

    async loadPosters() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/posters/active`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const posters = data.data || data || [];

            if (posters.length === 0) {
                this.showNoPostersMessage();
                return;
            }

            this.renderPosters(posters);
        } catch (error) {
            console.error('Error loading posters:', error);
            this.showErrorMessage();
        }
    }

    renderPosters(posters) {
        this.postersContainer.innerHTML = '';

        posters.forEach((poster, index) => {
            const posterCard = this.createPosterCard(poster, index);
            this.postersContainer.appendChild(posterCard);
        });
    }

    createPosterCard(poster, index) {
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());

        // Handle image path
        const imagePath = poster.image ? 
            (poster.image.startsWith('http') ? poster.image : `uploads/posters/${poster.image}`) : 
            'assets/placeholder-poster.jpg';

        // Format date
        const formattedDate = poster.createdAt ? 
            new Date(poster.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '';

        card.innerHTML = `
            <img src="${imagePath}" alt="${poster.title || 'Poster'}" class="poster-image" 
                 onerror="this.src='assets/placeholder-poster.jpg'">
            <div class="poster-content">
                <h3 class="poster-title">${poster.title || 'Untitled Poster'}</h3>
                <p class="poster-description">${poster.description || 'No description available.'}</p>
                ${formattedDate ? `<div class="poster-date">${formattedDate}</div>` : ''}
            </div>
        `;

        return card;
    }

    showNoPostersMessage() {
        this.postersContainer.innerHTML = `
            <div class="no-posters-message">
                <div class="message-icon">
                    <i class="fas fa-image"></i>
                </div>
                <h3>No Announcements Available</h3>
                <p>Check back later for the latest updates and announcements.</p>
            </div>
        `;
    }

    showErrorMessage() {
        this.postersContainer.innerHTML = `
            <div class="error-message">
                <div class="message-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to Load Announcements</h3>
                <p>Please try refreshing the page or check back later.</p>
            </div>
        `;
    }
}

// Initialize poster loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const posterLoader = new PosterLoader();
    posterLoader.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PosterLoader;
}