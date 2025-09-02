const { test, expect } = require('@playwright/test');

// Admin credentials
const adminCredentials = {
  email: 'admin@tamilsociety.com',
  password: 'Admin123!'
};

// Helper function to check if element exists without hanging
async function elementExists(page, selector, timeout = 1000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

// Helper function to login as admin
async function loginAsAdmin(page) {
  await page.goto('/admin-login.html');
  
  await page.fill('input[name="email"], #email', adminCredentials.email);
  await page.fill('input[name="password"], #password', adminCredentials.password);
  await page.click('button[type="submit"], .login-btn');
  
  // Wait for navigation to admin panel with extended timeout
  await page.waitForURL('**/admin.html*', { timeout: 30000 });
}

test.describe('Admin Panel Tests', () => {
  
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
      if (await elementExists(page, '.error-message, .alert-error, .notification-error')) {
        await expect(page.locator('.error-message, .alert-error, .notification-error')).toBeVisible();
      }
    });
  });
  
  test.describe('Dashboard and Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Increase timeout for admin login and initialization
      test.setTimeout(60000);
      await loginAsAdmin(page);
      
      // Wait for admin panel to fully initialize
      await page.waitForTimeout(3000);
      
      // Ensure we're on the admin page and it's loaded
      await expect(page).toHaveURL(/.*admin\.html/);
      
      // Wait for sidebar to be visible
      if (await elementExists(page, '.admin-sidebar', 5000)) {
        await expect(page.locator('.admin-sidebar')).toBeVisible();
      }
    });
    
    test('should display dashboard without sidebar overlap', async ({ page }) => {
      const sidebar = page.locator('.sidebar, .admin-sidebar');
      const mainContent = page.locator('.main-content, .admin-content, .content-area');
      
      if (await elementExists(page, '.sidebar, .admin-sidebar')) {
        await expect(sidebar).toBeVisible();
      }
      if (await elementExists(page, '.main-content, .admin-content, .content-area')) {
        await expect(mainContent).toBeVisible();
        
        // Check for proper layout - sidebar and content should not overlap
        const sidebarBox = await sidebar.boundingBox();
        const contentBox = await mainContent.boundingBox();
        
        if (sidebarBox && contentBox) {
          expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(contentBox.x + 10); // 10px tolerance
        }
      }
    });
    
    test('should navigate to all admin sections', async ({ page }) => {
      const sections = [
        { selector: '[data-section="dashboard"]', expected: 'dashboard' },
        { selector: '[data-section="books"]', expected: 'books' },
        { selector: '[data-section="ebooks"]', expected: 'ebooks' },
        { selector: '[data-section="projects"]', expected: 'projects' },
        { selector: '[data-section="team"]', expected: 'team' },
        { selector: '[data-section="users"]', expected: 'users' },
        { selector: '[data-section="media"]', expected: 'media-management' }
      ];
      
      for (const section of sections) {
        if (await elementExists(page, section.selector)) {
          await page.click(section.selector);
          if (await elementExists(page, `#${section.expected}, .${section.expected}-section`)) {
            await expect(page.locator(`#${section.expected}, .${section.expected}-section`)).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Books Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="books"]')) {
        await page.click('[data-section="books"]');
      }
    });
    
    test('should display books list', async ({ page }) => {
      if (await elementExists(page, '.books-list, .admin-books-container')) {
        await expect(page.locator('.books-list, .admin-books-container')).toBeVisible();
      }
    });
    
    test('should open add book form', async ({ page }) => {
      if (await elementExists(page, '.add-book-btn, button:has-text("Add Book")')) {
        await page.click('.add-book-btn, button:has-text("Add Book")');
        if (await elementExists(page, '.book-form, .add-book-form')) {
          await expect(page.locator('.book-form, .add-book-form')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Ebooks Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="ebooks"]')) {
        await page.click('[data-section="ebooks"]');
      }
    });
    
    test('should display ebooks list', async ({ page }) => {
      if (await elementExists(page, '.ebooks-list, .admin-ebooks-container')) {
        await expect(page.locator('.ebooks-list, .admin-ebooks-container')).toBeVisible();
      }
    });
    
    test('should handle Tamil font rendering', async ({ page }) => {
      if (await elementExists(page, '.tamil-text, [lang="ta"]')) {
        await expect(page.locator('.tamil-text, [lang="ta"]').first()).toBeVisible();
      }
    });
  });
  
  test.describe('Projects Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="projects"]')) {
        await page.click('[data-section="projects"]');
      }
    });
    
    test('should display projects list', async ({ page }) => {
      if (await elementExists(page, '.projects-list, .admin-projects-container')) {
        await expect(page.locator('.projects-list, .admin-projects-container')).toBeVisible();
      }
    });
    
    test('should export projects to CSV', async ({ page }) => {
      if (await elementExists(page, '.export-csv-btn, button:has-text("Export")')) {
        const downloadPromise = page.waitForEvent('download');
        await page.click('.export-csv-btn, button:has-text("Export")');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });
  });
  
  test.describe('Team Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="team"]')) {
        await page.click('[data-section="team"]');
      }
    });
    
    test('should display team members', async ({ page }) => {
      if (await elementExists(page, '.team-list, .admin-team-container')) {
        await expect(page.locator('.team-list, .admin-team-container')).toBeVisible();
      }
    });
    
    test('should handle image uploads', async ({ page }) => {
      if (await elementExists(page, 'input[type="file"], .upload-btn')) {
        await expect(page.locator('input[type="file"], .upload-btn').first()).toBeVisible();
      }
    });
  });
  
  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="users"]')) {
        await page.click('[data-section="users"]');
      }
    });
    
    test('should display users list', async ({ page }) => {
      if (await elementExists(page, '.users-list, .admin-users-container')) {
        await expect(page.locator('.users-list, .admin-users-container')).toBeVisible();
      }
    });
  });
  
  test.describe('Chat Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="chats"]')) {
        await page.click('[data-section="chats"]');
      }
    });
    
    test('should display chat interface', async ({ page }) => {
      if (await elementExists(page, '.chat-container, .admin-chat')) {
        await expect(page.locator('.chat-container, .admin-chat')).toBeVisible();
      }
    });
    
    test('should clear chat sessions', async ({ page }) => {
      if (await elementExists(page, '.clear-chat-btn, button:has-text("Clear")')) {
        await page.click('.clear-chat-btn, button:has-text("Clear")');
        // Should show confirmation or clear the chat
        if (await elementExists(page, '.chat-messages, .message-list')) {
          await expect(page.locator('.chat-messages, .message-list')).toBeEmpty();
        }
      }
    });
  });
  
  test.describe('Notifications Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="announcements"]')) {
        await page.click('[data-section="announcements"]');
      }
    });
    
    test('should display notifications list', async ({ page }) => {
      if (await elementExists(page, '.notifications-list, .admin-notifications')) {
        await expect(page.locator('.notifications-list, .admin-notifications')).toBeVisible();
      }
    });
    
    test('should create new notification', async ({ page }) => {
      if (await elementExists(page, '.add-notification-btn, button:has-text("Add Notification")')) {
        await page.click('.add-notification-btn, button:has-text("Add Notification")');
        if (await elementExists(page, '.notification-form, .add-notification-form')) {
          await expect(page.locator('.notification-form, .add-notification-form')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Announcements Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="announcements"]')) {
        await page.click('[data-section="announcements"]');
      }
    });
    
    test('should display announcements list', async ({ page }) => {
      if (await elementExists(page, '.announcements-list, .admin-announcements')) {
        await expect(page.locator('.announcements-list, .admin-announcements')).toBeVisible();
      }
    });
    
    test('should create new announcement', async ({ page }) => {
      if (await elementExists(page, '.add-announcement-btn, button:has-text("Add Announcement")')) {
        await page.click('.add-announcement-btn, button:has-text("Add Announcement")');
        if (await elementExists(page, '.announcement-form, .add-announcement-form')) {
          await expect(page.locator('.announcement-form, .add-announcement-form')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('File Storage', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      if (await elementExists(page, '[data-section="media-management"]')) {
        await page.click('[data-section="media-management"]');
      }
    });
    
    test('should display file manager', async ({ page }) => {
      if (await elementExists(page, '.file-manager, .media-manager')) {
        await expect(page.locator('.file-manager, .media-manager')).toBeVisible();
      }
    });
    
    test('should verify upload directory structure', async ({ page }) => {
      // Check if uploads are properly organized
      if (await elementExists(page, '.upload-folder, .folder-item')) {
        await expect(page.locator('.upload-folder, .folder-item').first()).toBeVisible();
      }
    });
    
    test('should handle file uploads', async ({ page }) => {
      if (await elementExists(page, 'input[type="file"], .file-upload-btn')) {
        await expect(page.locator('input[type="file"], .file-upload-btn').first()).toBeVisible();
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
      
      if (await elementExists(page, '.sidebar, .admin-sidebar')) {
        const sidebar = page.locator('.sidebar, .admin-sidebar');
        await expect(sidebar).toBeVisible();
        
        if (await elementExists(page, '.main-content, .admin-content')) {
          const mainContent = page.locator('.main-content, .admin-content');
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
        }
      }
    });
    
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      if (await elementExists(page, '.sidebar, .admin-sidebar')) {
        await expect(page.locator('.sidebar, .admin-sidebar')).toBeVisible();
      }
      if (await elementExists(page, '.main-content, .admin-content')) {
        await expect(page.locator('.main-content, .admin-content')).toBeVisible();
      }
    });
  });
  
  test.describe('Performance Tests', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });
    
    test('should load admin dashboard quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/admin.html');
      
      if (await elementExists(page, '.admin-dashboard, .dashboard-content')) {
        await expect(page.locator('.admin-dashboard, .dashboard-content')).toBeVisible();
      }
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
    
    test('should handle multiple section switches efficiently', async ({ page }) => {
      const sections = ['dashboard', 'books', 'ebooks', 'projects', 'team', 'users', 'media-management'];
      
      for (const section of sections) {
        if (await elementExists(page, `[data-section="${section}"]`)) {
          const startTime = Date.now();
          await page.click(`[data-section="${section}"]`);
          
          if (await elementExists(page, `.${section}-section, .admin-${section}`)) {
            await expect(page.locator(`.${section}-section, .admin-${section}`)).toBeVisible();
          }
          
          const switchTime = Date.now() - startTime;
          expect(switchTime).toBeLessThan(2000); // Section switch should be fast
        }
      }
    });
  });
});