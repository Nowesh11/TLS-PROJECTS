/**
 * Posters Management Module
 * Handles poster data display and management
 */

// Global variables
let postersData = [];
let filteredPosters = [];

// Use global API configuration
// Use window.TLS_API_BASE_URL directly to avoid const declaration conflicts

// Load posters data
async function loadPostersData() {
    try {
        showLoading();
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch posters");
        }

        const data = await response.json();
        postersData = data.posters || [];
        filteredPosters = [...postersData];
        
        displayPostersStats(data.stats);
        displayPostersTable();
        
    } catch (error) {
        console.error("Error loading posters:", error);
        showNotification("Error loading posters: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Display posters statistics
function displayPostersStats(stats) {
    // Statistics display removed - keeping only essential data loading
    return;
}

// Display posters table
function displayPostersTable() {
    const tableBody = document.getElementById("postersTableBody");
    if (!tableBody) return;
    
    if (filteredPosters.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No posters found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredPosters.map(poster => `
        <tr>
            <td>
                <img src="${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/uploads/posters/${poster.image_path}" alt="${poster.title}" class="poster-thumbnail">
            </td>
            <td>${poster.title || "N/A"}</td>
            <td>${poster.description ? (poster.description.length > 50 ? poster.description.substring(0, 50) + "..." : poster.description) : "N/A"}</td>
            <td>
                <span class="status-badge ${poster.is_active ? "status-active" : "status-inactive"}">
                    ${poster.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>${poster.display_order || 1}</td>
            <td>${poster.view_count || 0}</td>
            <td>${poster.click_count || 0}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewPosterDetails('${poster._id}')" class="btn-action btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editPoster('${poster._id}')" class="btn-action btn-edit" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="togglePosterStatus('${poster._id}')" class="btn-action ${poster.is_active ? "btn-warning" : "btn-success"}" title="${poster.is_active ? "Deactivate" : "Activate"}">
                        <i class="fas ${poster.is_active ? "fa-pause" : "fa-play"}"></i>
                    </button>
                    <button onclick="deletePoster('${poster._id}')" class="btn-action btn-danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Search posters
function searchPosters() {
    const searchTerm = document.getElementById("postersSearch")?.value.toLowerCase() || "";
    const statusFilter = document.getElementById("postersStatusFilter")?.value || "";
    
    filteredPosters = postersData.filter(poster => {
        const matchesSearch = !searchTerm || 
            (poster.title && poster.title.toLowerCase().includes(searchTerm)) ||
            (poster.description && poster.description.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || 
            (statusFilter === "active" && poster.is_active) ||
            (statusFilter === "inactive" && !poster.is_active);
        
        return matchesSearch && matchesStatus;
    });
    
    displayPostersTable();
}

// Show add poster modal
function showAddPosterModal() {
    const modal = document.getElementById("posterModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Add New Poster</h3>
            <button class="close-modal" onclick="closeModal('posterModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="posterForm" class="blue-gradient-form" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterTitle">Title *</label>
                        <input type="text" id="posterTitle" name="title" required maxlength="200">
                    </div>
                    <div class="form-group">
                        <label for="posterTitleTamil">Title (Tamil)</label>
                        <input type="text" id="posterTitleTamil" name="titleTamil" maxlength="200">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="posterDescription">Description *</label>
                    <textarea id="posterDescription" name="description" required maxlength="1000" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="posterDescriptionTamil">Description (Tamil)</label>
                    <textarea id="posterDescriptionTamil" name="descriptionTamil" maxlength="1000" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="posterImage">Image *</label>
                    <input type="file" id="posterImage" name="image" accept="image/*" required>
                    <small>Recommended size: 1200x600px</small>
                </div>
                
                <div class="form-group">
                    <label for="posterImageAlt">Image Alt Text</label>
                    <input type="text" id="posterImageAlt" name="imageAlt" maxlength="200">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterButtonText">Button Text</label>
                        <input type="text" id="posterButtonText" name="buttonText" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="posterButtonTextTamil">Button Text (Tamil)</label>
                        <input type="text" id="posterButtonTextTamil" name="buttonTextTamil" maxlength="50">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="posterButtonUrl">Button URL</label>
                    <input type="url" id="posterButtonUrl" name="link_url" maxlength="500">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterPriority">Display Order</label>
                        <select id="posterPriority" name="display_order">
                            <option value="1">1 (First)</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5" selected>5 (Medium)</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10 (Last)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="posterIsActive">Status</label>
                        <select id="posterIsActive" name="is_active">
                            <option value="true" selected>Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterStartDate">Start Date</label>
                        <input type="datetime-local" id="posterStartDate" name="start_at">
                    </div>
                    <div class="form-group">
                        <label for="posterEndDate">End Date</label>
                        <input type="datetime-local" id="posterEndDate" name="end_at">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterSeoTitle">SEO Title</label>
                        <input type="text" id="posterSeoTitle" name="seoTitle" maxlength="60">
                    </div>
                    <div class="form-group">
                        <label for="posterSeoDescription">SEO Description</label>
                        <input type="text" id="posterSeoDescription" name="seoDescription" maxlength="160">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button onclick="savePoster()" class="btn btn-primary">Add Poster</button>
            <button onclick="closeModal('posterModal')" class="btn btn-secondary">Cancel</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Edit poster
async function editPoster(posterId) {
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters/${posterId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch poster details");
        }

        const poster = await response.json();
        showEditPosterModal(poster);
        
    } catch (error) {
        console.error("Error fetching poster details:", error);
        showNotification("Error fetching poster details: " + error.message, "error");
    }
}

// Show edit poster modal
function showEditPosterModal(poster) {
    const modal = document.getElementById("posterModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Edit Poster</h3>
            <button class="close-modal" onclick="closeModal('posterModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="posterForm" class="blue-gradient-form" enctype="multipart/form-data">
                <input type="hidden" id="posterId" value="${poster._id}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterTitle">Title *</label>
                        <input type="text" id="posterTitle" name="title" value="${poster.title || ""}" required maxlength="200">
                    </div>
                    <div class="form-group">
                        <label for="posterTitleTamil">Title (Tamil)</label>
                        <input type="text" id="posterTitleTamil" name="titleTamil" value="${poster.titleTamil || ""}" maxlength="200">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="posterDescription">Description *</label>
                    <textarea id="posterDescription" name="description" required maxlength="1000" rows="3">${poster.description || ""}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="posterDescriptionTamil">Description (Tamil)</label>
                    <textarea id="posterDescriptionTamil" name="descriptionTamil" maxlength="1000" rows="3">${poster.descriptionTamil || ""}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="posterImage">Image</label>
                    <input type="file" id="posterImage" name="image" accept="image/*">
                    <small>Current image: ${poster.image_path || "None"}</small>
                    ${poster.image_path ? `<br><img src="${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/uploads/posters/${poster.image_path}" alt="Current poster" style="max-width: 200px; margin-top: 10px;">` : ""}
                </div>
                
                <div class="form-group">
                    <label for="posterImageAlt">Image Alt Text</label>
                    <input type="text" id="posterImageAlt" name="imageAlt" value="${poster.imageAlt || ""}" maxlength="200">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterButtonText">Button Text</label>
                        <input type="text" id="posterButtonText" name="buttonText" value="${poster.buttonText || ""}" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="posterButtonTextTamil">Button Text (Tamil)</label>
                        <input type="text" id="posterButtonTextTamil" name="buttonTextTamil" value="${poster.buttonTextTamil || ""}" maxlength="50">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="posterButtonUrl">Button URL</label>
                    <input type="url" id="posterButtonUrl" name="link_url" value="${poster.link_url || ""}" maxlength="500">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterPriority">Display Order</label>
                        <select id="posterPriority" name="display_order">
                            ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                                <option value="${i}" ${poster.display_order === i ? "selected" : ""}>${i}${i === 1 ? " (First)" : i === 10 ? " (Last)" : i === 5 ? " (Medium)" : ""}</option>
                            `).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="posterIsActive">Status</label>
                        <select id="posterIsActive" name="is_active">
                            <option value="true" ${poster.is_active ? "selected" : ""}>Active</option>
                            <option value="false" ${!poster.is_active ? "selected" : ""}>Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterStartDate">Start Date</label>
                        <input type="datetime-local" id="posterStartDate" name="start_at" value="${poster.start_at ? new Date(poster.start_at).toISOString().slice(0, 16) : ""}">
                    </div>
                    <div class="form-group">
                        <label for="posterEndDate">End Date</label>
                        <input type="datetime-local" id="posterEndDate" name="end_at" value="${poster.end_at ? new Date(poster.end_at).toISOString().slice(0, 16) : ""}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="posterSeoTitle">SEO Title</label>
                        <input type="text" id="posterSeoTitle" name="seoTitle" value="${poster.seoTitle || ""}" maxlength="60">
                    </div>
                    <div class="form-group">
                        <label for="posterSeoDescription">SEO Description</label>
                        <input type="text" id="posterSeoDescription" name="seoDescription" value="${poster.seoDescription || ""}" maxlength="160">
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button onclick="savePoster()" class="btn btn-primary">Update Poster</button>
            <button onclick="closeModal('posterModal')" class="btn btn-secondary">Cancel</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Save poster (add or update)
async function savePoster() {
    try {
        const form = document.getElementById("posterForm");
        const formData = new FormData(form);
        const posterId = document.getElementById("posterId")?.value;
        
        const url = posterId ? `${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters/${posterId}` : `${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters`;
        const method = posterId ? "PUT" : "POST";
        
        const response = await fetch(url, {
            method: method,
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to ${posterId ? "update" : "create"} poster`);
        }

        showNotification(`Poster ${posterId ? "updated" : "created"} successfully`, "success");
        closeModal("posterModal");
        loadPostersData(); // Reload data
        
    } catch (error) {
        console.error("Error saving poster:", error);
        showNotification("Error saving poster: " + error.message, "error");
    }
}

// Toggle poster status
async function togglePosterStatus(posterId) {
    const poster = postersData.find(p => p._id === posterId);
    if (!poster) return;
    
    const action = poster.is_active ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this poster?`)) return;
    
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters/${posterId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ is_active: !poster.is_active })
        });

        if (!response.ok) {
            throw new Error("Failed to update poster status");
        }

        showNotification(`Poster ${action}d successfully`, "success");
        loadPostersData(); // Reload data
        
    } catch (error) {
        console.error("Error updating poster status:", error);
        showNotification("Error updating poster status: " + error.message, "error");
    }
}

// Delete poster
async function deletePoster(posterId) {
    if (!confirm("Are you sure you want to delete this poster? This action cannot be undone.")) return;
    
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters/${posterId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to delete poster");
        }

        showNotification("Poster deleted successfully", "success");
        loadPostersData(); // Reload data
        
    } catch (error) {
        console.error("Error deleting poster:", error);
        showNotification("Error deleting poster: " + error.message, "error");
    }
}

