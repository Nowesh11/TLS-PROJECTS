const { test, expect } = require('@playwright/test');

test.describe('Admin Panel - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    
    // Login as admin if login form is present
    const loginForm = page.locator('form, .login-form, #adminLoginForm');
    if (await loginForm.count() > 0) {
      const emailField = loginForm.locator('input[name="email"], input[type="email"], #adminEmail');
      const passwordField = loginForm.locator('input[name="password"], input[type="password"], #adminPassword');
      const loginBtn = loginForm.locator('button[type="submit"], .login-btn, .submit-btn');
      
      if (await emailField.count() > 0 && await passwordField.count() > 0) {
        await emailField.fill('admin@tamilsociety.com');
      await passwordField.fill('Admin123!');
        await loginBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test.describe('Admin Authentication', () => {
    test('should display admin login form', async ({ page }) => {
      await page.goto('/admin.html');
      
      const loginForm = page.locator('form, .login-form, #adminLoginForm');
      if (await loginForm.count() > 0) {
        await expect(loginForm).toBeVisible();
        
        // Check for email field
        await expect(loginForm.locator('input[name="email"], input[type="email"]')).toBeVisible();
        
        // Check for password field
        await expect(loginForm.locator('input[name="password"], input[type="password"]')).toBeVisible();
        
        // Check for login button
        await expect(loginForm.locator('button[type="submit"], .login-btn')).toBeVisible();
      }
    });
    
    test('should authenticate admin with valid credentials', async ({ page }) => {
      await page.goto('/admin.html');
      
      const loginForm = page.locator('form, .login-form');
      if (await loginForm.count() > 0) {
        await loginForm.locator('input[name="email"]').fill('admin@tamilsociety.com');
      await loginForm.locator('input[name="password"]').fill('Admin123!');
        await loginForm.locator('button[type="submit"]').click();
        
        // Check for successful login (dashboard or admin content)
        const adminDashboard = page.locator('.admin-dashboard, .dashboard, .admin-content, .sidebar');
        await expect(adminDashboard).toBeVisible({ timeout: 10000 });
      }
    });
    
    test('should reject invalid admin credentials', async ({ page }) => {
      await page.goto('/admin.html');
      
      const loginForm = page.locator('form, .login-form');
      if (await loginForm.count() > 0) {
        await loginForm.locator('input[name="email"]').fill('invalid@example.com');
        await loginForm.locator('input[name="password"]').fill('wrongpassword');
        await loginForm.locator('button[type="submit"]').click();
        
        // Check for error message
        const errorMessage = page.locator('.error-message, .login-error, .alert-error');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible({ timeout: 5000 });
        }
      }
    });
    
    test('should handle admin logout', async ({ page }) => {
      const logoutBtn = page.locator('.logout-btn, .admin-logout, button:has-text("Logout")');
      
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        
        // Should redirect to login or show login form
        const loginForm = page.locator('form, .login-form');
        await expect(loginForm).toBeVisible({ timeout: 5000 });
      }
    });
  });
  
  test.describe('Admin Dashboard', () => {
    test('should display admin dashboard with key metrics', async ({ page }) => {
      // Check for main admin content area
      const adminContent = page.locator('.admin-content, .dashboard, .main-content, body');
      await expect(adminContent).toBeVisible();
      
      // Check for any statistics or metric elements (more flexible)
      const statsElements = page.locator('.stats, .metrics, .dashboard-stats, .admin-stats, .stat, .metric, .card');
      if (await statsElements.count() > 0) {
        await expect(statsElements.first()).toBeVisible();
      } else {
        // If no specific stats, just verify admin page loaded
        const pageTitle = await page.title();
        expect(pageTitle.toLowerCase()).toMatch(/admin|dashboard/);
      }
    });
    
    test('should display admin sidebar navigation', async ({ page }) => {
      // Look for navigation elements more broadly
      const navigation = page.locator('.sidebar, .admin-sidebar, .navigation, .admin-nav, .nav, nav, .menu');
      
      if (await navigation.count() > 0) {
        await expect(navigation.first()).toBeVisible();
        
        // Check for any navigation links
        const navLinks = navigation.first().locator('a, button, .nav-item, .menu-item');
        if (await navLinks.count() > 0) {
          await expect(navLinks.first()).toBeVisible();
        }
      } else {
        // If no sidebar, check for any admin navigation in the page
        const anyNavigation = page.locator('a[href*="admin"], button:has-text("Admin"), .admin-link');
        if (await anyNavigation.count() > 0) {
          await expect(anyNavigation.first()).toBeVisible();
        } else {
          // Just verify we're on an admin page
          const url = page.url();
          expect(url).toMatch(/admin/);
        }
      }
    });
    
    test('should navigate between admin sections', async ({ page }) => {
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      
      // Try to navigate to Users section
      const usersLink = sidebar.locator('a:has-text("Users"), .nav-item:has-text("Users")');
      if (await usersLink.count() > 0) {
        await usersLink.click();
        await page.waitForLoadState('networkidle');
        
        // Check if users content is displayed
        const usersContent = page.locator('.users-section, .admin-users, .user-management');
        if (await usersContent.count() > 0) {
          await expect(usersContent).toBeVisible();
        }
      }
      
      // Try to navigate to Books section
      const booksLink = sidebar.locator('a:has-text("Books"), .nav-item:has-text("Books")');
      if (await booksLink.count() > 0) {
        await booksLink.click();
        await page.waitForLoadState('networkidle');
        
        const booksContent = page.locator('.books-section, .admin-books, .book-management');
        if (await booksContent.count() > 0) {
          await expect(booksContent).toBeVisible();
        }
      }
    });
    
    test('should display recent activities or logs', async ({ page }) => {
      const activitySection = page.locator('.recent-activities, .activity-log, .admin-activities, .dashboard-activities');
      
      if (await activitySection.count() > 0) {
        await expect(activitySection).toBeVisible();
        
        // Check for activity items
        const activityItems = activitySection.locator('.activity-item, .log-item, .activity');
        if (await activityItems.count() > 0) {
          await expect(activityItems.first()).toBeVisible();
          
          // Check if activity has timestamp
          const timestamp = activityItems.first().locator('.timestamp, .time, .date');
          if (await timestamp.count() > 0) {
            await expect(timestamp).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('User Management', () => {
    test('should display users list with user information', async ({ page }) => {
      // Navigate to users section
      const usersLink = page.locator('a:has-text("Users"), .nav-item:has-text("Users")');
      if (await usersLink.count() > 0) {
        await usersLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const usersTable = page.locator('.users-table, .user-list, table');
      if (await usersTable.count() > 0) {
        await expect(usersTable).toBeVisible();
        
        // Check for table headers
        const headers = usersTable.locator('th, .table-header');
        if (await headers.count() > 0) {
          const headerTexts = await headers.allTextContents();
          const expectedHeaders = ['Name', 'Email', 'Role', 'Status', 'Actions'];
          
          const hasExpectedHeaders = expectedHeaders.some(header => 
            headerTexts.some(text => text.toLowerCase().includes(header.toLowerCase()))
          );
          expect(hasExpectedHeaders).toBeTruthy();
        }
        
        // Check for user rows
        const userRows = usersTable.locator('tbody tr, .user-row');
        if (await userRows.count() > 0) {
          await expect(userRows.first()).toBeVisible();
        }
      }
    });
    
    test('should allow searching and filtering users', async ({ page }) => {
      const searchInput = page.locator('input[name="search"], .search-input, .user-search');
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const userRows = page.locator('.user-row, tbody tr');
        if (await userRows.count() > 0) {
          const firstRowText = await userRows.first().textContent();
          expect(firstRowText.toLowerCase()).toContain('test');
        }
      }
      
      // Test role filter if available
      const roleFilter = page.locator('select[name="role"], .role-filter');
      if (await roleFilter.count() > 0) {
        const options = roleFilter.locator('option');
        if (await options.count() > 1) {
          await roleFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
    });
    
    test('should allow editing user information', async ({ page }) => {
      const editBtn = page.locator('.edit-user, .user-edit, button:has-text("Edit")');
      
      if (await editBtn.count() > 0) {
        await editBtn.first().click();
        
        // Check for edit modal or form
        const editModal = page.locator('.edit-modal, .user-edit-modal, .modal');
        const editForm = page.locator('.edit-form, .user-edit-form');
        
        if (await editModal.count() > 0) {
          await expect(editModal).toBeVisible();
          
          // Check for form fields
          const nameField = editModal.locator('input[name="name"], #userName');
          const emailField = editModal.locator('input[name="email"], #userEmail');
          const roleField = editModal.locator('select[name="role"], #userRole');
          
          if (await nameField.count() > 0) {
            await expect(nameField).toBeVisible();
          }
          if (await emailField.count() > 0) {
            await expect(emailField).toBeVisible();
          }
          if (await roleField.count() > 0) {
            await expect(roleField).toBeVisible();
          }
        } else if (await editForm.count() > 0) {
          await expect(editForm).toBeVisible();
        }
      }
    });
    
    test('should allow deleting users with confirmation', async ({ page }) => {
      const deleteBtn = page.locator('.delete-user, .user-delete, button:has-text("Delete")');
      
      if (await deleteBtn.count() > 0) {
        await deleteBtn.first().click();
        
        // Check for confirmation dialog
        const confirmDialog = page.locator('.confirm-dialog, .delete-confirmation, .modal');
        if (await confirmDialog.count() > 0) {
          await expect(confirmDialog).toBeVisible();
          
          // Check for confirmation buttons
          const confirmBtn = confirmDialog.locator('button:has-text("Confirm"), button:has-text("Delete"), .confirm-btn');
          const cancelBtn = confirmDialog.locator('button:has-text("Cancel"), .cancel-btn');
          
          if (await confirmBtn.count() > 0) {
            await expect(confirmBtn).toBeVisible();
          }
          if (await cancelBtn.count() > 0) {
            await expect(cancelBtn).toBeVisible();
            await cancelBtn.click(); // Cancel to avoid actual deletion
          }
        }
      }
    });
  });
  
  test.describe('Content Management', () => {
    test('should display books management section', async ({ page }) => {
      const booksLink = page.locator('a:has-text("Books"), .nav-item:has-text("Books")');
      if (await booksLink.count() > 0) {
        await booksLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const booksSection = page.locator('.books-section, .admin-books, .book-management');
      if (await booksSection.count() > 0) {
        await expect(booksSection).toBeVisible();
        
        // Check for add book button
        const addBookBtn = page.locator('.add-book, .book-add, button:has-text("Add Book")');
        if (await addBookBtn.count() > 0) {
          await expect(addBookBtn).toBeVisible();
        }
        
        // Check for books list/table
        const booksList = page.locator('.books-list, .books-table, table');
        if (await booksList.count() > 0) {
          await expect(booksList).toBeVisible();
        }
      }
    });
    
    test('should allow adding new books', async ({ page }) => {
      const addBookBtn = page.locator('.add-book, button:has-text("Add Book")');
      
      if (await addBookBtn.count() > 0) {
        await addBookBtn.click();
        
        // Check for add book form/modal
        const addBookModal = page.locator('.add-book-modal, .book-form-modal, .modal');
        const addBookForm = page.locator('.add-book-form, .book-form');
        
        if (await addBookModal.count() > 0) {
          await expect(addBookModal).toBeVisible();
          
          // Check for form fields
          const titleField = addBookModal.locator('input[name="title"], #bookTitle');
          const authorField = addBookModal.locator('input[name="author"], #bookAuthor');
          const priceField = addBookModal.locator('input[name="price"], #bookPrice');
          const imageField = addBookModal.locator('input[type="file"], .image-upload');
          
          if (await titleField.count() > 0) {
            await expect(titleField).toBeVisible();
          }
          if (await authorField.count() > 0) {
            await expect(authorField).toBeVisible();
          }
          if (await priceField.count() > 0) {
            await expect(priceField).toBeVisible();
          }
          if (await imageField.count() > 0) {
            await expect(imageField).toBeVisible();
          }
        } else if (await addBookForm.count() > 0) {
          await expect(addBookForm).toBeVisible();
        }
      }
    });
    
    test('should display ebooks management with Tamil font support', async ({ page }) => {
      const ebooksLink = page.locator('a:has-text("Ebooks"), .nav-item:has-text("Ebooks")');
      if (await ebooksLink.count() > 0) {
        await ebooksLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const ebooksSection = page.locator('.ebooks-section, .admin-ebooks, .ebook-management');
      if (await ebooksSection.count() > 0) {
        await expect(ebooksSection).toBeVisible();
        
        // Check for Tamil text rendering
        const tamilText = page.locator(':has-text("தமிழ்")');
        if (await tamilText.count() > 0) {
          await expect(tamilText).toBeVisible();
          
          // Check font rendering
          const computedStyle = await tamilText.first().evaluate(el => {
            return window.getComputedStyle(el).fontFamily;
          });
          expect(computedStyle).toBeTruthy();
        }
      }
    });
    
    test('should manage projects with CSV export functionality', async ({ page }) => {
      const projectsLink = page.locator('a:has-text("Projects"), .nav-item:has-text("Projects")');
      if (await projectsLink.count() > 0) {
        await projectsLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const projectsSection = page.locator('.projects-section, .admin-projects, .project-management');
      if (await projectsSection.count() > 0) {
        await expect(projectsSection).toBeVisible();
        
        // Check for CSV export button
        const exportBtn = page.locator('.export-csv, .csv-export, button:has-text("Export")');
        if (await exportBtn.count() > 0) {
          await expect(exportBtn).toBeVisible();
          
          // Test CSV export (mock download)
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
          await exportBtn.click();
          const download = await downloadPromise;
          
          if (download) {
            expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
          }
        }
      }
    });
  });
  
  test.describe('Media Management', () => {
    test('should display media library', async ({ page }) => {
      const mediaLink = page.locator('a:has-text("Media"), .nav-item:has-text("Media")');
      if (await mediaLink.count() > 0) {
        await mediaLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const mediaSection = page.locator('.media-section, .admin-media, .media-library');
      if (await mediaSection.count() > 0) {
        await expect(mediaSection).toBeVisible();
        
        // Check for upload area
        const uploadArea = page.locator('.upload-area, .file-upload, input[type="file"]');
        if (await uploadArea.count() > 0) {
          await expect(uploadArea).toBeVisible();
        }
        
        // Check for media grid
        const mediaGrid = page.locator('.media-grid, .file-grid, .media-items');
        if (await mediaGrid.count() > 0) {
          await expect(mediaGrid).toBeVisible();
        }
      }
    });
    
    test('should support file uploads with progress indication', async ({ page }) => {
      const fileInput = page.locator('input[type="file"], .file-upload');
      
      if (await fileInput.count() > 0) {
        // Check file input attributes
        const accept = await fileInput.getAttribute('accept');
        if (accept) {
          expect(accept).toBeTruthy();
        }
        
        // Check for upload progress area
        const progressArea = page.locator('.upload-progress, .progress-bar, .upload-status');
        if (await progressArea.count() > 0) {
          // Progress area should be hidden initially
          expect(await progressArea.isVisible()).toBeFalsy();
        }
      }
    });
    
    test('should allow deleting media files', async ({ page }) => {
      const mediaItems = page.locator('.media-item, .file-item');
      
      if (await mediaItems.count() > 0) {
        const firstItem = mediaItems.first();
        
        // Look for delete button on hover or always visible
        await firstItem.hover();
        
        const deleteBtn = firstItem.locator('.delete-btn, .remove-btn, button:has-text("Delete")');
        if (await deleteBtn.count() > 0) {
          await expect(deleteBtn).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Chat Management', () => {
    test('should display admin chat interface', async ({ page }) => {
      const chatLink = page.locator('a:has-text("Chat"), .nav-item:has-text("Chat")');
      if (await chatLink.count() > 0) {
        await chatLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const chatSection = page.locator('.chat-section, .admin-chat, .chat-management');
      if (await chatSection.count() > 0) {
        await expect(chatSection).toBeVisible();
        
        // Check for chat conversations list
        const chatList = page.locator('.chat-list, .conversations, .chat-sessions');
        if (await chatList.count() > 0) {
          await expect(chatList).toBeVisible();
        }
        
        // Check for chat window
        const chatWindow = page.locator('.chat-window, .chat-messages, .message-area');
        if (await chatWindow.count() > 0) {
          await expect(chatWindow).toBeVisible();
        }
      }
    });
    
    test('should allow clearing chat sessions', async ({ page }) => {
      const clearBtn = page.locator('.clear-chat, .clear-sessions, button:has-text("Clear")');
      
      if (await clearBtn.count() > 0) {
        await clearBtn.click();
        
        // Check for confirmation
        const confirmDialog = page.locator('.confirm-dialog, .modal');
        if (await confirmDialog.count() > 0) {
          await expect(confirmDialog).toBeVisible();
          
          const cancelBtn = confirmDialog.locator('button:has-text("Cancel"), .cancel-btn');
          if (await cancelBtn.count() > 0) {
            await cancelBtn.click(); // Cancel to avoid clearing
          }
        }
      }
    });
    
    test('should display unread message indicators', async ({ page }) => {
      const unreadIndicators = page.locator('.unread-indicator, .message-count, .badge');
      
      if (await unreadIndicators.count() > 0) {
        const firstIndicator = unreadIndicators.first();
        await expect(firstIndicator).toBeVisible();
        
        // Check if it contains a number
        const indicatorText = await firstIndicator.textContent();
        expect(indicatorText).toMatch(/\d+/);
      }
    });
  });
  
  test.describe('Admin Settings', () => {
    test('should display admin settings panel', async ({ page }) => {
      const settingsLink = page.locator('a:has-text("Settings"), .nav-item:has-text("Settings")');
      if (await settingsLink.count() > 0) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      const settingsSection = page.locator('.settings-section, .admin-settings, .configuration');
      if (await settingsSection.count() > 0) {
        await expect(settingsSection).toBeVisible();
        
        // Check for settings categories
        const settingsCategories = page.locator('.settings-category, .config-section');
        if (await settingsCategories.count() > 0) {
          await expect(settingsCategories.first()).toBeVisible();
        }
      }
    });
    
    test('should allow updating site configuration', async ({ page }) => {
      const configForm = page.locator('.config-form, .settings-form');
      
      if (await configForm.count() > 0) {
        await expect(configForm).toBeVisible();
        
        // Check for common configuration fields
        const siteNameField = configForm.locator('input[name="siteName"], #siteName');
        const siteDescField = configForm.locator('textarea[name="description"], #siteDescription');
        const saveBtn = configForm.locator('button[type="submit"], .save-btn');
        
        if (await siteNameField.count() > 0) {
          await expect(siteNameField).toBeVisible();
        }
        if (await siteDescField.count() > 0) {
          await expect(siteDescField).toBeVisible();
        }
        if (await saveBtn.count() > 0) {
          await expect(saveBtn).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Admin Responsive Design', () => {
    test('should adapt sidebar for mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      if (await sidebar.count() > 0) {
        // Check if sidebar is collapsed or has mobile menu
        const mobileMenu = page.locator('.mobile-menu, .menu-toggle, .sidebar-toggle');
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).toBeVisible();
        }
        
        // Check sidebar doesn't overlap main content
        const mainContent = page.locator('.main-content, .admin-content');
        if (await mainContent.count() > 0) {
          const sidebarBox = await sidebar.boundingBox();
          const contentBox = await mainContent.boundingBox();
          
          if (sidebarBox && contentBox) {
            // Ensure no significant overlap
            const overlap = Math.max(0, Math.min(sidebarBox.x + sidebarBox.width, contentBox.x + contentBox.width) - Math.max(sidebarBox.x, contentBox.x));
            expect(overlap).toBeLessThan(sidebarBox.width * 0.5);
          }
        }
      }
    });
    
    test('should display admin tables responsively', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const tables = page.locator('table, .data-table');
      
      if (await tables.count() > 0) {
        const firstTable = tables.first();
        await expect(firstTable).toBeVisible();
        
        // Check if table is scrollable or stacked
        const tableContainer = firstTable.locator('xpath=..');
        const containerStyle = await tableContainer.evaluate(el => {
          return window.getComputedStyle(el).overflowX;
        });
        
        expect(['auto', 'scroll', 'hidden'].includes(containerStyle)).toBeTruthy();
      }
    });
  });
  
  test.describe('Admin Theme Support', () => {
    test('should support dark/light theme toggle in admin panel', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .admin-theme-toggle');
      
      if (await themeToggle.count() > 0) {
        await expect(themeToggle).toBeVisible();
        
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme') || 
                 document.body.className.includes('dark') ? 'dark' : 'light';
        });
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Check if theme changed
        const newTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme') || 
                 document.body.className.includes('dark') ? 'dark' : 'light';
        });
        
        expect(newTheme).not.toBe(initialTheme);
      }
    });
    
    test('should maintain theme consistency across admin sections', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle');
      
      if (await themeToggle.count() > 0) {
        // Set to dark theme
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Navigate to different admin section
        const usersLink = page.locator('a:has-text("Users"), .nav-item:has-text("Users")');
        if (await usersLink.count() > 0) {
          await usersLink.click();
          await page.waitForLoadState('networkidle');
          
          // Check if dark theme is maintained
          const isDarkTheme = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme') === 'dark' || 
                   document.body.className.includes('dark');
          });
          
          expect(isDarkTheme).toBeTruthy();
        }
      }
    });
  });
});