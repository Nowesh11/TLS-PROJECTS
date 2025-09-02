// Purchased Books Management JavaScript

let purchasedBooksData = [];
let filteredPurchasedBooks = [];

// Load purchased books data
async function loadPurchasedBooksData() {
    try {
        showLoading();
        
        // Get authentication token using the same method as admin.js
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }
        
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch purchased books");
        }

        const data = await response.json();
        purchasedBooksData = data.data || [];
        filteredPurchasedBooks = [...purchasedBooksData];
        
        // Load statistics separately
        const statsResponse = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/stats`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            displayPurchasedBooksStats(statsData.data);
        }
        
        displayPurchasedBooksTable();
        
    } catch (error) {
        console.error("Error loading purchased books:", error);
        showNotification("Error loading purchased books: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Display purchased books statistics
function displayPurchasedBooksStats(stats) {
    if (!stats) return;
    
    // Update stat cards
    const totalOrdersElement = document.getElementById("totalOrdersCount");
    const pendingOrdersElement = document.getElementById("pendingOrdersCount");
    const processedOrdersElement = document.getElementById("processedOrdersCount");
    const totalRevenueElement = document.getElementById("totalRevenueAmount");
    
    if (totalOrdersElement) totalOrdersElement.textContent = stats.totalOrders || 0;
    if (pendingOrdersElement) pendingOrdersElement.textContent = stats.pendingOrders || 0;
    if (processedOrdersElement) processedOrdersElement.textContent = stats.processedOrders || 0;
    if (totalRevenueElement) totalRevenueElement.textContent = `₹${(stats.totalRevenue || 0).toFixed(2)}`;
}

// Display purchased books table
function displayPurchasedBooksTable() {
    const tableBody = document.getElementById("purchasedBooksTableBody");
    if (!tableBody) return;
    
    if (filteredPurchasedBooks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No purchased books found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredPurchasedBooks.map(order => {
        // Extract book title from populated book object
        const bookTitle = order.book_id?.title || "N/A";
        // Extract user info from populated user object
        const userName = order.user_id?.name || "N/A";
        const userEmail = order.user_id?.email || "N/A";
        // Use transaction_id for display
        const orderId = order.transaction_id || order._id?.toString().substring(0, 8).toUpperCase() || "N/A";
        
        return `
        <tr>
            <td>${orderId}</td>
            <td>${userName}</td>
            <td>${userEmail}</td>
            <td>${bookTitle}</td>
            <td>₹${(order.amount || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
                </span>
            </td>
            <td>${order.payment_method || "N/A"}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewPurchasedBookDetails('${order._id}')" class="btn-action btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="updateOrderStatus('${order._id}')" class="btn-action btn-edit" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${order.is_delivered ? `
                        <button onclick="refundPurchase('${order._id}')" class="btn-action btn-warning" title="Refund Purchase">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : `
                        <button onclick="markAsDelivered('${order._id}')" class="btn-action btn-success" title="Mark as Delivered">
                            <i class="fas fa-check"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
        `;
    }).join("");
}

// Search purchased books
function searchPurchasedBooks() {
    const searchTerm = document.getElementById("purchasedBooksSearch")?.value.toLowerCase() || "";
    const statusFilter = document.getElementById("purchasedBooksStatusFilter")?.value || "";
    
    filteredPurchasedBooks = purchasedBooksData.filter(order => {
        const bookTitle = order.book_id?.title || "";
        const userName = order.user_id?.name || "";
        const userEmail = order.user_id?.email || "";
        const orderId = order.transaction_id || order._id?.toString().substring(0, 8).toUpperCase() || "";
        
        const matchesSearch = !searchTerm || 
            userName.toLowerCase().includes(searchTerm) ||
            userEmail.toLowerCase().includes(searchTerm) ||
            bookTitle.toLowerCase().includes(searchTerm) ||
            orderId.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displayPurchasedBooksTable();
}

// View purchased book details
async function viewPurchasedBookDetails(orderId) {
    try {
        // Get authentication token with fallback
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }

        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/${orderId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch order details");
        }

        const order = await response.json();
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error("Error fetching order details:", error);
        showNotification("Error fetching order details: " + error.message, "error");
    }
}

// Show order details modal
function showOrderDetailsModal(orderResponse) {
    const modal = document.getElementById("orderDetailsModal");
    if (!modal) return;
    
    const order = orderResponse.data || orderResponse;
    const userName = order.user_id?.name || "N/A";
    const userEmail = order.user_id?.email || "N/A";
    const bookTitle = order.book_id?.title || "N/A";
    const bookAuthor = order.book_id?.author || "N/A";
    const bookPrice = order.book_id?.price || order.amount;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Purchase Details - ${order.transaction_id || order._id?.toString().substring(0, 8).toUpperCase()}</h3>
            <button class="close-modal" onclick="closeModal('orderDetailsModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="order-details-grid">
                <div class="detail-section">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Book Information</h4>
                    <p><strong>Title:</strong> ${bookTitle}</p>
                    <p><strong>Author:</strong> ${bookAuthor}</p>
                    <p><strong>Amount:</strong> ${order.currency || 'USD'} ${order.amount}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Payment Information</h4>
                    <p><strong>Method:</strong> ${order.payment_method || "N/A"}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </p>
                    <p><strong>Transaction ID:</strong> ${order.transaction_id}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Purchase Timeline</h4>
                    <p><strong>Purchased:</strong> ${new Date(order.purchased_at).toLocaleString()}</p>
                    ${order.delivered_at ? `<p><strong>Delivered:</strong> ${new Date(order.delivered_at).toLocaleString()}</p>` : ""}
                    ${order.refunded_at ? `<p><strong>Refunded:</strong> ${new Date(order.refunded_at).toLocaleString()}</p>` : ""}
                </div>
                
                ${order.notes ? `
                <div class="detail-section">
                    <h4>Notes</h4>
                    <p>${order.notes}</p>
                </div>
                ` : ""}
                
                ${order.refund_reason ? `
                <div class="detail-section">
                    <h4>Refund Reason</h4>
                    <p>${order.refund_reason}</p>
                </div>
                ` : ""}
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="updateOrderStatus('${order._id}')" class="btn btn-primary">Update Status</button>
            ${order.is_delivered ? `
                <button onclick="refundPurchase('${order._id}')" class="btn btn-warning">Refund Purchase</button>
            ` : `
                <button onclick="markAsDelivered('${order._id}')" class="btn btn-success">Mark as Delivered</button>
            `}
            <button onclick="closeModal('orderDetailsModal')" class="btn btn-secondary">Close</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Update order status
async function updateOrderStatus(orderId) {
    const order = purchasedBooksData.find(o => o._id === orderId);
    if (!order) return;
    
    const modal = document.getElementById("updateStatusModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Update Order Status</h3>
            <button class="close-modal" onclick="closeModal('updateStatusModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="updateStatusForm" class="blue-gradient-form">
                <div class="form-group">
                    <label for="orderStatus">Status:</label>
                    <select id="orderStatus" name="status" required>
                        <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="verified" ${order.status === "verified" ? "selected" : ""}>Verified</option>
                        <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
                        <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
                        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="trackingNumber">Tracking Number (optional):</label>
                    <input type="text" id="trackingNumber" name="trackingNumber" value="${order.trackingNumber || ""}">
                </div>
                
                <div class="form-group">
                    <label for="adminNotes">Admin Notes:</label>
                    <textarea id="adminNotes" name="adminNotes" rows="3">${order.adminNotes || ""}</textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button onclick="saveOrderStatus('${orderId}')" class="btn btn-primary">Update Status</button>
            <button onclick="closeModal('updateStatusModal')" class="btn btn-secondary">Cancel</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Save order status
async function saveOrderStatus(orderId) {
    try {
        const form = document.getElementById("updateStatusForm");
        const formData = new FormData(form);
        
        const updateData = {
            status: formData.get("status"),
            trackingNumber: formData.get("trackingNumber"),
            adminNotes: formData.get("adminNotes")
        };
        
        // Get authentication token with fallback
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }

        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/${orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error("Failed to update order status");
        }

        showNotification("Order status updated successfully", "success");
        closeModal("updateStatusModal");
        loadPurchasedBooksData(); // Reload data
        
    } catch (error) {
        console.error("Error updating order status:", error);
        showNotification("Error updating order status: " + error.message, "error");
    }
}

// View payment proof
function viewPaymentProof(proofPath) {
    if (!proofPath) return;
    
    // Open payment proof in new window/tab
    const proofUrl = `${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/uploads/${proofPath}`;
    window.open(proofUrl, "_blank");
}

// Export purchased books to CSV
async function exportPurchasedBooksCSV() {
    try {
        showLoading();
        // Get authentication token with fallback
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }

        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/export`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to export purchased books");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `purchased-books-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification("Purchased books exported successfully", "success");
        
    } catch (error) {
        console.error("Error exporting purchased books:", error);
        showNotification("Error exporting purchased books: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Initialize purchased books management
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for search and filter
    const searchInput = document.getElementById("purchasedBooksSearch");
    if (searchInput) {
        searchInput.addEventListener("input", searchPurchasedBooks);
    }
    
    const statusFilter = document.getElementById("purchasedBooksStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", searchPurchasedBooks);
    }
    
    // Add export button event listener
    const exportBtn = document.getElementById("exportPurchasedBooksBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportPurchasedBooksCSV);
    }
});

// Mark purchase as delivered
async function markAsDelivered(purchaseId) {
    try {
        // Get authentication token with fallback
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }

        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/${purchaseId}/deliver`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to mark purchase as delivered");
        }

        showNotification("Purchase marked as delivered successfully", "success");
        loadPurchasedBooksData(); // Reload data
        
    } catch (error) {
        console.error("Error marking purchase as delivered:", error);
        showNotification("Error marking purchase as delivered: " + error.message, "error");
    }
}

// Refund purchase
async function refundPurchase(purchaseId) {
    const reason = prompt("Enter refund reason (optional):");
    if (reason === null) return; // User cancelled
    
    try {
        // Get authentication token with fallback
        let token = localStorage.getItem("token");
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }

        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/purchases/${purchaseId}/refund`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ reason: reason || "Admin refund" })
        });

        if (!response.ok) {
            throw new Error("Failed to refund purchase");
        }

        showNotification("Purchase refunded successfully", "success");
        loadPurchasedBooksData(); // Reload data
        
    } catch (error) {
        console.error("Error refunding purchase:", error);
        showNotification("Error refunding purchase: " + error.message, "error");
    }
}

// Make functions globally available
window.loadPurchasedBooksData = loadPurchasedBooksData;
window.searchPurchasedBooks = searchPurchasedBooks;
window.viewPurchasedBookDetails = viewPurchasedBookDetails;
window.updateOrderStatus = updateOrderStatus;
window.saveOrderStatus = saveOrderStatus;
window.viewPaymentProof = viewPaymentProof;
window.exportPurchasedBooksCSV = exportPurchasedBooksCSV;
window.markAsDelivered = markAsDelivered;
window.refundPurchase = refundPurchase;