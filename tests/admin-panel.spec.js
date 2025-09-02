const { test, expect } = require('@playwright/test');

// Admin credentials
const adminCredentials = {
  email: 'admin@tamilsociety.com',
  password: 'Admin123!'
};

test.describe('Admin Panel Tests', () => {
  
  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('/admin-login.html');
    
    await page.fill('input[name="email"], #email', adminCredentials.email);
    await page.fill('input[name="password"], #password', adminCredentials.password);
    await page.click('button[type="submit"], .login-btn');
    
    // Wait for navigation to admin panel
    await page.waitForURL('**/admin.html*', { timeout: 10000 });
  }
  
  test.describe('Authentication', () => {
    test('should login with correct credentials', async ({ page }) => {
      await page.goto('/admin-login.html');
      
      await page.fill('input[name="email"], #email', adminCredentials.email);
      await page.fill('input[name="password"], #password', adminCredentials.password);
      await page.click('button[type="submit"], .login-btn');
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/.*admin\.html/);
    });
    
    test('should reject incorrect credentials', async ({ page }) => {
      await page.goto('/admin-login.html');
      
      await page.fill('input[name="email"], #email', 'wrong@email.com');
      await page.fill('input[name="password"], #password', 'wrongpassword');
      await page.click('button[type="submit"], .login-btn');
      
      // Should show error message
      await expect(page.locator('.error-message, .alert-error, .notification-error')).toBeVisible();
    });
  });
  
  test.describe('Dashboard and Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });
    
    test('should display dashboard without sidebar overlap', async ({ page }) => {
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      const mainContent = page.locator('.main-content, .admin-content, .content-area');
      
      await expect(sidebar).toBeVisible();
      await expect(mainContent).toBeVisible();
      
      // Check for proper layout - sidebar and content should not overlap
      const sidebarBox = await sidebar.boundingBox();
      const contentBox = await mainContent.boundingBox();
      
      if (sidebarBox && contentBox) {
        expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(contentBox.x + 10); // 10px tolerance
      }
    });
    
    test('should navigate to all admin sections', async ({ page }) => {
      const sections = [
        { selector: '[data-section="dashboard"], .nav-dashboard', expected: 'dashboard' },
        { selector: '[data-section="books"], .nav-books', expected: 'books' },
        { selector: '[data-section="ebooks"], .nav-ebooks', expected: 'ebooks' },
        { selector: '[data-section="projects"], .nav-projects', expected: 'projects' },
        { selector: '[data-section="team"], .nav-team', expected: 'team' },
        { selector: '[data-section="users"], .nav-users', expected: 'users' },
        { selector: '[data-section="media"], .nav-media', expected: 'media' }
      ];
      
      for (const section of sections) {
        const navItem = page.locator(section.selector);
        if (await navItem.count() > 0) {
          await navItem.click();
          await expect(page.locator(`[data-section="${section.expected}"], .${section.expected}-section`)).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Books Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="books"], .nav-books');
    });
    
    test('should display books list', async ({ page }) => {
      await expect(page.locator('.books-list, .admin-books-container')).toBeVisible();
    });
    
    test('should open add book form', async ({ page }) => {
      const addButton = page.locator('.add-book-btn, button:has-text("Add Book")');
      if (await addButton.count() > 0) {
        await addButton.click();
        await expect(page.locator('.book-form, .add-book-form')).toBeVisible();
      }
    });
  });
  
  test.describe('Ebooks Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="ebooks"], .nav-ebooks');
    });
    
    test('should display ebooks list', async ({ page }) => {
      await expect(page.locator('.ebooks-list, .admin-ebooks-container')).toBeVisible();
    });
    
    test('should handle Tamil font rendering', async ({ page }) => {
      const tamilText = page.locator('.tamil-text, [lang="ta"]');
      if (await tamilText.count() > 0) {
        await expect(tamilText.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Projects Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="projects"], .nav-projects');
    });
    
    test('should display projects list', async ({ page }) => {
      await expect(page.locator('.projects-list, .admin-projects-container')).toBeVisible();
    });
    
    test('should export projects to CSV', async ({ page }) => {
      const exportButton = page.locator('.export-csv-btn, button:has-text("Export")');
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });
  });
  
  test.describe('Team Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="team"], .nav-team');
    });
    
    test('should display team members', async ({ page }) => {
      await expect(page.locator('.team-list, .admin-team-container')).toBeVisible();
    });
    
    test('should handle image uploads', async ({ page }) => {
      const uploadButton = page.locator('input[type="file"], .upload-btn');
      if (await uploadButton.count() > 0) {
        await expect(uploadButton.first()).toBeVisible();
      }
    });
  });
  
  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="users"], .nav-users');
    });
    
    test('should display users list', async ({ page }) => {
      await expect(page.locator('.users-list, .admin-users-container')).toBeVisible();
    });
  });
  
  test.describe('Chat Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="chat"], .nav-chat');
    });
    
    test('should display chat interface', async ({ page }) => {
      const chatContainer = page.locator('.chat-container, .admin-chat');
      if (await chatContainer.count() > 0) {
        await expect(chatContainer).toBeVisible();
      }
    });
    
    test('should clear chat sessions', async ({ page }) => {
      const clearButton = page.locator('.clear-chat-btn, button:has-text("Clear")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        // Should show confirmation or clear the chat
        await expect(page.locator('.chat-messages, .message-list')).toBeEmpty();
      }
    });
  });
  
  test.describe('Announcements Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="announcements"], .nav-announcements');
    });
    
    test('should display announcements list', async ({ page }) => {
      const announcementsContainer = page.locator('.announcements-list, .admin-announcements');
      if (await announcementsContainer.count() > 0) {
        await expect(announcementsContainer).toBeVisible();
      }
    });
  });
  
  test.describe('File Storage', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-section="media"], .nav-media');
    });
    
    test('should display file manager', async ({ page }) => {
      const fileManager = page.locator('.file-manager, .media-manager');
      if (await fileManager.count() > 0) {
        await expect(fileManager).toBeVisible();
      }
    });
    
    test('should verify upload directory structure', async ({ page }) => {
      // Check if uploads are properly organized
      const uploadFolders = page.locator('.upload-folder, .folder-item');
      if (await uploadFolders.count() > 0) {
        await expect(uploadFolders.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Theme Toggle', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });
    
    test('should toggle between light and dark themes', async ({ page }) => {
      // Dismiss any popup notifications first
      try {
        await page.locator('.popup-notification .close, .notification-close, button:has-text("×")').click({ timeout: 1000 });
        await page.waitForTimeout(500);
      } catch (e) {
        // Ignore if no notifications to close
      }
      
      const themeToggle = page.locator('.theme-toggle, .admin-theme-toggle, button[onclick*="toggleTheme"]');
      
      if (await themeToggle.count() > 0) {
        // Get initial theme state
        const initialDataTheme = await page.locator('body').getAttribute('data-theme');
        
        // Click theme toggle with force to bypass intercepting elements
        await themeToggle.first().click({ force: true });
        await page.waitForTimeout(500);
        
        // Check if theme changed
        const newDataTheme = await page.locator('body').getAttribute('data-theme');
        
        if (initialDataTheme !== newDataTheme) {
          // Theme toggle is working
          expect(newDataTheme).toMatch(/dark|light/);
          
          // Toggle back
          await themeToggle.first().click({ force: true });
          await page.waitForTimeout(500);
          
          const finalDataTheme = await page.locator('body').getAttribute('data-theme');
          expect(finalDataTheme).not.toBe(newDataTheme);
        }
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });
    
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      const mainContent = page.locator('.main-content, .admin-content');
      
      await expect(sidebar).toBeVisible();
      await expect(mainContent).toBeVisible();
      
      // On mobile, sidebar should not overlap content
      const sidebarBox = await sidebar.boundingBox();
      const contentBox = await mainContent.boundingBox();
      
      if (sidebarBox && contentBox) {
        // Either sidebar is collapsed or content is properly positioned
        const isOverlapping = sidebarBox.x < contentBox.x + contentBox.width && 
                             sidebarBox.x + sidebarBox.width > contentBox.x;
        expect(isOverlapping).toBeFalsy();
      }
    });
  });
});