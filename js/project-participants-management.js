/**
 * Project Participants Management Module
 * Handles project participants data display and management
 */

// Global variables
let participantsData = [];
let filteredParticipants = [];

// Use global API configuration
// Use window.TLS_API_BASE_URL directly to avoid const declaration conflicts

// Load project participants data
async function loadProjectParticipantsData() {
    try {
        showLoading();
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch project participants");
        }

        const data = await response.json();
        participantsData = data.participants || [];
        filteredParticipants = [...participantsData];
        
        displayParticipantsStats(data.stats);
        displayParticipantsTable();
        
    } catch (error) {
        console.error("Error loading project participants:", error);
        showNotification("Error loading project participants: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Display participants statistics
function displayParticipantsStats(stats) {
    // Statistics display removed - keeping only essential data loading
    return;
}

// Display participants table
function displayParticipantsTable() {
    const tableBody = document.getElementById("participantsTableBody");
    if (!tableBody) return;
    
    if (filteredParticipants.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No participants found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredParticipants.map(participant => `
        <tr>
            <td>${participant.name || "N/A"}</td>
            <td>${participant.email || "N/A"}</td>
            <td>${participant.projectTitle || "N/A"}</td>
            <td>
                <span class="type-badge type-${participant.projectType}">
                    ${participant.projectType ? participant.projectType.charAt(0).toUpperCase() + participant.projectType.slice(1) : "N/A"}
                </span>
            </td>
            <td>
                <span class="role-badge role-${participant.role}">
                    ${participant.role ? participant.role.charAt(0).toUpperCase() + participant.role.slice(1) : "N/A"}
                </span>
            </td>
            <td>
                <span class="status-badge status-${participant.status}">
                    ${participant.status ? participant.status.charAt(0).toUpperCase() + participant.status.slice(1) : "Unknown"}
                </span>
            </td>
            <td>${new Date(participant.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewParticipantDetails('${participant._id}')" class="btn-action btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${participant.status === "pending" ? `
                        <button onclick="approveParticipant('${participant._id}')" class="btn-action btn-success" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectParticipant('${participant._id}')" class="btn-action btn-danger" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ""}
                    <button onclick="updateParticipantStatus('${participant._id}')" class="btn-action btn-edit" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Search participants
function searchParticipants() {
    const searchTerm = document.getElementById("participantsSearch")?.value.toLowerCase() || "";
    const statusFilter = document.getElementById("participantsStatusFilter")?.value || "";
    const typeFilter = document.getElementById("participantsTypeFilter")?.value || "";
    const roleFilter = document.getElementById("participantsRoleFilter")?.value || "";
    
    filteredParticipants = participantsData.filter(participant => {
        const matchesSearch = !searchTerm || 
            (participant.name && participant.name.toLowerCase().includes(searchTerm)) ||
            (participant.email && participant.email.toLowerCase().includes(searchTerm)) ||
            (participant.projectTitle && participant.projectTitle.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || participant.status === statusFilter;
        const matchesType = !typeFilter || participant.projectType === typeFilter;
        const matchesRole = !roleFilter || participant.role === roleFilter;
        
        return matchesSearch && matchesStatus && matchesType && matchesRole;
    });
    
    displayParticipantsTable();
}

// View participant details
async function viewParticipantDetails(participantId) {
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants/${participantId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch participant details");
        }

        const participant = await response.json();
        showParticipantDetailsModal(participant);
        
    } catch (error) {
        console.error("Error fetching participant details:", error);
        showNotification("Error fetching participant details: " + error.message, "error");
    }
}

// Show participant details modal
function showParticipantDetailsModal(participant) {
    const modal = document.getElementById("participantDetailsModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    
    // Generate form data display
    let formDataHtml = "";
    if (participant.formData && Object.keys(participant.formData).length > 0) {
        formDataHtml = `
            <div class="detail-section">
                <h4>Form Responses</h4>
                ${Object.entries(participant.formData).map(([key, value]) => `
                    <p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>
                `).join("")}
            </div>
        `;
    }
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Participant Details - ${participant.name}</h3>
            <button class="close-modal" onclick="closeModal('participantDetailsModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="participant-details-grid">
                <div class="detail-section">
                    <h4>Personal Information</h4>
                    <p><strong>Name:</strong> ${participant.name}</p>
                    <p><strong>Email:</strong> ${participant.email}</p>
                    <p><strong>Phone:</strong> ${participant.phone || "N/A"}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Project Information</h4>
                    <p><strong>Project:</strong> ${participant.projectTitle}</p>
                    <p><strong>Type:</strong> 
                        <span class="type-badge type-${participant.projectType}">${participant.projectType}</span>
                    </p>
                    <p><strong>Role:</strong> 
                        <span class="role-badge role-${participant.role}">${participant.role}</span>
                    </p>
                </div>
                
                <div class="detail-section">
                    <h4>Status Information</h4>
                    <p><strong>Status:</strong> 
                        <span class="status-badge status-${participant.status}">${participant.status}</span>
                    </p>
                    <p><strong>Applied:</strong> ${new Date(participant.createdAt).toLocaleString()}</p>
                    ${participant.approvedAt ? `<p><strong>Approved:</strong> ${new Date(participant.approvedAt).toLocaleString()}</p>` : ""}
                    ${participant.completedAt ? `<p><strong>Completed:</strong> ${new Date(participant.completedAt).toLocaleString()}</p>` : ""}
                </div>
                
                ${formDataHtml}
                
                ${participant.adminNotes ? `
                <div class="detail-section">
                    <h4>Admin Notes</h4>
                    <p>${participant.adminNotes}</p>
                </div>
                ` : ""}
            </div>
        </div>
        <div class="modal-footer">
            ${participant.status === "pending" ? `
                <button onclick="approveParticipant('${participant._id}')" class="btn btn-success">Approve</button>
                <button onclick="rejectParticipant('${participant._id}')" class="btn btn-danger">Reject</button>
            ` : ""}
            <button onclick="updateParticipantStatus('${participant._id}')" class="btn btn-primary">Update Status</button>
            <button onclick="closeModal('participantDetailsModal')" class="btn btn-secondary">Close</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Approve participant
async function approveParticipant(participantId) {
    if (!confirm("Are you sure you want to approve this participant?")) return;
    
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants/${participantId}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to approve participant");
        }

        showNotification("Participant approved successfully", "success");
        loadProjectParticipantsData(); // Reload data
        
    } catch (error) {
        console.error("Error approving participant:", error);
        showNotification("Error approving participant: " + error.message, "error");
    }
}

// Reject participant
async function rejectParticipant(participantId) {
    const reason = prompt("Please provide a reason for rejection (optional):");
    if (reason === null) return; // User cancelled
    
    try {
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants/${participantId}/reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            throw new Error("Failed to reject participant");
        }

        showNotification("Participant rejected successfully", "success");
        loadProjectParticipantsData(); // Reload data
        
    } catch (error) {
        console.error("Error rejecting participant:", error);
        showNotification("Error rejecting participant: " + error.message, "error");
    }
}

// Update participant status
async function updateParticipantStatus(participantId) {
    const participant = participantsData.find(p => p._id === participantId);
    if (!participant) return;
    
    const modal = document.getElementById("updateParticipantStatusModal");
    if (!modal) return;
    
    const modalContent = modal.querySelector(".modal-content");
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Update Participant Status</h3>
            <button class="close-modal" onclick="closeModal('updateParticipantStatusModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="updateParticipantStatusForm" class="blue-gradient-form">
                <div class="form-group">
                    <label for="participantStatus">Status:</label>
                    <select id="participantStatus" name="status" required>
                        <option value="pending" ${participant.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="approved" ${participant.status === "approved" ? "selected" : ""}>Approved</option>
                        <option value="rejected" ${participant.status === "rejected" ? "selected" : ""}>Rejected</option>
                        <option value="active" ${participant.status === "active" ? "selected" : ""}>Active</option>
                        <option value="completed" ${participant.status === "completed" ? "selected" : ""}>Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="participantRole">Role:</label>
                    <select id="participantRole" name="role" required>
                        <option value="participant" ${participant.role === "participant" ? "selected" : ""}>Participant</option>
                        <option value="volunteer" ${participant.role === "volunteer" ? "selected" : ""}>Volunteer</option>
                        <option value="crew" ${participant.role === "crew" ? "selected" : ""}>Crew</option>
                        <option value="coordinator" ${participant.role === "coordinator" ? "selected" : ""}>Coordinator</option>
                        <option value="leader" ${participant.role === "leader" ? "selected" : ""}>Leader</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="participantAdminNotes">Admin Notes:</label>
                    <textarea id="participantAdminNotes" name="adminNotes" rows="3">${participant.adminNotes || ""}</textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button onclick="saveParticipantStatus('${participantId}')" class="btn btn-primary">Update Status</button>
            <button onclick="closeModal('updateParticipantStatusModal')" class="btn btn-secondary">Cancel</button>
        </div>
    `;
    
    modal.style.display = "block";
}

// Save participant status
async function saveParticipantStatus(participantId) {
    try {
        const form = document.getElementById("updateParticipantStatusForm");
        const formData = new FormData(form);
        
        const updateData = {
            status: formData.get("status"),
            role: formData.get("role"),
            adminNotes: formData.get("adminNotes")
        };
        
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants/${participantId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error("Failed to update participant status");
        }

        showNotification("Participant status updated successfully", "success");
        closeModal("updateParticipantStatusModal");
        loadProjectParticipantsData(); // Reload data
        
    } catch (error) {
        console.error("Error updating participant status:", error);
        showNotification("Error updating participant status: " + error.message, "error");
    }
}

// Export participants to CSV
async function exportParticipantsCSV() {
    try {
        showLoading();
        const response = await fetch(`${window.TLS_API_BASE_URL || "http://127.0.0.1:8080"}/api/project-participants/export`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to export participants");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `project-participants-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification("Participants exported successfully", "success");
        
    } catch (error) {
        console.error("Error exporting participants:", error);
        showNotification("Error exporting participants: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

// Initialize participants management
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for search and filter
    const searchInput = document.getElementById("participantsSearch");
    if (searchInput) {
        searchInput.addEventListener("input", searchParticipants);
    }
    
    const statusFilter = document.getElementById("participantsStatusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", searchParticipants);
    }
    
    const typeFilter = document.getElementById("participantsTypeFilter");
    if (typeFilter) {
        typeFilter.addEventListener("change", searchParticipants);
    }
    
    const roleFilter = document.getElementById("participantsRoleFilter");
    if (roleFilter) {
        roleFilter.addEventListener("change", searchParticipants);
    }
    
    // Add export button event listener
    const exportBtn = document.getElementById("exportParticipantsBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportParticipantsCSV);
    }
});

// Make functions globally available
window.loadProjectParticipantsData = loadProjectParticipantsData;
window.searchParticipants = searchParticipants;
window.viewParticipantDetails = viewParticipantDetails;
window.approveParticipant = approveParticipant;
window.rejectParticipant = rejectParticipant;
window.updateParticipantStatus = updateParticipantStatus;
window.saveParticipantStatus = saveParticipantStatus;
window.exportParticipantsCSV = exportParticipantsCSV;