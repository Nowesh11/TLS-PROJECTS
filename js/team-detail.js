// Team Detail Page JavaScript
class TeamDetailManager {
    constructor() {
        this.currentLanguage = 'en';
        this.memberSlug = null;
        this.memberData = null;
        this.init();
    }

    init() {
        // Get member slug from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.memberSlug = urlParams.get('member');
        
        if (!this.memberSlug) {
            this.showError('No team member specified');
            return;
        }

        // Load member data
        this.loadMemberData();
        
        // Set up language detection
        this.detectLanguage();
    }

    detectLanguage() {
        // Check localStorage for saved language preference
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
            this.updateLanguageButtons();
        }
    }

    updateLanguageButtons() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.classList.remove('active');
            if ((btn.textContent === 'EN' && this.currentLanguage === 'en') ||
                (btn.textContent === 'தமிழ்' && this.currentLanguage === 'ta')) {
                btn.classList.add('active');
            }
        });
    }

    async loadMemberData() {
        try {
            const response = await fetch(`/api/team/slug/${this.memberSlug}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Team member not found');
                }
                throw new Error('Failed to load team member');
            }

            const result = await response.json();
            this.memberData = result.data;
            this.renderMemberDetail();
            
        } catch (error) {
            console.error('Error loading member data:', error);
            this.showError(error.message);
        }
    }

    renderMemberDetail() {
        const loadingState = document.getElementById('loadingState');
        const memberDetail = document.getElementById('memberDetail');
        const backButton = document.getElementById('backButton');
        const memberBreadcrumb = document.getElementById('memberBreadcrumb');
        
        if (!this.memberData) {
            this.showError('No member data available');
            return;
        }

        // Hide loading state
        loadingState.style.display = 'none';
        
        // Update breadcrumb
        const memberName = this.currentLanguage === 'ta' && this.memberData.name_ta 
            ? this.memberData.name_ta 
            : this.memberData.name_en;
        memberBreadcrumb.textContent = memberName;
        
        // Update page title
        document.title = `${memberName} - Tamil Language Society`;
        
        // Render member content
        memberDetail.innerHTML = this.generateMemberHTML();
        
        // Show member detail and back button
        memberDetail.style.display = 'block';
        backButton.style.display = 'inline-flex';
    }

    generateMemberHTML() {
        const member = this.memberData;
        const isEnglish = this.currentLanguage === 'en';
        
        // Get display values based on language
        const displayName = isEnglish ? member.name_en : (member.name_ta || member.name_en);
        const alternateName = isEnglish ? member.name_ta : member.name_en;
        const displayBio = isEnglish ? member.bio_en : (member.bio_ta || member.bio_en);
        
        // Generate image URL
        const imageUrl = member.image_path 
            ? `/uploads/team_members/${member.image_path}`
            : '/assets/default-avatar.jpg';
        
        // Parse social links
        let socialLinks = [];
        if (member.social_links) {
            try {
                socialLinks = typeof member.social_links === 'string' 
                    ? JSON.parse(member.social_links) 
                    : member.social_links;
            } catch (e) {
                console.warn('Error parsing social links:', e);
            }
        }
        
        return `
            <div class="member-header">
                <img src="${imageUrl}" alt="${displayName}" class="member-avatar" 
                     onerror="this.src='/assets/default-avatar.jpg'">
                <h1 class="member-name">${displayName}</h1>
                ${alternateName ? `<p class="member-name-tamil">${alternateName}</p>` : ''}
                <span class="member-role-badge">${this.formatRole(member.role)}</span>
            </div>
            
            <div class="member-body">
                <div class="member-info">
                    <div class="info-section">
                        <h3>
                            <i class="fas fa-user"></i>
                            ${isEnglish ? 'About' : 'பற்றி'}
                        </h3>
                        <p class="bio-text">${displayBio || (isEnglish ? 'No biography available.' : 'வாழ்க்கை வரலாறு கிடைக்கவில்லை.')}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>
                            <i class="fas fa-address-book"></i>
                            ${isEnglish ? 'Contact Information' : 'தொடர்பு தகவல்'}
                        </h3>
                        <div class="contact-info">
                            ${member.email ? `
                                <div class="contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <a href="mailto:${member.email}">${member.email}</a>
                                </div>
                            ` : ''}
                            ${member.phone ? `
                                <div class="contact-item">
                                    <i class="fas fa-phone"></i>
                                    <a href="tel:${member.phone}">${member.phone}</a>
                                </div>
                            ` : ''}
                            <div class="contact-item">
                                <i class="fas fa-briefcase"></i>
                                <span>${this.formatRole(member.role)}</span>
                            </div>
                        </div>
                        
                        ${socialLinks.length > 0 ? `
                            <div class="social-links">
                                ${socialLinks.map(link => this.generateSocialLink(link)).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    formatRole(role) {
        const roleMap = {
            'president': { en: 'President', ta: 'தலைவர்' },
            'vice-president': { en: 'Vice President', ta: 'துணைத் தலைவர்' },
            'secretary': { en: 'Secretary', ta: 'செயலாளர்' },
            'treasurer': { en: 'Treasurer', ta: 'பொருளாளர்' },
            'director': { en: 'Director', ta: 'இயக்குநர்' },
            'manager': { en: 'Manager', ta: 'மேலாளர்' },
            'coordinator': { en: 'Coordinator', ta: 'ஒருங்கிணைப்பாளர்' },
            'advisor': { en: 'Advisor', ta: 'ஆலோசகர்' },
            'member': { en: 'Member', ta: 'உறுப்பினர்' }
        };
        
        const roleInfo = roleMap[role] || { en: role, ta: role };
        return this.currentLanguage === 'ta' ? roleInfo.ta : roleInfo.en;
    }

    generateSocialLink(link) {
        const iconMap = {
            'facebook': 'fab fa-facebook-f',
            'twitter': 'fab fa-twitter',
            'instagram': 'fab fa-instagram',
            'linkedin': 'fab fa-linkedin-in',
            'youtube': 'fab fa-youtube',
            'github': 'fab fa-github',
            'website': 'fas fa-globe',
            'email': 'fas fa-envelope'
        };
        
        const icon = iconMap[link.platform.toLowerCase()] || 'fas fa-link';
        
        return `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="social-link" 
               title="${link.platform}">
                <i class="${icon}"></i>
            </a>
        `;
    }

    showError(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const memberDetail = document.getElementById('memberDetail');
        
        loadingState.style.display = 'none';
        memberDetail.style.display = 'none';
        errorState.style.display = 'block';
        
        // Update error message if needed
        const errorText = errorState.querySelector('p');
        if (errorText && message !== 'No team member specified') {
            errorText.textContent = message;
        }
    }

    switchLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        this.updateLanguageButtons();
        
        // Re-render member detail if data is available
        if (this.memberData) {
            this.renderMemberDetail();
        }
    }
}

// Global functions for navigation and theme
function switchLanguage(language) {
    if (window.teamDetailManager) {
        window.teamDetailManager.switchLanguage(language);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    window.teamDetailManager = new TeamDetailManager();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', function(event) {
    // Reload the page to handle URL parameter changes
    window.location.reload();
});