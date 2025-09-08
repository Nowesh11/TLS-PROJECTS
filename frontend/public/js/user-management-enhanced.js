/**
 * Enhanced User Management Functions
 * Fixes for search, filtering, pagination, and CRUD operations
 */

// Global variables for user management
let currentUsersPage = 1;
let currentUsersLimit = 10;
let currentUsersSearch = '';
let currentUsersRole = '';
let currentUsersStatus = '';

/**
 * Initialize enhanced user management
 */
function initializeUserManagement() {
    // Fix search input event listener
    const usersSearch = document.getElementById('users-search');
    if (usersSearch) {
        usersSearch.addEventListener('input', function() {
            currentUsersSearch = this.value;
            currentUsersPage = 1; // Reset to first page
            loadUsersDataEnhanced();
        });
    }

    // Add role filter event listener
    const roleFilter = document.getElementById('users-role-filter');
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            currentUsersRole = this.value;
            currentUsersPage = 1; // Reset to first page
            loadUsersDataEnhanced();
        });
    }

    // Add status filter event listener
    const statusFilter = document.getElementById('users-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentUsersStatus = this.value;
            currentUsersPage = 1; // Reset to first page
            loadUsersDataEnhanced();
        });
    }

    // Load initial data
    loadUsersDataEnhanced();
}

/**
 * Enhanced loadUsersData with server-side pagination, search, and filtering
 */
async function loadUsersDataEnhanced(page = currentUsersPage, limit = currentUsersLimit, search = currentUsersSearch, role = currentUsersRole, status = currentUsersStatus) {
    try {
        // Update current state
        currentUsersPage = page;
        currentUsersLimit = limit;
        currentUsersSearch = search;
        currentUsersRole = role;
        currentUsersStatus = status;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        
        if (search) params.append('q', search);
        if (role && role !== 'all') params.append('role', role);
        if (status && status !== 'all') {
            // Convert status to boolean for backend
            params.append('is_active', status === 'active' ? 'true' : 'false');
        }
        
        const response = await apiCall(`/api/users?${params.toString()}`);
        const users = response.data || [];
        const pagination = {
            totalPages: response.pages || 1,
            totalUsers: response.total || 0,
            currentPage: response.page || page
        };
        
        populateUsersTableEnhanced(users);
        updateUsersPagination(pagination, page, limit, search, role, status);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users data', 'error');
        // Fallback to client-side filtering if server-side fails
        if (typeof loadUsersData === 'function') {
            loadUsersData();
        }
    }
}

/**
 * Enhanced populate users table with proper column separation
 */
function populateUsersTableEnhanced(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    const rows = users.map(user => {
        const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
        const status = user.is_active ? 'Active' : 'Inactive';
        const statusClass = user.is_active ? 'status-active' : 'status-inactive';
        const displayName = user.full_name || user.name || 'N/A';
        
        return `
            <tr>
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user._id}" onchange="toggleUserSelection()">
                </td>
                <td>${escapeHtml(displayName)}</td>
                <td>${escapeHtml(user.email || 'N/A')}</td>
                <td>${escapeHtml(user.role || 'user')}</td>
                <td>
                    <span class="status-badge ${statusClass}">${status}</span>
                </td>
                <td>${joinedDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
    updateBulkOperationsVisibility();
}

/**
 * Update pagination controls for users table
 */
function updateUsersPagination(pagination, currentPage, limit, search, role, status) {
    const paginationContainer = document.getElementById('users-pagination');
    if (!paginationContainer) return;
    
    const { totalPages = 1, totalUsers = 0, currentPage: serverPage = currentPage } = pagination;
    const actualCurrentPage = serverPage || currentPage;
    
    let paginationHTML = `
        <div class="pagination-info">
            <span>Showing ${((actualCurrentPage - 1) * limit) + 1}-${Math.min(actualCurrentPage * limit, totalUsers)} of ${totalUsers} users</span>
        </div>
        <div class="pagination-controls" style="display: flex; gap: 0.5rem; align-items: center;">
    `;
    
    // Previous button
    if (actualCurrentPage > 1) {
        paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loadUsersDataEnhanced(${actualCurrentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, actualCurrentPage - 2);
    const endPage = Math.min(totalPages, actualCurrentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loadUsersDataEnhanced(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span style="padding: 0 0.5rem;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === actualCurrentPage ? 'btn-primary' : 'btn-secondary';
        paginationHTML += `<button class="btn btn-sm ${activeClass}" onclick="loadUsersDataEnhanced(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span style="padding: 0 0.5rem;">...</span>`;
        }
        paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loadUsersDataEnhanced(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (actualCurrentPage < totalPages) {
        paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loadUsersDataEnhanced(${actualCurrentPage + 1})">Next</button>`;
    }
    
    paginationHTML += `</div>`;
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Toggle user selection for bulk operations
 */
function toggleUserSelection() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    
    // Update bulk operations visibility
    updateBulkOperationsVisibility();
    
    // Update select all checkbox if it exists
    const selectAllCheckbox = document.getElementById('select-all-users');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
    }
}

/**
 * Update bulk operations visibility
 */
function updateBulkOperationsVisibility() {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    const bulkOperationsDiv = document.getElementById('bulkOperationsDiv');
    
    if (bulkOperationsDiv) {
        bulkOperationsDiv.style.display = checkedBoxes.length > 0 ? 'block' : 'none';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Enhanced refresh users function
 */
function refreshUsersEnhanced() {
    // Reset filters and pagination
    currentUsersPage = 1;
    currentUsersSearch = '';
    currentUsersRole = '';
    currentUsersStatus = '';
    
    // Reset form inputs
    const searchInput = document.getElementById('users-search');
    const roleFilter = document.getElementById('users-role-filter');
    const statusFilter = document.getElementById('users-status-filter');
    
    if (searchInput) searchInput.value = '';
    if (roleFilter) roleFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    
    // Reload data
    loadUsersDataEnhanced();
    
    showNotification('Users data refreshed successfully', 'success');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserManagement);
} else {
    initializeUserManagement();
}

// Make functions globally available
window.loadUsersDataEnhanced = loadUsersDataEnhanced;
window.refreshUsersEnhanced = refreshUsersEnhanced;
window.toggleUserSelection = toggleUserSelection;
window.updateBulkOperationsVisibility = updateBulkOperationsVisibility;