// View poster details
async function viewPosterDetails(posterId) {
    try {
        const response = await fetch(`/api/posters/${posterId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch poster details");
        }

        const poster = await response.json();
        showPosterDetailsModal(poster);
        
    } catch (error) {
        console.error("Error fetching poster details:", error);
        showNotification("Error fetching poster details: " + error.message, "error");
    }
}

// Show poster details modal
function showPosterDetailsModal(poster) {
    const modal = document.getElementById("posterDetailsModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Poster Details - ${poster.title}</h3>
            <button class="close-modal" onclick="closeModal('posterDetailsModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="poster-details-grid">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <p><strong>Title:</strong> ${poster.title}</p>
                    ${poster.titleTamil ? `<p><strong>Title (Tamil):</strong> ${poster.titleTamil}</p>` : ""}
                    <p><strong>Description:</strong> ${poster.description}</p>
                    ${poster.descriptionTamil ? `<p><strong>Description (Tamil):</strong> ${poster.descriptionTamil}</p>` : ""}
                </div>
                
                <div class="detail-section">
                    <h4>Image</h4>
                    ${poster.image ? `
                        <img src="${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/uploads/${poster.image}" alt="${poster.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.375rem;">
                        <p><strong>Alt Text:</strong> ${poster.imageAlt || "N/A"}</p>
                    ` : "<p>No image uploaded</p>"}
                </div>
                
                <div class="detail-section">
                    <h4>Action Button</h4>
                    <p><strong>Text:</strong> ${poster.buttonText || "N/A"}</p>
                    ${poster.buttonTextTamil ? `<p><strong>Text (Tamil):</strong> ${poster.buttonTextTamil}</p>` : ""}
                    <p><strong>URL:</strong> ${poster.buttonUrl || "N/A"}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Status & Settings</h4>
                    <p><strong>Status:</strong> 
                        <span class="status-badge ${poster.isActive ? "status-active" : "status-inactive"}">
                            ${poster.isActive ? "Active" : "Inactive"}
                        </span>
                    </p>
                    <p><strong>Priority:</strong> ${poster.priority}</p>
                    <p><strong>Start Date:</strong> ${poster.startDate ? new Date(poster.startDate).toLocaleString() : "N/A"}</p>
                    <p><strong>End Date:</strong> ${poster.endDate ? new Date(poster.endDate).toLocaleString() : "N/A"}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Analytics</h4>
                    <p><strong>Views:</strong> ${poster.viewCount || 0}</p>
                    <p><strong>Clicks:</strong> ${poster.clickCount || 0}</p>
                    <p><strong>Click Rate:</strong> ${poster.viewCount > 0 ? ((poster.clickCount / poster.viewCount) * 100).toFixed(2) + "%" : "0%"}</p>
                </div>
                
                <div class="detail-section">
                    <h4>SEO</h4>
                    <p><strong>SEO Title:</strong> ${poster.seoTitle || "N/A"}</p>
                    <p><strong>SEO Description:</strong> ${poster.seoDescription || "N/A"}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Timestamps</h4>
                    <p><strong>Created:</strong> ${new Date(poster.createdAt).toLocaleString()}</p>
                    <p><strong>Updated:</strong> ${new Date(poster.updatedAt).toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="editPoster('${poster._id}')" class="btn btn-primary">Edit Poster</button>
            <button onclick="closeModal('posterDetailsModal')" class="btn btn-secondary">Close</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Export posters to CSV
async function exportPostersCSV() {
    try {
        showLoading();
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/posters/export`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to export posters");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `posters-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification("Posters exported successfully", "success");
        
    } catch (error) {
        console.error("Error exporting posters:", error);
        showNotification("Error exporting posters: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Initialize posters management
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for search and filter
    const searchInput = document.getElementById("postersSearch");
    if (searchInput) {
        searchInput.addEventListener("input", searchPosters);
    }
    
    const statusFilter = document.getElementById("postersStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", searchPosters);
    }
    
    // Add export button event listener
    const exportBtn = document.getElementById("exportPostersBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportPostersCSV);
    }
    
    // Add new poster button event listener
    const addBtn = document.getElementById("addPosterBtn");
    if (addBtn) {
        addBtn.addEventListener("click", showAddPosterModal);
    }
});

// Make functions globally available
window.loadPostersData = loadPostersData;
window.searchPosters = searchPosters;
window.showAddPosterModal = showAddPosterModal;
window.editPoster = editPoster;
window.savePoster = savePoster;
window.togglePosterStatus = togglePosterStatus;
window.deletePoster = deletePoster;
window.viewPosterDetails = viewPosterDetails;
window.exportPostersCSV = exportPostersCSV;