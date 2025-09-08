/**
 * Chat Widget for Tamil Language Society
 * Provides WhatsApp-like messaging interface
 */

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.currentChatId = null;
        this.messages = [];
        this.isAuthenticated = false;
        this.currentUser = null;
        this.pollInterval = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.createChatWidget();
        this.bindEvents();
        this.startPolling(); // Always start polling for both authenticated and guest users
    }

    checkAuthStatus() {
        const token = localStorage.getItem("token");
        this.isAuthenticated = !!token;
        
        if (this.isAuthenticated && window.authManager) {
            this.currentUser = window.authManager.getCurrentUser();
        }
    }

    requireAuth() {
        // Allow guest users to chat without authentication
        return true;
    }

    showAuthPrompt() {
        const authModal = document.createElement("div");
        authModal.className = "auth-modal";
        authModal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h3><i class="fas fa-lock"></i> Sign In Required</h3>
                    <button class="auth-modal-close">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <p>You need to sign in to chat with our admin team.</p>
                    <div class="auth-buttons">
                        <a href="login.html" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Sign In
                        </a>
                        <a href="signup.html" class="btn btn-secondary">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(authModal);
        
        // Close modal events
        authModal.querySelector(".auth-modal-close").onclick = () => {
            document.body.removeChild(authModal);
        };
        
        authModal.onclick = (e) => {
            if (e.target === authModal) {
                document.body.removeChild(authModal);
            }
        };
    }

    createChatWidget() {
        // Create chat widget HTML
        const widgetHTML = `
            <div id="chat-widget" class="chat-widget">
                <!-- Chat Toggle Button -->
                <div id="chat-toggle" class="chat-toggle">
                    <i class="fas fa-comments"></i>
                    <span class="chat-badge" id="chat-badge" style="display: none;">0</span>
                    <div class="chat-button-tooltip">Chat with Admin</div>
                </div>

                <!-- Chat Window -->
                <div id="chat-window" class="chat-window" style="display: none;">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <div class="chat-avatar-container">
                                <img src="assets/logo.png" alt="Admin" class="chat-avatar">
                                <div class="online-indicator"></div>
                            </div>
                            <div class="chat-header-text">
                                <h4>Tamil Language Society</h4>
                                <span class="chat-status">
                                    <i class="fas fa-circle"></i> Online
                                </span>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <button id="chat-minimize" class="chat-btn" title="Minimize">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button id="chat-close" class="chat-btn" title="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Guest Info Form -->
                    <div id="guest-info-form" class="guest-info-form" style="display: none;">
                        <div class="guest-form-content">
                            <h4><i class="fas fa-user"></i> Contact Information</h4>
                            <p>Please provide your details to start the conversation:</p>
                            <div class="form-group">
                                <input type="text" id="guest-name" placeholder="Your Name" required>
                            </div>
                            <div class="form-group">
                                <input type="email" id="guest-email" placeholder="Your Email" required>
                            </div>
                            <div class="form-group">
                                <input type="text" id="guest-subject" placeholder="Subject (Optional)" value="Support Request">
                            </div>
                            <button id="start-guest-chat" class="btn btn-primary">
                                <i class="fas fa-comments"></i> Start Chat
                            </button>
                            <p class="guest-note">
                                <i class="fas fa-info-circle"></i>
                                Have an account? <a href="login.html">Sign in</a> for a better experience.
                            </p>
                        </div>
                    </div>

                    <!-- Chat Messages -->
                    <div id="chat-messages" class="chat-messages">
                        <div class="welcome-message">
                            <div class="admin-avatar">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="message-content">
                                <p>Hello! Welcome to Tamil Language Society. How can we help you today?</p>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Input -->
                    <div id="chat-input-area" class="chat-input-area">
                        <div class="chat-input-container">
                            <textarea id="chat-input" placeholder="Type your message..." rows="1"></textarea>
                            <button id="chat-send" class="chat-send-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add widget to page
        document.body.insertAdjacentHTML("beforeend", widgetHTML);

        // Add CSS styles
        this.addStyles();
    }

    addStyles() {
        const styles = `
            <style>
                .chat-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .chat-toggle {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--whatsapp-green) 0%, var(--whatsapp-dark-green) 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px var(--whatsapp-shadow);
                    transition: all 0.3s ease;
                    position: relative;
                }

                .chat-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px var(--whatsapp-shadow-hover);
                }

                .chat-toggle i {
                    color: white;
                    font-size: 24px;
                }

                .chat-button-tooltip {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    background: var(--text-primary);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    pointer-events: none;
                }

                .chat-toggle:hover .chat-button-tooltip {
                    opacity: 1;
                    visibility: visible;
                    bottom: 75px;
                }

                .chat-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: var(--error-color);
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .chat-window {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 380px;
                    height: 550px;
                    background: var(--bg-primary);
                    border-radius: 12px;
                    box-shadow: 0 10px 40px var(--shadow-lg);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }

                .chat-window.minimized {
                    height: 60px;
                    overflow: hidden;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-header {
                    background: linear-gradient(135deg, var(--whatsapp-green) 0%, var(--whatsapp-dark-green) 100%);
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .chat-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .chat-avatar-container {
                    position: relative;
                }

                .chat-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--border-light);
                }

                .online-indicator {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 12px;
                    height: 12px;
                    background: var(--success-color);
                    border: 2px solid white;
                    border-radius: 50%;
                }

                .chat-header-text h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .chat-status {
                    font-size: 12px;
                    opacity: 0.9;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .chat-status i {
                    font-size: 8px;
                    color: var(--success-color);
                }

                .chat-header-actions {
                    display: flex;
                    gap: 5px;
                }

                .chat-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chat-btn:hover {
                    background: var(--bg-overlay-light);
                }

                .auth-required {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .auth-message {
                    text-align: center;
                }

                .auth-message i {
                    font-size: 48px;
                    color: var(--text-light);
                    margin-bottom: 15px;
                }

                .auth-message h4 {
                    margin: 0 0 10px 0;
                    color: var(--text-primary);
                }

                .auth-message p {
                    color: var(--text-secondary);
                    margin-bottom: 20px;
                }

                .auth-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .auth-buttons .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    text-decoration: none;
                    display: inline-block;
                }

                .auth-buttons .btn-primary {
                    background: var(--primary-color, #667eea);
                    color: white;
                }

                .auth-buttons .btn-secondary {
                    background: var(--bg-secondary, #f1f2f6);
                    color: var(--text-primary, #333);
                }

                .guest-info-form {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 20px;
                }

                .guest-form-content {
                    width: 100%;
                    max-width: 280px;
                }

                .guest-form-content h4 {
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .guest-form-content h4 i {
                    color: var(--whatsapp-green);
                }

                .guest-form-content p {
                    margin: 0 0 16px 0;
                    color: var(--text-secondary);
                    font-size: 14px;
                    line-height: 1.4;
                }

                .form-group {
                    margin-bottom: 12px;
                }

                .form-group input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-secondary);
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--whatsapp-green);
                }

                .form-group input::placeholder {
                    color: var(--text-light);
                }

                .guest-form-content .btn {
                    width: 100%;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    margin-bottom: 12px;
                }

                .guest-form-content .btn-primary {
                    background: var(--whatsapp-green);
                    color: white;
                }

                .guest-form-content .btn-primary:hover {
                    background: var(--whatsapp-dark-green);
                }

                .guest-note {
                    font-size: 12px;
                    color: var(--text-secondary);
                    text-align: center;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }

                .guest-note i {
                    color: var(--whatsapp-green);
                }

                .guest-note a {
                    color: var(--whatsapp-green);
                    text-decoration: none;
                }

                .guest-note a:hover {
                    text-decoration: underline;
                }

                .chat-messages {
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    background: linear-gradient(to bottom, var(--chat-bg) 0%, var(--chat-bg) 100%);
                    background-image: 
                        radial-gradient(circle at 20% 50%, var(--chat-pattern-1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, var(--chat-pattern-2) 0%, transparent 50%),
                         radial-gradient(circle at 40% 80%, var(--chat-pattern-3) 0%, transparent 50%);
                }

                .welcome-message {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }

                .admin-avatar {
                    width: 32px;
                    height: 32px;
                    background: var(--primary-color, #667eea);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 10px;
                    flex-shrink: 0;
                }

                .admin-avatar i {
                    color: white;
                    font-size: 14px;
                }

                .message-content {
                    background: var(--bg-primary, white);
                    padding: 10px 12px;
                    border-radius: 12px;
                    max-width: 80%;
                    box-shadow: 0 1px 2px var(--shadow-sm);
                }

                .message-content p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .message {
                    display: flex;
                    margin-bottom: 15px;
                    animation: messageSlide 0.3s ease;
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message.user {
                    justify-content: flex-end;
                }

                .message.user .message-content {
                    background: var(--message-sent-bg);
                     color: var(--text-primary);
                    margin-left: auto;
                }

                .message.admin {
                    justify-content: flex-start;
                }

                .message-time {
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-top: 5px;
                }

                .chat-input-area {
                    padding: 15px;
                    background: var(--bg-primary, white);
                    border-top: 1px solid var(--border-secondary);
                }

                .chat-input-container {
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    background: var(--bg-secondary);
                    border-radius: 25px;
                    padding: 5px;
                }

                #chat-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 10px 15px;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                    font-size: 14px;
                    max-height: 100px;
                }

                .chat-send-btn {
                    width: 40px;
                    height: 40px;
                    background: var(--whatsapp-green);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    margin: 2px;
                }

                .chat-send-btn:hover:not(:disabled) {
                    background: var(--whatsapp-dark-green);
                    transform: scale(1.05);
                }

                .chat-send-btn:disabled {
                    background: var(--bg-muted);
                    cursor: not-allowed;
                    transform: none;
                }

                .typing-indicator {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    font-style: italic;
                    color: var(--text-secondary);
                    font-size: 13px;
                }

                .typing-dots {
                    display: inline-flex;
                    margin-left: 5px;
                }

                .typing-dots span {
                    width: 4px;
                    height: 4px;
                    background: var(--text-secondary);
                    border-radius: 50%;
                    margin: 0 1px;
                    animation: typing 1.4s infinite;
                }

                .typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-10px);
                    }
                }

                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--overlay-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .auth-modal-content {
                    background: var(--bg-primary, white);
                    border-radius: 12px;
                    padding: 0;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px var(--shadow-xl);
                    animation: modalSlide 0.3s ease;
                }

                @keyframes modalSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .auth-modal-header {
                    background: var(--theme-gradient);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .auth-modal-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .auth-modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .auth-modal-close:hover {
                    background: var(--bg-overlay-light);
                }

                .auth-modal-body {
                    padding: 30px;
                    text-align: center;
                }

                .auth-modal-body p {
                    margin-bottom: 25px;
                    color: var(--text-secondary);
                    line-height: 1.6;
                }

                .auth-modal-body .auth-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }

                .auth-modal-body .auth-buttons .btn {
                    padding: 12px 24px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .auth-modal-body .auth-buttons .btn-primary {
                    background: var(--theme-primary);
                    color: white;
                    border: 2px solid var(--theme-primary);
                }

                .auth-modal-body .auth-buttons .btn-primary:hover {
                    background: var(--theme-secondary);
                     border-color: var(--theme-secondary);
                    transform: translateY(-2px);
                }

                .auth-modal-body .auth-buttons .btn-secondary {
                    background: transparent;
                    color: var(--theme-primary);
                     border: 2px solid var(--theme-primary);
                }

                .auth-modal-body .auth-buttons .btn-secondary:hover {
                    background: var(--theme-primary);
                    color: white;
                    transform: translateY(-2px);
                }

                @media (max-width: 768px) {
                    .chat-window {
                        width: 300px;
                        height: 450px;
                    }
                    
                    .chat-toggle {
                        bottom: 15px;
                        right: 15px;
                        width: 55px;
                        height: 55px;
                        font-size: 22px;
                    }
                    
                    .auth-modal-body .auth-buttons {
                        flex-direction: column;
                    }
                    
                    .auth-modal-body .auth-buttons .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML("beforeend", styles);
    }

    bindEvents() {
        const chatToggle = document.getElementById("chat-toggle");
        const chatWindow = document.getElementById("chat-window");
        const chatClose = document.getElementById("chat-close");
        const chatMinimize = document.getElementById("chat-minimize");
        const chatInput = document.getElementById("chat-input");
        const chatSend = document.getElementById("chat-send");
        const startGuestChat = document.getElementById("start-guest-chat");

        // Toggle chat window
        chatToggle.addEventListener("click", () => {
            if (this.requireAuth()) {
                this.toggleChat();
            }
        });

        // Close chat
        chatClose.addEventListener("click", () => {
            this.closeChat();
        });

        // Minimize chat
        chatMinimize.addEventListener("click", () => {
            this.minimizeChat();
        });

        // Start guest chat
        startGuestChat.addEventListener("click", () => {
            this.startGuestChat();
        });

        // Send message on Enter
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey && this.requireAuth()) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send message on button click
        chatSend.addEventListener("click", () => {
            if (this.requireAuth()) {
                this.sendMessage();
            }
        });

        // Auto-resize textarea and input validation
        chatInput.addEventListener("input", (e) => {
            chatInput.style.height = "auto";
            chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
            
            const message = e.target.value.trim();
            chatSend.disabled = !message;
            
            // Show typing indicator
            if (message && !this.isTyping) {
                this.showTyping();
            } else if (!message && this.isTyping) {
                this.hideTyping();
            }
        });
        
        // Direct chat button from contact form
        const directChatBtn = document.getElementById("directChatBtn");
        if (directChatBtn) {
            directChatBtn.addEventListener("click", () => {
                if (this.requireAuth()) {
                    this.toggleChat();
                }
            });
        }
        
        // Handle authentication state changes
        window.addEventListener("authStateChanged", () => {
            this.checkAuthStatus();
            if (this.isAuthenticated && !this.pollInterval) {
                this.startPolling();
            } else if (!this.isAuthenticated && this.pollInterval) {
                this.stopPolling();
            }
        });
    }

    showTyping() {
        this.isTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.hideTyping();
        }, 3000);
    }

    hideTyping() {
        this.isTyping = false;
        clearTimeout(this.typingTimeout);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    toggleChat() {
        const chatWindow = document.getElementById("chat-window");
        const guestForm = document.getElementById("guest-info-form");
        const chatMessages = document.getElementById("chat-messages");
        const chatInputArea = document.getElementById("chat-input-area");

        if (this.isOpen) {
            this.closeChat();
        } else {
            this.isOpen = true;
            chatWindow.style.display = "flex";
            
            // Show appropriate interface based on authentication
            if (this.isAuthenticated || this.currentChatId) {
                // Show chat interface for authenticated users or existing chats
                guestForm.style.display = "none";
                chatMessages.style.display = "block";
                chatInputArea.style.display = "block";
                
                const chatInput = document.getElementById("chat-input");
                setTimeout(() => chatInput.focus(), 100);
                this.loadChat();
            } else {
                // Show guest form for unauthenticated users
                guestForm.style.display = "block";
                chatMessages.style.display = "none";
                chatInputArea.style.display = "none";
                
                const guestName = document.getElementById("guest-name");
                setTimeout(() => guestName.focus(), 100);
            }
        }
    }

    openChat() {
        const chatWindow = document.getElementById("chat-window");
        const authRequired = document.getElementById("auth-required");
        const chatMessages = document.getElementById("chat-messages");
        const chatInputArea = document.getElementById("chat-input-area");

        this.isOpen = true;
        chatWindow.style.display = "flex";

        if (!this.isAuthenticated) {
            authRequired.style.display = "flex";
            chatMessages.style.display = "none";
            chatInputArea.style.display = "none";
        } else {
            authRequired.style.display = "none";
            chatMessages.style.display = "block";
            chatInputArea.style.display = "block";
            this.loadChat();
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById("chat-window").style.display = "none";
    }

    minimizeChat() {
        this.closeChat();
    }

    async loadChat() {
        try {
            const response = await this.apiCall("/api/chat");
            if (response.success && response.data.length > 0) {
                this.currentChatId = response.data[0]._id;
                this.displayMessages(response.data[0].messages);
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    }

    async sendMessage() {
        const chatInput = document.getElementById("chat-input");
        const message = chatInput.value.trim();

        if (!message) return;

        // For guest users without a chat ID, show the guest form
        if (!this.isAuthenticated && !this.currentChatId) {
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification("Please provide your contact information first", "info");
            }
            return;
        }

        // Clear input
        chatInput.value = "";
        chatInput.style.height = "auto";

        // Add message to UI immediately
        this.addMessageToUI(message, "user");

        try {
            let response;
            if (this.currentChatId) {
                // Send to existing chat - use public endpoint for guest users
                const endpoint = this.isAuthenticated 
                    ? `/api/chat/${this.currentChatId}/message`
                    : `/api/chat/public/${this.currentChatId}/message`;
                    
                response = await this.apiCall(endpoint, {
                    method: "POST",
                    body: JSON.stringify({ content: message })
                });
            } else if (this.isAuthenticated) {
                // Create new chat for authenticated users
                response = await this.apiCall("/api/chat", {
                    method: "POST",
                    body: JSON.stringify({ 
                        message: message,
                        subject: "Support Request"
                    })
                });
                
                if (response.success) {
                    this.currentChatId = response.data._id;
                }
            }

            if (!response || !response.success) {
                throw new Error(response?.message || "Failed to send message");
            }

        } catch (error) {
            console.error("Error sending message:", error);
            this.addMessageToUI("Sorry, there was an error sending your message. Please try again.", "system");
        }
    }

    addMessageToUI(content, type, timestamp = new Date()) {
        const chatMessages = document.getElementById("chat-messages");
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${type}`;

        const timeStr = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (type === "user") {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                    <div class="message-time">${timeStr}</div>
                </div>
            `;
        } else if (type === "admin") {
            messageDiv.innerHTML = `
                <div class="admin-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                    <div class="message-time">${timeStr}</div>
                </div>
            `;
        } else if (type === "system") {
            messageDiv.innerHTML = `
                <div class="message-content" style="background: var(--error-bg); color: var(--error-text); border: 1px solid var(--error-border);">
                    <p>${this.escapeHtml(content)}</p>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    displayMessages(messages) {
        const chatMessages = document.getElementById("chat-messages");
        // Clear existing messages except welcome message
        const welcomeMessage = chatMessages.querySelector(".welcome-message");
        chatMessages.innerHTML = "";
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }

        messages.forEach(message => {
            const senderType = message.senderRole === "admin" ? "admin" : "user";
            this.addMessageToUI(message.content, senderType, new Date(message.sentAt));
        });
    }

    startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(() => {
            if (this.isAuthenticated && this.currentChatId && this.isOpen) {
                this.checkForNewMessages();
            }
        }, 3000); // Poll every 3 seconds
    }

    async checkForNewMessages() {
        try {
            const response = await this.apiCall(`/api/chat/${this.currentChatId}`);
            if (response.success) {
                const newMessages = response.data.messages;
                if (newMessages.length > this.messages.length) {
                    // New messages received
                    const latestMessages = newMessages.slice(this.messages.length);
                    latestMessages.forEach(message => {
                        if (message.senderRole === "admin") {
                            this.addMessageToUI(message.content, "admin", new Date(message.sentAt));
                        }
                    });
                    this.messages = newMessages;
                }
            }
        } catch (error) {
            console.error("Error checking for new messages:", error);
        }
    }

    async apiCall(endpoint, options = {}) {
        // Use centralized apiCall from api-integration.js for better error handling and token management
        if (window.apiCall && typeof window.apiCall === "function") {
            return await window.apiCall(endpoint, options);
        }
        
        // Fallback implementation if centralized version is not available
        console.warn("Centralized apiCall not found, using fallback implementation");
        
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

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    async startGuestChat() {
        const guestName = document.getElementById("guest-name").value.trim();
        const guestEmail = document.getElementById("guest-email").value.trim();
        const guestSubject = document.getElementById("guest-subject").value.trim();

        if (!guestName || !guestEmail) {
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification("Please fill in your name and email", "error");
            } else {
                alert("Please fill in your name and email");
            }
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestEmail)) {
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification("Please enter a valid email address", "error");
            } else {
                alert("Please enter a valid email address");
            }
            return;
        }

        try {
            // Create guest chat session
             const response = await this.apiCall("/api/chat/public", {
                 method: "POST",
                 body: JSON.stringify({
                     name: guestName,
                     email: guestEmail,
                     subject: guestSubject || "Support Request",
                     message: "Hello! I would like to get in touch with your team."
                 })
             });

            if (response.success) {
                this.currentChatId = response.data._id;
                
                // Hide guest form and show chat interface
                const guestForm = document.getElementById("guest-info-form");
                const chatMessages = document.getElementById("chat-messages");
                const chatInputArea = document.getElementById("chat-input-area");
                
                guestForm.style.display = "none";
                chatMessages.style.display = "block";
                chatInputArea.style.display = "block";
                
                // Focus on chat input
                const chatInput = document.getElementById("chat-input");
                setTimeout(() => chatInput.focus(), 100);
                
                // Show success message
                if (window.TamilSociety && window.TamilSociety.showNotification) {
                    window.TamilSociety.showNotification("Chat session started! How can we help you?", "success");
                }
            } else {
                throw new Error(response.message || "Failed to start chat session");
            }
        } catch (error) {
            console.error("Error starting guest chat:", error);
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification("Failed to start chat session. Please try again.", "error");
            } else {
                alert("Failed to start chat session. Please try again.");
            }
        }
    }

    // Public method to show auth required notification
    showAuthRequiredNotification(action) {
        if (window.TamilSociety && window.TamilSociety.showNotification) {
            window.TamilSociety.showNotification(
                `Please sign in to ${action}. You can browse the website without signing in.`,
                "info",
                5000
            );
        } else {
            alert(`Please sign in to ${action}. You can browse the website without signing in.`);
        }
    }
}

// Initialize chat widget when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.chatWidget = new ChatWidget();
    // Also expose globally for easy access
    window.chatWidget = window.TamilSociety.chatWidget;
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
    module.exports = ChatWidget;
}