const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
  
  test.describe('Page Load Performance', () => {
    test('should load homepage within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Homepage should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      // Check for performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        }
        return null;
      });
      
      if (performanceMetrics) {
        // DOM Content Loaded should be fast
        expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
        
        // First Contentful Paint should be quick
        if (performanceMetrics.firstContentfulPaint > 0) {
          expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000);
        }
      }
    });
    
    test('should load books page efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/books.html', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Books page should load within 6 seconds (may have more content)
      expect(loadTime).toBeLessThan(6000);
      
      // Check if books are displayed
      const booksContainer = page.locator('.books-grid, .books-container, .products-grid');
      if (await booksContainer.count() > 0) {
        await expect(booksContainer.first()).toBeVisible();
      }
      
      // Check for lazy loading of images
      const bookImages = page.locator('.book-card img, .product-card img');
      if (await bookImages.count() > 0) {
        const firstImage = bookImages.first();
        await expect(firstImage).toBeVisible();
        
        // Image should have loaded
        const naturalWidth = await firstImage.evaluate(img => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
    
    test('should load admin panel efficiently', async ({ page }) => {
      // Login first
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        
        const startTime = Date.now();
        await loginButton.click();
        
        // Wait for dashboard to load
        await page.waitForTimeout(2000);
        
        const loadTime = Date.now() - startTime;
        
        // Admin dashboard should load within 4 seconds
        expect(loadTime).toBeLessThan(4000);
        
        // Check if dashboard elements are visible
        const dashboard = page.locator('.dashboard, .admin-dashboard, .main-content');
        if (await dashboard.count() > 0) {
          await expect(dashboard.first()).toBeVisible();
        }
      }
    });
    
    test('should handle concurrent page loads', async ({ browser }) => {
      // Test multiple pages loading simultaneously
      const context = await browser.newContext();
      
      const pages = [
        context.newPage(),
        context.newPage(),
        context.newPage()
      ];
      
      const urls = ['/', '/books.html', '/projects.html'];
      const startTime = Date.now();
      
      // Load all pages concurrently
      const loadPromises = pages.map(async (page, index) => {
        const pageStartTime = Date.now();
        await page.goto(urls[index], { waitUntil: 'networkidle' });
        return Date.now() - pageStartTime;
      });
      
      const loadTimes = await Promise.all(loadPromises);
      const totalTime = Date.now() - startTime;
      
      // All pages should load within 10 seconds total
      expect(totalTime).toBeLessThan(10000);
      
      // Each individual page should load reasonably fast
      loadTimes.forEach(time => {
        expect(time).toBeLessThan(8000);
      });
      
      // Close pages
      await Promise.all(pages.map(page => page.close()));
      await context.close();
    });
  });
  
  test.describe('Resource Loading Performance', () => {
    test('should optimize image loading', async ({ page }) => {
      await page.goto('/');
      
      // Check for image optimization
      const images = page.locator('img');
      if (await images.count() > 0) {
        const imageCount = Math.min(await images.count(), 5);
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const src = await img.getAttribute('src');
          
          if (src && !src.startsWith('data:')) {
            // Check image response
            const response = await page.request.get(src);
            expect(response.status()).toBeLessThan(400);
            
            // Check for appropriate image formats
            const contentType = response.headers()['content-type'];
            if (contentType) {
              expect(contentType).toMatch(/image\/(jpeg|jpg|png|webp|svg|gif)/);
            }
            
            // Check image size (should not be excessively large)
            const contentLength = response.headers()['content-length'];
            if (contentLength) {
              const sizeInMB = parseInt(contentLength) / (1024 * 1024);
              expect(sizeInMB).toBeLessThan(5); // Images should be under 5MB
            }
          }
        }
      }
    });
    
    test('should load CSS efficiently', async ({ page }) => {
      const cssRequests = [];
      
      page.on('response', response => {
        if (response.url().endsWith('.css')) {
          cssRequests.push({
            url: response.url(),
            status: response.status(),
            size: response.headers()['content-length']
          });
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Should have CSS files loaded
      expect(cssRequests.length).toBeGreaterThan(0);
      
      // All CSS should load successfully
      cssRequests.forEach(css => {
        expect(css.status).toBeLessThan(400);
        
        // CSS files should not be excessively large
        if (css.size) {
          const sizeInKB = parseInt(css.size) / 1024;
          expect(sizeInKB).toBeLessThan(500); // CSS should be under 500KB
        }
      });
    });
    
    test('should load JavaScript efficiently', async ({ page }) => {
      const jsRequests = [];
      
      page.on('response', response => {
        if (response.url().endsWith('.js')) {
          jsRequests.push({
            url: response.url(),
            status: response.status(),
            size: response.headers()['content-length']
          });
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Should have JavaScript files loaded
      expect(jsRequests.length).toBeGreaterThan(0);
      
      // All JS should load successfully
      jsRequests.forEach(js => {
        expect(js.status).toBeLessThan(400);
        
        // JS files should not be excessively large
        if (js.size) {
          const sizeInMB = parseInt(js.size) / (1024 * 1024);
          expect(sizeInMB).toBeLessThan(2); // JS should be under 2MB
        }
      });
    });
    
    test('should minimize HTTP requests', async ({ page }) => {
      const requests = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          resourceType: request.resourceType()
        });
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Should not have excessive number of requests
      expect(requests.length).toBeLessThan(50);
      
      // Check resource types distribution
      const resourceTypes = requests.reduce((acc, req) => {
        acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
        return acc;
      }, {});
      
      // Should not have too many image requests (suggests images aren't optimized)
      if (resourceTypes.image) {
        expect(resourceTypes.image).toBeLessThan(20);
      }
      
      // Should not have too many stylesheet requests (suggests CSS isn't bundled)
      if (resourceTypes.stylesheet) {
        expect(resourceTypes.stylesheet).toBeLessThan(10);
      }
    });
  });
  
  test.describe('API Performance', () => {
    test('should handle API requests efficiently', async ({ page }) => {
      const apiRequests = [];
      
      page.on('response', response => {
        if (response.url().includes('/api/') || response.url().includes('localhost:5000')) {
          apiRequests.push({
            url: response.url(),
            status: response.status(),
            timing: response.timing()
          });
        }
      });
      
      await page.goto('/books.html', { waitUntil: 'networkidle' });
      
      if (apiRequests.length > 0) {
        // All API requests should be successful
        apiRequests.forEach(api => {
          expect(api.status).toBeLessThan(400);
        });
        
        // API response times should be reasonable
        const avgResponseTime = apiRequests.reduce((sum, api) => {
          return sum + (api.timing?.responseEnd - api.timing?.responseStart || 0);
        }, 0) / apiRequests.length;
        
        expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      }
    });
    
    test('should handle database queries efficiently', async ({ page }) => {
      // Login to admin to test database-heavy operations
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        // Navigate to data-heavy page (books management)
        const booksMenuItem = page.locator('a[href*="books"], .nav-link:has-text("Books")');
        if (await booksMenuItem.count() > 0) {
          const startTime = Date.now();
          await booksMenuItem.click();
          
          // Wait for data to load
          const dataTable = page.locator('table, .data-table, .books-table');
          if (await dataTable.count() > 0) {
            await expect(dataTable.first()).toBeVisible();
          }
          
          const loadTime = Date.now() - startTime;
          
          // Database queries should complete quickly
          expect(loadTime).toBeLessThan(3000);
        }
      }
    });
    
    test('should handle file upload performance', async ({ page }) => {
      // Login to admin
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        // Navigate to file upload area
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"], .nav-link:has-text("Files")');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileInput = page.locator('input[type="file"], .file-input');
          if (await fileInput.count() > 0) {
            // Create test file
            const testFileBuffer = Buffer.from('Test file content for performance testing');
            
            const startTime = Date.now();
            
            await fileInput.setInputFiles({
              name: 'performance-test.txt',
              mimeType: 'text/plain',
              buffer: testFileBuffer
            });
            
            // Wait for upload to complete
            const successMessage = page.locator('.upload-success, .success-message');
            if (await successMessage.count() > 0) {
              await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
            }
            
            const uploadTime = Date.now() - startTime;
            
            // Small file upload should be fast
            expect(uploadTime).toBeLessThan(5000);
          }
        }
      }
    });
  });
  
  test.describe('Memory and Resource Usage', () => {
    test('should not have memory leaks', async ({ page }) => {
      // Get initial memory usage
      const initialMetrics = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      // Navigate through multiple pages
      const pages = ['/', '/books.html', '/projects.html', '/contact.html'];
      
      for (const pageUrl of pages) {
        await page.goto(pageUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
      }
      
      // Get final memory usage
      const finalMetrics = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (initialMetrics && finalMetrics) {
        // Memory usage should not increase dramatically
        const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
        
        expect(memoryIncreaseMB).toBeLessThan(50); // Should not increase by more than 50MB
      }
    });
    
    test('should handle DOM efficiently', async ({ page }) => {
      await page.goto('/');
      
      // Count DOM elements
      const domElementCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });
      
      // Should not have excessive DOM elements
      expect(domElementCount).toBeLessThan(2000);
      
      // Check for unused elements
      const hiddenElements = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let hiddenCount = 0;
        
        for (const element of allElements) {
          const style = window.getComputedStyle(element);
          if (style.display === 'none' && !element.hasAttribute('data-hidden-ok')) {
            hiddenCount++;
          }
        }
        
        return hiddenCount;
      });
      
      // Should not have too many hidden elements (suggests inefficient DOM)
      expect(hiddenElements).toBeLessThan(domElementCount * 0.3);
    });
    
    test('should optimize event listeners', async ({ page }) => {
      await page.goto('/');
      
      // Check for potential event listener issues
      const eventListenerCount = await page.evaluate(() => {
        let count = 0;
        const elements = document.querySelectorAll('*');
        
        // This is a simplified check - in real scenarios you'd use more sophisticated methods
        elements.forEach(element => {
          const events = ['click', 'mouseover', 'mouseout', 'focus', 'blur'];
          events.forEach(eventType => {
            if (element[`on${eventType}`]) {
              count++;
            }
          });
        });
        
        return count;
      });
      
      // Should not have excessive inline event handlers
      expect(eventListenerCount).toBeLessThan(100);
    });
  });
  
  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time even with slow network
      expect(loadTime).toBeLessThan(10000);
      
      // Page should still be functional
      const mainContent = page.locator('main, .main-content, .container');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
    });
    
    test('should handle network failures gracefully', async ({ page, context }) => {
      await page.goto('/');
      
      // Simulate network failure for API calls
      await context.route('**/api/**', route => {
        route.abort('failed');
      });
      
      // Try to perform an action that would make API call
      const loginBtn = page.locator('.login-btn, .btn-login');
      if (await loginBtn.count() > 0) {
        await loginBtn.first().click();
        
        // Should show error message or fallback
        const errorMessage = page.locator('.error-message, .alert-error, .network-error');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
    
    test('should cache resources appropriately', async ({ page }) => {
      const cachedRequests = [];
      
      page.on('response', response => {
        const cacheControl = response.headers()['cache-control'];
        if (cacheControl) {
          cachedRequests.push({
            url: response.url(),
            cacheControl: cacheControl,
            resourceType: response.request().resourceType()
          });
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check that static resources have appropriate caching
      const staticResources = cachedRequests.filter(req => 
        req.resourceType === 'stylesheet' || 
        req.resourceType === 'script' || 
        req.resourceType === 'image'
      );
      
      if (staticResources.length > 0) {
        staticResources.forEach(resource => {
          // Static resources should have cache headers
          expect(resource.cacheControl).toBeTruthy();
          expect(resource.cacheControl).not.toMatch(/no-cache|no-store/);
        });
      }
    });
  });
  
  test.describe('User Experience Performance', () => {
    test('should provide fast user interactions', async ({ page }) => {
      await page.goto('/');
      
      // Test button click responsiveness
      const buttons = page.locator('button, .btn');
      if (await buttons.count() > 0) {
        const button = buttons.first();
        
        const startTime = Date.now();
        await button.click();
        
        // Should respond to click within 100ms
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(100);
      }
      
      // Test form input responsiveness
      const inputs = page.locator('input[type="text"], input[type="email"], textarea');
      if (await inputs.count() > 0) {
        const input = inputs.first();
        
        const startTime = Date.now();
        await input.fill('test');
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(200);
      }
    });
    
    test('should show loading states appropriately', async ({ page }) => {
      await page.goto('/');
      
      // Check for loading indicators
      const loadingElements = page.locator('.loading, .spinner, .skeleton, .loader');
      
      if (await loadingElements.count() > 0) {
        // Loading elements should be visible initially
        const isVisible = await loadingElements.first().isVisible();
        
        if (isVisible) {
          // Should disappear after content loads
          await expect(loadingElements.first()).toBeHidden({ timeout: 5000 });
        }
      }
    });
    
    test('should handle animations smoothly', async ({ page }) => {
      await page.goto('/');
      
      // Look for animated elements
      const animatedElements = page.locator('.animate, .animated, .fade-in, .slide-in');
      
      if (await animatedElements.count() > 0) {
        // Check that animations don't block the main thread
        const animationPerformance = await page.evaluate(() => {
          const startTime = performance.now();
          
          // Trigger any animations
          const elements = document.querySelectorAll('.animate, .animated, .fade-in, .slide-in');
          elements.forEach(el => {
            el.style.transform = 'translateX(100px)';
          });
          
          return performance.now() - startTime;
        });
        
        // Animation setup should be fast
        expect(animationPerformance).toBeLessThan(50);
      }
    });
  });
  
  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(6000);
      
      // Check touch responsiveness
      const touchTargets = page.locator('button, a, .btn');
      if (await touchTargets.count() > 0) {
        const target = touchTargets.first();
        
        const startTime = Date.now();
        await target.tap();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(150);
      }
    });
    
    test('should optimize for mobile bandwidth', async ({ page, context }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      let totalBytes = 0;
      
      page.on('response', response => {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          totalBytes += parseInt(contentLength);
        }
      });
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Total page size should be reasonable for mobile
      const totalMB = totalBytes / (1024 * 1024);
      expect(totalMB).toBeLessThan(5); // Under 5MB total
    });
  });
});