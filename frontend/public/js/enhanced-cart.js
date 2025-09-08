// Enhanced Cart Management System
class EnhancedCart {
    constructor() {
        this.cart = [];
        this.sessionId = this.getSessionId();
        this.loadCart();
    }

    getSessionId() {
        let sessionId = localStorage.getItem("cart_session_id");
        if (!sessionId) {
            sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("cart_session_id", sessionId);
        }
        return sessionId;
    }

    getAuthToken() {
        // Use TokenManager if available
        if (typeof window.TokenManager !== "undefined" && window.tokenManager) {
            return window.tokenManager.getToken();
        }
        
        // Fallback to direct localStorage access
        return localStorage.getItem("token");
    }

    async loadCart() {
        const maxRetries = 3;
        const retryDelay = 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🛒 Loading cart (attempt ${attempt}/${maxRetries})...`);
                
                const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart`, {
                    headers: {
                        "Authorization": this.getAuthToken() ? `Bearer ${this.getAuthToken()}` : "",
                        "X-Session-ID": this.sessionId
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    this.updateLocalCartFromServer(result.data);
                    console.log("✅ Cart loaded successfully");
                    return;
                } else {
                    throw new Error(`Cart load failed: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error(`❌ Error loading cart (attempt ${attempt}/${maxRetries}):`, error);
                
                if (attempt === maxRetries) {
                    console.warn("🔄 Failed to load cart from server, using local cart data");
                    this.loadLocalCart();
                    return;
                }
                
                // Wait before retrying
                const delay = retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    async loadCartFallback() {
        try {
            // Fallback method without retries
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart`, {
                headers: {
                    "Authorization": this.getAuthToken() ? `Bearer ${this.getAuthToken()}` : "",
                    "X-Session-ID": this.sessionId
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateLocalCartFromServer(result.data);
            } else {
                // Fallback to local storage
                this.loadLocalCart();
            }
        } catch (error) {
            console.log("Loading cart from server failed, using local storage:", error);
            this.loadLocalCart();
        }
    }

    loadLocalCart() {
        const savedCart = localStorage.getItem("tamil_society_cart");
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartDisplay();
        }
    }

    updateLocalCartFromServer(serverCart) {
        if (serverCart && serverCart.items) {
            this.cart = serverCart.items.map(item => ({
                id: item.book._id || item.book,
                title: item.book.title || "",
                tamilTitle: item.book.titleTamil || "",
                author: item.book.author || "",
                price: item.price,
                image: item.book.image || "",
                quantity: item.quantity
            }));
        } else {
            this.cart = [];
        }
        this.saveLocalCart();
        this.updateCartDisplay();
    }

    async addToCart(bookId, book) {
        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
                    "X-Session-ID": this.sessionId
                },
                body: JSON.stringify({
                    bookId: bookId,
                    quantity: 1
                })
            });

            const result = await response.json();

