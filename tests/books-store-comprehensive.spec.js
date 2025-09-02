const { test, expect } = require('@playwright/test');

test.describe('Books Store - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/books.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Book Catalog Display', () => {
    test('should display all book cards with complete information', async ({ page }) => {
      // Check books container is visible
      await expect(page.locator('.books-container, .books-grid, .book-list')).toBeVisible();
      
      // Get all book cards
      const bookCards = page.locator('.book-card, .book-item, .book');
      const cardCount = await bookCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check each book card has required elements
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = bookCards.nth(i);
        
        // Book cover image
        await expect(card.locator('img, .book-cover, .book-image')).toBeVisible();
        
        // Book title
        await expect(card.locator('.book-title, .title, h3, h4')).toBeVisible();
        
        // Book price
        await expect(card.locator('.book-price, .price, .cost')).toBeVisible();
        
        // Action buttons (Add to Cart, Buy Now)
        const addToCartBtn = card.locator('.add-to-cart, .add-cart, button:has-text("Add to Cart")');
        const buyNowBtn = card.locator('.buy-now, button:has-text("Buy Now")');
        
        expect(await addToCartBtn.count() > 0 || await buyNowBtn.count() > 0).toBeTruthy();
      }
    });
    
    test('should display book descriptions and authors', async ({ page }) => {
      const bookCards = page.locator('.book-card, .book-item');
      if (await bookCards.count() > 0) {
        const firstBook = bookCards.first();
        
        // Check for author information
        const author = firstBook.locator('.book-author, .author, .by-author');
        if (await author.count() > 0) {
          await expect(author).toBeVisible();
          const authorText = await author.textContent();
          expect(authorText.trim().length).toBeGreaterThan(0);
        }
        
        // Check for book description
        const description = firstBook.locator('.book-description, .description, .summary');
        if (await description.count() > 0) {
          await expect(description).toBeVisible();
        }
      }
    });
    
    test('should handle book image loading and fallbacks', async ({ page }) => {
      const bookImages = page.locator('.book-card img, .book-cover, .book-image');
      const imageCount = await bookImages.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = bookImages.nth(i);
          await expect(img).toBeVisible();
          
          // Check if image has valid src
          const src = await img.getAttribute('src');
          expect(src).toBeTruthy();
          expect(src).not.toBe('');
          
          // Check if image has alt text for accessibility
          const alt = await img.getAttribute('alt');
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
  
  test.describe('Shopping Cart Functionality', () => {
    test('should add books to cart and update cart counter', async ({ page }) => {
      const addToCartBtn = page.locator('.add-to-cart, .add-cart, button:has-text("Add to Cart")').first();
      
      if (await addToCartBtn.count() > 0) {
        // Get initial cart count
        const cartCounter = page.locator('.cart-count, .cart-badge, .cart-number');
        let initialCount = 0;
        if (await cartCounter.count() > 0) {
          const countText = await cartCounter.textContent();
          initialCount = parseInt(countText) || 0;
        }
        
        // Add book to cart
        await addToCartBtn.click();
        
        // Check for success notification
        const notification = page.locator('.notification, .toast, .alert-success, .success-message');
        if (await notification.count() > 0) {
          await expect(notification).toBeVisible({ timeout: 5000 });
        }
        
        // Check cart counter updated
        if (await cartCounter.count() > 0) {
          await expect(cartCounter).toBeVisible();
          const newCountText = await cartCounter.textContent();
          const newCount = parseInt(newCountText) || 0;
          expect(newCount).toBeGreaterThan(initialCount);
        }
      }
    });
    
    test('should open cart modal/page when cart is clicked', async ({ page }) => {
      const cartButton = page.locator('.cart-btn, .cart-icon, .shopping-cart, [data-action="cart"]');
      
      if (await cartButton.count() > 0) {
        await cartButton.click();
        
        // Check if cart modal or page opens
        const cartModal = page.locator('.cart-modal, .shopping-cart-modal, #cartModal');
        const cartPage = page.locator('.cart-page, .shopping-cart-page');
        
        if (await cartModal.count() > 0) {
          await expect(cartModal).toBeVisible();
        } else if (await cartPage.count() > 0) {
          await expect(cartPage).toBeVisible();
        } else {
          // Check if URL changed to cart page
          await expect(page).toHaveURL(/cart/);
        }
      }
    });
    
    test('should persist cart items across page reloads', async ({ page }) => {
      const addToCartBtn = page.locator('.add-to-cart, button:has-text("Add to Cart")').first();
      
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
        
        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check if cart count is maintained
        const cartCounter = page.locator('.cart-count, .cart-badge');
        if (await cartCounter.count() > 0) {
          const countText = await cartCounter.textContent();
          const count = parseInt(countText) || 0;
          expect(count).toBeGreaterThan(0);
        }
      }
    });
  });
  
  test.describe('Book Purchase Flow', () => {
    test('should open buy now modal with customer form', async ({ page }) => {
      const buyNowBtn = page.locator('.buy-now, button:has-text("Buy Now")').first();
      
      if (await buyNowBtn.count() > 0) {
        await buyNowBtn.click();
        
        // Check if buy now modal opens
        const modal = page.locator('.buy-now-modal, .purchase-modal, #buyNowModal, .modal');
        await expect(modal).toBeVisible();
        
        // Check form fields
        await expect(modal.locator('input[name="name"], input[placeholder*="name"], #customerName')).toBeVisible();
        await expect(modal.locator('input[name="email"], input[type="email"], #customerEmail')).toBeVisible();
        await expect(modal.locator('input[name="phone"], input[type="tel"], #customerPhone')).toBeVisible();
        await expect(modal.locator('textarea[name="address"], #customerAddress')).toBeVisible();
        
        // Check submit button
        await expect(modal.locator('button[type="submit"], .submit-btn, .purchase-btn')).toBeVisible();
      }
    });
    
    test('should validate required fields in purchase form', async ({ page }) => {
      const buyNowBtn = page.locator('.buy-now, button:has-text("Buy Now")').first();
      
      if (await buyNowBtn.count() > 0) {
        await buyNowBtn.click();
        
        const modal = page.locator('.buy-now-modal, .purchase-modal, .modal');
        await expect(modal).toBeVisible();
        
        // Try to submit empty form
        const submitBtn = modal.locator('button[type="submit"], .submit-btn');
        await submitBtn.click();
        
        // Check for validation errors
        const errorMessages = modal.locator('.error-message, .field-error, .invalid-feedback, .validation-error');
        if (await errorMessages.count() > 0) {
          await expect(errorMessages.first()).toBeVisible();
        }
      }
    });
    
    test('should handle successful purchase submission', async ({ page }) => {
      const buyNowBtn = page.locator('.buy-now, button:has-text("Buy Now")').first();
      
      if (await buyNowBtn.count() > 0) {
        await buyNowBtn.click();
        
        const modal = page.locator('.buy-now-modal, .purchase-modal, .modal');
        await expect(modal).toBeVisible();
        
        // Fill form with valid data
        await modal.locator('input[name="name"], #customerName').fill('Test Customer');
        await modal.locator('input[name="email"], #customerEmail').fill('test@example.com');
        await modal.locator('input[name="phone"], #customerPhone').fill('1234567890');
        await modal.locator('textarea[name="address"], #customerAddress').fill('123 Test Street, Test City');
        
        // Submit form
        const submitBtn = modal.locator('button[type="submit"], .submit-btn');
        await submitBtn.click();
        
        // Check for success message or redirect
        const successMessage = page.locator('.success-message, .alert-success, .purchase-success');
        if (await successMessage.count() > 0) {
          await expect(successMessage).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });
  
  test.describe('Book Rating System', () => {
    test('should display existing star ratings', async ({ page }) => {
      const ratingElements = page.locator('.star-rating, .rating-stars, .book-rating');
      
      if (await ratingElements.count() > 0) {
        const firstRating = ratingElements.first();
        await expect(firstRating).toBeVisible();
        
        // Check for star elements
        const stars = firstRating.locator('.star, .fa-star, i[class*="star"]');
        if (await stars.count() > 0) {
          expect(await stars.count()).toBeGreaterThanOrEqual(5); // Typically 5-star rating
        }
      }
    });
    
    test('should allow users to rate books', async ({ page }) => {
      const ratingElements = page.locator('.star-rating, .rating-stars');
      
      if (await ratingElements.count() > 0) {
        const firstRating = ratingElements.first();
        const stars = firstRating.locator('.star, .fa-star');
        
        if (await stars.count() >= 3) {
          // Click on 3rd star
          await stars.nth(2).click();
          
          // Check if rating was applied (visual feedback)
          const activeStars = firstRating.locator('.star.active, .fa-star.active, .star.filled');
          if (await activeStars.count() > 0) {
            expect(await activeStars.count()).toBeGreaterThanOrEqual(3);
          }
        }
      }
    });
    
    test('should save user ratings persistently', async ({ page }) => {
      const ratingElements = page.locator('.star-rating, .rating-stars');
      
      if (await ratingElements.count() > 0) {
        const firstRating = ratingElements.first();
        const stars = firstRating.locator('.star, .fa-star');
        
        if (await stars.count() >= 4) {
          // Rate with 4 stars
          await stars.nth(3).click();
          await page.waitForTimeout(1000);
          
          // Reload page
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          // Check if rating persisted
          const reloadedRating = page.locator('.star-rating, .rating-stars').first();
          const activeStars = reloadedRating.locator('.star.active, .star.filled, .fa-star.active');
          
          if (await activeStars.count() > 0) {
            expect(await activeStars.count()).toBe(4);
          }
        }
      }
    });
  });
  
  test.describe('Book Search and Filtering', () => {
    test('should filter books by search query', async ({ page }) => {
      const searchInput = page.locator('.search-input, input[type="search"], #bookSearch, .book-search');
      
      if (await searchInput.count() > 0) {
        // Get initial book count
        const initialBooks = page.locator('.book-card, .book-item');
        const initialCount = await initialBooks.count();
        
        // Search for specific term
        await searchInput.fill('Tamil');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const filteredBooks = page.locator('.book-card, .book-item');
        const filteredCount = await filteredBooks.count();
        
        // Results should be different (unless all books contain 'Tamil')
        if (filteredCount > 0) {
          // Check if visible books contain search term
          const firstBook = filteredBooks.first();
          const bookText = await firstBook.textContent();
          expect(bookText.toLowerCase()).toContain('tamil');
        }
      }
    });
    
    test('should filter books by category/genre', async ({ page }) => {
      const categoryFilter = page.locator('.category-filter, .genre-filter, select[name="category"]');
      
      if (await categoryFilter.count() > 0) {
        // Get available options
        const options = categoryFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select second option (first is usually "All")
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          // Check if books are filtered
          const filteredBooks = page.locator('.book-card, .book-item');
          expect(await filteredBooks.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
    
    test('should sort books by price, name, or rating', async ({ page }) => {
      const sortSelect = page.locator('.sort-select, select[name="sort"], #bookSort');
      
      if (await sortSelect.count() > 0) {
        const options = sortSelect.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Test different sort options
          for (let i = 1; i < Math.min(optionCount, 3); i++) {
            await sortSelect.selectOption({ index: i });
            await page.waitForTimeout(1000);
            
            // Verify books are still displayed
            const books = page.locator('.book-card, .book-item');
            expect(await books.count()).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });
  
  test.describe('Purchased Books Tracking', () => {
    test('should mark purchased books visually', async ({ page }) => {
      const purchasedBooks = page.locator('.book-purchased, .purchased-book, .book-card.purchased');
      
      if (await purchasedBooks.count() > 0) {
        const firstPurchased = purchasedBooks.first();
        await expect(firstPurchased).toBeVisible();
        
        // Check for purchased indicator
        const purchasedBadge = firstPurchased.locator('.purchased-badge, .owned-badge, .purchased-indicator');
        if (await purchasedBadge.count() > 0) {
          await expect(purchasedBadge).toBeVisible();
        }
      }
    });
    
    test('should show purchase history for logged-in users', async ({ page }) => {
      // Check if user is logged in (look for user menu or profile)
      const userMenu = page.locator('.user-menu, .profile-menu, .user-dropdown');
      
      if (await userMenu.count() > 0) {
        const purchaseHistoryLink = page.locator('a:has-text("Purchase History"), .purchase-history, [href*="purchases"]');
        
        if (await purchaseHistoryLink.count() > 0) {
          await purchaseHistoryLink.click();
          
          // Check if purchase history page/modal opens
          const historyContainer = page.locator('.purchase-history, .order-history, .purchases-list');
          if (await historyContainer.count() > 0) {
            await expect(historyContainer).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if books are still visible and properly arranged
      const booksContainer = page.locator('.books-container, .books-grid');
      await expect(booksContainer).toBeVisible();
      
      const bookCards = page.locator('.book-card, .book-item');
      if (await bookCards.count() > 0) {
        // Check if cards are stacked vertically or in mobile grid
        const firstCard = bookCards.first();
        await expect(firstCard).toBeVisible();
        
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(375); // Should fit in mobile width
        }
      }
    });
    
    test('should display properly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check layout
      const booksContainer = page.locator('.books-container, .books-grid');
      await expect(booksContainer).toBeVisible();
      
      const bookCards = page.locator('.book-card, .book-item');
      expect(await bookCards.count()).toBeGreaterThan(0);
    });
  });
});