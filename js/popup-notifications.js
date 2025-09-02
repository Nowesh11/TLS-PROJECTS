// Pop-up Notification System for New Content
class PopupNotificationManager {
    constructor() {
        this.activePopups = [];
        this.maxPopups = 3;
        this.popupQueue = [];
        this.init();
    }

    init() {
        // Create popup container if it doesn't exist
        if (!document.getElementById("popup-notifications-container")) {
            const container = document.createElement("div");
            container.id = "popup-notifications-container";
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    showPopup(notification) {
        if (this.activePopups.length >= this.maxPopups) {
            this.popupQueue.push(notification);
            return;
        }

        const popup = this.createPopup(notification);
        this.activePopups.push(popup);
        
        const container = document.getElementById("popup-notifications-container");
        container.appendChild(popup);

        // Animate in
        setTimeout(() => {
            popup.style.transform = "translateX(0)";
            popup.style.opacity = "1";
        }, 100);

        // Auto-hide after duration
        const duration = notification.duration || 8000;
        setTimeout(() => {
            this.hidePopup(popup);
        }, duration);
    }

    createPopup(notification) {
        const popup = document.createElement("div");
        popup.className = "popup-notification";
        popup.style.cssText = `
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-purple) 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            min-width: 350px;
            max-width: 400px;
            box-shadow: 0 10px 30px var(--shadow-xl);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            position: relative;
            overflow: hidden;
        `;

        const typeColors = {
            "success": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)",
        "error": "linear-gradient(135deg, var(--error-color) 0%, var(--error-dark) 100%)",
        "announcement": "linear-gradient(135deg, var(--warning-color) 0%, var(--warning-dark) 100%)",
        "new-project": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)",
        "new-book": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)",
        "new-ebook": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)",
        "new-team": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)",
        "welcome": "linear-gradient(135deg, var(--success-color) 0%, var(--success-dark) 100%)"
        };

        if (typeColors[notification.type]) {
            popup.style.background = typeColors[notification.type];
        }

        const typeIcons = {
            "new-project": "fas fa-project-diagram",
            "new-book": "fas fa-book",
            "new-ebook": "fas fa-tablet-alt",
            "new-team": "fas fa-users",
            "announcement": "fas fa-bullhorn",
            "welcome": "fas fa-heart"
        };

        const icon = typeIcons[notification.type] || "fas fa-bell";

        popup.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--bg-overlay-light);">
                <div class="progress-bar" style="height: 100%; background: var(--progress-bar-bg); width: 0%; transition: width linear;"></div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: var(--bg-overlay-light); padding: 12px; border-radius: 50%; flex-shrink: 0;">
                    <i class="${icon}" style="font-size: 20px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: white;">${notification.title}</div>
                    <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9; line-height: 1.4;">${notification.message}</p>
                    ${notification.actions ? this.createActionButtons(notification.actions) : ""}
                </div>
                <button class="close-popup" aria-label="Close popup notification" style="background: none; border: none; color: var(--text-light); font-size: 18px; cursor: pointer; padding: 5px; margin: -5px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add close functionality
        const closeBtn = popup.querySelector(".close-popup");
        closeBtn.addEventListener("click", () => {
            this.hidePopup(popup);
        });

        // Add progress bar animation
        const progressBar = popup.querySelector(".progress-bar");
        const duration = notification.duration || 8000;
        setTimeout(() => {
            progressBar.style.transitionDuration = `${duration}ms`;
            progressBar.style.width = "100%";
        }, 100);

        // Add action button functionality
        const actionButtons = popup.querySelectorAll(".popup-action-btn");
        actionButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const action = e.target.dataset.action;
                if (notification.onAction) {
                    notification.onAction(action);
                }
                this.hidePopup(popup);
            });
        });

        return popup;
    }

    createActionButtons(actions) {
        return `
            <div style="display: flex; gap: 10px; margin-top: 8px;">
                ${actions.map(action => `
                    <button class="popup-action-btn" data-action="${action.action}" 
                            style="background: var(--bg-overlay-light); border: 1px solid var(--border-light); 
                                   color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; 
                                   cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                        ${action.label}
                    </button>
                `).join("")}
            </div>
        `;
    }

    hidePopup(popup) {
        popup.style.transform = "translateX(100%)";
        popup.style.opacity = "0";
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            
            // Remove from active popups
            const index = this.activePopups.indexOf(popup);
            if (index > -1) {
                this.activePopups.splice(index, 1);
            }
            
            // Show next popup in queue
            if (this.popupQueue.length > 0) {
                const nextPopup = this.popupQueue.shift();
                setTimeout(() => {
                    this.showPopup(nextPopup);
                }, 300);
            }
        }, 300);
    }

    // Predefined notification types
    showNewProjectNotification(project) {
        this.showPopup({
            type: "new-project",
            title: "புதிய திட்டம்! New Project Available",
            message: `"${project.title}" has been added to our projects. Check it out now!`,
            actions: [
                { label: "View Project", action: "view-project" },
                { label: "Dismiss", action: "dismiss" }
            ],
            onAction: (action) => {
                if (action === "view-project") {
                    window.location.href = "/projects.html";
                }
            },
            duration: 10000
        });
    }

    showNewBookNotification(book) {
        this.showPopup({
            type: "new-book",
            title: "புதிய புத்தகம்! New Book Available",
            message: `"${book.title}" by ${book.author} is now available in our collection!`,
            actions: [
                { label: "View Books", action: "view-books" },
                { label: "Dismiss", action: "dismiss" }
            ],
            onAction: (action) => {
                if (action === "view-books") {
                    window.location.href = "/books.html";
                }
            },
            duration: 10000
        });
    }

    showNewEbookNotification(ebook) {
        this.showPopup({
            type: "new-ebook",
            title: "புதிய மின்புத்தகம்! New E-Book Available",
            message: `"${ebook.title}" is now available for download. Get your copy today!`,
            actions: [
                { label: "View E-Books", action: "view-ebooks" },
                { label: "Dismiss", action: "dismiss" }
            ],
            onAction: (action) => {
                if (action === "view-ebooks") {
                    window.location.href = "/ebooks.html";
                }
            },
            duration: 10000
        });
    }

    showNewTeamMemberNotification(member) {
        this.showPopup({
            type: "new-team",
            title: "புதிய குழு உறுப்பினர்! New Team Member",
            message: `Welcome ${member.name} to our team as ${member.position}!`,
            actions: [
                { label: "Meet the Team", action: "view-team" },
                { label: "Dismiss", action: "dismiss" }
            ],
            onAction: (action) => {
                if (action === "view-team") {
                    window.location.href = "/about.html#team";
                }
            },
            duration: 10000
        });
    }

    showAnnouncementNotification(announcement) {
        this.showPopup({
            type: "announcement",
            title: announcement.title,
            message: announcement.content,
            actions: [
                { label: "View All", action: "view-announcements" },
                { label: "Dismiss", action: "dismiss" }
            ],
            onAction: (action) => {
                if (action === "view-announcements") {
                    window.location.href = "/notifications.html";
                }
            },
            duration: 12000
        });
    }
}

// Initialize popup notification manager
document.addEventListener("DOMContentLoaded", function() {
    window.popupNotificationManager = new PopupNotificationManager();
    
    // Expose to global scope
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.popupNotificationManager = window.popupNotificationManager;
});

// CSS for hover effects
const popupStyle = document.createElement("style");
popupStyle.textContent = `
    .popup-action-btn:hover {
        background: var(--bg-overlay-medium) !important;
                border-color: var(--border-medium) !important;
        transform: translateY(-1px);
    }
    
    .close-popup:hover {
        color: var(--text-white) !important;
        transform: scale(1.1);
    }
`;
document.head.appendChild(popupStyle);