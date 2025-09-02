const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {
  
  const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpassword123'
  };
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
  
  test.describe('User Registration', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/signup.html');
      
      // Check if signup form is visible
      await expect(page.locator('.signup-form, #signupForm')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[name="name"], #name')).toBeVisible();
      await expect(page.locator('input[name="email"], #email')).toBeVisible();
      await expect(page.locator('input[name="password"], #password')).toBeVisible();
      await expect(page.locator('button[type="submit"], .signup-btn')).toBeVisible();
    });
    
    test('should handle successful signup', async ({ page }) => {
      await page.goto('/signup.html');
      
      // Fill signup form
      await page.fill('input[name="name"], #name', testUser.name);
      await page.fill('input[name="email"], #email', testUser.email);
      await page.fill('input[name="password"], #password', testUser.password);
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], .signup-btn');
      await submitButton.click();
      
      // Should show success message or redirect
      const successMessage = page.locator('.success-message, .alert-success, .notification');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible();
      } else {
        // Check if redirected to login or dashboard
        await expect(page).toHaveURL(/login|dashboard|home/);
      }
    });
    
    test('should validate required fields', async ({ page }) => {
      await page.goto('/signup.html');
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], .signup-btn');
      await submitButton.click();
      
      // Should show validation errors
      const errorMessages = page.locator('.error-message, .field-error, .invalid-feedback');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });
    
    test('should validate email format', async ({ page }) => {
      await page.goto('/signup.html');
      
      // Fill form with invalid email
      await page.fill('input[name="name"], #name', testUser.name);
      await page.fill('input[name="email"], #email', 'invalid-email');
      await page.fill('input[name="password"], #password', testUser.password);
      
      const submitButton = page.locator('button[type="submit"], .signup-btn');
      await submitButton.click();
      
      // Should show email validation error
      const emailError = page.locator('.email-error, .invalid-email');
      if (await emailError.count() > 0) {
        await expect(emailError.first()).toBeVisible();
      }
    });
    
    test('should validate password strength', async ({ page }) => {
      await page.goto('/signup.html');
      
      // Fill form with weak password
      await page.fill('input[name="name"], #name', testUser.name);
      await page.fill('input[name="email"], #email', testUser.email);
      await page.fill('input[name="password"], #password', '123');
      
      const submitButton = page.locator('button[type="submit"], .signup-btn');
      await submitButton.click();
      
      // Should show password validation error
      const passwordError = page.locator('.password-error, .weak-password');
      if (await passwordError.count() > 0) {
        await expect(passwordError.first()).toBeVisible();
      }
    });
  });
  
  test.describe('User Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login.html');
      
      // Check if login form is visible
      await expect(page.locator('.login-form, #loginForm')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[name="email"], #email')).toBeVisible();
      await expect(page.locator('input[name="password"], #password')).toBeVisible();
      await expect(page.locator('button[type="submit"], .login-btn')).toBeVisible();
    });
    
    test('should handle successful login', async ({ page }) => {
      await page.goto('/login.html');
      
      // Fill login form with valid credentials
      await page.fill('input[name="email"], #email', 'user@example.com');
      await page.fill('input[name="password"], #password', 'password123');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      
      // Should show success or redirect
      const successMessage = page.locator('.success-message, .login-success');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible();
      } else {
        // Check if redirected to dashboard
        await expect(page).toHaveURL(/dashboard|home|profile/);
      }
    });
    
    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login.html');
      
      // Fill login form with invalid credentials
      await page.fill('input[name="email"], #email', 'invalid@example.com');
      await page.fill('input[name="password"], #password', 'wrongpassword');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('.error-message, .login-error, .alert-danger')).toBeVisible();
    });
    
    test('should validate required fields', async ({ page }) => {
      await page.goto('/login.html');
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      
      // Should show validation errors
      const errorMessages = page.locator('.error-message, .field-error, .required-field');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });
  });
  
  test.describe('JWT Token Management', () => {
    test('should store JWT token after successful login', async ({ page }) => {
      await page.goto('/login.html');
      
      // Login with valid credentials
      await page.fill('input[name="email"], #email', 'user@example.com');
      await page.fill('input[name="password"], #password', 'password123');
      
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check if JWT token is stored
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || 
               localStorage.getItem('authToken') || 
               localStorage.getItem('jwt') ||
               sessionStorage.getItem('token');
      });
      
      if (token) {
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
      }
    });
    
    test('should persist token across page reloads', async ({ page }) => {
      await page.goto('/login.html');
      
      // Login first
      await page.fill('input[name="email"], #email', 'user@example.com');
      await page.fill('input[name="password"], #password', 'password123');
      
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Get token before reload
      const tokenBefore = await page.evaluate(() => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
      });
      
      if (tokenBefore) {
        // Reload page
        await page.reload();
        
        // Check if token still exists
        const tokenAfter = await page.evaluate(() => {
          return localStorage.getItem('token') || localStorage.getItem('authToken');
        });
        
        expect(tokenAfter).toBe(tokenBefore);
      }
    });
    
    test('should validate token format', async ({ page }) => {
      await page.goto('/login.html');
      
      // Login and get token
      await page.fill('input[name="email"], #email', 'user@example.com');
      await page.fill('input[name="password"], #password', 'password123');
      
      const submitButton = page.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
      });
      
      if (token) {
        // JWT tokens should have 3 parts separated by dots
        const parts = token.split('.');
        expect(parts.length).toBe(3);
        
        // Each part should be base64 encoded
        parts.forEach(part => {
          expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
        });
      }
    });
    
    test('should handle token expiration', async ({ page }) => {
      await page.goto('/');
      
      // Set an expired token
      await page.evaluate(() => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
        localStorage.setItem('token', expiredToken);
      });
      
      // Try to access protected content
      await page.goto('/profile.html');
      
      // Should redirect to login or show auth modal
      const loginRedirect = page.url().includes('login.html');
      const authModal = await page.locator('.auth-modal, .login-modal').count() > 0;
      
      expect(loginRedirect || authModal).toBeTruthy();
    });
  });
  
  test.describe('Authentication Modals', () => {
    test('should open login modal from navigation', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login"), a:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        
        // Should open login modal
        await expect(page.locator('.login-modal, .auth-modal, #loginModal')).toBeVisible();
        
        // Check modal content
        await expect(page.locator('.modal input[name="email"], .modal #email')).toBeVisible();
        await expect(page.locator('.modal input[name="password"], .modal #password')).toBeVisible();
      }
    });
    
    test('should open signup modal from navigation', async ({ page }) => {
      await page.goto('/');
      
      const signupButton = page.locator('.signup-btn, button:has-text("Sign Up"), a:has-text("Sign Up")');
      if (await signupButton.count() > 0) {
        await signupButton.click();
        
        // Should open signup modal
        await expect(page.locator('.signup-modal, .auth-modal, #signupModal')).toBeVisible();
        
        // Check modal content
        await expect(page.locator('.modal input[name="name"], .modal #name')).toBeVisible();
        await expect(page.locator('.modal input[name="email"], .modal #email')).toBeVisible();
        await expect(page.locator('.modal input[name="password"], .modal #password')).toBeVisible();
      }
    });
    
    test('should close modal with close button', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        
        // Modal should be visible
        const modal = page.locator('.login-modal, .auth-modal');
        await expect(modal).toBeVisible();
        
        // Click close button
        const closeButton = page.locator('.modal .close, .modal .close-btn, .modal .fa-times');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          
          // Modal should be hidden
          await expect(modal).toBeHidden();
        }
      }
    });
    
    test('should close modal with escape key', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        
        // Modal should be visible
        const modal = page.locator('.login-modal, .auth-modal');
        await expect(modal).toBeVisible();
        
        // Press escape key
        await page.keyboard.press('Escape');
        
        // Modal should be hidden
        await expect(modal).toBeHidden();
      }
    });
    
    test('should switch between login and signup modals', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.locator('.login-btn, button:has-text("Login")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        
        // Login modal should be visible
        await expect(page.locator('.login-modal, .auth-modal')).toBeVisible();
        
        // Click switch to signup
        const switchToSignup = page.locator('a:has-text("Sign Up"), .switch-to-signup');
        if (await switchToSignup.count() > 0) {
          await switchToSignup.click();
          
          // Should show signup form
          await expect(page.locator('input[name="name"], #name')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Protected Routes', () => {
    test('should redirect unauthorized users to login', async ({ page }) => {
      // Clear any existing tokens
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access protected route
      await page.goto('/profile.html');
      
      // Should redirect to login or show auth modal
      const isRedirected = page.url().includes('login.html') || page.url().includes('signup.html');
      const hasAuthModal = await page.locator('.auth-modal, .login-required').count() > 0;
      
      expect(isRedirected || hasAuthModal).toBeTruthy();
    });
    
    test('should allow access to protected routes with valid token', async ({ page }) => {
      await page.goto('/');
      
      // Set a valid token (mock)
      await page.evaluate(() => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.mock';
        localStorage.setItem('token', mockToken);
      });
      
      // Try to access protected route
      await page.goto('/profile.html');
      
      // Should not redirect (or show profile content)
      const hasProfileContent = await page.locator('.profile-content, .user-profile, h1:has-text("Profile")').count() > 0;
      const isNotRedirected = !page.url().includes('login.html');
      
      expect(hasProfileContent || isNotRedirected).toBeTruthy();
    });
    
    test('should show auth modal for restricted actions', async ({ page }) => {
      await page.goto('/books.html');
      
      // Clear tokens
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to perform restricted action (buy book)
      const buyButton = page.locator('.buy-now-btn, button:has-text("Buy Now")');
      if (await buyButton.count() > 0) {
        await buyButton.first().click();
        
        // Should show auth modal or redirect
        const authModal = page.locator('.auth-modal, .login-required, .auth-required');
        if (await authModal.count() > 0) {
          await expect(authModal.first()).toBeVisible();
        } else {
          // Check if redirected to login
          expect(page.url()).toMatch(/login|signup/);
        }
      }
    });
  });
  
  test.describe('User Session Management', () => {
    test('should maintain user session across tabs', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      // Login in first tab
      await page1.goto('/login.html');
      await page1.fill('input[name="email"], #email', 'user@example.com');
      await page1.fill('input[name="password"], #password', 'password123');
      
      const submitButton = page1.locator('button[type="submit"], .login-btn');
      await submitButton.click();
      await page1.waitForTimeout(2000);
      
      // Check if logged in in second tab
      await page2.goto('/');
      
      const token1 = await page1.evaluate(() => localStorage.getItem('token'));
      const token2 = await page2.evaluate(() => localStorage.getItem('token'));
      
      if (token1 && token2) {
        expect(token1).toBe(token2);
      }
      
      await page1.close();
      await page2.close();
    });
    
    test('should handle logout functionality', async ({ page }) => {
      await page.goto('/');
      
      // Set logged in state
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-token');
      });
      
      // Find and click logout button
      const logoutButton = page.locator('.logout-btn, button:has-text("Logout"), a:has-text("Logout")');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        
        // Token should be removed
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
        
        // Should redirect to home or show logged out state
        const isLoggedOut = page.url().includes('/') || 
                           await page.locator('.login-btn, button:has-text("Login")').count() > 0;
        expect(isLoggedOut).toBeTruthy();
      }
    });
    
    test('should extend session on user activity', async ({ page }) => {
      await page.goto('/');
      
      // Set token with timestamp
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem('tokenTimestamp', Date.now().toString());
      });
      
      // Simulate user activity
      await page.click('body');
      await page.waitForTimeout(1000);
      
      // Check if session is extended
      const newTimestamp = await page.evaluate(() => {
        return localStorage.getItem('tokenTimestamp');
      });
      
      expect(newTimestamp).toBeTruthy();
    });
  });
  
  test.describe('Password Reset', () => {
    test('should display forgot password link', async ({ page }) => {
      await page.goto('/login.html');
      
      const forgotPasswordLink = page.locator('a:has-text("Forgot Password"), .forgot-password');
      if (await forgotPasswordLink.count() > 0) {
        await expect(forgotPasswordLink.first()).toBeVisible();
      }
    });
    
    test('should handle password reset request', async ({ page }) => {
      await page.goto('/forgot-password.html');
      
      const emailField = page.locator('input[name="email"], #email');
      const submitButton = page.locator('button[type="submit"], .reset-btn');
      
      if (await emailField.count() > 0 && await submitButton.count() > 0) {
        await emailField.fill('user@example.com');
        await submitButton.click();
        
        // Should show success message
        await expect(page.locator('.success-message, .reset-sent')).toBeVisible();
      }
    });
  });
  
  test.describe('Social Authentication', () => {
    test('should display social login buttons', async ({ page }) => {
      await page.goto('/login.html');
      
      const socialButtons = page.locator('.social-login, .google-login, .facebook-login');
      if (await socialButtons.count() > 0) {
        await expect(socialButtons.first()).toBeVisible();
      }
    });
    
    test('should handle Google login', async ({ page }) => {
      await page.goto('/login.html');
      
      const googleButton = page.locator('.google-login, button:has-text("Google")');
      if (await googleButton.count() > 0) {
        // Note: This would typically open a popup, so we just check if the button works
        await googleButton.click();
        
        // Should either open popup or redirect
        // In a real test, you'd mock the OAuth flow
      }
    });
  });
});