            if (result.success) {
                this.updateLocalCartFromServer(result.data);
                return { success: true, message: "Added to cart successfully" };
            } else {
                throw new Error(result.message || "Failed to add to cart");
            }
        } catch (error) {
            console.error("Add to cart API error:", error);
            // Fallback to local cart
            return this.addToLocalCart(bookId, book);
        }
    }

    addToLocalCart(bookId, book) {
        const existingItem = this.cart.find(item => item.id === bookId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: bookId,
                title: book.title,
                tamilTitle: book.tamilTitle,
                author: book.author,
                price: book.price,
                image: book.image,
                quantity: 1
            });
        }

        this.saveLocalCart();
        this.updateCartDisplay();
        return { success: true, message: "Added to cart successfully" };
    }

    async updateQuantity(bookId, newQuantity) {
        if (newQuantity <= 0) {
            return this.removeFromCart(bookId);
        }

        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
                    "X-Session-ID": this.sessionId
                },
                body: JSON.stringify({
                    bookId: bookId,
                    quantity: newQuantity
                })
            });

            const result = await response.json();

            if (result.success) {
                this.updateLocalCartFromServer(result.data);
                return { success: true };
            } else {
                throw new Error(result.message || "Failed to update quantity");
            }
        } catch (error) {
            console.error("Update quantity API error:", error);
            // Fallback to local update
            const item = this.cart.find(item => item.id === bookId);
            if (item) {
                item.quantity = newQuantity;
                this.saveLocalCart();
                this.updateCartDisplay();
                this.renderCartItems();
            }
            return { success: true };
        }
    }

    async removeFromCart(bookId) {
        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart/remove`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
                    "X-Session-ID": this.sessionId
                },
                body: JSON.stringify({
                    bookId: bookId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.updateLocalCartFromServer(result.data);
                return { success: true };
            } else {
                throw new Error(result.message || "Failed to remove from cart");
            }
        } catch (error) {
            console.error("Remove from cart API error:", error);
            // Fallback to local removal
            this.cart = this.cart.filter(item => item.id !== bookId);
            this.saveLocalCart();
            this.updateCartDisplay();
            this.renderCartItems();
            return { success: true };
        }
    }

    async clearCart() {
        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart`, {
                method: "DELETE",
                headers: {
                    "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
                    "X-Session-ID": this.sessionId
                }
            });

            if (response.ok) {
                this.cart = [];
                this.saveLocalCart();
                this.updateCartDisplay();
                this.renderCartItems();
                return { success: true };
            }
        } catch (error) {
            console.error("Clear cart API error:", error);
        }

        // Fallback to local clear
        this.cart = [];
        this.saveLocalCart();
        this.updateCartDisplay();
        this.renderCartItems();
        return { success: true };
    }

    saveLocalCart() {
        localStorage.setItem("tamil_society_cart", JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById("cart-count");
        const notificationDot = document.getElementById("notification-dot");
        
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
        
        if (notificationDot) {
            if (cartCount > 0) {
                notificationDot.classList.add("show");
            } else {
                notificationDot.classList.remove("show");
            }
        }
    }

    renderCartItems() {
        const container = document.getElementById("cart-items");
        const footer = document.getElementById("cart-footer");
        
        if (!container) return;
        
        if (this.cart.length === 0) {
            container.innerHTML = "<p style=\"color: var(--gray-500); text-align: center;\">Your cart is empty</p>";
            if (footer) footer.style.display = "none";
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        container.innerHTML = this.cart.map(item => {
            const imageStyle = this.getBookImageStyle(item.image);
            return `
                <div class="cart-item" style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--gray-200);">
                    <div style="width: 60px; height: 80px; ${imageStyle} border-radius: 0.5rem; flex-shrink: 0;"></div>
                    <div style="flex: 1;">
                        <h5 style="color: var(--gray-900); margin-bottom: 0.25rem; font-size: 0.9rem;">${item.tamilTitle}</h5>
                        <p style="color: var(--gray-600); font-size: 0.8rem; margin-bottom: 0.5rem;">${item.title}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--theme-primary); font-weight: 600;">RM${item.price}</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <button onclick="enhancedCart.updateQuantity('${item.id}', ${item.quantity - 1})" style="background: var(--gray-200); border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer;">-</button>
                                <span style="font-weight: 600;">${item.quantity}</span>
                                <button onclick="enhancedCart.updateQuantity('${item.id}', ${item.quantity + 1})" style="background: var(--gray-200); border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer;">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        const totalElement = document.getElementById("cart-total-amount");
        if (totalElement) {
            totalElement.textContent = `RM${total.toFixed(2)}`;
        }
        
        if (footer) footer.style.display = "block";
    }

    getBookImageStyle(imagePath) {
        if (!imagePath) {
            return "background: var(--theme-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;";
        }
        
        const imageUrl = imagePath.startsWith("http") ? imagePath : `${window.TLS_API_BASE_URL || "http://localhost:8080"}/${imagePath}`;
        return `background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
    }

    toggleCart() {
        const cartSummary = document.getElementById("cart-summary");
        if (!cartSummary) return;
        
        const isVisible = cartSummary.style.transform === "translateX(0px)";
        
        if (isVisible) {
            cartSummary.style.transform = "translateX(120%)";
        } else {
            cartSummary.style.transform = "translateX(0px)";
            this.renderCartItems();
        }
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getCartItems() {
        return this.cart;
    }

    getCartCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCart() {
        return this.cart;
    }

    async checkout(formData) {
        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/cart/checkout`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
                    "X-Session-ID": this.sessionId
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Clear cart after successful checkout
                this.cart = [];
                this.saveLocalCart();
                this.updateCartDisplay();
                this.renderCartItems();
                return { success: true, data: result.data };
            } else {
                throw new Error(result.message || "Checkout failed");
            }
        } catch (error) {
            console.error("Checkout API error:", error);
            throw error;
        }
    }
}

// Initialize enhanced cart
const enhancedCart = new EnhancedCart();

// Export for global use
window.enhancedCart = enhancedCart;