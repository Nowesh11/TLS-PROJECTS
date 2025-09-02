// Team Management Functions for Admin Panel

/**
 * Team Management Module
 * Handles team member CRUD operations for the new TeamMember model
 */

// Global variables
let currentTeamMembers = [];
let currentEditingMember = null;

/**
 * Initialize team management
 */
function initTeamManagement() {
    loadTeamMembers();
}

/**
 * Load team members data from new API
 */
async function loadTeamMembers() {
    try {
        showLoadingState();
        const response = await apiCall("/api/team-members");
        const teamMembers = response.data || response;
        
        currentTeamMembers = teamMembers;
        renderTeamMembersTable(teamMembers);
        renderTeamMembersCards(teamMembers);
        
    } catch (error) {
        console.error("Error loading team members:", error);
        showErrorState("Error loading team members");
    }
}

/**
 * Render team members table for desktop view
 */
function renderTeamMembersTable(teamMembers) {
    const tbody = document.getElementById("teamTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (!teamMembers || teamMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No team members found</td></tr>`;
        return;
    }
    
    teamMembers.forEach(member => {
        const row = document.createElement("tr");
        
        // Construct image URL
        const imageSrc = getTeamMemberImageUrl(member.image_path);
        
        row.innerHTML = `
            <td style="padding: 1rem;">
                <img src="${imageSrc}" 
                     alt="${member.name_en}" 
                     onerror="this.src='/assets/default-avatar.jpg'"
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-secondary);">
            </td>
            <td style="padding: 1rem;">
                <div style="font-weight: 600; color: var(--text-primary);">${member.name_en}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">${member.email || ''}</div>
            </td>
            <td style="padding: 1rem;">
                <div style="font-family: 'Noto Sans Tamil', var(--font-tamil), sans-serif; font-weight: 600;">${member.name_ta}</div>
            </td>
            <td style="padding: 1rem;">
                <span class="badge badge-${member.role.toLowerCase()}">${getRoleDisplayName(member.role)}</span>
            </td>
            <td style="padding: 1rem;">${member.email || '-'}</td>
            <td style="padding: 1rem;">
                <label class="switch">
                    <input type="checkbox" ${member.is_active ? 'checked' : ''} onchange="toggleTeamMemberStatus('${member._id}', this.checked)">
                    <span class="slider"></span>
                </label>
            </td>
            <td style="padding: 1rem;">${member.order_num}</td>
            <td style="padding: 1rem;">
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewTeamMember('${member._id}')" class="btn btn-sm btn-info" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editTeamMember('${member._id}')" class="btn btn-sm btn-primary" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTeamMember('${member._id}')" class="btn btn-sm btn-danger" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Render team members cards for mobile view
 */
function renderTeamMembersCards(teamMembers) {
    const container = document.getElementById("teamCardsContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!teamMembers || teamMembers.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No team members found</div>`;
        return;
    }
    
    teamMembers.forEach(member => {
        const card = document.createElement("div");
        card.className = "team-member-card";
        
        const imageSrc = getTeamMemberImageUrl(member.image_path);
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${imageSrc}" 
                     alt="${member.name_en}" 
                     onerror="this.src='/assets/default-avatar.jpg'">
            </div>
            <div class="card-content">
                <h4>${member.name_en}</h4>
                <p class="role">${getRoleDisplayName(member.role)}</p>
                <p class="email">${member.email || ''}</p>
                <div class="status ${member.is_active ? 'active' : 'inactive'}">
                    ${member.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div class="card-actions">
                <button onclick="viewTeamMember('${member._id}')" class="btn btn-sm btn-info">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editTeamMember('${member._id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTeamMember('${member._id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Get team member image URL
 */
function getTeamMemberImageUrl(imagePath) {
    if (!imagePath) return '/assets/default-avatar.jpg';
    
    if (imagePath.startsWith('http')) {
        return imagePath;
    } else if (imagePath.startsWith('/assets/')) {
        return imagePath;
    } else {
        return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/uploads/team_members/${imagePath}`;
    }
}

/**
 * Get role display name
 */
function getRoleDisplayName(role) {
    const displayNames = {
        'PRESIDENT': 'President',
        'VICE_PRESIDENT': 'Vice President',
        'SECRETARY': 'Secretary',
        'TREASURER': 'Treasurer',
        'DIRECTOR': 'Director',
        'MANAGER': 'Manager',
        'COORDINATOR': 'Coordinator',
        'ADVISOR': 'Advisor',
        'MEMBER': 'Member'
    };
    return displayNames[role] || role;
}

/**
 * Open team member modal for creating new member
 */
function openTeamMemberModal() {
    currentEditingMember = null;
    document.getElementById('teamMemberModalTitle').textContent = 'Add New Team Member';
    clearTeamMemberForm();
    openModal('teamMember');
}

/**
 * View team member details
 */
async function viewTeamMember(memberId) {
    try {
        const response = await apiCall(`/api/team-members/${memberId}`);
        const member = response.data || response;
        
        // Show member details in a view-only modal or expand card
        showTeamMemberDetails(member);
        
    } catch (error) {
        console.error('Error loading team member:', error);
        showNotification('Error loading team member details', 'error');
    }
}

/**
 * Edit team member
 */
async function editTeamMember(memberId) {
    try {
        const response = await apiCall(`/api/team-members/${memberId}`);
        const member = response.data || response;
        
        currentEditingMember = member;
        document.getElementById('teamMemberModalTitle').textContent = 'Edit Team Member';
        populateTeamMemberForm(member);
        openModal('teamMember');
        
    } catch (error) {
        console.error('Error loading team member for edit:', error);
        showNotification('Error loading team member', 'error');
    }
}

/**
 * Delete team member
 */
async function deleteTeamMember(memberId) {
    const member = currentTeamMembers.find(m => m._id === memberId);
    if (!member) return;
    
    const confirmed = await showConfirmDialog(
        'Delete Team Member',
        `Are you sure you want to delete ${member.name_en}? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
        await apiCall(`/api/team-members/${memberId}`, 'DELETE');
        showNotification('Team member deleted successfully', 'success');
        loadTeamMembers(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting team member:', error);
        showNotification('Error deleting team member', 'error');
    }
}

/**
 * Toggle team member active status
 */
async function toggleTeamMemberStatus(memberId, isActive) {
    try {
        await apiCall(`/api/team-members/${memberId}`, 'PUT', {
            is_active: isActive
        });
        
        showNotification(`Team member ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        
        // Update local data
        const member = currentTeamMembers.find(m => m._id === memberId);
        if (member) {
            member.is_active = isActive;
        }
        
    } catch (error) {
        console.error('Error updating team member status:', error);
        showNotification('Error updating team member status', 'error');
        
        // Revert the toggle
        const checkbox = event.target;
        checkbox.checked = !isActive;
    }
}

/**
 * Save team member (create or update)
 */
async function saveTeamMember(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Handle social links
    const socialLinks = {};
    const platforms = form.querySelectorAll('select[name="social_platform[]"]');
    const urls = form.querySelectorAll('input[name="social_url[]"]');
    
    platforms.forEach((platform, index) => {
        if (platform.value && urls[index] && urls[index].value) {
            socialLinks[platform.value] = urls[index].value;
        }
    });
    
    if (Object.keys(socialLinks).length > 0) {
        formData.set('social_links', JSON.stringify(socialLinks));
    }
    
    // Remove individual social link fields
    formData.delete('social_platform[]');
    formData.delete('social_url[]');
    
    try {
        let response;
        if (currentEditingMember) {
            // Update existing member
            response = await apiCall(`/api/team-members/${currentEditingMember._id}`, 'PUT', formData);
            showNotification('Team member updated successfully', 'success');
        } else {
            // Create new member
            response = await apiCall('/api/team-members', 'POST', formData);
            showNotification('Team member created successfully', 'success');
        }
        
        closeModal('teamMember');
        loadTeamMembers(); // Refresh the list
        
    } catch (error) {
        console.error('Error saving team member:', error);
        showNotification('Error saving team member', 'error');
    }
}

/**
 * Clear team member form
 */
function clearTeamMemberForm() {
    const form = document.getElementById('teamMemberForm');
    if (form) {
        form.reset();
        
        // Clear image preview
        const preview = document.getElementById('team-member-image-preview');
        if (preview) {
            preview.innerHTML = '';
        }
        
        // Reset social links to one empty row
        resetSocialLinks();
    }
}

/**
 * Populate team member form with existing data
 */
function populateTeamMemberForm(member) {
    const form = document.getElementById('teamMemberForm');
    if (!form) return;
    
    // Populate basic fields
    form.name_en.value = member.name_en || '';
    form.name_ta.value = member.name_ta || '';
    form.role.value = member.role || '';
    form.email.value = member.email || '';
    form.phone.value = member.phone || '';
    form.order_num.value = member.order_num || 1;
    form.bio_en.value = member.bio_en || '';
    form.bio_ta.value = member.bio_ta || '';
    form.is_active.checked = member.is_active !== false;
    
    // Show current image if exists
    if (member.image_path) {
        const preview = document.getElementById('team-member-image-preview');
        if (preview) {
            const imageSrc = getTeamMemberImageUrl(member.image_path);
            preview.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${imageSrc}" alt="Current image" style="width: 100px; height: 100px; border-radius: 8px; object-fit: cover; border: 2px solid var(--border-secondary);">
                    <span style="position: absolute; top: -8px; right: -8px; background: var(--success-color); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
            `;
        }
    }
    
    // Populate social links
    populateSocialLinks(member.social_links || {});
}

/**
 * Handle team member image selection
 */
function handleTeamMemberImageSelection(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('team-member-image-preview');
    
    if (!preview) return;
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            event.target.value = '';
            return;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size must be less than 5MB', 'error');
            event.target.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${e.target.result}" alt="Preview" style="width: 100px; height: 100px; border-radius: 8px; object-fit: cover; border: 2px solid var(--primary-color);">
                    <span style="position: absolute; top: -8px; right: -8px; background: var(--primary-color); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                        <i class="fas fa-image"></i>
                    </span>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

/**
 * Add social link row
 */
function addSocialLink() {
    const container = document.getElementById('socialLinksContainer');
    if (!container) return;
    
    const newRow = document.createElement('div');
    newRow.className = 'social-link-row';
    newRow.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: end;';
    
    newRow.innerHTML = `
        <div style="width: 120px;">
            <select name="social_platform[]" class="form-select">
                <option value="">Platform</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="website">Website</option>
            </select>
        </div>
        <div style="flex: 1;">
            <input type="url" name="social_url[]" class="form-input" placeholder="Enter URL">
        </div>
        <button type="button" onclick="removeSocialLink(this)" class="btn btn-danger" style="width: 40px; height: 40px; padding: 0;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(newRow);
}

/**
 * Remove social link row
 */
function removeSocialLink(button) {
    const row = button.closest('.social-link-row');
    if (row) {
        row.remove();
    }
}

/**
 * Reset social links to one empty row
 */
function resetSocialLinks() {
    const container = document.getElementById('socialLinksContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="social-link-row" style="display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: end;">
            <div style="width: 120px;">
                <select name="social_platform[]" class="form-select">
                    <option value="">Platform</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="website">Website</option>
                </select>
            </div>
            <div style="flex: 1;">
                <input type="url" name="social_url[]" class="form-input" placeholder="Enter URL">
            </div>
            <button type="button" onclick="removeSocialLink(this)" class="btn btn-danger" style="width: 40px; height: 40px; padding: 0;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

/**
 * Populate social links from data
 */
function populateSocialLinks(socialLinks) {
    const container = document.getElementById('socialLinksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (Object.keys(socialLinks).length === 0) {
        resetSocialLinks();
        return;
    }
    
    Object.entries(socialLinks).forEach(([platform, url]) => {
        const row = document.createElement('div');
        row.className = 'social-link-row';
        row.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: end;';
        
        row.innerHTML = `
            <div style="width: 120px;">
                <select name="social_platform[]" class="form-select">
                    <option value="">Platform</option>
                    <option value="facebook" ${platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="twitter" ${platform === 'twitter' ? 'selected' : ''}>Twitter</option>
                    <option value="linkedin" ${platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                    <option value="instagram" ${platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="youtube" ${platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="website" ${platform === 'website' ? 'selected' : ''}>Website</option>
                </select>
            </div>
            <div style="flex: 1;">
                <input type="url" name="social_url[]" class="form-input" placeholder="Enter URL" value="${url}">
            </div>
            <button type="button" onclick="removeSocialLink(this)" class="btn btn-danger" style="width: 40px; height: 40px; padding: 0;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(row);
    });
    
    // Add one empty row at the end
    addSocialLink();
}

/**
 * Filter team members
 */
function filterTeamMembers() {
    const searchTerm = document.getElementById('teamSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('teamRoleFilter')?.value || '';
    const statusFilter = document.getElementById('teamStatusFilter')?.value || '';
    
    let filteredMembers = currentTeamMembers.filter(member => {
        const matchesSearch = !searchTerm || 
            member.name_en.toLowerCase().includes(searchTerm) ||
            member.name_ta.toLowerCase().includes(searchTerm) ||
            (member.email && member.email.toLowerCase().includes(searchTerm));
            
        const matchesRole = !roleFilter || member.role === roleFilter;
        const matchesStatus = !statusFilter || 
            (statusFilter === 'active' && member.is_active) ||
            (statusFilter === 'inactive' && !member.is_active);
            
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    renderTeamMembersTable(filteredMembers);
    renderTeamMembersCards(filteredMembers);
}

/**
 * Sort team members table
 */
function sortTeamMembers(field) {
    const currentSort = document.querySelector(`[data-sort="${field}"]`)?.dataset.direction || 'asc';
    const newDirection = currentSort === 'asc' ? 'desc' : 'asc';
    
    // Update sort indicators
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.dataset.direction = 'asc';
        header.querySelector('i')?.classList.remove('fa-sort-up', 'fa-sort-down');
        header.querySelector('i')?.classList.add('fa-sort');
    });
    
    const currentHeader = document.querySelector(`[data-sort="${field}"]`);
    if (currentHeader) {
        currentHeader.dataset.direction = newDirection;
        const icon = currentHeader.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-sort');
            icon.classList.add(newDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        }
    }
    
    // Sort the data
    currentTeamMembers.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (newDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Re-render with current filters
    filterTeamMembers();
}

/**
 * Export team members to CSV
 */
function exportToCSV(type) {
    if (type !== 'team-members') return;
    
    const headers = ['Name (EN)', 'Name (TA)', 'Role', 'Email', 'Phone', 'Active', 'Order'];
    const csvContent = [headers.join(',')];
    
    currentTeamMembers.forEach(member => {
        const row = [
            `"${member.name_en || ''}"`
            ,`"${member.name_ta || ''}"`
            ,`"${getRoleDisplayName(member.role)}"`
            ,`"${member.email || ''}"`
            ,`"${member.phone || ''}"`
            ,member.is_active ? 'Yes' : 'No'
            ,member.order_num || 0
        ];
        csvContent.push(row.join(','));
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Show loading state
 */
function showLoadingState() {
    const tbody = document.getElementById('teamTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading team members...</td></tr>`;
    }
}

/**
 * Show error state
 */
function showErrorState(message) {
    const tbody = document.getElementById('teamTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-danger);">${message}</td></tr>`;
    }
}

/**
 * Show team member details (for view functionality)
 */
function showTeamMemberDetails(member) {
    // This could open a detailed view modal or expand the card
    // For now, we'll use a simple alert, but this should be enhanced
    const details = `
        Name: ${member.name_en} (${member.name_ta})
        Role: ${getRoleDisplayName(member.role)}
        Email: ${member.email || 'N/A'}
        Phone: ${member.phone || 'N/A'}
        Status: ${member.is_active ? 'Active' : 'Inactive'}
        Bio (EN): ${member.bio_en || 'N/A'}
        Bio (TA): ${member.bio_ta || 'N/A'}
    `;
    
    alert(details); // Replace with proper modal
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamManagement);
} else {
    initTeamManagement();
}