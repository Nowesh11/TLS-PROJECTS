// Notification Management System for Tamil Language Society

class NotificationManager {
    constructor() {
        this.notifications = this.loadNotifications();
        this.emailQueue = [];
        this.isInitialized = false;
        this.maxNotifications = 100;
        this.notificationTypes = {
            'info': { icon: 'fas fa-info-circle', color: '#2563eb' },
            'success': { icon: 'fas fa-check-circle', color: '#10b981' },
            'warning': { icon: 'fas fa-exclamation-triangle', color: '#f59e0b' },
            'error': { icon: 'fas fa-times-circle', color: '#ef4444' },
            'announcement': { icon: 'fas fa-bullhorn', color: '#8b5cf6' },
            'event': { icon: 'fas fa-calendar-alt', color: '#f97316' }
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.createNotificationElements();
        this.bindEvents();
        this.startPeriodicCheck();
        this.generateSampleNotifications();
        this.updateNotificationBadge();
        
        this.isInitialized = true;
        console.log('Notification Manager initialized');
    }
    
    createNotificationElements() {
        // Create notification modal if it doesn't exist
        if (!document.getElementById('notification-modal')) {
            const modal = this.createNotificationModal();
            document.body.appendChild(modal);
        }
        
        // Create email notification overlay
        if (!document.getElementById('email-notification')) {
            const emailNotification = this.createEmailNotification();
            document.body.appendChild(emailNotification);
        }
    }
    
    createNotificationModal() {
        const modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-bell"></i>
                        Notifications
                        <span class="tamil-text">அறிவிப்புகள்</span>
                    </h2>
                    <button class="modal-close" onclick="notificationManager.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="notification-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="unread">Unread</button>
                        <button class="filter-btn" data-filter="info">Info</button>
                        <button class="filter-btn" data-filter="announcement">Announcements</button>
                        <button class="filter-btn" data-filter="event">Events</button>
                    </div>
                    <div class="notifications-list" id="notifications-list">
                        <!-- Notifications will be populated here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="notificationManager.markAllAsRead()">
                        Mark All as Read
                    </button>
                    <button class="btn btn-primary" onclick="notificationManager.clearAllNotifications()">
                        Clear All
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .notification-modal.show {
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .modal-content {
                position: relative;
                background: white;
                border-radius: 1rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .notification-modal.show .modal-content {
                transform: scale(1);
            }
            
            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .modal-header .tamil-text {
                font-family: 'Noto Sans Tamil', sans-serif;
                font-size: 1rem;
                opacity: 0.9;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: background-color 0.2s ease;
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .modal-body {
                padding: 1.5rem;
                max-height: 50vh;
                overflow-y: auto;
            }
            
            .notification-filters {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }
            
            .filter-btn {
                padding: 0.5rem 1rem;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.875rem;
            }
            
            .filter-btn:hover {
                background: #f3f4f6;
            }
            
            .filter-btn.active {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }
            
            .notifications-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .notification-item {
                padding: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 0.75rem;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            
            .notification-item:hover {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
            
            .notification-item.unread {
                border-left: 4px solid #2563eb;
                background: #f0f9ff;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.5rem;
            }
            
            .notification-icon {
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
            }
            
            .notification-meta {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-title {
                font-weight: 600;
                color: #1f2937;
                margin: 0;
            }
            
            .notification-time {
                font-size: 0.75rem;
                color: #6b7280;
            }
            
            .notification-message {
                color: #4b5563;
                line-height: 1.5;
                margin: 0;
            }
            
            .notification-actions {
                margin-top: 0.75rem;
                display: flex;
                gap: 0.5rem;
            }
            
            .notification-btn {
                padding: 0.25rem 0.75rem;
                font-size: 0.75rem;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .notification-btn:hover {
                background: #f3f4f6;
            }
            
            .notification-btn.primary {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }
            
            .notification-btn.primary:hover {
                background: #1d4ed8;
            }
            
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                background: #f9fafb;
            }
            
            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
                color: #6b7280;
            }
            
            .empty-state i {
                font-size: 3rem;
                margin-bottom: 1rem;
                color: #d1d5db;
            }
            
            .email-notification {
                position: fixed;
                top: 100px;
                right: 2rem;
                background: white;
                border-radius: 0.75rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                max-width: 350px;
                transform: translateX(120%);
                transition: transform 0.5s ease;
                z-index: 9998;
            }
            
            .email-notification.show {
                transform: translateX(0);
            }
            
            .email-header {
                padding: 1rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: linear-gradient(135deg, #f59e0b, #f97316);
                color: white;
                border-radius: 0.75rem 0.75rem 0 0;
            }
            
            .email-body {
                padding: 1rem;
            }
            
            .email-subject {
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #1f2937;
            }
            
            .email-preview {
                color: #6b7280;
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .email-actions {
                padding: 1rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
            }
            
            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    max-height: 90vh;
                }
                
                .notification-filters {
                    justify-content: center;
                }
                
                .filter-btn {
                    font-size: 0.75rem;
                    padding: 0.375rem 0.75rem;
                }
                
                .email-notification {
                    right: 1rem;
                    max-width: calc(100% - 2rem);
                }
            }
        `;
        
        document.head.appendChild(style);
        return modal;
    }
    
    createEmailNotification() {
        const emailNotification = document.createElement('div');
        emailNotification.id = 'email-notification';
        emailNotification.className = 'email-notification';
        emailNotification.innerHTML = `
            <div class="email-header">
                <i class="fas fa-envelope"></i>
                <div>
                    <div class="email-from">Tamil Language Society</div>
                    <div style="font-size: 0.75rem; opacity: 0.9;">New Email</div>
                </div>
                <button class="email-close" onclick="notificationManager.closeEmailNotification()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="email-body">
                <div class="email-subject"></div>
                <div class="email-preview"></div>
            </div>
            <div class="email-actions">
                <button class="notification-btn" onclick="notificationManager.closeEmailNotification()">
                    Dismiss
                </button>
                <button class="notification-btn primary" onclick="notificationManager.openEmailDetails()">
                    View Details
                </button>
            </div>
        `;
        
        return emailNotification;
    }
    
    bindEvents() {
        // Notification bell click
        const notificationBell = document.querySelector('.notification-icon');
        if (notificationBell) {
            notificationBell.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }
        
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.handleFilterClick(e.target);
            }
        });
        
        // Modal overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeEmailNotification();
            }
        });
    }
    
    generateSampleNotifications() {
        if (this.notifications.length > 0) return; // Don't generate if notifications already exist
        
        const sampleNotifications = [
            {
                id: 'notif_' + Date.now() + '_1',
                type: 'announcement',
                title: 'New Tamil Literature Collection',
                message: 'புதிய தமிழ் இலக்கிய தொகுப்பு இப்போது கிடைக்கிறது! Explore our latest collection of classical Tamil literature.',
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                read: false,
                actions: [
                    { label: 'View Collection', action: 'viewCollection' },
                    { label: 'Learn More', action: 'learnMore' }
                ]
            },
            {
                id: 'notif_' + Date.now() + '_2',
                type: 'event',
                title: 'Tamil Cultural Festival',
                message: 'தமிழ் கலாச்சார விழா - Join us for a celebration of Tamil culture, music, and dance this weekend.',
                timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                read: false,
                actions: [
                    { label: 'Register Now', action: 'register' },
                    { label: 'View Details', action: 'viewDetails' }
                ]
            },
            {
                id: 'notif_' + Date.now() + '_3',
                type: 'info',
                title: 'Learning Resources Updated',
                message: 'New Tamil learning materials and exercises have been added to our digital library.',
                timestamp: new Date(Date.now() - 86400000), // 1 day ago
                read: true,
                actions: [
                    { label: 'Explore Resources', action: 'exploreResources' }
                ]
            },
            {
                id: 'notif_' + Date.now() + '_4',
                type: 'success',
                title: 'Profile Updated Successfully',
                message: 'Your profile information has been updated. Thank you for keeping your details current.',
                timestamp: new Date(Date.now() - 172800000), // 2 days ago
                read: true
            },
            {
                id: 'notif_' + Date.now() + '_5',
                type: 'warning',
                title: 'Membership Renewal Reminder',
                message: 'உங்கள் உறுப்பினர் பதிவு விரைவில் காலாவதியாகும். Your membership will expire in 7 days.',
                timestamp: new Date(Date.now() - 259200000), // 3 days ago
                read: false,
                actions: [
                    { label: 'Renew Now', action: 'renewMembership' },
                    { label: 'View Plans', action: 'viewPlans' }
                ]
            }
        ];
        
        this.notifications = sampleNotifications;
        this.saveNotifications();
    }
    
    addNotification(notification) {
        const newNotification = {
            id: notification.id || 'notif_' + Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp || new Date(),
            read: false,
            actions: notification.actions || []
        };
        
        this.notifications.unshift(newNotification);
        
        // Keep only the latest notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        this.saveNotifications();
        this.updateNotificationBadge();
        
        // Simulate email notification
        this.showEmailNotification(newNotification);
        
        return newNotification;
    }
    
    showEmailNotification(notification) {
        const emailNotification = document.getElementById('email-notification');
        const subject = emailNotification.querySelector('.email-subject');
        const preview = emailNotification.querySelector('.email-preview');
        
        subject.textContent = notification.title;
        preview.textContent = notification.message.substring(0, 100) + '...';
        
        emailNotification.classList.add('show');
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            this.closeEmailNotification();
        }, 8000);
    }
    
    closeEmailNotification() {
        const emailNotification = document.getElementById('email-notification');
        emailNotification.classList.remove('show');
    }
    
    openEmailDetails() {
        this.closeEmailNotification();
        this.openModal();
    }
    
    openModal() {
        const modal = document.getElementById('notification-modal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.renderNotifications();
    }
    
    closeModal() {
        const modal = document.getElementById('notification-modal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    renderNotifications(filter = 'all') {
        const container = document.getElementById('notifications-list');
        let filteredNotifications = this.notifications;
        
        // Apply filter
        if (filter === 'unread') {
            filteredNotifications = this.notifications.filter(n => !n.read);
        } else if (filter !== 'all') {
            filteredNotifications = this.notifications.filter(n => n.type === filter);
        }
        
        if (filteredNotifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredNotifications.map(notification => {
            const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.info;
            const timeAgo = this.getTimeAgo(notification.timestamp);
            
            return `
                <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                     data-id="${notification.id}"
                     onclick="notificationManager.markAsRead('${notification.id}')">
                    <div class="notification-header">
                        <div class="notification-icon" style="background-color: ${typeConfig.color}20; color: ${typeConfig.color}">
                            <i class="${typeConfig.icon}"></i>
                        </div>
                        <div class="notification-meta">
                            <h4 class="notification-title">${notification.title}</h4>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    ${notification.actions ? this.renderNotificationActions(notification.actions) : ''}
                </div>
            `;
        }).join('');
    }
    
    renderNotificationActions(actions) {
        return `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-btn ${action.primary ? 'primary' : ''}" 
                            onclick="notificationManager.handleAction('${action.action}', event)">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    handleFilterClick(button) {
        // Update active filter
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        this.renderNotifications(filter);
    }
    
    handleAction(action, event) {
        event.stopPropagation();
        
        switch (action) {
            case 'viewCollection':
                window.location.href = 'ebooks.html';
                break;
            case 'register':
                window.location.href = 'contact.html';
                break;
            case 'exploreResources':
                window.location.href = 'ebooks.html';
                break;
            case 'renewMembership':
                window.location.href = 'donate.html';
                break;
            case 'viewPlans':
                window.location.href = 'donate.html';
                break;
            default:
                window.TamilSociety.showNotification('Action: ' + action);
        }
        
        this.closeModal();
    }
    
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
        }
    }
    
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.updateNotificationBadge();
        this.renderNotifications();
        window.TamilSociety.showNotification('All notifications marked as read');
    }
    
    clearAllNotifications() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            this.notifications = [];
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
            window.TamilSociety.showNotification('All notifications cleared');
        }
    }
    
    updateNotificationBadge() {
        const badge = document.getElementById('notification-dot');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (badge) {
            if (unreadCount > 0) {
                badge.classList.add('show');
                badge.setAttribute('data-count', unreadCount);
            } else {
                badge.classList.remove('show');
            }
        }
    }
    
    startPeriodicCheck() {
        // Check for new notifications every 30 seconds
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000);
    }
    
    checkForNewNotifications() {
        // Simulate random notifications
        const shouldCreateNotification = Math.random() < 0.1; // 10% chance
        
        if (shouldCreateNotification) {
            const randomNotifications = [
                {
                    type: 'info',
                    title: 'New Article Published',
                    message: 'புதிய கட்டுரை வெளியிடப்பட்டுள்ளது - A new article about Tamil grammar has been published.'
                },
                {
                    type: 'event',
                    title: 'Poetry Reading Session',
                    message: 'கவிதை வாசிப்பு அமர்வு - Join our virtual poetry reading session this Friday.'
                },
                {
                    type: 'announcement',
                    title: 'Website Maintenance',
                    message: 'Scheduled maintenance will occur tonight from 2-4 AM. Some features may be unavailable.'
                }
            ];
            
            const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
            this.addNotification(randomNotification);
            
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification(randomNotification.title);
            }
        }
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return time.toLocaleDateString();
        }
    }
    
    loadNotifications() {
        try {
            const stored = localStorage.getItem('tamil_society_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }
    
    saveNotifications() {
        try {
            localStorage.setItem('tamil_society_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }
    
    // Public API methods
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    
    getAllNotifications() {
        return [...this.notifications];
    }
    
    getNotificationById(id) {
        return this.notifications.find(n => n.id === id);
    }
    
    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateNotificationBadge();
        return true;
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.notificationManager = new NotificationManager();
    
    // Expose to global scope for easy access
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.notificationManager = window.notificationManager;
});

// Example usage and testing functions
function createTestNotification() {
    if (window.notificationManager) {
        window.notificationManager.addNotification({
            type: 'info',
            title: 'Test Notification',
            message: 'This is a test notification to demonstrate the system.',
            actions: [
                { label: 'View More', action: 'viewMore' },
                { label: 'Dismiss', action: 'dismiss' }
            ]
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
