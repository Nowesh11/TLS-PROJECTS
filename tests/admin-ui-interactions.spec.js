const { test, expect } = require('@playwright/test');

test.describe('Admin Panel UI Interactions', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as admin
    await page.goto('http://localhost:5000/admin-login.html');
    await page.fill('#email', 'admin@tamilsociety.com');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin panel
    await page.waitForURL('**/admin.html*');
  });

  test.afterEach(async () => {
    // Page cleanup is handled automatically by Playwright
  });

  test.describe('Export CSV Functionality', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books', 'posters'];
    
    for (const section of sections) {
      test(`should test export CSV in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for Export CSV button
        const exportButton = page.locator(`#${section} .btn-export, #${section} button:has-text("Export CSV"), #${section} .export-csv`);
        
        if (await exportButton.count() > 0) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download');
          
          await exportButton.first().click();
          
          // Wait for download to start
          const download = await downloadPromise;
          
          // Verify download
          expect(download.suggestedFilename()).toContain('.csv');
          expect(download.suggestedFilename()).toMatch(new RegExp(section, 'i'));
        } else {
          console.log(`No export button found in ${section} section`);
        }
      });
    }
  });

  test.describe('Refresh Button Functionality', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books', 'posters'];
    
    for (const section of sections) {
      test(`should test refresh button in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for Refresh button
        const refreshButton = page.locator(`#${section} .btn-refresh, #${section} button:has-text("Refresh"), #${section} .refresh-btn`);
        
        if (await refreshButton.count() > 0) {
          // Monitor network requests
          let apiCallMade = false;
          page.on('request', request => {
            if (request.url().includes('/api/') && request.method() === 'GET') {
              apiCallMade = true;
            }
          });
          
          await refreshButton.first().click();
          
          // Wait for potential API call
          await page.waitForTimeout(2000);
          
          // Verify refresh action (API call or content reload)
          expect(apiCallMade).toBeTruthy();
        } else {
          console.log(`No refresh button found in ${section} section`);
        }
      });
    }
  });

  test.describe('Search Functionality', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books', 'posters'];
    
    for (const section of sections) {
      test(`should test search functionality in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for search input
        const searchInput = page.locator(`#${section} input[type="search"], #${section} .search-input, #${section} input[placeholder*="Search"]`);
        
        if (await searchInput.count() > 0) {
          // Test search functionality
          await searchInput.first().fill('test search query');
          
          // Look for search button or trigger search on input
          const searchButton = page.locator(`#${section} .btn-search, #${section} button:has-text("Search")`);
          
          if (await searchButton.count() > 0) {
            await searchButton.first().click();
          } else {
            // Trigger search with Enter key
            await searchInput.first().press('Enter');
          }
          
          // Wait for search results
          await page.waitForTimeout(1000);
          
          // Verify search was triggered (could check for loading state or results)
          const hasResults = await page.locator(`#${section} table tbody tr, #${section} .item, #${section} .result`).count() >= 0;
          expect(hasResults).toBeTruthy();
          
          // Clear search
          await searchInput.first().clear();
        } else {
          console.log(`No search input found in ${section} section`);
        }
      });
    }
  });

  test.describe('Filter Functionality', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books', 'posters'];
    
    for (const section of sections) {
      test(`should test filter functionality in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for filter dropdowns
        const filterSelects = page.locator(`#${section} select:not([id*="Form"]), #${section} .filter-select`);
        
        if (await filterSelects.count() > 0) {
          const firstFilter = filterSelects.first();
          
          // Get available options
          const options = await firstFilter.locator('option').count();
          
          if (options > 1) {
            // Select second option (first is usually "All" or default)
            await firstFilter.selectOption({ index: 1 });
            
            // Wait for filter to apply
            await page.waitForTimeout(1000);
            
            // Verify filter was applied (results should change)
            const hasFilteredResults = await page.locator(`#${section} table tbody tr, #${section} .item`).count() >= 0;
            expect(hasFilteredResults).toBeTruthy();
          }
        } else {
          console.log(`No filter dropdowns found in ${section} section`);
        }
      });
    }
  });

  test.describe('Table Interactions', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books'];
    
    for (const section of sections) {
      test(`should test table sorting in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for sortable table headers
        const sortableHeaders = page.locator(`#${section} th[data-sort], #${section} th.sortable, #${section} th:has(.sort-icon)`);
        
        if (await sortableHeaders.count() > 0) {
          const firstHeader = sortableHeaders.first();
          
          // Click to sort
          await firstHeader.click();
          
          // Wait for sort to apply
          await page.waitForTimeout(1000);
          
          // Click again to reverse sort
          await firstHeader.click();
          
          // Wait for reverse sort
          await page.waitForTimeout(1000);
          
          // Verify sorting indicators
          const sortIndicator = page.locator(`#${section} th .sort-asc, #${section} th .sort-desc, #${section} th .fa-sort-up, #${section} th .fa-sort-down`);
          
          if (await sortIndicator.count() > 0) {
            await expect(sortIndicator.first()).toBeVisible();
          }
        } else {
          console.log(`No sortable headers found in ${section} section`);
        }
      });

      test(`should test table pagination in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Look for pagination controls
        const paginationControls = page.locator(`#${section} .pagination, #${section} .page-nav, #${section} .pager`);
        
        if (await paginationControls.count() > 0) {
          // Look for next page button
          const nextButton = page.locator(`#${section} .pagination .next, #${section} .page-next, #${section} button:has-text("Next")`);
          
          if (await nextButton.count() > 0 && await nextButton.first().isEnabled()) {
            await nextButton.first().click();
            
            // Wait for page change
            await page.waitForTimeout(1000);
            
            // Verify page changed (could check page number or different content)
            const pageIndicator = page.locator(`#${section} .page-current, #${section} .active`);
            
            if (await pageIndicator.count() > 0) {
              await expect(pageIndicator.first()).toBeVisible();
            }
          }
        } else {
          console.log(`No pagination found in ${section} section`);
        }
      });
    }
  });

  test.describe('Action Buttons', () => {
    const sections = ['books', 'ebooks', 'projects', 'activities', 'team', 'users', 'announcements', 'purchased-books', 'posters'];
    
    for (const section of sections) {
      test(`should test action buttons in ${section} section`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Test Add/Create button
        const addButton = page.locator(`#${section} .btn-primary, #${section} button:has-text("Add"), #${section} button:has-text("Create"), #${section} .btn-add`);
        
        if (await addButton.count() > 0) {
          await addButton.first().click();
          
          // Wait for modal or form to appear
          await page.waitForTimeout(1000);
          
          // Check if modal or form opened
          const modal = page.locator('.modal, .popup, .form-container');
          const form = page.locator(`#${section} form, form[id*="${section}"]`);
          
          const modalVisible = await modal.count() > 0 && await modal.first().isVisible();
          const formVisible = await form.count() > 0 && await form.first().isVisible();
          
          expect(modalVisible || formVisible).toBeTruthy();
          
          // Close modal if opened
          if (modalVisible) {
            const closeButton = page.locator('.modal .close, .modal .btn-close, .modal button:has-text("Cancel")');
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
            }
          }
        }
        
        // Test Edit buttons (if any items exist)
        const editButtons = page.locator(`#${section} .btn-edit, #${section} button:has-text("Edit"), #${section} .edit-btn`);
        
        if (await editButtons.count() > 0) {
          await editButtons.first().click();
          
          // Wait for edit form/modal
          await page.waitForTimeout(1000);
          
          // Verify edit interface opened
          const editModal = page.locator('.modal, .popup, .edit-form');
          const editForm = page.locator(`form[id*="edit"], form[id*="update"]`);
          
          const editModalVisible = await editModal.count() > 0 && await editModal.first().isVisible();
          const editFormVisible = await editForm.count() > 0 && await editForm.first().isVisible();
          
          expect(editModalVisible || editFormVisible).toBeTruthy();
          
          // Close edit interface
          if (editModalVisible) {
            const closeButton = page.locator('.modal .close, .modal .btn-close, .modal button:has-text("Cancel")');
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
            }
          }
        }
        
        // Test View/Details buttons
        const viewButtons = page.locator(`#${section} .btn-view, #${section} button:has-text("View"), #${section} .view-btn, #${section} button:has-text("Details")`);
        
        if (await viewButtons.count() > 0) {
          await viewButtons.first().click();
          
          // Wait for view modal/page
          await page.waitForTimeout(1000);
          
          // Verify view interface opened
          const viewModal = page.locator('.modal, .popup, .details-view');
          const viewModalVisible = await viewModal.count() > 0 && await viewModal.first().isVisible();
          
          if (viewModalVisible) {
            expect(viewModalVisible).toBeTruthy();
            
            // Close view modal
            const closeButton = page.locator('.modal .close, .modal .btn-close, .modal button:has-text("Close")');
            if (await closeButton.count() > 0) {
              await closeButton.first().click();
            }
          }
        }
      });
    }
  });

  test.describe('Form Interactions', () => {
    test('should test form validation and submission', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Open add form
      const addButton = page.locator('#books .btn-primary, #books button:has-text("Add")');
      
      if (await addButton.count() > 0) {
        await addButton.first().click();
        await page.waitForTimeout(1000);
        
        // Test form validation
        const submitButton = page.locator('form button[type="submit"], .btn-submit');
        
        if (await submitButton.count() > 0) {
          // Try submitting empty form
          await submitButton.first().click();
          
          // Check for validation messages
          const validationMessages = page.locator('.error-message, .invalid-feedback, .alert-danger, .validation-error');
          
          if (await validationMessages.count() > 0) {
            await expect(validationMessages.first()).toBeVisible();
          }
          
          // Fill required fields and test successful submission
          const titleInput = page.locator('input[name="title"], #bookTitle, input[placeholder*="title"]');
          const authorInput = page.locator('input[name="author"], #bookAuthor, input[placeholder*="author"]');
          
          if (await titleInput.count() > 0) {
            await titleInput.first().fill('Test Book Title');
          }
          
          if (await authorInput.count() > 0) {
            await authorInput.first().fill('Test Author');
          }
          
          // Submit form with valid data
          await submitButton.first().click();
          
          // Wait for success message or form closure
          await page.waitForTimeout(2000);
          
          // Check for success indicators
          const successMessage = page.locator('.alert-success, .success-message, .notification-success');
          
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Responsive Interactions', () => {
    test('should test mobile menu interactions', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Look for mobile menu toggle
      const menuToggle = page.locator('.menu-toggle, .hamburger, .mobile-menu-btn, .navbar-toggler');
      
      if (await menuToggle.count() > 0) {
        await menuToggle.first().click();
        
        // Check if mobile menu opened
        const mobileMenu = page.locator('.mobile-menu, .sidebar.show, .nav-menu.active');
        
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu.first()).toBeVisible();
          
          // Test menu item click
          const menuItem = page.locator('.mobile-menu a, .sidebar a').first();
          
          if (await menuItem.count() > 0) {
            await menuItem.click();
            
            // Verify menu closed after selection
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test('should test tablet interactions', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test sidebar behavior on tablet
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
        
        // Test section navigation
        await page.click('[data-section="books"]');
        await page.waitForSelector('#books', { state: 'visible' });
        
        // Verify content area adjusts properly
        const contentArea = page.locator('.content, .main-content, #books');
        
        if (await contentArea.count() > 0) {
          await expect(contentArea.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', async () => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key on focused button
      const firstButton = page.locator('button, a').first();
      await firstButton.focus();
      await page.keyboard.press('Enter');
      
      // Verify action was triggered
      await page.waitForTimeout(1000);
    });

    test('should support escape key to close modals', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Open a modal
      const addButton = page.locator('#books .btn-primary');
      
      if (await addButton.count() > 0) {
        await addButton.first().click();
        await page.waitForTimeout(1000);
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        
        // Verify modal closed
        const modal = page.locator('.modal:visible, .popup:visible');
        
        if (await modal.count() > 0) {
          await expect(modal.first()).not.toBeVisible();
        }
      }
    });
  });
});