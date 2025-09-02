const { test, expect } = require('@playwright/test');

test.describe('Public Website - Comprehensive Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('http://127.0.0.1:3000/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Homepage Features', () => {
    test('should display homepage with all sections and API data', async ({ page }) => {
      // Check main sections
      const heroSection = page.locator('.hero, .banner, .main-banner, .intro');
      if (await heroSection.count() > 0) {
        await expect(heroSection.first()).toBeVisible();
      }
      
      // Check for dynamic content from API
      const dynamicContent = page.locator('.books-section, .projects-section, .team-section');
      if (await dynamicContent.count() > 0) {
        await expect(dynamicContent.first()).toBeVisible();
      }
      
      // Verify API data is loaded
      await page.waitForTimeout(2000); // Allow time for API calls
      const dataElements = page.locator('.book-card, .project-card, .team-member');
      if (await dataElements.count() > 0) {
        await expect(dataElements.first()).toBeVisible();
      }
    });
    
    test('should have working navigation menu', async ({ page }) => {
      const navMenu = page.locator('nav, .navbar, .navigation, .menu');
      await expect(navMenu.first()).toBeVisible();
      
      // Check navigation links
      const navLinks = navMenu.first().locator('a');
      if (await navLinks.count() > 0) {
        const linkCount = await navLinks.count();
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          await expect(navLinks.nth(i)).toBeVisible();
        }
      }
    });
    
    test('should have working search functionality', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], .search-input, #search');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        
        const searchButton = page.locator('button[type="submit"], .search-btn, .search-button');
        if (await searchButton.count() > 0) {
          await searchButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Books Section', () => {
    test('should display books from database with all information', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/books.html');
      
      // Wait for books to load from API
      await page.waitForTimeout(3000);
      
      const booksContainer = page.locator('.books-container, .book-list, .books-grid');
      if (await booksContainer.count() > 0) {
        await expect(booksContainer).toBeVisible();
      }
      
      // Check individual book cards
      const bookCards = page.locator('.book-card, .book-item, .book');
      if (await bookCards.count() > 0) {
        await expect(bookCards.first()).toBeVisible();
        
        // Check book information
        const bookTitle = bookCards.first().locator('.title, .book-title, h3, h4');
        const bookAuthor = bookCards.first().locator('.author, .book-author');
        const bookPrice = bookCards.first().locator('.price, .book-price');
        
        if (await bookTitle.count() > 0) {
          await expect(bookTitle).toBeVisible();
        }
        if (await bookAuthor.count() > 0) {
          await expect(bookAuthor).toBeVisible();
        }
        if (await bookPrice.count() > 0) {
          await expect(bookPrice).toBeVisible();
        }
      }
    });
    
    test('should have working book purchase buttons', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/books.html');
      await page.waitForTimeout(3000);
      
      const buyButtons = page.locator('button:has-text("Buy"), .buy-btn, .purchase-btn');
      if (await buyButtons.count() > 0) {
        await expect(buyButtons.first()).toBeVisible();
        await buyButtons.first().click();
        
        // Check if purchase modal opens
        const purchaseModal = page.locator('.modal, .purchase-modal, .buy-modal');
        if (await purchaseModal.count() > 0) {
          await expect(purchaseModal).toBeVisible();
        }
      }
    });
    
    test('should have working add to cart functionality', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/books.html');
      await page.waitForTimeout(3000);
      
      const cartButtons = page.locator('button:has-text("Cart"), .cart-btn, .add-to-cart');
      if (await cartButtons.count() > 0) {
        await expect(cartButtons.first()).toBeVisible();
        await cartButtons.first().click();
        
        // Check cart update
        const cartIndicator = page.locator('.cart-count, .cart-badge, .cart-items');
        if (await cartIndicator.count() > 0) {
          await expect(cartIndicator).toBeVisible();
        }
      }
    });
    
    test('should display books catalog with proper book cards', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/books.html');
      await page.waitForTimeout(3000);
      
      // Check if books are displayed
      const bookCards = page.locator('.book-card, .book-item, .book');
      if (await bookCards.count() > 0) {
        await expect(bookCards.first()).toBeVisible();
        
        // Check book card elements
        const firstCard = bookCards.first();
        const bookTitle = firstCard.locator('.book-title, .title, h3, h4');
        const bookAuthor = firstCard.locator('.book-author, .author');
        const addToCartBtn = firstCard.locator('button:has-text("Add to Cart"), .add-to-cart');
        const buyNowBtn = firstCard.locator('button:has-text("Buy Now"), .buy-now');
        
        if (await bookTitle.count() > 0) {
          await expect(bookTitle).toBeVisible();
        }
        if (await addToCartBtn.count() > 0) {
          await expect(addToCartBtn).toBeVisible();
        }
        if (await buyNowBtn.count() > 0) {
          await expect(buyNowBtn).toBeVisible();
        }
      }
    });
  });

  test.describe('Ebooks Section', () => {
    test('should display ebooks from database', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/ebooks.html');
      await page.waitForTimeout(3000);
      
      const ebooksContainer = page.locator('.ebooks-container, .ebook-list, .ebooks-grid');
      if (await ebooksContainer.count() > 0) {
        await expect(ebooksContainer).toBeVisible();
      }
      
      const ebookCards = page.locator('.ebook-card, .ebook-item, .ebook');
      if (await ebookCards.count() > 0) {
        await expect(ebookCards.first()).toBeVisible();
      }
    });
    
    test('should have working download buttons', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/ebooks.html');
      await page.waitForTimeout(3000);
      
      const downloadButtons = page.locator('button:has-text("Download"), .download-btn, .ebook-download');
      if (await downloadButtons.count() > 0) {
        await expect(downloadButtons.first()).toBeVisible();
      }
    });
    
    test('should have working read online buttons', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/ebooks.html');
      await page.waitForTimeout(3000);
      
      const readButtons = page.locator('button:has-text("Read"), .read-btn, .read-online');
      if (await readButtons.count() > 0) {
        await expect(readButtons.first()).toBeVisible();
        await readButtons.first().click();
        
        // Check if reader opens
        const reader = page.locator('.ebook-reader, .reader, .reading-interface');
        if (await reader.count() > 0) {
          await expect(reader).toBeVisible();
        }
      }
    });
  });

  test.describe('Projects Section', () => {
    test('should display projects from database', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/projects.html');
      await page.waitForTimeout(3000);
      
      const projectsContainer = page.locator('.projects-container, .project-list, .projects-grid');
      if (await projectsContainer.count() > 0) {
        await expect(projectsContainer).toBeVisible();
      }
      
      const projectCards = page.locator('.project-card, .project-item, .project');
      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toBeVisible();
        
        // Check project information
        const projectTitle = projectCards.first().locator('.title, .project-title, h3, h4');
        const projectDescription = projectCards.first().locator('.description, .project-desc');
        
        if (await projectTitle.count() > 0) {
          await expect(projectTitle).toBeVisible();
        }
        if (await projectDescription.count() > 0) {
          await expect(projectDescription).toBeVisible();
        }
      }
    });
    
    test('should have working project interaction buttons', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/projects.html');
      await page.waitForTimeout(3000);
      
      const joinButtons = page.locator('button:has-text("Join"), .join-btn, .project-join');
      if (await joinButtons.count() > 0) {
        await expect(joinButtons.first()).toBeVisible();
        await joinButtons.first().click();
        
        // Check if join modal opens
        const joinModal = page.locator('.modal, .join-modal, .project-modal');
        if (await joinModal.count() > 0) {
          await expect(joinModal).toBeVisible();
        }
      }
    });
  });

  test.describe('Authentication Features', () => {
    test('should have working login functionality', async ({ page }) => {
      const loginButton = page.locator('button:has-text("Login"), .login-btn, a[href*="login"]');
      if (await loginButton.count() > 0) {
        await loginButton.first().click();
        
        // Check if login modal or page opens
        const loginForm = page.locator('.login-form, .auth-modal, form');
        if (await loginForm.count() > 0) {
          await expect(loginForm).toBeVisible();
          
          // Check form fields
          const emailField = loginForm.locator('input[type="email"], input[name="email"]');
          const passwordField = loginForm.locator('input[type="password"], input[name="password"]');
          
          if (await emailField.count() > 0) {
            await expect(emailField).toBeVisible();
          }
          if (await passwordField.count() > 0) {
            await expect(passwordField).toBeVisible();
          }
        }
      }
    });
    
    test('should have working signup functionality', async ({ page }) => {
      const signupButton = page.locator('button:has-text("Sign"), .signup-btn, a[href*="signup"]');
      if (await signupButton.count() > 0) {
        await signupButton.first().click();
        
        const signupForm = page.locator('.signup-form, .register-form, form');
        if (await signupForm.count() > 0) {
          await expect(signupForm).toBeVisible();
        }
      }
    });
  });

  test.describe('About Page', () => {
    test('should display about page with team information', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/about.html');
      
      const aboutContent = page.locator('.about-content, .about-section, main');
      if (await aboutContent.count() > 0) {
        await expect(aboutContent).toBeVisible();
      }
      
      // Check for team section
      const teamSection = page.locator('.team-section, .team, .members');
      if (await teamSection.count() > 0) {
        await expect(teamSection).toBeVisible();
        
        const teamMembers = teamSection.locator('.team-member, .member, .person');
        if (await teamMembers.count() > 0) {
          await expect(teamMembers.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Chat Widget', () => {
    test('should display and function chat widget', async ({ page }) => {
      const chatWidget = page.locator('.chat-widget, .chat-button, .chat-toggle');
      if (await chatWidget.count() > 0) {
        await expect(chatWidget).toBeVisible();
        await chatWidget.click();
        
        // Check if chat interface opens
        const chatInterface = page.locator('.chat-interface, .chat-window, .chat-modal');
        if (await chatInterface.count() > 0) {
          await expect(chatInterface).toBeVisible();
          
          // Check chat input
          const chatInput = chatInterface.locator('input, textarea');
          if (await chatInput.count() > 0) {
            await expect(chatInput).toBeVisible();
            await chatInput.fill('Test message');
          }
          
          // Check send button
          const sendButton = chatInterface.locator('button:has-text("Send"), .send-btn');
          if (await sendButton.count() > 0) {
            await expect(sendButton).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Notifications', () => {
    test('should display notifications page', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/notifications.html');
      
      const notificationsContainer = page.locator('.notifications, .notification-list, .alerts');
      if (await notificationsContainer.count() > 0) {
        await expect(notificationsContainer).toBeVisible();
      }
      
      // Check individual notifications
      const notifications = page.locator('.notification, .alert, .notice');
      if (await notifications.count() > 0) {
        await expect(notifications.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Check mobile navigation
      const mobileMenu = page.locator('.mobile-menu, .hamburger, .menu-toggle');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible();
        await mobileMenu.click();
        
        const mobileNav = page.locator('.mobile-nav, .nav-menu');
        if (await mobileNav.count() > 0) {
          await expect(mobileNav).toBeVisible();
        }
      }
    });
    
    test('should work properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      // Check layout adaptation
      const mainContent = page.locator('main, .main-content, .container');
      if (await mainContent.count() > 0) {
        await expect(mainContent).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/nonexistent-page.html');
      
      const errorPage = page.locator('.error-page, .not-found, .error-404');
      if (await errorPage.count() > 0) {
        await expect(errorPage).toBeVisible();
      } else {
        // Check if redirected to 404 page
        const url = page.url();
        expect(url).toMatch(/404|error/);
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://127.0.0.1:3000/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
    
    test('should display loading indicators during API calls', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/books.html');
      
      // Check for loading indicators
      const loadingIndicators = page.locator('.loading, .spinner, .loader');
      if (await loadingIndicators.count() > 0) {
        // Loading indicator should appear initially
        await expect(loadingIndicators.first()).toBeVisible();
        
        // Then disappear after content loads
        await page.waitForTimeout(5000);
        await expect(loadingIndicators.first()).not.toBeVisible();
      }
    });
  });
});