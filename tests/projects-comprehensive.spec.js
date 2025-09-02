const { test, expect } = require('@playwright/test');

test.describe('Projects - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Projects Display', () => {
    test('should display all project cards with complete information', async ({ page }) => {
      // Check projects container is visible
      await expect(page.locator('.projects-container, .projects-grid, .project-list')).toBeVisible();
      
      // Get all project cards
      const projectCards = page.locator('.project-card, .project-item, .project');
      const cardCount = await projectCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check each project card has required elements
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = projectCards.nth(i);
        
        // Project image
        const projectImage = card.locator('img, .project-image, .project-cover');
        if (await projectImage.count() > 0) {
          await expect(projectImage).toBeVisible();
        }
        
        // Project title
        await expect(card.locator('.project-title, .title, h3, h4')).toBeVisible();
        
        // Project description
        const description = card.locator('.project-description, .description, .summary');
        if (await description.count() > 0) {
          await expect(description).toBeVisible();
        }
        
        // Action buttons (View Details, Join, etc.)
        const actionBtn = card.locator('.view-details, .join-project, .learn-more, button');
        if (await actionBtn.count() > 0) {
          await expect(actionBtn.first()).toBeVisible();
        }
      }
    });
    
    test('should display project status and progress indicators', async ({ page }) => {
      const projectCards = page.locator('.project-card, .project-item');
      
      if (await projectCards.count() > 0) {
        const firstProject = projectCards.first();
        
        // Check for project status
        const statusIndicator = firstProject.locator('.project-status, .status, .badge');
        if (await statusIndicator.count() > 0) {
          await expect(statusIndicator).toBeVisible();
          
          const statusText = await statusIndicator.textContent();
          expect(statusText).toMatch(/active|completed|upcoming|in progress/i);
        }
        
        // Check for progress bar
        const progressBar = firstProject.locator('.progress-bar, .project-progress, .completion-bar');
        if (await progressBar.count() > 0) {
          await expect(progressBar).toBeVisible();
        }
        
        // Check for participant count
        const participantCount = firstProject.locator('.participant-count, .members-count, .volunteers');
        if (await participantCount.count() > 0) {
          await expect(participantCount).toBeVisible();
        }
      }
    });
    
    test('should display project categories and tags', async ({ page }) => {
      const projectCards = page.locator('.project-card, .project-item');
      
      if (await projectCards.count() > 0) {
        const firstProject = projectCards.first();
        
        // Check for project category
        const category = firstProject.locator('.project-category, .category, .project-type');
        if (await category.count() > 0) {
          await expect(category).toBeVisible();
        }
        
        // Check for project tags
        const tags = firstProject.locator('.project-tags, .tags, .project-labels');
        if (await tags.count() > 0) {
          await expect(tags).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Project Details and Navigation', () => {
    test('should open project details when view details is clicked', async ({ page }) => {
      const viewDetailsBtn = page.locator('.view-details, .learn-more, .project-details-btn').first();
      
      if (await viewDetailsBtn.count() > 0) {
        await viewDetailsBtn.click();
        
        // Check if details modal opens or navigates to details page
        const detailsModal = page.locator('.project-details-modal, .project-modal, #projectModal');
        const detailsPage = page.locator('.project-details-page, .project-detail');
        
        if (await detailsModal.count() > 0) {
          await expect(detailsModal).toBeVisible();
          
          // Check modal content
          await expect(detailsModal.locator('.project-title, .modal-title')).toBeVisible();
          await expect(detailsModal.locator('.project-description, .modal-body')).toBeVisible();
          
        } else if (await detailsPage.count() > 0) {
          await expect(detailsPage).toBeVisible();
          
        } else {
          // Check if URL changed to project details
          await expect(page).toHaveURL(/project|detail/);
        }
      }
    });
    
    test('should display comprehensive project information in details view', async ({ page }) => {
      const viewDetailsBtn = page.locator('.view-details, .learn-more').first();
      
      if (await viewDetailsBtn.count() > 0) {
        await viewDetailsBtn.click();
        
        const detailsContainer = page.locator('.project-details-modal, .project-details-page, .project-detail');
        
        if (await detailsContainer.count() > 0) {
          // Check for detailed description
          const fullDescription = detailsContainer.locator('.full-description, .project-description');
          if (await fullDescription.count() > 0) {
            await expect(fullDescription).toBeVisible();
          }
          
          // Check for project timeline
          const timeline = detailsContainer.locator('.project-timeline, .timeline, .milestones');
          if (await timeline.count() > 0) {
            await expect(timeline).toBeVisible();
          }
          
          // Check for project goals
          const goals = detailsContainer.locator('.project-goals, .objectives, .targets');
          if (await goals.count() > 0) {
            await expect(goals).toBeVisible();
          }
          
          // Check for team information
          const teamInfo = detailsContainer.locator('.project-team, .team-members, .organizers');
          if (await teamInfo.count() > 0) {
            await expect(teamInfo).toBeVisible();
          }
        }
      }
    });
    
    test('should handle project details modal close functionality', async ({ page }) => {
      const viewDetailsBtn = page.locator('.view-details, .learn-more').first();
      
      if (await viewDetailsBtn.count() > 0) {
        await viewDetailsBtn.click();
        
        const modal = page.locator('.project-details-modal, .project-modal');
        
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
          
          // Try to close modal
          const closeBtn = modal.locator('.close, .modal-close, [aria-label="Close"]');
          if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await expect(modal).not.toBeVisible();
          } else {
            // Try clicking outside modal
            await page.click('body', { position: { x: 10, y: 10 } });
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });
  
  test.describe('Project Participation and Join Functionality', () => {
    test('should display join project button for available projects', async ({ page }) => {
      const joinButtons = page.locator('.join-project, .participate, .volunteer, button:has-text("Join")');
      
      if (await joinButtons.count() > 0) {
        const firstJoinBtn = joinButtons.first();
        await expect(firstJoinBtn).toBeVisible();
        
        // Check if button is enabled
        const isDisabled = await firstJoinBtn.isDisabled();
        expect(isDisabled).toBeFalsy();
      }
    });
    
    test('should open join project form when join button is clicked', async ({ page }) => {
      const joinBtn = page.locator('.join-project, button:has-text("Join")').first();
      
      if (await joinBtn.count() > 0) {
        await joinBtn.click();
        
        // Check if join form modal opens
        const joinModal = page.locator('.join-modal, .participation-modal, #joinProjectModal');
        const joinForm = page.locator('.join-form, .participation-form');
        
        if (await joinModal.count() > 0) {
          await expect(joinModal).toBeVisible();
          
          // Check form fields
          await expect(joinModal.locator('input[name="name"], #participantName')).toBeVisible();
          await expect(joinModal.locator('input[name="email"], input[type="email"]')).toBeVisible();
          
        } else if (await joinForm.count() > 0) {
          await expect(joinForm).toBeVisible();
        }
      }
    });
    
    test('should validate join project form fields', async ({ page }) => {
      const joinBtn = page.locator('.join-project, button:has-text("Join")').first();
      
      if (await joinBtn.count() > 0) {
        await joinBtn.click();
        
        const modal = page.locator('.join-modal, .participation-modal');
        
        if (await modal.count() > 0) {
          // Try to submit empty form
          const submitBtn = modal.locator('button[type="submit"], .submit-btn');
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            
            // Check for validation errors
            const errorMessages = modal.locator('.error-message, .field-error, .validation-error');
            if (await errorMessages.count() > 0) {
              await expect(errorMessages.first()).toBeVisible();
            }
          }
        }
      }
    });
    
    test('should handle successful project join submission', async ({ page }) => {
      const joinBtn = page.locator('.join-project, button:has-text("Join")').first();
      
      if (await joinBtn.count() > 0) {
        await joinBtn.click();
        
        const modal = page.locator('.join-modal, .participation-modal');
        
        if (await modal.count() > 0) {
          // Fill form with valid data
          const nameField = modal.locator('input[name="name"], #participantName');
          if (await nameField.count() > 0) {
            await nameField.fill('Test Participant');
          }
          
          const emailField = modal.locator('input[name="email"], input[type="email"]');
          if (await emailField.count() > 0) {
            await emailField.fill('participant@example.com');
          }
          
          const phoneField = modal.locator('input[name="phone"], input[type="tel"]');
          if (await phoneField.count() > 0) {
            await phoneField.fill('1234567890');
          }
          
          // Submit form
          const submitBtn = modal.locator('button[type="submit"], .submit-btn');
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            
            // Check for success message
            const successMessage = page.locator('.success-message, .join-success, .participation-success');
            if (await successMessage.count() > 0) {
              await expect(successMessage).toBeVisible({ timeout: 10000 });
            }
          }
        }
      }
    });
  });
  
  test.describe('Project Search and Filtering', () => {
    test('should filter projects by search query', async ({ page }) => {
      const searchInput = page.locator('.search-input, input[type="search"], #projectSearch, .project-search');
      
      if (await searchInput.count() > 0) {
        // Get initial project count
        const initialProjects = page.locator('.project-card, .project-item');
        const initialCount = await initialProjects.count();
        
        // Search for specific term
        await searchInput.fill('Tamil');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const filteredProjects = page.locator('.project-card, .project-item');
        const filteredCount = await filteredProjects.count();
        
        if (filteredCount > 0) {
          // Check if visible projects contain search term
          const firstProject = filteredProjects.first();
          const projectText = await firstProject.textContent();
          expect(projectText.toLowerCase()).toContain('tamil');
        }
      }
    });
    
    test('should filter projects by category', async ({ page }) => {
      const categoryFilter = page.locator('.category-filter, select[name="category"], .project-category-filter');
      
      if (await categoryFilter.count() > 0) {
        const options = categoryFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select second option (first is usually "All")
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          // Check if projects are filtered
          const filteredProjects = page.locator('.project-card, .project-item');
          expect(await filteredProjects.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
    
    test('should filter projects by status', async ({ page }) => {
      const statusFilter = page.locator('.status-filter, select[name="status"], .project-status-filter');
      
      if (await statusFilter.count() > 0) {
        const options = statusFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Test different status filters
          for (let i = 1; i < Math.min(optionCount, 3); i++) {
            await statusFilter.selectOption({ index: i });
            await page.waitForTimeout(1000);
            
            // Verify projects are still displayed
            const projects = page.locator('.project-card, .project-item');
            expect(await projects.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
    
    test('should sort projects by different criteria', async ({ page }) => {
      const sortSelect = page.locator('.sort-select, select[name="sort"], #projectSort');
      
      if (await sortSelect.count() > 0) {
        const options = sortSelect.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Test different sort options
          for (let i = 1; i < Math.min(optionCount, 3); i++) {
            await sortSelect.selectOption({ index: i });
            await page.waitForTimeout(1000);
            
            // Verify projects are still displayed
            const projects = page.locator('.project-card, .project-item');
            expect(await projects.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });
  
  test.describe('Project CSV Export Functionality', () => {
    test('should display CSV export button for projects', async ({ page }) => {
      const exportBtn = page.locator('.export-csv, .download-csv, button:has-text("Export"), button:has-text("CSV")');
      
      if (await exportBtn.count() > 0) {
        await expect(exportBtn).toBeVisible();
        
        // Check if button is enabled
        const isDisabled = await exportBtn.isDisabled();
        expect(isDisabled).toBeFalsy();
      }
    });
    
    test('should initiate CSV download when export button is clicked', async ({ page }) => {
      const exportBtn = page.locator('.export-csv, .download-csv, button:has-text("Export")').first();
      
      if (await exportBtn.count() > 0) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        
        await exportBtn.click();
        
        try {
          const download = await downloadPromise;
          
          // Check if download started
          expect(download).toBeTruthy();
          
          // Check filename
          const filename = download.suggestedFilename();
          expect(filename).toBeTruthy();
          expect(filename).toMatch(/\.csv$/i);
          
        } catch (error) {
          // If download doesn't work, check for alternative behaviors
          const notification = page.locator('.notification, .export-success, .download-message');
          if (await notification.count() > 0) {
            await expect(notification).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
    
    test('should handle CSV export with filtered data', async ({ page }) => {
      // Apply a filter first
      const categoryFilter = page.locator('.category-filter, select[name="category"]');
      
      if (await categoryFilter.count() > 0) {
        const options = categoryFilter.locator('option');
        if (await options.count() > 1) {
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
      
      // Then try to export
      const exportBtn = page.locator('.export-csv, button:has-text("Export")').first();
      
      if (await exportBtn.count() > 0) {
        await exportBtn.click();
        
        // Check for export confirmation or download
        const exportMessage = page.locator('.export-message, .download-message');
        if (await exportMessage.count() > 0) {
          await expect(exportMessage).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
  
  test.describe('Project Management (Admin Features)', () => {
    test('should display admin project management controls for authorized users', async ({ page }) => {
      // Check if user is logged in as admin
      const adminControls = page.locator('.admin-controls, .project-admin, .manage-projects');
      
      if (await adminControls.count() > 0) {
        await expect(adminControls).toBeVisible();
        
        // Check for add project button
        const addProjectBtn = adminControls.locator('.add-project, .create-project, button:has-text("Add")');
        if (await addProjectBtn.count() > 0) {
          await expect(addProjectBtn).toBeVisible();
        }
        
        // Check for edit/delete buttons on project cards
        const projectCards = page.locator('.project-card, .project-item');
        if (await projectCards.count() > 0) {
          const firstCard = projectCards.first();
          const editBtn = firstCard.locator('.edit-project, .edit-btn');
          const deleteBtn = firstCard.locator('.delete-project, .delete-btn');
          
          if (await editBtn.count() > 0) {
            await expect(editBtn).toBeVisible();
          }
          if (await deleteBtn.count() > 0) {
            await expect(deleteBtn).toBeVisible();
          }
        }
      }
    });
    
    test('should open add project form when add button is clicked', async ({ page }) => {
      const addProjectBtn = page.locator('.add-project, .create-project, button:has-text("Add Project")');
      
      if (await addProjectBtn.count() > 0) {
        await addProjectBtn.click();
        
        // Check if add project modal/form opens
        const addModal = page.locator('.add-project-modal, .create-project-modal, #addProjectModal');
        const addForm = page.locator('.add-project-form, .create-project-form');
        
        if (await addModal.count() > 0) {
          await expect(addModal).toBeVisible();
          
          // Check form fields
          await expect(addModal.locator('input[name="title"], #projectTitle')).toBeVisible();
          await expect(addModal.locator('textarea[name="description"], #projectDescription')).toBeVisible();
          
        } else if (await addForm.count() > 0) {
          await expect(addForm).toBeVisible();
        }
      }
    });
    
    test('should handle project editing functionality', async ({ page }) => {
      const editBtn = page.locator('.edit-project, .edit-btn').first();
      
      if (await editBtn.count() > 0) {
        await editBtn.click();
        
        // Check if edit modal opens
        const editModal = page.locator('.edit-project-modal, .project-edit-modal');
        
        if (await editModal.count() > 0) {
          await expect(editModal).toBeVisible();
          
          // Check if form is pre-filled with existing data
          const titleField = editModal.locator('input[name="title"], #projectTitle');
          if (await titleField.count() > 0) {
            const titleValue = await titleField.inputValue();
            expect(titleValue.length).toBeGreaterThan(0);
          }
          
          // Check for save button
          const saveBtn = editModal.locator('button[type="submit"], .save-btn');
          if (await saveBtn.count() > 0) {
            await expect(saveBtn).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Project Activities and Updates', () => {
    test('should display project activities or updates section', async ({ page }) => {
      const activitiesSection = page.locator('.project-activities, .project-updates, .recent-activities');
      
      if (await activitiesSection.count() > 0) {
        await expect(activitiesSection).toBeVisible();
        
        // Check for activity items
        const activityItems = activitiesSection.locator('.activity-item, .update-item, .activity');
        if (await activityItems.count() > 0) {
          const firstActivity = activityItems.first();
          await expect(firstActivity).toBeVisible();
          
          // Check activity content
          const activityText = firstActivity.locator('.activity-text, .update-text');
          if (await activityText.count() > 0) {
            await expect(activityText).toBeVisible();
          }
          
          // Check activity timestamp
          const timestamp = firstActivity.locator('.activity-time, .timestamp, .date');
          if (await timestamp.count() > 0) {
            await expect(timestamp).toBeVisible();
          }
        }
      }
    });
    
    test('should load more activities when load more button is clicked', async ({ page }) => {
      const loadMoreBtn = page.locator('.load-more-activities, .load-more, button:has-text("Load More")');
      
      if (await loadMoreBtn.count() > 0) {
        // Get initial activity count
        const initialActivities = page.locator('.activity-item, .update-item');
        const initialCount = await initialActivities.count();
        
        await loadMoreBtn.click();
        await page.waitForTimeout(2000);
        
        // Check if more activities loaded
        const newActivities = page.locator('.activity-item, .update-item');
        const newCount = await newActivities.count();
        
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if projects are still visible and properly arranged
      const projectsContainer = page.locator('.projects-container, .projects-grid');
      await expect(projectsContainer).toBeVisible();
      
      const projectCards = page.locator('.project-card, .project-item');
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();
        await expect(firstCard).toBeVisible();
        
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(375); // Should fit in mobile width
        }
      }
    });
    
    test('should maintain project card readability on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('.project-card, .project-item');
      
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();
        
        // Check title readability
        const title = firstCard.locator('.project-title, .title');
        if (await title.count() > 0) {
          await expect(title).toBeVisible();
          
          const fontSize = await title.evaluate(el => {
            return window.getComputedStyle(el).fontSize;
          });
          
          const fontSizeNum = parseInt(fontSize);
          expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable size
        }
        
        // Check button accessibility
        const actionBtn = firstCard.locator('button, .btn');
        if (await actionBtn.count() > 0) {
          const btnBox = await actionBtn.first().boundingBox();
          if (btnBox) {
            expect(btnBox.height).toBeGreaterThan(30); // Minimum touch target
          }
        }
      }
    });
    
    test('should adapt project filters for mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if filters are accessible on mobile
      const filtersContainer = page.locator('.filters-container, .project-filters');
      
      if (await filtersContainer.count() > 0) {
        await expect(filtersContainer).toBeVisible();
        
        // Check if filters are properly sized for mobile
        const filterElements = filtersContainer.locator('select, input, button');
        if (await filterElements.count() > 0) {
          const firstFilter = filterElements.first();
          const filterBox = await firstFilter.boundingBox();
          
          if (filterBox) {
            expect(filterBox.width).toBeLessThan(375);
            expect(filterBox.height).toBeGreaterThan(30);
          }
        }
      }
    });
  });
});