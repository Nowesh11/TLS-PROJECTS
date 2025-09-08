// Notification Management System for Tamil Language Society

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.emailQueue = [];
        this.isInitialized = false;
        this.maxNotifications = 100;
        this.notificationTypes = {
            "success": { 
                icon: "fas fa-check-circle", 
                color: "var(--success-color, #10b981)",
                gradient: "linear-gradient(135deg, var(--success-color, #10b981) 0%, var(--success-dark, #059669) 100%)"
            },
            "error": { 
                icon: "fas fa-exclamation-triangle", 
                color: "var(--error-color, #ef4444)",
                gradient: "linear-gradient(135deg, var(--error-color, #ef4444) 0%, var(--error-dark, #dc2626) 100%)"
            },
            "announcement": { 
                icon: "fas fa-bullhorn", 
                color: "var(--warning-color, #f59e0b)",
                gradient: "linear-gradient(135deg, var(--warning-color, #f59e0b) 0%, var(--warning-dark, #d97706) 100%)"
            },
            "chat": { 
                icon: "fas fa-comments", 
                color: "var(--info-color, #3b82f6)",
                gradient: "linear-gradient(135deg, var(--info-color, #3b82f6) 0%, var(--info-dark, #2563eb) 100%)"
            }
        };
        
        this.init(); // Re-enabled for new DB-driven system
    }
    
    async init() {
        if (this.isInitialized) return;
        
        this.createNotificationElements();
        this.bindEvents();
        
        // Load notifications from database
        this.notifications = await this.loadNotifications();
        
        this.startPeriodicCheck();
        this.updateNotificationBadge();
        
        this.isInitialized = true;
        console.log("Notification Manager initialized with", this.notifications.length, "notifications");
    }
    
    createNotificationElements() {
        // Create notification modal if it doesn't exist
        if (!document.getElementById("notification-modal")) {
            const modal = this.createNotificationModal();
            document.body.appendChild(modal);
        }
        
        // Create email notification overlay
        if (!document.getElementById("email-notification")) {
            const emailNotification = this.createEmailNotification();
            document.body.appendChild(emailNotification);
        }
    }
    
    createNotificationModal() {
        const modal = document.createElement("div");
        modal.id = "notification-modal";
        modal.className = "notification-modal";
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-bell"></i>
                        Notifications
                        <span data-key="notifications_title" data-content-type="text">Notifications</span>
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
        const notificationStyle = document.createElement("style");
        notificationStyle.textContent = `
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
                background: var(--overlay-dark);
                backdrop-filter: blur(5px);
            }
            
            .modal-content {
                position: relative;
                background: var(--bg-primary);
                border-radius: 1.5rem;
                max-width: 380px;
                width: 90%;
                max-height: 60vh;
                overflow: hidden;
                box-shadow: var(--shadow-xl);
                transform: scale(0.9);
                transition: transform 0.3s ease;
                border: 2px solid var(--border-accent, #3b82f6);
            }
            
            .notification-modal.show .modal-content {
                transform: scale(1);
            }
            
            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-secondary, #e5e7eb);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, var(--primary-color, #2563eb), var(--primary-dark, #1e40af));
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
                background: var(--bg-overlay, rgba(255, 255, 255, 0.1));
            }
            
            .modal-body {
                padding: 1rem;
                max-height: 45vh;
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
                gap: 0.5rem;
            }
            
            .notification-item {
                padding: 0.5rem;
                border: 1px solid #3b82f6;
                border-radius: 0.75rem;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                box-shadow: var(--shadow-sm, 0 2px 8px rgba(59, 130, 246, 0.1));
            }
            
            .notification-item:hover {
                box-shadow: var(--shadow-lg, 0 8px 25px rgba(59, 130, 246, 0.3));
                transform: translateY(-2px);
                border-color: #2563eb;
            }
            
            .notification-item.success {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-color: #10b981;
            }
            
            .notification-item.warning {
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-color: #f59e0b;
            }
            
            .notification-item.error {
                background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                border-color: #ef4444;
            }
            
            .notification-item.info {
                background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
                border-color: #3b82f6;
            }
            
            .notification-item.unread {
                border-left: 4px solid #2563eb;
                background: #f0f9ff;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }
            
            .notification-icon {
                width: 1.5rem;
                height: 1.5rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
            }
            
            .notification-meta {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-title {
                font-weight: 600;
                color: #1e40af;
                margin: 0 0 0.125rem 0;
                font-size: 0.75rem;
                line-height: 1.3;
            }
            
            .notification-time {
                font-size: 0.5rem;
                color: #6b7280;
                margin-top: 0.125rem;
            }
            
            .notification-message {
                color: #374151;
                line-height: 1.2;
                margin: 0;
                font-size: 0.625rem;
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
                box-shadow: var(--shadow-xl);
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
            
            /* New curved container styles */
            .notification-curved-container {
                background: #ffffff;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
                border-left: 4px solid #007bff;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .notification-curved-container:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg, 0 6px 20px rgba(0, 0, 0, 0.15));
            }
            
            .notification-curved-container.notification-alert {
                border-left-color: #dc3545;
                background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
            }
            
            .notification-curved-container.notification-welcome {
                border-left-color: #28a745;
                background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
            }
            
            .notification-curved-container.notification-default {
                border-left-color: #6c757d;
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            }
            
            .notification-vibrant-title {
                font-size: 18px;
                font-weight: 700;
                margin: 0;
                flex: 1;
            }
            
            .notification-vibrant-title.title-alert {
                color: #dc3545;
                text-shadow: var(--text-shadow-error, 0 1px 2px rgba(220, 53, 69, 0.1));
            }
            
            .notification-vibrant-title.title-welcome {
                color: #28a745;
                text-shadow: var(--text-shadow-success, 0 1px 2px rgba(40, 167, 69, 0.1));
            }
            
            .notification-vibrant-title.title-default {
                color: #495057;
                text-shadow: var(--text-shadow-default, 0 1px 2px rgba(73, 80, 87, 0.1));
            }
            
            .notification-body {
                padding-left: 44px;
            }
            
            .btn-explore, .btn-dismiss {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-explore {
                background: #007bff;
                color: white;
            }
            
            .btn-explore:hover {
                background: #0056b3;
                transform: translateY(-1px);
            }
            
            .btn-dismiss {
                background: #6c757d;
                color: white;
            }
            
            .btn-dismiss:hover {
                background: #545b62;
                transform: translateY(-1px);
            }
            
            /* Announcement detail modal */
            .announcement-detail-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--overlay-bg, rgba(0, 0, 0, 0.5));
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .announcement-detail-content {
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .announcement-detail-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .announcement-detail-header h3 {
                margin: 0;
                color: #333;
            }
            
            .announcement-detail-body {
                padding: 20px;
            }
            
            .announcement-detail-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                text-align: right;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #6c757d;
            }
            
            .close-btn:hover {
                color: #dc3545;
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
        
        document.head.appendChild(notificationStyle);
        return modal;
    }
    
    createEmailNotification() {
        const emailNotification = document.createElement("div");
        emailNotification.id = "email-notification";
        emailNotification.className = "email-notification";
        emailNotification.innerHTML = `
            <div class="email-header">
                <i class="fas fa-envelope"></i>
                <div>
                    <div class="email-from">Tamil Language Society</div>
                    <div style="font-size: 0.75rem; opacity: 0.9;">New Email</div>
                </div>
                <button class="email-close" onclick="notificationManager.closeEmailNotification()" aria-label="Close email notification">
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
        const notificationBell = document.querySelector(".notification-icon");
        if (notificationBell) {
            notificationBell.addEventListener("click", (e) => {
                e.preventDefault();
                this.openModal();
            });
        }
        
        // Filter buttons
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("filter-btn")) {
                this.handleFilterClick(e.target);
            }
        });
        
        // Modal overlay click
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal-overlay")) {
                this.closeModal();
            }
        });
        
        // Keyboard events
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeModal();
                this.closeEmailNotification();
            }
        });
    }
    
    generateSampleNotifications() {
        // Disabled sample notifications to prevent irrelevant notifications
        return;
    }
    
    addNotification(notification) {
        const newNotification = {
            id: notification.id || "notif_" + Date.now(),
            type: notification.type || "success",
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
        const emailNotification = document.getElementById("email-notification");
        const subject = emailNotification.querySelector(".email-subject");
        const preview = emailNotification.querySelector(".email-preview");
        
        subject.textContent = notification.title;
        preview.textContent = notification.message.substring(0, 100) + "...";
        
        emailNotification.classList.add("show");
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            this.closeEmailNotification();
        }, 8000);
    }
    
    closeEmailNotification() {
        const emailNotification = document.getElementById("email-notification");
        emailNotification.classList.remove("show");
    }
    
    openEmailDetails() {
        this.closeEmailNotification();
        this.openModal();
    }
    
    openModal() {
        const modal = document.getElementById("notification-modal");
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
        this.renderNotifications();
    }
    
    closeModal() {
        const modal = document.getElementById("notification-modal");
        modal.classList.remove("show");
        document.body.style.overflow = "";
    }
    
    renderNotifications(filter = "all") {
        const container = document.getElementById("notifications-list");
        let filteredNotifications = this.notifications;
        
        // Apply filter
        if (filter === "unread") {
            filteredNotifications = this.notifications.filter(n => !n.read);
        } else if (filter !== "all") {
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
            const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.success;
            const timeAgo = this.getTimeAgo(notification.timestamp);
            
            // Determine container color based on type
            let containerClass = "notification-curved-container";
            let titleClass = "notification-vibrant-title";
            
            if (notification.type === "error") {
                containerClass += " notification-alert";
                titleClass += " title-alert";
            } else if (notification.type === "success") {
                containerClass += " notification-welcome";
                titleClass += " title-welcome";
            } else {
                containerClass += " notification-default";
                titleClass += " title-default";
            }
            
            return `
                <div class="${containerClass} ${!notification.read ? "unread" : ""}" 
                     data-id="${notification.id}"
                     onclick="notificationManager.markAsRead('${notification.id}')">
                    <div class="notification-header">
                        <div class="notification-icon" style="background: ${typeConfig.gradient || typeConfig.color}; color: white; border-radius: 50%; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.15)); font-size: 0.75rem;">
                            <i class="${typeConfig.icon}"></i>
                        </div>
                        <div class="notification-meta">
                            <h4 class="${titleClass}">${notification.title}</h4>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="notification-body">
                        <p class="notification-message">${notification.message}</p>
                        <div class="notification-actions">
                            <button class="btn-explore" onclick="window.notificationManager.exploreNotification('${notification.id}')">
                                <i class="fas fa-external-link-alt"></i> Explore
                            </button>
                            <button class="btn-dismiss" onclick="window.notificationManager.dismissNotification('${notification.id}')">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }
    
    renderNotificationActions(actions) {
        return `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-btn ${action.primary ? "primary" : ""}" 
                            onclick="notificationManager.handleAction('${action.action}', event)">
                        ${action.label}
                    </button>
                `).join("")}
            </div>
        `;
    }
    
    handleFilterClick(button) {
        // Update active filter
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        
        const filter = button.dataset.filter;
        this.renderNotifications(filter);
    }
    
    handleAction(action, event) {
        event.stopPropagation();
        
        switch (action) {
            case "viewCollection":
                window.location.href = "ebooks.html";
                break;
            case "register":
                window.location.href = "contact.html";
                break;
            case "exploreResources":
                window.location.href = "ebooks.html";
                break;
            case "renewMembership":
                // Donate functionality removed
                break;
            case "viewPlans":
                // Donate functionality removed
                break;
            case "startChat":
                // Open chat widget
                if (window.chatWidget) {
                    window.chatWidget.openChat();
                } else {
                    // Fallback to contact page if chat widget is not available
                    window.location.href = "contact.html";
                }
                break;
            default:
                window.TamilSociety.showNotification("Action: " + action);
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
        window.TamilSociety.showNotification("All notifications marked as read");
    }
    
    clearAllNotifications() {
        if (confirm("Are you sure you want to clear all notifications?")) {
            this.notifications = [];
            this.saveNotifications();
            this.updateNotificationBadge();
            this.renderNotifications();
            window.TamilSociety.showNotification("All notifications cleared");
        }
    }
    
    updateNotificationBadge() {
        const badge = document.getElementById("notification-dot");
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (badge) {
            if (unreadCount > 0) {
                badge.classList.add("show");
                badge.setAttribute("data-count", unreadCount);
            } else {
                badge.classList.remove("show");
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
        // Disabled automatic notification generation to prevent irrelevant notifications
        // Only real notifications from user actions will be shown
        return;
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) {
            return "Just now";
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? "s" : ""} ago`;
        } else {
            return time.toLocaleDateString();
        }
    }
    
    async loadNotifications() {
        try {
            // Load announcements from database
            const response = await fetch("/api/announcements/active", {
                headers: {
                    "Authorization": `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const announcements = data.data || data;
                
                // Convert announcements to notification format
                return announcements.map(announcement => ({
                    id: announcement._id,
                    type: this.getNotificationType(announcement.type, announcement.priority),
                    title: announcement.title,
                    message: announcement.content,
                    timestamp: new Date(announcement.createdAt).getTime(),
                    read: false,
                    priority: announcement.priority,
                    actions: [
                        { label: "Explore", action: "explore", data: announcement },
                        { label: "Dismiss", action: "dismiss" }
                    ]
                }));
            } else {
                // Fallback to localStorage if API fails
                const stored = localStorage.getItem("tamil_society_notifications");
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error("Error loading notifications:", error);
            // Fallback to localStorage
            const stored = localStorage.getItem("tamil_society_notifications");
            return stored ? JSON.parse(stored) : [];
        }
    }
    
    getNotificationType(announcementType, priority) {
        // Map announcement types and priorities to notification types with color coding
        if (priority === "high" || announcementType === "urgent") {
            return "error"; // Red for alerts
        } else if (announcementType === "general") {
            return "success"; // Green for welcome/general
        } else {
            return "announcement"; // Orange for other announcements
        }
    }
    
    getAuthToken() {
        return localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || "";
    }
    
    saveNotifications() {
        try {
            localStorage.setItem("tamil_society_notifications", JSON.stringify(this.notifications));
        } catch (error) {
            console.error("Error saving notifications:", error);
        }
    }
    
    exploreNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        // Mark as read when exploring
        this.markAsRead(notificationId);

        // Handle different notification types
        if (notification.type === "announcement") {
            // For announcements, show more details or navigate to relevant page
            if (notification.link) {
                window.open(notification.link, "_blank");
            } else {
                // Show detailed announcement modal or navigate to announcements page
                this.showAnnouncementDetails(notification);
            }
        } else if (notification.type === "chat") {
            // Navigate to chat interface
            if (window.location.pathname !== "/admin.html") {
                window.location.href = "/admin.html#chat";
            } else {
                // Switch to chat tab if already on admin page
                const chatTab = document.querySelector("[data-tab=\"chat\"]");
                if (chatTab) chatTab.click();
            }
        } else {
            // Default action - close notification modal
            this.closeModal();
        }
    }

    dismissNotification(notificationId) {
        // Remove notification from array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        
        // Update storage and UI
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    showAnnouncementDetails(notification) {
        // Create a detailed view modal for announcements
        const modal = document.createElement("div");
        modal.className = "announcement-detail-modal";
        modal.innerHTML = `
            <div class="announcement-detail-content">
                <div class="announcement-detail-header">
                    <h3>${notification.title}</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="announcement-detail-body">
                    <p>${notification.message}</p>
                    ${notification.content ? `<div class="announcement-content">${notification.content}</div>` : ""}
                </div>
                <div class="announcement-detail-footer">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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
document.addEventListener("DOMContentLoaded", function() {
    window.notificationManager = new NotificationManager();
    
    // Expose to global scope for easy access
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.notificationManager = window.notificationManager;
});

// Example usage and testing functions
function createTestNotification() {
    if (window.notificationManager) {
        window.notificationManager.addNotification({
            type: "info",
            title: "Test Notification",
            message: "This is a test notification to demonstrate the system.",
            actions: [
                { label: "View More", action: "viewMore" },
                { label: "Dismiss", action: "dismiss" }
            ]
        });
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = NotificationManager;
}
