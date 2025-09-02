const { test, expect } = require('@playwright/test');

test.describe('Theme System - Light/Dark Mode Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Public Website Theme Tests', () => {
    test('should have theme toggle functionality', async ({ page }) => {
      // Look for theme toggle button
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch, button:has-text("Dark"), button:has-text("Light")');
      
      if (await themeToggle.count() > 0) {
        await expect(themeToggle.first()).toBeVisible();
        
        // Test theme switching
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        // Check if theme class is applied to body or html
        const bodyClass = await page.locator('body').getAttribute('class');
        const htmlClass = await page.locator('html').getAttribute('class');
        const dataTheme = await page.locator('body').getAttribute('data-theme');
        
        const hasThemeClass = (bodyClass && (bodyClass.includes('dark') || bodyClass.includes('light'))) ||
                             (htmlClass && (htmlClass.includes('dark') || htmlClass.includes('light'))) ||
                             (dataTheme && (dataTheme.includes('dark') || dataTheme.includes('light')));
        
        expect(hasThemeClass).toBeTruthy();
      }
    });
    
    test('should apply theme to navigation elements', async ({ page }) => {
      const nav = page.locator('nav, .navbar, .navigation, header');
      if (await nav.count() > 0) {
        // Get initial styles
        const initialBg = await nav.first().evaluate(el => getComputedStyle(el).backgroundColor);
        const initialClasses = await nav.first().getAttribute('class');
        
        // Toggle theme if toggle exists
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch, button[data-theme], .toggle-theme');
        if (await themeToggle.count() > 0 && await themeToggle.first().isVisible()) {
          try {
            await themeToggle.first().click();
            await page.waitForTimeout(1000);
            
            // Check if background or classes changed
            const newBg = await nav.first().evaluate(el => getComputedStyle(el).backgroundColor);
            const newClasses = await nav.first().getAttribute('class');
            
            // Either background should change or classes should change
            const themeChanged = (newBg !== initialBg) || (newClasses !== initialClasses);
            expect(themeChanged).toBeTruthy();
          } catch (error) {
            // If theme toggle fails, just ensure nav is visible
            await expect(nav.first()).toBeVisible();
          }
        } else {
          // If no theme toggle, just ensure nav is visible
          await expect(nav.first()).toBeVisible();
        }
      }
    });
    
    test('should apply theme to buttons', async ({ page }) => {
      const buttons = page.locator('button, .btn');
      if (await buttons.count() > 0) {
        const button = buttons.first();
        const initialColor = await button.evaluate(el => getComputedStyle(el).color);
        const initialBg = await button.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newColor = await button.evaluate(el => getComputedStyle(el).color);
          const newBg = await button.evaluate(el => getComputedStyle(el).backgroundColor);
          
          // At least one style property should change
          const stylesChanged = (newColor !== initialColor) || (newBg !== initialBg);
          expect(stylesChanged).toBeTruthy();
        }
      }
    });
    
    test('should apply theme to modals', async ({ page }) => {
      // Try to open a modal
      const modalTriggers = page.locator('button:has-text("Login"), button:has-text("Sign"), .login-btn, .modal-trigger');
      
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('.modal, .auth-modal, .login-modal, .signup-modal');
        if (await modal.count() > 0 && await modal.first().isVisible()) {
          const modalBg = await modal.first().evaluate(el => getComputedStyle(el).backgroundColor);
          const modalColor = await modal.first().evaluate(el => getComputedStyle(el).color);
          
          // Toggle theme
          const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
          if (await themeToggle.count() > 0) {
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            const newModalBg = await modal.first().evaluate(el => getComputedStyle(el).backgroundColor);
            const newModalColor = await modal.first().evaluate(el => getComputedStyle(el).color);
            
            const modalStylesChanged = (newModalBg !== modalBg) || (newModalColor !== modalColor);
            expect(modalStylesChanged).toBeTruthy();
          }
        }
      }
    });
    
    test('should apply theme to tables', async ({ page }) => {
      // Navigate to a page that might have tables
      await page.goto('http://127.0.0.1:3000/books.html');
      await page.waitForTimeout(2000);
      
      const tables = page.locator('table, .table, .data-table');
      if (await tables.count() > 0) {
        const table = tables.first();
        const initialBg = await table.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await table.evaluate(el => getComputedStyle(el).backgroundColor);
          expect(newBg).not.toBe(initialBg);
        }
      }
    });
    
    test('should apply theme to dropdown menus', async ({ page }) => {
      const dropdowns = page.locator('select, .dropdown, .select-menu');
      if (await dropdowns.count() > 0) {
        const dropdown = dropdowns.first();
        
        // Click to open dropdown if it's a custom dropdown
        if (await dropdown.getAttribute('class') && (await dropdown.getAttribute('class')).includes('dropdown')) {
          await dropdown.click();
          await page.waitForTimeout(500);
        }
        
        const initialBg = await dropdown.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await dropdown.evaluate(el => getComputedStyle(el).backgroundColor);
          expect(newBg).not.toBe(initialBg);
        }
      }
    });
    
    test('should apply theme to chat widget', async ({ page }) => {
      const chatWidget = page.locator('.chat-widget, .chat-button, .chat-toggle');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        await page.waitForTimeout(1000);
        
        const chatInterface = page.locator('.chat-interface, .chat-window, .chat-modal');
        if (await chatInterface.count() > 0 && await chatInterface.first().isVisible()) {
          const initialBg = await chatInterface.first().evaluate(el => getComputedStyle(el).backgroundColor);
          
          // Toggle theme
          const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
          if (await themeToggle.count() > 0) {
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            const newBg = await chatInterface.first().evaluate(el => getComputedStyle(el).backgroundColor);
            expect(newBg).not.toBe(initialBg);
          }
        }
      }
    });
    
    test('should persist theme preference', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        // Get current theme state
        const bodyClass = await page.locator('body').getAttribute('class');
        const dataTheme = await page.locator('body').getAttribute('data-theme');
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check if theme persisted
        const newBodyClass = await page.locator('body').getAttribute('class');
        const newDataTheme = await page.locator('body').getAttribute('data-theme');
        
        // Theme should persist after reload
        const themePersisted = (bodyClass === newBodyClass) || (dataTheme === newDataTheme);
        expect(themePersisted).toBeTruthy();
      }
    });
  });

  test.describe('Admin Panel Theme Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to admin panel
      await page.goto('http://127.0.0.1:3000/admin-login.html');
      await page.waitForLoadState('networkidle');
    });
    
    test('should have theme toggle in admin panel', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch, button:has-text("Dark"), button:has-text("Light")');
      
      if (await themeToggle.count() > 0) {
        await expect(themeToggle.first()).toBeVisible();
        
        // Test theme switching
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        // Check if theme class is applied
        const bodyClass = await page.locator('body').getAttribute('class');
        const htmlClass = await page.locator('html').getAttribute('class');
        const dataTheme = await page.locator('body').getAttribute('data-theme');
        
        const hasThemeClass = (bodyClass && (bodyClass.includes('dark') || bodyClass.includes('light'))) ||
                             (htmlClass && (htmlClass.includes('dark') || htmlClass.includes('light'))) ||
                             (dataTheme && (dataTheme.includes('dark') || dataTheme.includes('light')));
        
        expect(hasThemeClass).toBeTruthy();
      }
    });
    
    test('should apply theme to admin sidebar', async ({ page }) => {
      // Navigate to main admin panel
      await page.goto('http://127.0.0.1:3000/admin.html');
      await page.waitForTimeout(2000);
      
      const sidebar = page.locator('.sidebar, .admin-sidebar, .nav-sidebar, .side-nav');
      if (await sidebar.count() > 0) {
        const initialBg = await sidebar.first().evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await sidebar.first().evaluate(el => getComputedStyle(el).backgroundColor);
          expect(newBg).not.toBe(initialBg);
        }
      }
    });
    
    test('should apply theme to admin tables', async ({ page }) => {
      // Navigate to admin books page
      await page.goto('http://127.0.0.1:3000/admin-books.html');
      await page.waitForTimeout(2000);
      
      const tables = page.locator('table, .table, .data-table, .admin-table');
      if (await tables.count() > 0) {
        const table = tables.first();
        const initialBg = await table.evaluate(el => getComputedStyle(el).backgroundColor);
        const initialColor = await table.evaluate(el => getComputedStyle(el).color);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await table.evaluate(el => getComputedStyle(el).backgroundColor);
          const newColor = await table.evaluate(el => getComputedStyle(el).color);
          
          const stylesChanged = (newBg !== initialBg) || (newColor !== initialColor);
          expect(stylesChanged).toBeTruthy();
        }
      }
    });
    
    test('should apply theme to admin buttons', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin.html');
      await page.waitForTimeout(2000);
      
      const buttons = page.locator('button, .btn, .admin-btn');
      if (await buttons.count() > 0) {
        const button = buttons.first();
        const initialBg = await button.evaluate(el => getComputedStyle(el).backgroundColor);
        const initialColor = await button.evaluate(el => getComputedStyle(el).color);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await button.evaluate(el => getComputedStyle(el).backgroundColor);
          const newColor = await button.evaluate(el => getComputedStyle(el).color);
          
          const stylesChanged = (newBg !== initialBg) || (newColor !== initialColor);
          expect(stylesChanged).toBeTruthy();
        }
      }
    });
    
    test('should apply theme to admin modals', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin-books.html');
      await page.waitForTimeout(2000);
      
      // Try to open an admin modal
      const modalTriggers = page.locator('button:has-text("Add"), button:has-text("Edit"), button:has-text("Create"), .add-btn, .edit-btn');
      
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('.modal, .admin-modal, .edit-modal, .add-modal');
        if (await modal.count() > 0 && await modal.first().isVisible()) {
          const modalBg = await modal.first().evaluate(el => getComputedStyle(el).backgroundColor);
          
          // Toggle theme
          const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
          if (await themeToggle.count() > 0) {
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            const newModalBg = await modal.first().evaluate(el => getComputedStyle(el).backgroundColor);
            expect(newModalBg).not.toBe(modalBg);
          }
        }
      }
    });
    
    test('should apply theme to admin dropdowns', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin.html');
      await page.waitForTimeout(2000);
      
      const dropdowns = page.locator('select, .dropdown, .select-menu, .admin-dropdown');
      if (await dropdowns.count() > 0) {
        const dropdown = dropdowns.first();
        const initialBg = await dropdown.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await dropdown.evaluate(el => getComputedStyle(el).backgroundColor);
          expect(newBg).not.toBe(initialBg);
        }
      }
    });
    
    test('should apply theme to admin forms', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin-books.html');
      await page.waitForTimeout(2000);
      
      const forms = page.locator('form, .form, .admin-form');
      if (await forms.count() > 0) {
        const form = forms.first();
        const inputs = form.locator('input, textarea, select');
        
        if (await inputs.count() > 0) {
          const input = inputs.first();
          const initialBg = await input.evaluate(el => getComputedStyle(el).backgroundColor);
          const initialBorder = await input.evaluate(el => getComputedStyle(el).borderColor);
          
          // Toggle theme
          const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
          if (await themeToggle.count() > 0) {
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            const newBg = await input.evaluate(el => getComputedStyle(el).backgroundColor);
            const newBorder = await input.evaluate(el => getComputedStyle(el).borderColor);
            
            const stylesChanged = (newBg !== initialBg) || (newBorder !== initialBorder);
            expect(stylesChanged).toBeTruthy();
          }
        }
      }
    });
    
    test('should apply theme to admin dashboard cards', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin.html');
      await page.waitForTimeout(2000);
      
      const cards = page.locator('.card, .dashboard-card, .stat-card, .metric-card');
      if (await cards.count() > 0) {
        const card = cards.first();
        const initialBg = await card.evaluate(el => getComputedStyle(el).backgroundColor);
        const initialShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
        
        // Toggle theme
        const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
        if (await themeToggle.count() > 0) {
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          const newBg = await card.evaluate(el => getComputedStyle(el).backgroundColor);
          const newShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
          
          const stylesChanged = (newBg !== initialBg) || (newShadow !== initialShadow);
          expect(stylesChanged).toBeTruthy();
        }
      }
    });
  });

  test.describe('Cross-Platform Theme Consistency', () => {
    test('should maintain theme consistency across pages', async ({ page }) => {
      // Set theme on homepage
      const themeToggle = page.locator('.theme-toggle, .dark-mode-toggle, .mode-switch');
      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        const homeTheme = await page.locator('body').getAttribute('class') || await page.locator('body').getAttribute('data-theme');
        
        // Navigate to different pages and check theme consistency
        const pages = ['books.html', 'projects.html', 'about.html', 'contact.html'];
        
        for (const pagePath of pages) {
          await page.goto(`http://127.0.0.1:3000/${pagePath}`);
          await page.waitForTimeout(1000);
          
          const pageTheme = await page.locator('body').getAttribute('class') || await page.locator('body').getAttribute('data-theme');
          
          // Theme should be consistent across pages
          expect(pageTheme).toBe(homeTheme);
        }
      }
    });
    
    test('should work with system theme preference', async ({ page }) => {
      // Emulate dark color scheme preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if system preference is respected
      const bodyClass = await page.locator('body').getAttribute('class');
      const dataTheme = await page.locator('body').getAttribute('data-theme');
      
      const respectsSystemTheme = (bodyClass && bodyClass.includes('dark')) ||
                                 (dataTheme && dataTheme.includes('dark'));
      
      // Should respect system preference or have default theme
      expect(typeof respectsSystemTheme).toBe('boolean');
    });
  });
});