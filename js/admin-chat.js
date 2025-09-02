/**
 * Admin Chat Management System
 * Handles chat conversations, contact messages, and user support
 */

class AdminChatManager {
    constructor() {
        this.currentChatId = null;
        this.chats = [];
        this.contactMessages = [];
        this.pollInterval = null;
        this.autoReplyEnabled = localStorage.getItem("autoReplyEnabled") === "true" || false;
        this.autoReplyMessage = localStorage.getItem("autoReplyMessage") || "Thank you for contacting us! We have received your message and will respond as soon as possible. Our typical response time is within 24 hours.";
        this.autoReplyDelay = parseInt(localStorage.getItem("autoReplyDelay")) || 30000; // 30 seconds default
        this.autoReplyKeywords = JSON.parse(localStorage.getItem("autoReplyKeywords") || "[]");
        this.customAutoReplies = JSON.parse(localStorage.getItem("customAutoReplies") || "{}");
        this.init();
    }

    init() {
        this.loadChats();
        this.loadContactMessages();
        this.bindEvents();
        this.setupAutoReplyUI();
        this.startPolling();
    }

    bindEvents() {
        // Chat list events
        document.addEventListener("click", (e) => {
            if (e.target.closest(".chat-item")) {
                const chatId = e.target.closest(".chat-item").dataset.chatId;
                this.selectChat(chatId);
            }

            if (e.target.closest(".contact-item")) {
                const messageId = e.target.closest(".contact-item").dataset.messageId;
                this.viewContactMessage(messageId);
            }

            if (e.target.closest(".convert-to-chat")) {
                const messageId = e.target.closest(".convert-to-chat").dataset.messageId;
                this.convertContactToChat(messageId);
            }

            if (e.target.closest(".mark-resolved")) {
                const messageId = e.target.closest(".mark-resolved").dataset.messageId;
                this.markContactResolved(messageId);
            }
        });

        // Send message event
        const sendBtn = document.getElementById("sendMessage");
        const messageInput = document.getElementById("messageInput");

        if (sendBtn) {
            sendBtn.addEventListener("click", () => this.sendMessage());
        }

        if (messageInput) {
            messageInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Update chat status button
        const updateStatusBtn = document.getElementById("updateChatStatus");
        if (updateStatusBtn) {
            updateStatusBtn.addEventListener("click", () => {
                this.updateChatStatus();
            });
        }
        
        // Search functionality
        const chatSearch = document.getElementById("chatSearch");
        if (chatSearch) {
            chatSearch.addEventListener("input", (e) => {
                this.filterChats(e.target.value);
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById("chatStatusFilter");
        if (statusFilter) {
            statusFilter.addEventListener("change", (e) => {
                this.filterChatsByStatus(e.target.value);
            });
        }

        // Chat status update
        const statusSelect = document.getElementById("chat-status-select");
        if (statusSelect) {
            statusSelect.addEventListener("change", (e) => {
                this.updateChatStatus(this.currentChatId, e.target.value);
            });
        }
    }

    async loadChats() {
        try {
            const response = await this.apiCall("/api/chat");
            if (response.success) {
                const previousChats = this.chats;
                this.chats = response.data;
                
                // Check for new messages and trigger auto-replies
                if (previousChats.length > 0) {
                    this.checkForNewMessages(previousChats, this.chats);
                }
                
                this.renderChatList();
            }
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    }

    async loadContactMessages() {
        try {
            const response = await this.apiCall("/api/admin/messages");
            if (response.success) {
                this.contactMessages = response.data;
                this.renderContactMessages();
            }
        } catch (error) {
            console.error("Error loading contact messages:", error);
        }
    }

    renderChatList() {
        const chatList = document.getElementById("chatList");
        if (!chatList) return;

        if (this.chats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No active chats</p>
                </div>
            `;
            return;
        }

        chatList.innerHTML = this.chats.map(chat => {
            const user = chat.participants.find(p => p.role === "user");
            const lastMessage = chat.messages[chat.messages.length - 1];
            const unreadCount = chat.unreadCount || 0;
            const isUnread = unreadCount > 0;

            return `
                <div class="chat-item ${chat._id === this.currentChatId ? "active" : ""} ${isUnread ? "unread" : ""}" data-chat-id="${chat._id}">
                    <div class="chat-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="chat-info">
                        <div class="chat-header">
                            <h4>${user?.user?.name || "Unknown User"}</h4>
                            <span class="chat-time">${this.formatTime(lastMessage?.sentAt)}</span>
                        </div>
                        <div class="chat-preview">
                            <p>${this.truncateMessage(lastMessage?.content || "No messages", 50)}</p>
                            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ""}
                        </div>
                        <div class="chat-meta">
                            <span class="chat-status status-${chat.status}">${this.capitalizeFirst(chat.status)}</span>
                            <span class="chat-priority priority-${chat.priority}">${this.capitalizeFirst(chat.priority)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
        
        // Update chat stats
        this.updateChatStats();
    }

    renderContactMessages() {
        const contactList = document.getElementById("admin-contact-list");
        if (!contactList) return;

        if (this.contactMessages.length === 0) {
            contactList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope"></i>
                    <p>No contact messages</p>
                </div>
            `;
            return;
        }

        contactList.innerHTML = this.contactMessages.map(message => `
            <div class="contact-item ${message.read ? "read" : "unread"}" data-message-id="${message.id}">
                <div class="contact-info">
                    <div class="contact-header">
                        <h4>${message.name}</h4>
                        <span class="contact-time">${this.formatTime(message.date)}</span>
                    </div>
                    <div class="contact-email">${message.email}</div>
                    <div class="contact-subject">${message.subject}</div>
                    <div class="contact-preview">${message.message.substring(0, 100)}...</div>
                    <div class="contact-actions">
                        <button class="btn btn-sm btn-primary convert-to-chat" data-message-id="${message.id}">
                            <i class="fas fa-comments"></i> Start Chat
                        </button>
                        <button class="btn btn-sm btn-success mark-resolved" data-message-id="${message.id}">
                            <i class="fas fa-check"></i> Mark Resolved
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }

    async selectChat(chatId) {
        this.currentChatId = chatId;
        
        try {
            const response = await this.apiCall(`/api/chat/${chatId}`);
            if (response.success) {
                this.renderChatMessages(response.data);
                this.renderChatList(); // Update active state
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    }

    renderChatMessages(chat) {
        const messagesContainer = document.getElementById("chatMessages");
        const chatHeader = document.getElementById("chatHeader");
        const chatInput = document.getElementById("chatInput");
        const chatUserName = document.getElementById("chatUserName");
        const chatUserEmail = document.getElementById("chatUserEmail");
        const chatStatusSelect = document.getElementById("chatStatusSelect");
        
        if (!messagesContainer || !chatHeader) return;

        // Update chat header
        const user = chat.participants.find(p => p.role === "user");
        chatUserName.textContent = user?.user?.name || "Unknown User";
        chatUserEmail.textContent = user?.user?.email || "No email";
        chatStatusSelect.value = chat.status;
        
        // Show header and input
        chatHeader.style.display = "block";
        if (chatInput) chatInput.style.display = "block";

        // Render messages
        messagesContainer.innerHTML = chat.messages.map(message => {
            const attachmentHtml = message.attachments && message.attachments.length > 0 
                ? message.attachments.map(att => `
                    <div class="message-attachment">
                        <div class="attachment-icon">
                            <i class="fas fa-${this.getFileIcon(att.originalName)}"></i>
                        </div>
                        <div class="attachment-info">
                            <p class="attachment-name">${att.originalName}</p>
                            <p class="attachment-size">${this.formatFileSize(att.size)}</p>
                        </div>
                    </div>
                `).join('') : '';
                
            return `
                <div class="message ${message.senderRole}">
                    <div class="message-avatar">
                        <i class="fas fa-${message.senderRole === "user" ? "user" : "user-tie"}"></i>
                    </div>
                    <div class="message-content">
                        ${message.content ? `<div class="message-text">${message.content}</div>` : ''}
                        ${attachmentHtml}
                        <div class="message-time">${this.formatTime(message.sentAt)}</div>
                    </div>
                </div>
            `;
        }).join("");

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Mark messages as read
        this.markChatAsRead(chat._id);
    }

    async sendMessage() {
        const messageInput = document.getElementById("messageInput");
        if (!messageInput || !this.currentChatId) return;

        const content = messageInput.value.trim();
        if (!content) return;

        try {
            const response = await this.apiCall(`/api/chat/${this.currentChatId}/message`, {
                method: "POST",
                body: JSON.stringify({ content })
            });

            if (response.success) {
                messageInput.value = "";
                this.renderChatMessages(response.data);
                this.loadChats(); // Refresh chat list
            }
        } catch (error) {
            console.error("Error sending message:", error);
            this.showNotification("Error sending message", "error");
        }
    }
    
    updateChatStatus() {
        const statusSelect = document.getElementById("chatStatusSelect");
        if (!statusSelect || !this.currentChatId) return;
        
        const newStatus = statusSelect.value;
        
        fetch(`/api/v1/chat/${this.currentChatId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.loadChats(); // Refresh chat list
                // Show success message
                this.showNotification('Chat status updated successfully', 'success');
            }
        })
        .catch(error => {
            console.error("Error updating chat status:", error);
            this.showNotification('Error updating chat status', 'error');
        });
    }
    
    filterChats(searchTerm) {
        const filteredChats = this.chats.filter(chat => {
            const user = chat.participants.find(p => p.role === "user");
            const userName = user?.user?.name || "";
            const userEmail = user?.user?.email || "";
            const lastMessage = chat.messages[chat.messages.length - 1];
            const messageContent = lastMessage?.content || "";
            
            return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   messageContent.toLowerCase().includes(searchTerm.toLowerCase());
        });
        
        this.renderFilteredChats(filteredChats);
    }
    
    filterChatsByStatus(status) {
        const filteredChats = status ? this.chats.filter(chat => chat.status === status) : this.chats;
        this.renderFilteredChats(filteredChats);
    }
    
    renderFilteredChats(chats) {
        const originalChats = this.chats;
        this.chats = chats;
        this.renderChatList();
        this.chats = originalChats;
    }

    // Auto-reply functionality
    async handleIncomingMessage(chat, message) {
        if (!this.autoReplyEnabled || message.senderRole === "admin") {
            return;
        }

        // Check if this is a new conversation or first user message
        const userMessages = chat.messages.filter(msg => msg.senderRole === "user");
        const adminMessages = chat.messages.filter(msg => msg.senderRole === "admin");
        
        // Only auto-reply if this is the first user message or if no admin has replied yet
        if (userMessages.length === 1 || adminMessages.length === 0) {
            setTimeout(() => {
                this.sendAutoReply(chat._id, message.content);
            }, this.autoReplyDelay);
        }
    }

    async sendAutoReply(chatId, userMessage) {
        try {
            let replyMessage = this.getAutoReplyMessage(userMessage);
            
            const response = await this.apiCall(`/api/chat/${chatId}/message`, {
                method: "POST",
                body: JSON.stringify({ 
                    content: replyMessage,
                    isAutoReply: true 
                })
            });

            if (response.success) {
                this.loadChats();
                if (this.currentChatId === chatId) {
                    this.renderChatMessages(response.data);
                }
                this.showNotification("Auto-reply sent", "info");
            }
        } catch (error) {
            console.error("Error sending auto-reply:", error);
        }
    }

    getAutoReplyMessage(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for custom keyword-based replies
        for (const keyword of this.autoReplyKeywords) {
            if (lowerMessage.includes(keyword.toLowerCase()) && this.customAutoReplies[keyword]) {
                return this.customAutoReplies[keyword];
            }
        }
        
        // Check for common patterns
        if (lowerMessage.includes("urgent") || lowerMessage.includes("emergency")) {
            return "Thank you for your urgent message. We understand this is important to you and will prioritize your request. An admin will respond within 2 hours.";
        }
        
        if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("fee")) {
            return "Thank you for your inquiry about pricing. An admin will provide you with detailed pricing information shortly.";
        }
        
        if (lowerMessage.includes("support") || lowerMessage.includes("help") || lowerMessage.includes("issue")) {
            return "Thank you for reaching out for support. We're here to help! An admin will assist you with your issue as soon as possible.";
        }
        
        // Default auto-reply message
        return this.autoReplyMessage;
    }

    // Auto-reply settings management
    toggleAutoReply() {
        this.autoReplyEnabled = !this.autoReplyEnabled;
        localStorage.setItem("autoReplyEnabled", this.autoReplyEnabled.toString());
        this.updateAutoReplyUI();
        this.showNotification(`Auto-reply ${this.autoReplyEnabled ? "enabled" : "disabled"}`, "info");
    }

    updateAutoReplySettings(settings) {
        if (settings.message) {
            this.autoReplyMessage = settings.message;
            localStorage.setItem("autoReplyMessage", this.autoReplyMessage);
        }
        
        if (settings.delay) {
            this.autoReplyDelay = parseInt(settings.delay) * 1000; // Convert to milliseconds
            localStorage.setItem("autoReplyDelay", this.autoReplyDelay.toString());
        }
        
        if (settings.keywords) {
            this.autoReplyKeywords = settings.keywords;
            localStorage.setItem("autoReplyKeywords", JSON.stringify(this.autoReplyKeywords));
        }
        
        if (settings.customReplies) {
            this.customAutoReplies = settings.customReplies;
            localStorage.setItem("customAutoReplies", JSON.stringify(this.customAutoReplies));
        }
        
        this.showNotification("Auto-reply settings updated", "success");
    }

    updateAutoReplyUI() {
        const toggleBtn = document.getElementById("auto-reply-toggle");
        const statusIndicator = document.getElementById("auto-reply-status");
        
        if (toggleBtn) {
            toggleBtn.textContent = this.autoReplyEnabled ? "Disable Auto-Reply" : "Enable Auto-Reply";
            toggleBtn.className = `btn ${this.autoReplyEnabled ? "btn-warning" : "btn-success"}`;
        }
        
        if (statusIndicator) {
            statusIndicator.textContent = this.autoReplyEnabled ? "ON" : "OFF";
            statusIndicator.className = `status-indicator ${this.autoReplyEnabled ? "status-active" : "status-inactive"}`;
        }
    }

    setupAutoReplyUI() {
        // Add auto-reply controls to the chat management section
        const chatSection = document.getElementById("chats");
        if (!chatSection) return;
        
        const autoReplyControls = document.createElement("div");
        autoReplyControls.innerHTML = `
            <div class="auto-reply-controls" style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: var(--text-primary);">Auto-Reply Settings</h3>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="color: var(--text-secondary);">Status: <span id="auto-reply-status" class="status-indicator ${this.autoReplyEnabled ? "status-active" : "status-inactive"}">${this.autoReplyEnabled ? "ON" : "OFF"}</span></span>
                        <button id="auto-reply-toggle" class="btn ${this.autoReplyEnabled ? "btn-warning" : "btn-success"}">${this.autoReplyEnabled ? "Disable Auto-Reply" : "Enable Auto-Reply"}</button>
                        <button id="auto-reply-settings" class="btn btn-primary">Settings</button>
                    </div>
                </div>
                <div id="auto-reply-settings-panel" style="display: none; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Default Message:</label>
                        <textarea id="auto-reply-message" style="width: 100%; height: 80px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.375rem; background: var(--bg-primary); color: var(--text-primary);" placeholder="Enter default auto-reply message...">${this.autoReplyMessage}</textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Delay (seconds):</label>
                        <input type="number" id="auto-reply-delay" value="${this.autoReplyDelay / 1000}" min="5" max="300" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.375rem; background: var(--bg-primary); color: var(--text-primary);">
                        <div style="margin-top: 1rem;">
                            <button id="save-auto-reply-settings" class="btn btn-success">Save Settings</button>
                            <button id="reset-auto-reply-settings" class="btn btn-secondary">Reset to Default</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const sectionHeader = chatSection.querySelector(".section-header");
        if (sectionHeader) {
            sectionHeader.insertAdjacentElement("afterend", autoReplyControls);
        }
        
        this.bindAutoReplyEvents();
    }

    bindAutoReplyEvents() {
        const toggleBtn = document.getElementById("auto-reply-toggle");
        const settingsBtn = document.getElementById("auto-reply-settings");
        const settingsPanel = document.getElementById("auto-reply-settings-panel");
        const saveBtn = document.getElementById("save-auto-reply-settings");
        const resetBtn = document.getElementById("reset-auto-reply-settings");
        
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => this.toggleAutoReply());
        }
        
        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener("click", () => {
                settingsPanel.style.display = settingsPanel.style.display === "none" ? "grid" : "none";
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                const message = document.getElementById("auto-reply-message").value;
                const delay = document.getElementById("auto-reply-delay").value;
                
                this.updateAutoReplySettings({
                    message: message,
                    delay: delay
                });
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                const defaultMessage = "Thank you for contacting us! We have received your message and will respond as soon as possible. Our typical response time is within 24 hours.";
                document.getElementById("auto-reply-message").value = defaultMessage;
                document.getElementById("auto-reply-delay").value = "30";
                
                this.updateAutoReplySettings({
                    message: defaultMessage,
                    delay: "30"
                });
            });
        }
    }

    checkForNewMessages(previousChats, currentChats) {
        currentChats.forEach(currentChat => {
            const previousChat = previousChats.find(chat => chat._id === currentChat._id);
            
            if (previousChat) {
                // Check if there are new messages
                const previousMessageCount = previousChat.messages.length;
                const currentMessageCount = currentChat.messages.length;
                
                if (currentMessageCount > previousMessageCount) {
                    // Get the new messages
                    const newMessages = currentChat.messages.slice(previousMessageCount);
                    
                    // Check each new message for auto-reply trigger
                    newMessages.forEach(message => {
                        if (message.senderRole === "user") {
                            this.handleIncomingMessage(currentChat, message);
                        }
                    });
                }
            } else {
                // This is a completely new chat
                const userMessages = currentChat.messages.filter(msg => msg.senderRole === "user");
                if (userMessages.length > 0) {
                    // Trigger auto-reply for the first user message
                    this.handleIncomingMessage(currentChat, userMessages[0]);
                }
            }
        });
    }

    async updateChatStatus(chatId, status) {
        try {
            const response = await this.apiCall(`/api/chat/${chatId}/status`, {
                method: "PUT",
                body: JSON.stringify({ status })
            });

            if (response.success) {
                this.showNotification("Chat status updated", "success");
                this.loadChats();
            }
        } catch (error) {
            console.error("Error updating chat status:", error);
            this.showNotification("Error updating chat status", "error");
        }
    }

    async convertContactToChat(messageId) {
        try {
            const response = await this.apiCall(`/api/chat/from-contact/${messageId}`, {
                method: "POST"
            });

            if (response.success) {
                this.showNotification("Contact message converted to chat", "success");
                this.loadChats();
                this.loadContactMessages();
                this.selectChat(response.data._id);
            }
        } catch (error) {
            console.error("Error converting contact to chat:", error);
            this.showNotification("Error converting contact to chat", "error");
        }
    }

    async markContactResolved(messageId) {
        try {
            // This would need to be implemented in the backend
            this.showNotification("Contact message marked as resolved", "success");
            this.loadContactMessages();
        } catch (error) {
            console.error("Error marking contact as resolved:", error);
            this.showNotification("Error marking contact as resolved", "error");
        }
    }

    startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(() => {
            this.loadChats();
            if (this.currentChatId) {
                this.selectChat(this.currentChatId);
            }
        }, 3000); // Poll every 3 seconds for better responsiveness
    }

    async apiCall(endpoint, options = {}) {
        // Use centralized apiCall function for better error handling and token management
        if (window.apiCall) {
            return await window.apiCall(endpoint, options);
        }
        
        // Fallback implementation
        const token = localStorage.getItem("token");
        
        const defaultOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` })
            }
        };

        const response = await fetch(`http://localhost:8080${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        return await response.json();
    }

    formatTime(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return "Just now";
        } else if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            return `${Math.floor(diff / 3600000)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = "info") {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                color: white;
                font-weight: 500;
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            
            if (type === 'success') {
                notification.style.background = '#10b981';
            } else if (type === 'error') {
                notification.style.background = '#ef4444';
            } else {
                notification.style.background = '#3b82f6';
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
    
    // Helper methods for improved UI
    truncateMessage(message, maxLength) {
        if (!message || message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }
    
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    updateChatStats() {
        const totalChats = this.chats.length;
        const activeChats = this.chats.filter(chat => chat.status === 'active').length;
        const pendingChats = this.chats.filter(chat => chat.status === 'pending').length;
        const unreadMessages = this.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        
        // Update stat elements
        const totalChatsEl = document.getElementById('totalChats');
        const activeChatsEl = document.getElementById('activeChats');
        const pendingChatsEl = document.getElementById('pendingChats');
        const unreadMessagesEl = document.getElementById('unreadMessages');
        
        if (totalChatsEl) totalChatsEl.textContent = totalChats;
        if (activeChatsEl) activeChatsEl.textContent = activeChats;
        if (pendingChatsEl) pendingChatsEl.textContent = pendingChats;
        if (unreadMessagesEl) unreadMessagesEl.textContent = unreadMessages;
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'file-pdf',
            'doc': 'file-word', 'docx': 'file-word',
            'xls': 'file-excel', 'xlsx': 'file-excel',
            'ppt': 'file-powerpoint', 'pptx': 'file-powerpoint',
            'jpg': 'file-image', 'jpeg': 'file-image', 'png': 'file-image', 'gif': 'file-image',
            'mp4': 'file-video', 'avi': 'file-video', 'mov': 'file-video',
            'mp3': 'file-audio', 'wav': 'file-audio',
            'zip': 'file-archive', 'rar': 'file-archive', '7z': 'file-archive'
        };
        return iconMap[ext] || 'file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    markChatAsRead(chatId) {
        // Mark chat as read in the backend
        fetch(`/api/v1/chat/${chatId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).catch(error => {
            console.error('Error marking chat as read:', error);
        });
    }
}

// Initialize admin chat manager
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("admin-chat-container")) {
        window.adminChatManager = new AdminChatManager();
    }
});