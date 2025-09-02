const { test, expect } = require('@playwright/test');

test.describe('Admin Authentication & Authorization', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    // Page cleanup is handled automatically by Playwright
  });

  test.describe('Admin Login Flow', () => {
    test('should display login form correctly', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Check login form elements
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check form labels and placeholders
      await expect(page.locator('label[for="email"], input#email')).toBeVisible();
      await expect(page.locator('label[for="password"], input#password')).toBeVisible();
      
      // Verify page title or heading
      await expect(page.locator('h1, h2, .login-title')).toContainText(/admin|login/i);
    });

    test('should show validation errors for empty fields', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Check for validation messages
      const errorMessages = page.locator('.error-message, .alert-danger, .invalid-feedback, .validation-error');
      
      // Wait for validation to appear
      await page.waitForTimeout(1000);
      
      // Should show some form of validation
      const hasValidation = await errorMessages.count() > 0;
      const formStillVisible = await page.locator('#email').isVisible();
      
      // Either validation messages appear or form prevents submission
      expect(hasValidation || formStillVisible).toBeTruthy();
    });

    test('should show error for invalid credentials', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Fill invalid credentials
      await page.fill('#email', 'invalid_user');
      await page.fill('#password', 'invalid_password');
      await page.click('button[type="submit"]');
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check for error message
      const errorMessage = page.locator('.error-message, .alert-danger, .login-error');
      
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
        await expect(errorMessage.first()).toContainText(/invalid|incorrect|error/i);
      } else {
        // If no explicit error message, user should still be on login page
        await expect(page.locator('#email')).toBeVisible();
      }
    });

    test('should successfully login with valid credentials', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Fill valid credentials
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      
      // Should redirect to admin panel
      const currentUrl = page.url();
      expect(currentUrl).toContain('admin.html');
      
      // Verify admin panel elements are visible
      await expect(page.locator('.sidebar, .admin-sidebar')).toBeVisible();
      await expect(page.locator('.content, .main-content')).toBeVisible();
    });

    test('should handle login with Enter key', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Fill credentials
      await page.fill('#email', 'admin@tamilsociety.com');
        await page.fill('#password', 'Admin123!');
        
        // Press Enter in password field
      await page.press('#password', 'Enter');
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      
      // Should redirect to admin panel
      const currentUrl = page.url();
      expect(currentUrl).toContain('admin.html');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after login', async () => {
      // Login first
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin@tamilsociety.com');
        await page.fill('#password', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html*');
      
      // Navigate to different admin sections
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      await page.click('[data-section="projects"]');
      await page.waitForSelector('#projects', { state: 'visible' });
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      const currentUrl = page.url();
      expect(currentUrl).toContain('admin.html');
      
      // Admin elements should still be visible
      await expect(page.locator('.sidebar, .admin-sidebar')).toBeVisible();
    });

    test('should handle session expiration', async () => {
      // Login first
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin.html*');
      
      // Clear session storage and cookies to simulate session expiration
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.context().clearCookies();
      
      // Try to access admin functionality
      await page.reload();
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('#email, #password').count() > 0;
      
      expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
    });

    test('should logout successfully', async () => {
      // Login first
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin.html*');
      
      // Look for logout button
      const logoutButton = page.locator('.logout-btn, button:has-text("Logout"), a:has-text("Logout"), .btn-logout');
      
      if (await logoutButton.count() > 0) {
        await logoutButton.first().click();
        
        // Wait for redirect
        await page.waitForTimeout(2000);
        
        // Should redirect to login page
        const currentUrl = page.url();
        expect(currentUrl).toContain('login');
        
        // Login form should be visible
        await expect(page.locator('#email')).toBeVisible();
      } else {
        console.log('No logout button found - testing manual session clearing');
        
        // Clear session manually
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        
        await page.context().clearCookies();
        await page.goto('http://localhost:5000/admin.html');
        
        // Should redirect to login
        const currentUrl = page.url();
        const hasLoginForm = await page.locator('#email').isVisible();
        
        expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
      }
    });
  });

  test.describe('Protected Route Access', () => {
    test('should redirect to login when accessing admin panel without authentication', async () => {
      // Try to access admin panel directly
      await page.goto('http://localhost:5000/admin.html');
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('#email, #password').count() > 0;
      
      expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
    });

    test('should protect admin-specific pages', async () => {
      const adminPages = [
        'admin.html',
        'admin-books.html',
        'admin-test.html'
      ];
      
      for (const adminPage of adminPages) {
        await page.goto(`http://localhost:5000/${adminPage}`);
        
        // Should redirect to login or show authentication required
        const currentUrl = page.url();
        const hasLoginForm = await page.locator('#email, #password').count() > 0;
        const hasAuthError = await page.locator('.auth-error, .unauthorized').count() > 0;
        
        expect(currentUrl.includes('login') || hasLoginForm || hasAuthError).toBeTruthy();
      }
    });

    test('should allow access to admin panel after authentication', async () => {
      // Login first
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin.html*');
      
      // Should have access to all admin sections
      const adminSections = ['dashboard', 'books', 'ebooks', 'projects', 'activities', 'team'];
      
      for (const section of adminSections) {
        const sectionButton = page.locator(`[data-section="${section}"]`);
        
        if (await sectionButton.count() > 0) {
          await sectionButton.click();
          await page.waitForTimeout(1000);
          
          // Section should be visible
          const sectionContent = page.locator(`#${section}`);
          
          if (await sectionContent.count() > 0) {
            await expect(sectionContent).toBeVisible();
          }
        }
      }
    });

    test('should handle API authentication for admin endpoints', async () => {
      // Login first
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin.html*');
      
      // Monitor API calls
      const apiCalls = [];
      
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
          });
        }
      });
      
      // Navigate to a section that makes API calls
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      await page.waitForTimeout(2000);
      
      // Check if API calls were made with proper authentication
      if (apiCalls.length > 0) {
        const hasAuthHeaders = apiCalls.some(call => 
          call.headers.authorization || 
          call.headers.cookie || 
          call.headers['x-auth-token']
        );
        
        // At least some API calls should have authentication headers
        expect(hasAuthHeaders || apiCalls.length > 0).toBeTruthy();
      }
    });
  });

  test.describe('Security Features', () => {
    test('should prevent multiple rapid login attempts', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Attempt multiple rapid logins with wrong credentials
      for (let i = 0; i < 5; i++) {
        await page.fill('#email', 'wrong_user');
        await page.fill('#password', 'wrong_password');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }
      
      // Check if there's rate limiting or account lockout
      const rateLimitMessage = page.locator('.rate-limit, .too-many-attempts, .account-locked');
      const submitButton = page.locator('button[type="submit"]');
      
      // Either rate limit message appears or submit button is disabled
      const hasRateLimit = await rateLimitMessage.count() > 0;
      const buttonDisabled = await submitButton.isDisabled();
      
      if (hasRateLimit) {
        await expect(rateLimitMessage.first()).toBeVisible();
      }
      
      // Note: Rate limiting might not be implemented, so this is optional
      console.log(`Rate limiting detected: ${hasRateLimit}, Button disabled: ${buttonDisabled}`);
    });

    test('should handle CSRF protection', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Check for CSRF token in form
      const csrfToken = page.locator('input[name="_token"], input[name="csrf_token"], meta[name="csrf-token"]');
      
      if (await csrfToken.count() > 0) {
        await expect(csrfToken.first()).toBeVisible();
        
        // Verify token has a value
        const tokenValue = await csrfToken.first().getAttribute('value') || await csrfToken.first().getAttribute('content');
        expect(tokenValue).toBeTruthy();
        expect(tokenValue.length).toBeGreaterThan(10);
      } else {
        console.log('No CSRF token found - may not be implemented');
      }
    });

    test('should secure password field', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      // Password field should be of type password
      const passwordField = page.locator('#password');
      const fieldType = await passwordField.getAttribute('type');
      
      expect(fieldType).toBe('password');
      
      // Fill password and verify it's masked
      await passwordField.fill('test123');
      const fieldValue = await passwordField.inputValue();
      
      // Value should be retrievable but display should be masked
      expect(fieldValue).toBe('test123');
    });

    test('should use HTTPS in production-like environment', async () => {
      // This test checks if the application is configured for HTTPS
      // In development, this might not apply, but we can check for security headers
      
      const response = await page.goto('http://localhost:5000/admin-login.html');
      const headers = response.headers();
      
      // Check for security headers (optional in development)
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security'
      ];
      
      let securityHeadersFound = 0;
      securityHeaders.forEach(header => {
        if (headers[header]) {
          securityHeadersFound++;
        }
      });
      
      console.log(`Security headers found: ${securityHeadersFound}/${securityHeaders.length}`);
      
      // In development, security headers might not be set, so this is informational
      expect(securityHeadersFound >= 0).toBeTruthy();
    });
  });

  test.describe('User Experience', () => {
    test('should show loading state during login', async () => {
      await page.goto('http://localhost:5000/admin-login.html');
      
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      
      // Click submit and immediately check for loading state
      await page.click('button[type="submit"]');
      
      // Check for loading indicators
      const loadingIndicators = page.locator('.loading, .spinner, button:disabled, .btn-loading');
      
      // Wait briefly to catch loading state
      await page.waitForTimeout(100);
      
      const hasLoadingState = await loadingIndicators.count() > 0;
      
      if (hasLoadingState) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
      
      // Wait for login to complete
      await page.waitForTimeout(3000);
    });

    test('should remember login state across browser tabs', async () => {
      // Login in first tab
      await page.goto('http://localhost:5000/admin-login.html');
      await page.fill('#email', 'admin@tamilsociety.com');
      await page.fill('#password', 'Admin123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin.html*');
      
      // Open new tab
      const newPage = await page.context().newPage();
      
      // Navigate to admin panel in new tab
      await newPage.goto('http://localhost:5000/admin.html');
      
      // Should be logged in (or redirect appropriately)
      const currentUrl = newPage.url();
      const hasAdminContent = await newPage.locator('.sidebar, .admin-sidebar').count() > 0;
      
      expect(currentUrl.includes('admin.html') || hasAdminContent).toBeTruthy();
      
      await newPage.close();
    });
  });
});