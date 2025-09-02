/**
 * Team Public Page JavaScript
 * Handles loading and displaying team members on the public team page
 */

class TeamPublicManager {
    constructor() {
        this.teamMembers = [];
        this.filteredMembers = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTeamMembers();
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setActiveFilter(e.target);
                this.filterTeamMembers(filter);
            });
        });
    }

    setActiveFilter(activeBtn) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Add active class to clicked button
        activeBtn.classList.add('active');
    }

    async loadTeamMembers() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/team-members?status=active');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.teamMembers = data.teamMembers || [];
            
            if (this.teamMembers.length === 0) {
                this.showEmpty();
            } else {
                this.filteredMembers = [...this.teamMembers];
                this.renderTeamMembers();
                this.hideLoading();
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            this.showError();
        }
    }

    filterTeamMembers(filter) {
        this.currentFilter = filter;
        
        if (filter === 'all') {
            this.filteredMembers = [...this.teamMembers];
        } else {
            this.filteredMembers = this.teamMembers.filter(member => 
                member.role === filter
            );
        }
        
        this.renderTeamMembers();
    }

    renderTeamMembers() {
        const grid = document.getElementById('teamGrid');
        if (!grid) return;

        if (this.filteredMembers.length === 0) {
            grid.innerHTML = `
                <div class="team-empty" style="grid-column: 1 / -1;">
                    <i class="fas fa-users fa-2x"></i>
                    <p>No team members found for the selected filter.</p>
                </div>
            `;
            return;
        }

        // Sort members by order_num
        const sortedMembers = this.filteredMembers.sort((a, b) => {
            return (a.order_num || 999) - (b.order_num || 999);
        });

        grid.innerHTML = sortedMembers.map(member => this.createMemberCard(member)).join('');
    }

    createMemberCard(member) {
        const imageUrl = member.image_path 
            ? `/uploads/team_members/${member.image_path}`
            : '/assets/default-avatar.svg';
        
        const socialLinks = this.parseSocialLinks(member.social_links);
        const socialLinksHtml = socialLinks.length > 0 
            ? `<div class="social-links">${socialLinks.map(link => this.createSocialLink(link)).join('')}</div>`
            : '';

        const roleClass = this.getRoleClass(member.role);
        const currentLang = document.documentElement.lang || 'en';
        
        const name = currentLang === 'ta' && member.name_ta ? member.name_ta : member.name_en;
        const bio = currentLang === 'ta' && member.bio_ta ? member.bio_ta : member.bio_en;

        return `
            <div class="team-member-card" data-role="${member.role}" onclick="viewMemberDetail('${member.slug}')" style="cursor: pointer;">
                <div class="member-image">
                    <img src="${imageUrl}" alt="${name}" onerror="this.src='/assets/default-avatar.svg'">
                </div>
                <div class="member-content">
                    <div class="member-role ${roleClass}">
                        ${this.formatRole(member.role)}
                    </div>
                    <h3>${this.escapeHtml(name)}</h3>
                    ${member.name_ta && currentLang === 'en' ? `<h4>${this.escapeHtml(member.name_ta)}</h4>` : ''}
                    ${bio ? `<p>${this.escapeHtml(bio)}</p>` : ''}
                    ${member.email ? `
                        <div class="member-contact">
                            <i class="fas fa-envelope"></i>
                            <span>${this.escapeHtml(member.email)}</span>
                        </div>
                    ` : ''}
                    ${socialLinksHtml}
                </div>
            </div>
        `;
    }

    parseSocialLinks(socialLinksJson) {
        if (!socialLinksJson) return [];
        
        try {
            const links = JSON.parse(socialLinksJson);
            return Array.isArray(links) ? links : [];
        } catch (error) {
            console.error('Error parsing social links:', error);
            return [];
        }
    }

    createSocialLink(link) {
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

        const icon = iconMap[link.platform] || 'fas fa-link';
        
        return `
            <a href="${this.escapeHtml(link.url)}" class="social-link" target="_blank" rel="noopener noreferrer">
                <i class="${icon}"></i>
            </a>
        `;
    }

    getRoleClass(role) {
        const roleClasses = {
            'president': 'role-president',
            'vice_president': 'role-vice-president',
            'secretary': 'role-secretary',
            'treasurer': 'role-treasurer',
            'director': 'role-director',
            'manager': 'role-manager',
            'coordinator': 'role-coordinator',
            'advisor': 'role-advisor',
            'member': 'role-member'
        };
        
        return roleClasses[role] || 'role-member';
    }

    formatRole(role) {
        const roleNames = {
            'president': 'President',
            'vice_president': 'Vice President',
            'secretary': 'Secretary',
            'treasurer': 'Treasurer',
            'director': 'Director',
            'manager': 'Manager',
            'coordinator': 'Coordinator',
            'advisor': 'Advisor',
            'member': 'Member'
        };
        
        return roleNames[role] || 'Member';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        document.getElementById('teamLoading').style.display = 'block';
        document.getElementById('teamGrid').style.display = 'none';
        document.getElementById('teamError').style.display = 'none';
        document.getElementById('teamEmpty').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('teamLoading').style.display = 'none';
        document.getElementById('teamGrid').style.display = 'grid';
        document.getElementById('teamError').style.display = 'none';
        document.getElementById('teamEmpty').style.display = 'none';
    }

    showError() {
        document.getElementById('teamLoading').style.display = 'none';
        document.getElementById('teamGrid').style.display = 'none';
        document.getElementById('teamError').style.display = 'block';
        document.getElementById('teamEmpty').style.display = 'none';
    }

    showEmpty() {
        document.getElementById('teamLoading').style.display = 'none';
        document.getElementById('teamGrid').style.display = 'none';
        document.getElementById('teamError').style.display = 'none';
        document.getElementById('teamEmpty').style.display = 'block';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TeamPublicManager();
});

// Language switching support
function switchLanguage(lang) {
    document.documentElement.lang = lang;
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchLanguage('${lang}')"]`).classList.add('active');
    
    // Re-render team members with new language
    if (window.teamManager) {
        window.teamManager.renderTeamMembers();
    }
}

// Theme toggle support
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    const themeToggle = document.querySelector('.theme-toggle i');
    if (newTheme === 'dark') {
        themeToggle.className = 'fas fa-sun';
    } else {
        themeToggle.className = 'fas fa-moon';
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.querySelector('.theme-toggle i');
    if (savedTheme === 'dark') {
        themeToggle.className = 'fas fa-sun';
    } else {
        themeToggle.className = 'fas fa-moon';
    }
});

// Global function to view member detail
function viewMemberDetail(memberSlug) {
    window.location.href = `team-detail.html?member=${memberSlug}`;
}

// Export for global access
window.teamManager = null;
document.addEventListener('DOMContentLoaded', () => {
    window.teamManager = new TeamPublicManager();
});