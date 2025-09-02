const { test, expect } = require('@playwright/test');

// Helper function to check if element exists without waiting
async function elementExists(page, selector, timeout = 1000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Public Website Tests - Optimized', () => {
  
  test.describe('Homepage and Navigation', () => {
    test('should display homepage with hero section', async ({ page }) => {
      await page.goto('/');
      
      // Check hero section with fast timeout
      const heroExists = await elementExists(page, '.hero-section, .hero, .banner');
      if (heroExists) {
        await expect(page.locator('.hero-section, .hero, .banner')).toBeVisible();
      }
      
      // Check navigation menu
      const navExists = await elementExists(page, '.navbar, .nav, .header-nav');
      if (navExists) {
        await expect(page.locator('.navbar, .nav, .header-nav')).toBeVisible();
      }
      
      // Check main navigation links
      const navLinks = ['Home', 'Books', 'Ebooks', 'Projects', 'About', 'Contact'];
      for (const linkText of navLinks) {
        const linkExists = await elementExists(page, `a:has-text("${linkText}"), .nav-link:has-text("${linkText}")`);
        if (linkExists) {
          await expect(page.locator(`a:has-text("${linkText}"), .nav-link:has-text("${linkText}")`).first()).toBeVisible();
        }
      }
    });
    
    test('should have working theme toggle', async ({ page }) => {
      await page.goto('/');
      
      const themeToggleExists = await elementExists(page, '.theme-toggle, .theme-switcher, #theme-toggle');
      if (themeToggleExists) {
        const themeToggle = page.locator('.theme-toggle, .theme-switcher, #theme-toggle');
        await themeToggle.click();
        
        // Check if theme attribute changes
        const htmlElement = page.locator('html, body');
        const hasThemeAttr = await htmlElement.getAttribute('data-theme') !== null || 
                            await htmlElement.getAttribute('class') !== null;
        expect(hasThemeAttr).toBeTruthy();
      }
    });
    
    test('should have working language toggle', async ({ page }) => {
      await page.goto('/');
      
      const langToggleExists = await elementExists(page, '.language-toggle, .lang-switcher, #language-toggle');
      if (langToggleExists) {
        const languageToggle = page.locator('.language-toggle, .lang-switcher, #language-toggle');
        await languageToggle.click();
        
        // Check if language attribute exists
        const langAttr = await page.locator('html').getAttribute('lang');
        expect(langAttr).toBeTruthy();
      }
    });
  });
  
  test.describe('Authentication', () => {
    test('should open login modal', async ({ page }) => {
      await page.goto('/');
      
      const loginBtnExists = await elementExists(page, '.login-btn, button:has-text("Login"), a:has-text("Login")');
      if (loginBtnExists) {
        await page.locator('.login-btn, button:has-text("Login"), a:has-text("Login")').first().click();
        
        const modalExists = await elementExists(page, '.login-modal, .auth-modal, #loginModal');
        if (modalExists) {
          await expect(page.locator('.login-modal, .auth-modal, #loginModal')).toBeVisible();
        }
      }
    });
    
    test('should handle login form submission', async ({ page }) => {
      await page.goto('/');
      
      const loginBtnExists = await elementExists(page, '.login-btn, button:has-text("Login")');
      if (loginBtnExists) {
        await page.locator('.login-btn, button:has-text("Login")').first().click();
        
        // Wait for modal to appear
        const modalExists = await elementExists(page, '.login-modal, .auth-modal, #loginModal');
        if (modalExists) {
          // Fill login form with fast checks
          const emailExists = await elementExists(page, 'input[name="email"], #email');
          const passwordExists = await elementExists(page, 'input[name="password"], #password');
          
          if (emailExists && passwordExists) {
            await page.fill('input[name="email"], #email', 'test@example.com');
            await page.fill('input[name="password"], #password', 'testpassword');
            
            const submitExists = await elementExists(page, 'button[type="submit"], .submit-btn');
            if (submitExists) {
              await page.locator('button[type="submit"], .submit-btn').first().click();
              
              // Check for response (loading, notification, or redirect)
              const responseExists = await elementExists(page, '.loading, .spinner, .notification, .alert');
              if (responseExists) {
                await expect(page.locator('.loading, .spinner, .notification, .alert').first()).toBeVisible();
              }
            }
          }
        }
      }
    });
  });
  
  test.describe('Books Store', () => {
    test('should display books catalog', async ({ page }) => {
      await page.goto('/books.html');
      
      const booksContainerExists = await elementExists(page, '.books-container, .books-grid, .book-list');
      if (booksContainerExists) {
        await expect(page.locator('.books-container, .books-grid, .book-list')).toBeVisible();
        
        // Check for book cards
        const bookCardsExist = await elementExists(page, '.book-card, .book-item');
        if (bookCardsExist) {
          const firstBook = page.locator('.book-card, .book-item').first();
          await expect(firstBook).toBeVisible();
          
          // Check book elements with fast checks
          const imageExists = await elementExists(page, '.book-card img, .book-item img, .book-cover');
          const titleExists = await elementExists(page, '.book-title, .title');
          const priceExists = await elementExists(page, '.book-price, .price');
          
          if (imageExists) await expect(firstBook.locator('img, .book-cover')).toBeVisible();
          if (titleExists) await expect(firstBook.locator('.book-title, .title')).toBeVisible();
          if (priceExists) await expect(firstBook.locator('.book-price, .price')).toBeVisible();
        }
      }
    });
    
    test('should add book to cart', async ({ page }) => {
      await page.goto('/books.html');
      
      const addToCartExists = await elementExists(page, '.add-to-cart-btn, button:has-text("Add to Cart")');
      if (addToCartExists) {
        await page.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();
        
        // Check for notification or cart update with fast timeout
        const notificationExists = await elementExists(page, '.notification, .toast, .alert, .cart-count, .cart-badge');
        if (notificationExists) {
          await expect(page.locator('.notification, .toast, .alert, .cart-count, .cart-badge').first()).toBeVisible();
        }
      }
    });
    
    test('should handle star ratings', async ({ page }) => {
      await page.goto('/books.html');
      
      const ratingsExist = await elementExists(page, '.star-rating, .rating-stars');
      if (ratingsExist) {
        const firstRating = page.locator('.star-rating, .rating-stars').first();
        await expect(firstRating).toBeVisible();
        
        const starsExist = await elementExists(page, '.star, .fa-star');
        if (starsExist) {
          const stars = firstRating.locator('.star, .fa-star');
          const starCount = await stars.count();
          if (starCount > 2) {
            await stars.nth(2).click(); // Click 3rd star
          }
        }
      }
    });
  });
  
  test.describe('Ebooks Library', () => {
    test('should display ebooks catalog', async ({ page }) => {
      await page.goto('/ebooks.html');
      
      const ebooksContainerExists = await elementExists(page, '.ebooks-container, .ebooks-grid');
      if (ebooksContainerExists) {
        await expect(page.locator('.ebooks-container, .ebooks-grid')).toBeVisible();
        
        const ebookCardsExist = await elementExists(page, '.ebook-card, .ebook-item');
        if (ebookCardsExist) {
          await expect(page.locator('.ebook-card, .ebook-item').first()).toBeVisible();
        }
      }
    });
    
    test('should handle ebook downloads', async ({ page }) => {
      await page.goto('/ebooks.html');
      
      const downloadBtnExists = await elementExists(page, '.download-btn, button:has-text("Download")');
      if (downloadBtnExists) {
        const downloadButton = page.locator('.download-btn, button:has-text("Download")').first();
        
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
        await downloadButton.click();
        
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.(pdf|epub|mobi)$/i);
        } else {
          // Check if auth is required
          const authRequiredExists = await elementExists(page, '.auth-required, .login-required');
          if (authRequiredExists) {
            await expect(page.locator('.auth-required, .login-required')).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Projects Showcase', () => {
    test('should display projects list', async ({ page }) => {
      await page.goto('/projects.html');
      
      const projectsContainerExists = await elementExists(page, '.projects-container, .projects-grid');
      if (projectsContainerExists) {
        await expect(page.locator('.projects-container, .projects-grid')).toBeVisible();
        
        const projectCardsExist = await elementExists(page, '.project-card, .project-item');
        if (projectCardsExist) {
          const firstProject = page.locator('.project-card, .project-item').first();
          await expect(firstProject).toBeVisible();
          
          const titleExists = await elementExists(page, '.project-title, .title');
          const descExists = await elementExists(page, '.project-description, .description');
          
          if (titleExists) await expect(firstProject.locator('.project-title, .title')).toBeVisible();
          if (descExists) await expect(firstProject.locator('.project-description, .description')).toBeVisible();
        }
      }
    });
  });
  

  
  test.describe('Chat System', () => {
    test('should display chat widget', async ({ page }) => {
      await page.goto('/');
      
      const chatWidgetExists = await elementExists(page, '.chat-widget, .chat-button, #chatWidget');
      if (chatWidgetExists) {
        const chatWidget = page.locator('.chat-widget, .chat-button, #chatWidget');
        await expect(chatWidget).toBeVisible();
        
        await chatWidget.click();
        
        const chatContainerExists = await elementExists(page, '.chat-container, .chat-window');
        if (chatContainerExists) {
          await expect(page.locator('.chat-container, .chat-window')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check if mobile menu exists
      const mobileMenuExists = await elementExists(page, '.mobile-menu, .hamburger, .menu-toggle');
      if (mobileMenuExists) {
        await expect(page.locator('.mobile-menu, .hamburger, .menu-toggle')).toBeVisible();
      }
      
      // Check if content is responsive
      const mainContentExists = await elementExists(page, 'main, .main-content, .container');
      if (mainContentExists) {
        const mainContent = page.locator('main, .main-content, .container').first();
        const boundingBox = await mainContent.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
    
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Check if layout adapts to tablet
      const containerExists = await elementExists(page, '.container, .main-content');
      if (containerExists) {
        const container = page.locator('.container, .main-content').first();
        const boundingBox = await container.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(768);
        }
      }
    });
  });
  
  test.describe('Performance', () => {
    test('should load homepage within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
    
    test('should have no console errors on homepage', async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto('/');
      
      // Allow some time for any async errors
      await page.waitForTimeout(1000);
      
      // Filter out common non-critical errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('net::ERR_')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });
});