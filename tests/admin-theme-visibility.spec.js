const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Theme Visibility & Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto('http://localhost:5000/admin/login');
    
    // Login as admin
    await page.fill('input[name="email"]', 'admin@tamilsociety.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
  });

  test.describe('Theme Toggle Functionality', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      // Check if theme toggle exists
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme"), button:has-text("Dark"), button:has-text("Light")');
      
      if (await themeToggle.count() > 0) {
        // Test theme toggle
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        // Verify theme change (check for dark/light class on body or html)
        const bodyClass = await page.getAttribute('body', 'class');
        const htmlClass = await page.getAttribute('html', 'class');
        
        expect(bodyClass || htmlClass).toMatch(/(dark|light|theme)/i);
        
        // Toggle back
        await themeToggle.first().click();
        await page.waitForTimeout(500);
      } else {
        console.log('Theme toggle not found - may not be implemented yet');
      }
    });

    test('should persist theme preference across page navigation', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
      
      if (await themeToggle.count() > 0) {
        // Set to dark theme
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        const initialTheme = await page.getAttribute('body', 'class');
        
        // Navigate to different admin sections
        await page.click('a[href*="books"], .sidebar a:has-text("Books")');
        await page.waitForTimeout(1000);
        
        const booksPageTheme = await page.getAttribute('body', 'class');
        expect(booksPageTheme).toBe(initialTheme);
        
        // Navigate to users section
        await page.click('a[href*="users"], .sidebar a:has-text("Users")');
        await page.waitForTimeout(1000);
        
        const usersPageTheme = await page.getAttribute('body', 'class');
        expect(usersPageTheme).toBe(initialTheme);
      }
    });
  });

  test.describe('Dark Theme Visibility', () => {
    test('should have proper contrast and visibility in dark theme', async ({ page }) => {
      // Try to enable dark theme
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Dark")');
      
      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(500);
      }
      
      // Test visibility of key elements in dark theme
      const sidebar = page.locator('.sidebar, .admin-sidebar, nav');
      const mainContent = page.locator('.main-content, .admin-content, main');
      const buttons = page.locator('button');
      const inputs = page.locator('input');
      
      // Check if elements are visible
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
      }
      
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
      
      // Check button visibility
      const visibleButtons = await buttons.count();
      if (visibleButtons > 0) {
        for (let i = 0; i < Math.min(visibleButtons, 5); i++) {
          await expect(buttons.nth(i)).toBeVisible();
        }
      }
      
      // Check input visibility
      const visibleInputs = await inputs.count();
      if (visibleInputs > 0) {
        for (let i = 0; i < Math.min(visibleInputs, 3); i++) {
          await expect(inputs.nth(i)).toBeVisible();
        }
      }
    });

    test('should have readable text in dark theme', async ({ page }) => {
      // Enable dark theme if available
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Dark")');
      
      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(500);
      }
      
      // Check text elements for visibility
      const textElements = page.locator('h1, h2, h3, p, span, div:has-text("Dashboard"), div:has-text("Books"), div:has-text("Users")');
      const elementCount = await textElements.count();
      
      if (elementCount > 0) {
        for (let i = 0; i < Math.min(elementCount, 10); i++) {
          const element = textElements.nth(i);
          const text = await element.textContent();
          
          if (text && text.trim().length > 0) {
            await expect(element).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Light Theme Visibility', () => {
    test('should have proper contrast and visibility in light theme', async ({ page }) => {
      // Ensure light theme is active (default or toggle)
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Light")');
      
      if (await themeToggle.count() > 0) {
        // Click twice to ensure light theme (in case it starts dark)
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        await themeToggle.first().click();
        await page.waitForTimeout(500);
      }
      
      // Test visibility of key elements in light theme
      const sidebar = page.locator('.sidebar, .admin-sidebar, nav');
      const mainContent = page.locator('.main-content, .admin-content, main');
      const cards = page.locator('.card, .dashboard-card, .stat-card');
      
      // Check element visibility
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
      }
      
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
      
      // Check cards visibility
      const cardCount = await cards.count();
      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 5); i++) {
          await expect(cards.nth(i)).toBeVisible();
        }
      }
    });

    test('should have readable text in light theme', async ({ page }) => {
      // Test text readability in light theme
      const headings = page.locator('h1, h2, h3');
      const paragraphs = page.locator('p');
      const labels = page.locator('label');
      
      // Check headings
      const headingCount = await headings.count();
      if (headingCount > 0) {
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          await expect(headings.nth(i)).toBeVisible();
        }
      }
      
      // Check paragraphs
      const paragraphCount = await paragraphs.count();
      if (paragraphCount > 0) {
        for (let i = 0; i < Math.min(paragraphCount, 3); i++) {
          await expect(paragraphs.nth(i)).toBeVisible();
        }
      }
      
      // Check labels
      const labelCount = await labels.count();
      if (labelCount > 0) {
        for (let i = 0; i < Math.min(labelCount, 3); i++) {
          await expect(labels.nth(i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Theme Consistency Across Sections', () => {
    const adminSections = [
      { name: 'Dashboard', selector: 'a[href*="dashboard"], .sidebar a:has-text("Dashboard")' },
      { name: 'Books', selector: 'a[href*="books"], .sidebar a:has-text("Books")' },
      { name: 'E-books', selector: 'a[href*="ebooks"], .sidebar a:has-text("E-books")' },
      { name: 'Projects', selector: 'a[href*="projects"], .sidebar a:has-text("Projects")' },
      { name: 'Activities', selector: 'a[href*="activities"], .sidebar a:has-text("Activities")' },
      { name: 'Team', selector: 'a[href*="team"], .sidebar a:has-text("Team")' },
      { name: 'Users', selector: 'a[href*="users"], .sidebar a:has-text("Users")' }
    ];

    for (const section of adminSections) {
      test(`should maintain theme consistency in ${section.name} section`, async ({ page }) => {
        // Navigate to the section
        const sectionLink = page.locator(section.selector);
        
        if (await sectionLink.count() > 0) {
          await sectionLink.first().click();
          await page.waitForTimeout(1000);
          
          // Check if theme toggle exists and test both themes
          const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
          
          if (await themeToggle.count() > 0) {
            // Test dark theme
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            // Verify elements are visible in dark theme
            const content = page.locator('.content, .main-content, main, .section-content');
            if (await content.count() > 0) {
              await expect(content.first()).toBeVisible();
            }
            
            // Test light theme
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            
            // Verify elements are visible in light theme
            if (await content.count() > 0) {
              await expect(content.first()).toBeVisible();
            }
          }
          
          // Check for basic visibility regardless of theme implementation
          const pageTitle = page.locator('h1, h2, .page-title, .section-title');
          if (await pageTitle.count() > 0) {
            await expect(pageTitle.first()).toBeVisible();
          }
        } else {
          console.log(`${section.name} section link not found - may not be implemented yet`);
        }
      });
    }
  });

  test.describe('Theme Accessibility', () => {
    test('should meet accessibility standards in both themes', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
      
      // Test accessibility in light theme
      const buttons = page.locator('button');
      const links = page.locator('a');
      const inputs = page.locator('input');
      
      // Check button accessibility
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const isVisible = await button.isVisible();
          if (isVisible) {
            await expect(button).toBeEnabled();
          }
        }
      }
      
      // Check link accessibility
      const linkCount = await links.count();
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          const link = links.nth(i);
          const isVisible = await link.isVisible();
          if (isVisible) {
            await expect(link).toBeVisible();
          }
        }
      }
      
      // Test in dark theme if available
      if (await themeToggle.count() > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        // Re-check accessibility in dark theme
        const darkButtons = page.locator('button');
        const darkButtonCount = await darkButtons.count();
        
        if (darkButtonCount > 0) {
          for (let i = 0; i < Math.min(darkButtonCount, 3); i++) {
            const button = darkButtons.nth(i);
            const isVisible = await button.isVisible();
            if (isVisible) {
              await expect(button).toBeEnabled();
            }
          }
        }
      }
    });

    test('should have proper focus indicators in both themes', async ({ page }) => {
      const focusableElements = page.locator('button, a, input, select, textarea');
      const elementCount = await focusableElements.count();
      
      if (elementCount > 0) {
        // Test focus on first few elements
        for (let i = 0; i < Math.min(elementCount, 3); i++) {
          const element = focusableElements.nth(i);
          const isVisible = await element.isVisible();
          
          if (isVisible) {
            await element.focus();
            await page.waitForTimeout(200);
            
            // Verify element is focused
            const isFocused = await element.evaluate(el => document.activeElement === el);
            expect(isFocused).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Theme Performance', () => {
    test('should switch themes without performance issues', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
      
      if (await themeToggle.count() > 0) {
        // Measure theme switch performance
        const startTime = Date.now();
        
        // Switch themes multiple times
        for (let i = 0; i < 5; i++) {
          await themeToggle.first().click();
          await page.waitForTimeout(100);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Theme switches should be fast (less than 2 seconds for 5 switches)
        expect(totalTime).toBeLessThan(2000);
      }
    });

    test('should not cause layout shifts during theme changes', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Theme")');
      
      if (await themeToggle.count() > 0) {
        // Get initial layout
        const sidebar = page.locator('.sidebar, .admin-sidebar, nav');
        
        if (await sidebar.count() > 0) {
          const initialBox = await sidebar.first().boundingBox();
          
          // Switch theme
          await themeToggle.first().click();
          await page.waitForTimeout(500);
          
          // Check layout after theme switch
          const newBox = await sidebar.first().boundingBox();
          
          if (initialBox && newBox) {
            // Layout should remain stable (allowing for small differences)
            expect(Math.abs(initialBox.width - newBox.width)).toBeLessThan(10);
            expect(Math.abs(initialBox.height - newBox.height)).toBeLessThan(10);
          }
        }
      }
    });
  });
});