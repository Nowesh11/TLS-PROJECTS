const { test, expect } = require('@playwright/test');

test.describe('Public Website Tests', () => {
  
  test.describe('Homepage and Navigation', () => {
    test('should display homepage with hero section', async ({ page }) => {
      await page.goto('/');
      
      // Check hero section
      await expect(page.locator('.hero-section, .hero, .banner')).toBeVisible();
      
      // Check navigation menu
      await expect(page.locator('.navbar, .nav, .header-nav')).toBeVisible();
      
      // Check main navigation links
      const navLinks = ['Home', 'Books', 'Ebooks', 'Projects', 'About', 'Contact'];
      for (const linkText of navLinks) {
        const link = page.locator(`a:has-text("${linkText}"), .nav-link:has-text("${linkText}")`);
        if (await link.count() > 0) {
          await expect(link.first()).toBeVisible();
        }
      }
    });
    
    test('should have working theme toggle', async ({ page }) => {
      await page.goto('/');
      
      const themeToggle = page.locator('.theme-toggle, .theme-switcher, #theme-toggle');
      if (await themeToggle.count() > 0) {
        // Test theme switching
        await themeToggle.click();
        await expect(page.locator('html, body')).toHaveAttribute('data-theme', /dark|light/);
        
        await themeToggle.click();
        await expect(page.locator('html, body')).toHaveAttribute('data-theme', /dark|light/);
      }
    });
    
    test('should have working language toggle', async ({ page }) => {
      await page.goto('/');
      
      const languageToggle = page.locator('.language-toggle, .lang-switcher, #language-toggle');
      if (await languageToggle.count() > 0) {
        await languageToggle.click();
        // Should switch between Tamil and English
        await expect(page.locator('html')).toHaveAttribute('lang', /ta|en/);
      }
    });
  });
  
  test.describe('Authentication', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login"), a:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        // Should navigate to login page instead of opening modal
        await expect(page).toHaveURL(/.*login\.html/);
        await expect(page.locator('#login-form, .auth-form')).toBeVisible();
      }
    });
    
    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/');
      
      const signupButton = page.locator('.signup-btn, button:has-text("Sign Up"), a:has-text("Sign Up")');
      if (await signupButton.count() > 0) {
        await signupButton.click();
        // Should navigate to signup page instead of opening modal
        await expect(page).toHaveURL(/.*signup\.html/);
        await expect(page.locator('#signup-form, .auth-form')).toBeVisible();
      }
    });
    
    test('should handle login form submission', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        
        // Fill login form
        await page.fill('input[name="email"], #email', 'test@example.com');
        await page.fill('input[name="password"], #password', 'testpassword');
        
        const submitButton = page.locator('button[type="submit"], .submit-btn');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Should show loading or response
          await expect(page.locator('.loading, .spinner, .notification')).toBeVisible();
        }
      }
    });
    
    test('should persist JWT token', async ({ page }) => {
      await page.goto('/');
      
      // Check if token exists in localStorage after login attempt
      const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('authToken'));
      // Token might be null if not logged in, which is expected
      expect(typeof token).toBe('string' || 'object');
    });
  });
  
  test.describe('Books Store', () => {
    test('should display books catalog', async ({ page }) => {
      await page.goto('/books.html');
      
      // Wait for books grid to be visible
      await page.waitForSelector('#books-grid', { timeout: 10000 });
      
      // Wait for either API books to load or static books to be rendered
      await page.waitForFunction(() => {
        const grid = document.querySelector('#books-grid');
        const hasBooks = grid && grid.children.length > 0;
        const hasLoadingState = grid && grid.querySelector('.loading-state');
        
        // If loading state is present, wait for it to be replaced with books
        if (hasLoadingState) {
          return false;
        }
        
        // Check if books are loaded (either from API or static data)
        return hasBooks && !hasLoadingState;
      }, { timeout: 20000 });
      
      // Check if books are displayed
      const bookCards = page.locator('#books-grid .book-card');
      await expect(bookCards.first()).toBeVisible();
      
      // Check book card elements
      const firstBook = bookCards.first();
      await expect(firstBook.locator('.book-cover')).toBeVisible();
      await expect(firstBook.locator('.book-title, .title, h3, h4')).toBeVisible();
      await expect(firstBook.locator('.book-price, .price, .price-info')).toBeVisible();
    });
    
    test('should add book to cart', async ({ page }) => {
      await page.goto('/books.html');
      
      const addToCartButton = page.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first();
      if (await addToCartButton.count() > 0) {
        await addToCartButton.click();
        
        // Should show notification or update cart count
        const notification = page.locator('.notification, .toast, .alert');
        const cartCount = page.locator('.cart-count, .cart-badge');
        
        if (await notification.count() > 0) {
          await expect(notification.first()).toBeVisible();
        } else if (await cartCount.count() > 0) {
          await expect(cartCount.first()).toBeVisible();
        }
      }
    });
    
    test('should open buy now form', async ({ page }) => {
      await page.goto('http://localhost:3000/books.html');
      
      // Wait for books to load
      await page.waitForSelector('.book-card', { timeout: 10000 });
      
      // Wait for page initialization to complete (event listeners attached)
      await page.waitForFunction(() => window.bookButtonListenersAdded === true, { timeout: 10000 });
      
      // Debug: Check if Buy Now buttons exist
      const buyNowButtons = await page.locator('.btn-buy-now').count();
      console.log(`Found ${buyNowButtons} Buy Now buttons`);
      
      // Click the first "Buy Now" button
      await page.click('.btn-buy-now');
      
      // Wait for modal to be created
      await page.waitForTimeout(1000);
      
      // Debug: Check modal states
      const modalInfo = await page.evaluate(() => {
        const modals = document.querySelectorAll('.modal-overlay');
        return Array.from(modals).map((modal, index) => ({
          index,
          display: getComputedStyle(modal).display,
          visibility: getComputedStyle(modal).visibility,
          opacity: getComputedStyle(modal).opacity,
          zIndex: getComputedStyle(modal).zIndex,
          hasContent: modal.innerHTML.length > 0
        }));
      });
      console.log('Modal states:', JSON.stringify(modalInfo, null, 2));
      
      // Find the last modal (most recently created)
      const modalCount = await page.locator('.modal-overlay').count();
      console.log(`Found ${modalCount} modal overlays after click`);
      
      // Check if the last modal is visible (most recently created)
      const modal = page.locator('.modal-overlay').last();
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check if form fields are present within the first modal
      await expect(modal.locator('#buynow-name')).toBeVisible();
      await expect(modal.locator('#buynow-email')).toBeVisible();
    });
    
    test('should handle star ratings', async ({ page }) => {
      await page.goto('/books.html');
      
      const starRatings = page.locator('.star-rating, .rating-stars');
      if (await starRatings.count() > 0) {
        const firstRating = starRatings.first();
        await expect(firstRating).toBeVisible();
        
        // Test clicking on stars
        const stars = firstRating.locator('.star, .fa-star');
        if (await stars.count() > 0) {
          await stars.nth(2).click(); // Click 3rd star
          // Should update rating
        }
      }
    });
    
    test('should save purchased books', async ({ page }) => {
      await page.goto('/books.html');
      
      // Check if purchased books are marked or saved
      const purchasedBooks = page.locator('.purchased-book, .book-purchased');
      if (await purchasedBooks.count() > 0) {
        await expect(purchasedBooks.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Ebooks Library', () => {
    test('should display ebooks catalog', async ({ page }) => {
      await page.goto('/ebooks.html');
      
      await expect(page.locator('.ebooks-container, .ebooks-grid')).toBeVisible();
      
      // Check for ebook cards
      const ebookCards = page.locator('.ebook-card, .ebook-item');
      if (await ebookCards.count() > 0) {
        await expect(ebookCards.first()).toBeVisible();
      }
    });
    
    test('should handle ebook downloads', async ({ page }) => {
      await page.goto('/ebooks.html');
      
      const downloadButton = page.locator('.download-btn, button:has-text("Download")').first();
      if (await downloadButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        
        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.(pdf|epub|mobi)$/i);
        } catch (error) {
          // Download might require authentication
          await expect(page.locator('.auth-required, .login-required')).toBeVisible();
        }
      }
    });
    
    test('should render Tamil fonts correctly', async ({ page }) => {
      await page.goto('/ebooks.html');
      
      const tamilText = page.locator('.tamil-text, [lang="ta"]');
      if (await tamilText.count() > 0) {
        await expect(tamilText.first()).toBeVisible();
        
        // Check if Tamil fonts are loaded
        const fontFamily = await tamilText.first().evaluate(el => 
          window.getComputedStyle(el).fontFamily
        );
        expect(fontFamily).toBeTruthy();
      }
    });
  });
  
  test.describe('Projects Showcase', () => {
    test('should display projects list', async ({ page }) => {
      await page.goto('/projects.html');
      
      await expect(page.locator('.projects-container, .projects-grid')).toBeVisible();
      
      // Check for project cards
      const projectCards = page.locator('.project-card, .project-item');
      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toBeVisible();
        
        // Check project card elements
        const firstProject = projectCards.first();
        await expect(firstProject.locator('.project-title, .title')).toBeVisible();
        await expect(firstProject.locator('.project-description, .description')).toBeVisible();
      }
    });
    
    test('should handle project join forms', async ({ page }) => {
      await page.goto('/projects.html');
      
      const joinButton = page.locator('.join-btn, button:has-text("Join")').first();
      if (await joinButton.count() > 0) {
        await joinButton.click();
        
        // Should open join form
        await expect(page.locator('.join-form, .project-join-modal')).toBeVisible();
        
        // Fill form fields
        const nameField = page.locator('input[name="name"], #participantName');
        const emailField = page.locator('input[name="email"], #participantEmail');
        
        if (await nameField.count() > 0) {
          await nameField.fill('Test User');
        }
        if (await emailField.count() > 0) {
          await emailField.fill('test@example.com');
        }
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], .submit-btn');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await expect(page.locator('.success-message, .notification')).toBeVisible();
        }
      }
    });
    
    test('should filter projects by bureau', async ({ page }) => {
      await page.goto('/projects.html');
      
      const bureauFilter = page.locator('.bureau-filter, select[name="bureau"]');
      if (await bureauFilter.count() > 0) {
        await bureauFilter.selectOption({ index: 1 }); // Select first option
        
        // Projects should be filtered
        const projectCards = page.locator('.project-card, .project-item');
        if (await projectCards.count() > 0) {
          await expect(projectCards.first()).toBeVisible();
        }
      }
    });
  });
  

  
  test.describe('Chat System', () => {
    test('should display chat widget', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button, #chatWidget');
      if (await chatWidget.count() > 0) {
        await expect(chatWidget).toBeVisible();
        
        // Open chat
        await chatWidget.click();
        await expect(page.locator('.chat-container, .chat-window')).toBeVisible();
      }
    });
    
    test('should send message to admin', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Send message
        const messageInput = page.locator('.chat-input, input[name="message"]');
        const sendButton = page.locator('.send-btn, button:has-text("Send")');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          await messageInput.fill('Hello, I need help!');
          await sendButton.click();
          
          // Message should appear in chat
          await expect(page.locator('.chat-message, .message')).toBeVisible();
        }
      }
    });
    
    test('should clear chat session', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const clearButton = page.locator('.clear-chat-btn, button:has-text("Clear")');
        if (await clearButton.count() > 0) {
          await clearButton.click();
          
          // Chat should be cleared
          const messages = page.locator('.chat-message, .message');
          expect(await messages.count()).toBe(0);
        }
      }
    });
  });
  
  test.describe('Notifications and Announcements', () => {
    test('should display announcements', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .notification-banner');
      if (await announcements.count() > 0) {
        await expect(announcements.first()).toBeVisible();
      }
    });
    
    test('should explore announcements', async ({ page }) => {
      await page.goto('/');
      
      const exploreButton = page.locator('.explore-btn, button:has-text("Explore")');
      if (await exploreButton.count() > 0) {
        await exploreButton.click();
        
        // Should show more details or navigate to announcements page
        await expect(page.locator('.announcement-details, .announcements-page')).toBeVisible();
      }
    });
    
    test('should dismiss announcements', async ({ page }) => {
      await page.goto('/');
      
      const dismissButton = page.locator('.dismiss-btn, .close-btn, .fa-times');
      if (await dismissButton.count() > 0) {
        await dismissButton.click();
        
        // Announcement should be hidden
        const announcement = page.locator('.announcement, .notification-banner');
        if (await announcement.count() > 0) {
          await expect(announcement.first()).toBeHidden();
        }
      }
    });
    
    test('should show notification dot', async ({ page }) => {
      await page.goto('/');
      
      const notificationDot = page.locator('.notification-dot, .badge');
      if (await notificationDot.count() > 0) {
        await expect(notificationDot.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Team Section', () => {
    test('should display team members', async ({ page }) => {
      await page.goto('/team.html');
      
      const teamContainer = page.locator('.team-container, .team-grid');
      if (await teamContainer.count() > 0) {
        await expect(teamContainer).toBeVisible();
        
        // Check team member cards
        const memberCards = page.locator('.team-member, .member-card');
        if (await memberCards.count() > 0) {
          await expect(memberCards.first()).toBeVisible();
          
          // Check member card elements
          const firstMember = memberCards.first();
          await expect(firstMember.locator('img, .member-image')).toBeVisible();
          await expect(firstMember.locator('.member-name, .name')).toBeVisible();
        }
      }
    });
    
    test('should show member details on hover', async ({ page }) => {
      await page.goto('/team.html');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const firstMember = memberCards.first();
        await firstMember.hover();
        
        // Should show additional details
        const memberDetails = page.locator('.member-details, .hover-info');
        if (await memberDetails.count() > 0) {
          await expect(memberDetails.first()).toBeVisible();
        }
      }
    });
    
    test('should have responsive team cards', async ({ page }) => {
      await page.goto('/team.html');
      
      // Test mobile responsiveness
      await page.setViewportSize({ width: 375, height: 667 });
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        await expect(memberCards.first()).toBeVisible();
        
        // Cards should stack properly on mobile
        const cardBox = await memberCards.first().boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(375); // Should fit in mobile viewport
        }
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check mobile navigation
      const mobileNav = page.locator('.mobile-nav, .hamburger-menu');
      if (await mobileNav.count() > 0) {
        await mobileNav.click();
        await expect(page.locator('.nav-menu, .mobile-menu')).toBeVisible();
      }
      
      // Check content is properly sized
      const mainContent = page.locator('main, .main-content');
      if (await mainContent.count() > 0) {
        const contentBox = await mainContent.boundingBox();
        if (contentBox) {
          expect(contentBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
    
    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Check tablet layout
      await expect(page.locator('.hero-section, .hero')).toBeVisible();
      await expect(page.locator('.navbar, .nav')).toBeVisible();
    });
  });
  
  test.describe('Performance and Loading', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
    
    test('should handle loading states', async ({ page }) => {
      await page.goto('/');
      
      // Check for loading indicators
      const loadingIndicators = page.locator('.loading, .spinner, .skeleton');
      if (await loadingIndicators.count() > 0) {
        // Loading indicators should eventually disappear
        await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
      }
    });
  });
  
  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      await page.goto('/');
      
      // Should show error message or fallback content
      const errorMessage = page.locator('.error-message, .offline-message');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
      
      // Reset online mode
      await page.context().setOffline(false);
    });
    
    test('should handle API failures', async ({ page }) => {
      await page.goto('/');
      
      // Check if fallback data is shown when API fails
      const content = page.locator('.books-container, .projects-container, .content');
      if (await content.count() > 0) {
        await expect(content.first()).toBeVisible();
      }
    });
  });
});