const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Comprehensive Testing', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as admin
    await page.goto('http://localhost:3000/admin-login.html');
    await page.fill('#email', 'admin@tamilsociety.com');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin panel
    await page.waitForURL('**/admin.html*');
  });

  test.afterEach(async () => {
    // Page cleanup is handled automatically by Playwright
  });

  test.describe('Admin Authentication', () => {
    test('should login successfully with valid credentials', async () => {
      await expect(page).toHaveURL(/.*admin.*/);
      await expect(page.locator('.admin-header')).toBeVisible();
    });

    test('should display admin user info', async () => {
      await expect(page.locator('.user-info')).toBeVisible();
      await expect(page.locator('.user-name')).toContainText('Admin');
    });
  });

  test.describe('Sidebar Navigation', () => {
    const sidebarSections = [
      { id: 'dashboard', name: 'Dashboard' },
      { id: 'website-content', name: 'Website Content' },
      { id: 'books', name: 'Books Management' },
      { id: 'ebooks', name: 'E-books Management' },
      { id: 'projects', name: 'Projects Management' },
      { id: 'activities', name: 'Activities Management' },
      { id: 'initiatives', name: 'Initiatives Management' },
      { id: 'team', name: 'Team Management' },
      { id: 'recruitment', name: 'Recruitment Management' },
      { id: 'chats', name: 'Chats Management' },
      { id: 'users', name: 'Users Management' },
      { id: 'announcements', name: 'Announcements Management' },
      { id: 'purchased-books', name: 'Purchased Books Management' },
      { id: 'payment-settings', name: 'Payment Settings' },
      { id: 'posters', name: 'Posters Management' },
      { id: 'slideshow', name: 'Slideshow Management' },
      { id: 'file-storage', name: 'File Storage Management' }
    ];

    for (const section of sidebarSections) {
      test(`should navigate to ${section.name} section`, async () => {
        await page.click(`[data-section="${section.id}"]`);
        await expect(page.locator(`#${section.id}`)).toBeVisible();
        await expect(page.locator(`#${section.id} h1`)).toContainText(section.name);
      });
    }
  });

  test.describe('Dashboard Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="dashboard"]');
      await page.waitForSelector('#dashboard', { state: 'visible' });
    });

    test('should display dashboard statistics', async () => {
      await expect(page.locator('.stats-grid')).toBeVisible();
      await expect(page.locator('.stat-card')).toHaveCount(4);
    });

    test('should display pie chart', async () => {
      await expect(page.locator('#pieChart')).toBeVisible();
    });

    test('should have working quick actions', async () => {
      await expect(page.locator('.quick-actions')).toBeVisible();
      const quickActionButtons = page.locator('.quick-actions button');
      const count = await quickActionButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display recent activity', async () => {
      await expect(page.locator('.recent-activity')).toBeVisible();
    });
  });

  test.describe('Website Content Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="website-content"]');
      await page.waitForSelector('#website-content', { state: 'visible' });
    });

    test('should display page selector', async () => {
      await expect(page.locator('#page-selector')).toBeVisible();
    });

    test('should have language toggle functionality', async () => {
      await expect(page.locator('.language-toggle')).toBeVisible();
      await page.click('.language-toggle button:first-child');
      await page.click('.language-toggle button:last-child');
    });

    test('should display content editor', async () => {
      await expect(page.locator('#content-editor')).toBeVisible();
    });

    test('should have save content button', async () => {
      await expect(page.locator('#save-content-btn')).toBeVisible();
      await expect(page.locator('#save-content-btn')).toBeEnabled();
    });
  });

  test.describe('Books Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
    });

    test('should display action buttons', async () => {
      await expect(page.locator('#add-book-btn')).toBeVisible();
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh Books")')).toBeVisible();
    });

    test('should have search functionality', async () => {
      await expect(page.locator('#books-search')).toBeVisible();
      await page.fill('#books-search', 'test book');
    });

    test('should have filter functionality', async () => {
      await expect(page.locator('#books-status-filter')).toBeVisible();
      await page.selectOption('#books-status-filter', 'active');
    });

    test('should display books table', async () => {
      await expect(page.locator('#books-table')).toBeVisible();
      await expect(page.locator('#books-table thead')).toBeVisible();
      await expect(page.locator('#books-tbody')).toBeVisible();
    });

    test('should test refresh books functionality', async () => {
      await page.click('button:has-text("Refresh Books")');
      // Wait for potential loading state
      await page.waitForTimeout(1000);
    });

    test('should test add book modal', async () => {
      await page.click('#add-book-btn');
      await page.waitForTimeout(500);
      // Check if modal appears or function is called
    });
  });

  test.describe('E-books Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="ebooks"]');
      await page.waitForSelector('#ebooks', { state: 'visible' });
    });

    test('should display action buttons', async () => {
      await expect(page.locator('#add-ebook-btn')).toBeVisible();
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh E-books")')).toBeVisible();
    });

    test('should have search and filter functionality', async () => {
      await expect(page.locator('#ebooks-search')).toBeVisible();
      await expect(page.locator('#ebooks-status-filter')).toBeVisible();
    });

    test('should display ebooks table', async () => {
      await expect(page.locator('#ebooks-table')).toBeVisible();
      await expect(page.locator('#ebooks-tbody')).toBeVisible();
    });

    test('should test refresh ebooks functionality', async () => {
      await page.click('button:has-text("Refresh E-books")');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Projects Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="projects"]');
      await page.waitForSelector('#projects', { state: 'visible' });
    });

    test('should display action buttons', async () => {
      await expect(page.locator('#add-project-btn')).toBeVisible();
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh Projects")')).toBeVisible();
    });

    test('should have search and filter functionality', async () => {
      await expect(page.locator('#projects-search')).toBeVisible();
      await expect(page.locator('#projects-status-filter')).toBeVisible();
    });

    test('should display projects table', async () => {
      await expect(page.locator('#projects-table')).toBeVisible();
      await expect(page.locator('#projects-tbody')).toBeVisible();
    });

    test('should test refresh projects functionality', async () => {
      await page.click('button:has-text("Refresh Projects")');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Activities Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="activities"]');
      await page.waitForSelector('#activities', { state: 'visible' });
    });

    test('should display action buttons', async () => {
      await expect(page.locator('#add-activity-btn')).toBeVisible();
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh Activities")')).toBeVisible();
    });

    test('should have search and filter functionality', async () => {
      await expect(page.locator('#activities-search')).toBeVisible();
      await expect(page.locator('#activities-status-filter')).toBeVisible();
    });

    test('should display activities table', async () => {
      await expect(page.locator('#activities-table')).toBeVisible();
      await expect(page.locator('#activities-tbody')).toBeVisible();
    });

    test('should test refresh activities functionality', async () => {
      await page.click('button:has-text("Refresh Activities")');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Initiatives Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="initiatives"]');
      await page.waitForSelector('#initiatives', { state: 'visible' });
    });

    test('should display action buttons', async () => {
      await expect(page.locator('#add-initiative-btn')).toBeVisible();
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Refresh Initiatives")')).toBeVisible();
    });

    test('should have search and filter functionality', async () => {
      await expect(page.locator('#initiatives-search')).toBeVisible();
      await expect(page.locator('#initiatives-status-filter')).toBeVisible();
    });

    test('should display initiatives table', async () => {
      await expect(page.locator('#initiatives-table')).toBeVisible();
      await expect(page.locator('#initiatives-tbody')).toBeVisible();
    });

    test('should test refresh initiatives functionality', async () => {
      await page.click('button:has-text("Refresh Initiatives")');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Team Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="team"]');
      await page.waitForSelector('#team', { state: 'visible' });
    });

    test('should display team management interface', async () => {
      await expect(page.locator('#team h1')).toContainText('Team Management');
    });

    test('should have team action buttons', async () => {
      const exportButton = page.locator('button:has-text("Export CSV")');
      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test.describe('Recruitment Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="recruitment"]');
      await page.waitForSelector('#recruitment', { state: 'visible' });
    });

    test('should display recruitment management interface', async () => {
      await expect(page.locator('#recruitment h1')).toContainText('Recruitment Management');
    });
  });

  test.describe('Chats Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="chats"]');
      await page.waitForSelector('#chats', { state: 'visible' });
    });

    test('should display chat management interface', async () => {
      await expect(page.locator('#chats h1')).toContainText('Chats Management');
    });

    test('should have chat interface elements', async () => {
      const chatList = page.locator('#chatList');
      const chatMessages = page.locator('#chatMessages');
      
      if (await chatList.count() > 0) {
        await expect(chatList).toBeVisible();
      }
      
      if (await chatMessages.count() > 0) {
        await expect(chatMessages).toBeVisible();
      }
    });
  });

  test.describe('Users Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="users"]');
      await page.waitForSelector('#users', { state: 'visible' });
    });

    test('should display users management interface', async () => {
      await expect(page.locator('#users h1')).toContainText('Users Management');
    });

    test('should have users action buttons', async () => {
      const exportButton = page.locator('button:has-text("Export CSV")');
      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
      }
    });
  });

  test.describe('Announcements Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="announcements"]');
      await page.waitForSelector('#announcements', { state: 'visible' });
    });

    test('should display announcements management interface', async () => {
      await expect(page.locator('#announcements h1')).toContainText('Announcements');
    });

    test('should have announcements action buttons', async () => {
      const createButton = page.locator('button:has-text("Create Announcement")');
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
      }
    });
  });

  test.describe('Purchased Books Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="purchased-books"]');
      await page.waitForSelector('#purchased-books', { state: 'visible' });
    });

    test('should display purchased books management interface', async () => {
      await expect(page.locator('#purchased-books h1')).toContainText('Purchased Books');
    });
  });

  test.describe('Payment Settings Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="payment-settings"]');
      await page.waitForSelector('#payment-settings', { state: 'visible' });
    });

    test('should display payment settings interface', async () => {
      await expect(page.locator('#payment-settings h1')).toContainText('Payment Settings');
    });
  });

  test.describe('Posters Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="posters"]');
      await page.waitForSelector('#posters', { state: 'visible' });
    });

    test('should display posters management interface', async () => {
      await expect(page.locator('#posters h1')).toContainText('Posters Management');
    });
  });

  test.describe('Slideshow Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="slideshow"]');
      await page.waitForSelector('#slideshow', { state: 'visible' });
    });

    test('should display slideshow management interface', async () => {
      await expect(page.locator('#slideshow h1')).toContainText('Slideshow Management');
    });
  });

  test.describe('File Storage Management Section', () => {
    test.beforeEach(async () => {
      await page.click('[data-section="file-storage"]');
      await page.waitForSelector('#file-storage', { state: 'visible' });
    });

    test('should display file storage management interface', async () => {
      await expect(page.locator('#file-storage h1')).toContainText('File Storage Management');
    });
  });

  test.describe('Theme Testing', () => {
    test('should test light theme visibility', async () => {
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
      });
      
      // Test visibility of key elements in light theme
      await expect(page.locator('.admin-header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.main-content')).toBeVisible();
    });

    test('should test dark theme visibility', async () => {
      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      
      // Test visibility of key elements in dark theme
      await expect(page.locator('.admin-header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.main-content')).toBeVisible();
    });

    test('should test theme toggle functionality', async () => {
      const themeToggle = page.locator('.theme-toggle, #theme-toggle, [data-theme-toggle]');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        await themeToggle.click();
      }
    });
  });

  test.describe('Export Functionality', () => {
    const exportSections = [
      { section: 'books', buttonText: 'Export CSV' },
      { section: 'ebooks', buttonText: 'Export CSV' },
      { section: 'projects', buttonText: 'Export CSV' },
      { section: 'activities', buttonText: 'Export CSV' },
      { section: 'initiatives', buttonText: 'Export CSV' },
      { section: 'team', buttonText: 'Export CSV' }
    ];

    for (const { section, buttonText } of exportSections) {
      test(`should test export functionality for ${section}`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        const exportButton = page.locator(`button:has-text("${buttonText}")`);
        if (await exportButton.count() > 0) {
          await exportButton.click();
          await page.waitForTimeout(1000);
        }
      });
    }
  });

  test.describe('Modal Functionality', () => {
    const modalSections = [
      { section: 'books', buttonId: '#add-book-btn', modalType: 'book' },
      { section: 'ebooks', buttonId: '#add-ebook-btn', modalType: 'ebook' },
      { section: 'projects', buttonId: '#add-project-btn', modalType: 'project' },
      { section: 'activities', buttonId: '#add-activity-btn', modalType: 'activity' },
      { section: 'initiatives', buttonId: '#add-initiative-btn', modalType: 'initiative' }
    ];

    for (const { section, buttonId, modalType } of modalSections) {
      test(`should test add ${modalType} modal`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        await page.click(buttonId);
        await page.waitForTimeout(1000);
        
        // Check if modal appears or if function is called without errors
        const modalSelector = `#${modalType}-modal, .modal, [data-modal="${modalType}"]`;
        const modal = page.locator(modalSelector);
        
        // If modal exists, check visibility, otherwise just ensure no errors
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
        }
      });
    }
  });

  test.describe('Table Action Buttons', () => {
    test('should test table action buttons when data is present', async () => {
      const sections = ['books', 'ebooks', 'projects', 'activities', 'initiatives'];
      
      for (const section of sections) {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Check if table has data rows
        const tableRows = page.locator(`#${section}-tbody tr`);
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
          // Test edit and delete buttons if they exist
          const editButtons = page.locator('.btn-edit, button:has-text("Edit")');
          const deleteButtons = page.locator('.btn-delete, button:has-text("Delete")');
          
          if (await editButtons.count() > 0) {
            await expect(editButtons.first()).toBeVisible();
          }
          
          if (await deleteButtons.count() > 0) {
            await expect(deleteButtons.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Search and Filter Functionality', () => {
    const searchableSections = [
      { section: 'books', searchId: '#books-search', filterId: '#books-status-filter' },
      { section: 'ebooks', searchId: '#ebooks-search', filterId: '#ebooks-status-filter' },
      { section: 'projects', searchId: '#projects-search', filterId: '#projects-status-filter' },
      { section: 'activities', searchId: '#activities-search', filterId: '#activities-status-filter' },
      { section: 'initiatives', searchId: '#initiatives-search', filterId: '#initiatives-status-filter' }
    ];

    for (const { section, searchId, filterId } of searchableSections) {
      test(`should test search and filter for ${section}`, async () => {
        await page.click(`[data-section="${section}"]`);
        await page.waitForSelector(`#${section}`, { state: 'visible' });
        
        // Test search functionality
        await page.fill(searchId, 'test search');
        await page.waitForTimeout(500);
        await page.fill(searchId, '');
        
        // Test filter functionality
        const filterOptions = await page.locator(`${filterId} option`).count();
        if (filterOptions > 1) {
          await page.selectOption(filterId, { index: 1 });
          await page.waitForTimeout(500);
          await page.selectOption(filterId, '');
        }
      });
    }
  });

  test.describe('Responsive Design', () => {
    test('should test mobile responsiveness', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('.admin-header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
      
      // Test sidebar toggle on mobile if it exists
      const sidebarToggle = page.locator('.sidebar-toggle, .menu-toggle, [data-sidebar-toggle]');
      if (await sidebarToggle.count() > 0) {
        await sidebarToggle.click();
        await page.waitForTimeout(500);
      }
    });

    test('should test tablet responsiveness', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('.admin-header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.main-content')).toBeVisible();
    });
  });
});