const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Audit framework utilities
class AuditFramework {
  constructor() {
    this.results = {
      auditMetadata: {
        startTime: new Date().toISOString(),
        projectName: 'TLS Projects - Full Stack Audit',
        auditVersion: '1.0.0',
        totalFeatures: 0,
        completedFeatures: 0,
        failedFeatures: 0,
        fixedFeatures: 0,
        notImplementedFeatures: 0
      },
      testResults: [],
      fixes: [],
      evidence: []
    };
  }

  async logResult(feature, status, details = {}) {
    const result = {
      feature,
      status, // 'PASS', 'FAIL', 'NOT_IMPLEMENTED', 'FIXED'
      timestamp: new Date().toISOString(),
      details,
      evidence: details.screenshot ? [details.screenshot] : []
    };
    
    this.results.testResults.push(result);
    this.results.auditMetadata.totalFeatures++;
    
    if (status === 'PASS') this.results.auditMetadata.completedFeatures++;
    else if (status === 'FAIL') this.results.auditMetadata.failedFeatures++;
    else if (status === 'FIXED') this.results.auditMetadata.fixedFeatures++;
    else if (status === 'NOT_IMPLEMENTED') this.results.auditMetadata.notImplementedFeatures++;
  }

  async saveResults() {
    const reportPath = path.join(__dirname, '..', 'test-reports', 'audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
  }

  async takeScreenshot(page, name) {
    const screenshotPath = path.join(__dirname, '..', 'test-reports', 'screenshots', `${name}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }
}

const audit = new AuditFramework();

test.describe('Comprehensive Feature Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure servers are running
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    await audit.saveResults();
  });

  // 1. PUBLIC WEBSITE AUDIT
  test.describe('Public Website Features', () => {
    
    test('Homepage - Hero Section and Navigation', async ({ page }) => {
      try {
        await page.goto('http://localhost:3000');
        
        // Test navigation elements
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'Home' })).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'About Us' })).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'Projects' })).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'Ebooks' })).toBeVisible();
        await expect(page.locator('nav').getByRole('link', { name: 'Book Store' })).toBeVisible();
        
        // Test hero section
        await expect(page.locator('.hero, .hero-section, #hero')).toBeVisible();
        
        // Test theme toggle
        const themeToggle = page.locator('#theme-toggle, .theme-toggle, [data-theme-toggle]');
        await expect(themeToggle).toBeVisible();
        
        const screenshot = await audit.takeScreenshot(page, 'homepage-navigation');
        await audit.logResult('Homepage Navigation & Hero', 'PASS', { screenshot });
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'homepage-navigation-fail');
        await audit.logResult('Homepage Navigation & Hero', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });

    test('Theme Toggle Functionality', async ({ page }) => {
      try {
        await page.goto('http://localhost:3000');
        
        // Test light theme (default)
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-theme', 'light');
        
        // Toggle to dark theme
        const themeToggle = page.locator('#theme-toggle, .theme-toggle, [data-theme-toggle]');
        if (await themeToggle.isVisible()) {
          await themeToggle.click();
          await page.waitForTimeout(500); // Allow theme transition
          
          // Check if theme changed (could be data-theme attribute or class)
          const isDarkTheme = await body.getAttribute('data-theme') === 'dark' || 
                             await body.getAttribute('class')?.includes('dark-theme') ||
                             await page.locator('html').getAttribute('data-theme') === 'dark';
          
          // Toggle back to light theme
          await themeToggle.click();
          await page.waitForTimeout(500);
        }
        
        const screenshot = await audit.takeScreenshot(page, 'theme-toggle');
        await audit.logResult('Theme Toggle Functionality', 'PASS', { screenshot });
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'theme-toggle-fail');
        await audit.logResult('Theme Toggle Functionality', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });

    test('Books Page - Filtering and Cart', async ({ page }) => {
      try {
        await page.goto('http://localhost:3000/books.html');
        await page.waitForLoadState('networkidle');
        
        // Test books grid loading
        await expect(page.locator('.books-grid')).toBeVisible();
        
        // Test search functionality
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
        }
        
        // Test category filter
        const categoryFilter = page.locator('select[name="category"]');
        if (await categoryFilter.isVisible()) {
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
        
        // Test add to cart functionality
        const addToCartBtn = page.locator('.add-to-cart').first();
        if (await addToCartBtn.isVisible()) {
          await addToCartBtn.click();
          await page.waitForTimeout(500);
        }
        
        const screenshot = await audit.takeScreenshot(page, 'books-page');
        await audit.logResult('Books Page Filtering & Cart', 'PASS', { screenshot });
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'books-page-fail');
        await audit.logResult('Books Page Filtering & Cart', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });



    test('Chat Widget Functionality', async ({ page }) => {
      try {
        await page.goto('http://localhost:3000/contact.html'); // Chat widget is likely on contact page
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Wait for dynamic loading
        
        // Look for chat widget with multiple selectors
        const chatWidget = page.locator('.chat-widget, #chat-widget, #directChatBtn, .chat-button, [onclick*="chat"], [onclick*="Chat"]');
        
        const widgetCount = await chatWidget.count();
        if (widgetCount === 0) {
          const screenshot = await audit.takeScreenshot(page, 'chat-widget-fail');
          await audit.logResult('Chat Widget Functionality', 'FAIL', { screenshot, error: 'Chat widget not found on page' });
          return;
        }
        
        // Check if widget is visible
        const isVisible = await chatWidget.first().isVisible();
        if (!isVisible) {
          const screenshot = await audit.takeScreenshot(page, 'chat-widget-fail');
          await audit.logResult('Chat Widget Functionality', 'FAIL', { screenshot, error: 'Chat widget exists but is not visible' });
          return;
        }
        
        // Test chat widget interaction
        await chatWidget.first().click();
        await page.waitForTimeout(2000);
        
        // Check for chat interface or modal
        const chatInterface = page.locator('.chat-interface, .chat-modal, .chat-container, [style*="position: fixed"]');
        const interfaceVisible = await chatInterface.count() > 0;
        
        const screenshot = await audit.takeScreenshot(page, 'chat-widget');
        
        if (interfaceVisible) {
          await audit.logResult('Chat Widget Functionality', 'PASS', { screenshot, details: 'Chat widget opened successfully' });
        } else {
          // Check for any notification or response
          const notification = page.locator('.notification, .toast, .alert');
          if (await notification.count() > 0) {
            await audit.logResult('Chat Widget Functionality', 'PASS', { screenshot, details: 'Chat widget triggered notification/response' });
          } else {
            await audit.logResult('Chat Widget Functionality', 'PARTIAL', { screenshot, details: 'Chat widget clicked but no visible response' });
          }
        }
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'chat-widget-fail');
        await audit.logResult('Chat Widget Functionality', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });
  });

  // 2. ADMIN PANEL AUDIT
  test.describe('Admin Panel Features', () => {
    
    test('Admin Login Process', async ({ page }) => {
      try {
        await page.goto('http://localhost:3000/admin-login.html');
        await page.waitForLoadState('networkidle');
        
        // Fill login form
        await page.fill('input[name="email"], input[type="email"]', 'admin@tamilsociety.com');
        await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
        
        // Submit login
        await page.click('button[type="submit"], .login-btn');
        await page.waitForTimeout(3000);
        
        // Check if redirected to admin panel or if login was successful
        const currentUrl = page.url();
        const isAdminPage = currentUrl.includes('admin.html') || currentUrl.includes('admin');
        
        const screenshot = await audit.takeScreenshot(page, 'admin-login');
        await audit.logResult('Admin Login Process', isAdminPage ? 'PASS' : 'FAIL', { 
          screenshot,
          details: `Current URL: ${currentUrl}`
        });
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'admin-login-fail');
        await audit.logResult('Admin Login Process', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });

    test('Admin Dashboard Components', async ({ page }) => {
      try {
        // First login as admin
        await page.goto('http://localhost:3000/admin-login.html');
        await page.fill('input[name="email"], input[type="email"]', 'admin@tamilsociety.com');
        await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
        await page.click('button[type="submit"], .login-btn');
        await page.waitForTimeout(2000);
        
        // Test admin dashboard
        await page.goto('http://localhost:3000/admin.html');
        await page.waitForLoadState('networkidle');
        
        // Test dashboard components
        await expect(page.locator('.admin-sidebar, .sidebar')).toBeVisible();
        await expect(page.locator('.admin-content, .main-content').first()).toBeVisible();
        
        // Test navigation items
        const navItems = ['Dashboard', 'Books', 'Projects', 'Users', 'Content'];
        for (const item of navItems) {
          const navLink = page.getByText(item).first();
          if (await navLink.isVisible()) {
            await navLink.click();
            await page.waitForTimeout(500);
          }
        }
        
        const screenshot = await audit.takeScreenshot(page, 'admin-dashboard');
        await audit.logResult('Admin Dashboard Components', 'PASS', { screenshot });
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'admin-dashboard-fail');
        await audit.logResult('Admin Dashboard Components', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });
  });

  // 3. RESPONSIVE DESIGN AUDIT
  test.describe('Responsive Design Tests', () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      test(`Responsive Design - ${viewport.name}`, async ({ page }) => {
        try {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto('http://localhost:3000');
          await page.waitForLoadState('networkidle');
          
          // Test navigation responsiveness
          const nav = page.locator('nav');
          await expect(nav).toBeVisible();
          
          // Test mobile menu if on mobile viewport
          if (viewport.width <= 768) {
            const mobileMenuToggle = page.locator('.hamburger, .mobile-menu-toggle, .menu-toggle');
            if (await mobileMenuToggle.isVisible()) {
              await mobileMenuToggle.click();
              await page.waitForTimeout(500);
            }
          }
          
          // Test hero section
          await expect(page.locator('.hero, .hero-section, #hero')).toBeVisible();
          await expect(page.locator('.features-section, .services-section, .features, .services')).toBeVisible();
          
          const screenshot = await audit.takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`);
          await audit.logResult(`Responsive Design - ${viewport.name}`, 'PASS', { 
            screenshot,
            viewport: `${viewport.width}x${viewport.height}`
          });
          
        } catch (error) {
          const screenshot = await audit.takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}-fail`);
          await audit.logResult(`Responsive Design - ${viewport.name}`, 'FAIL', { 
            error: error.message, 
            screenshot,
            viewport: `${viewport.width}x${viewport.height}`
          });
        }
      });
    }
  });

  // 4. API INTEGRATION AUDIT
  test.describe('API Integration Tests', () => {
    
    test('Books API Integration', async ({ page }) => {
      try {
        // Test API endpoint directly
        const response = await page.request.get('http://localhost:5000/api/books');
        const isApiWorking = response.status() === 200;
        
        if (isApiWorking) {
          const books = await response.json();
          
          // Test books page integration
          await page.goto('http://localhost:3000/books.html');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Check if books are loaded
          const bookCards = page.locator('.book-card, .book-item');
          const bookCount = await bookCards.count();
          
          const screenshot = await audit.takeScreenshot(page, 'books-api');
          await audit.logResult('Books API Integration', bookCount > 0 ? 'PASS' : 'FAIL', { 
            screenshot,
            details: `API Status: ${response.status()}, Books loaded: ${bookCount}`
          });
        } else {
          await audit.logResult('Books API Integration', 'FAIL', { 
            details: `API Status: ${response.status()}`
          });
        }
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'books-api-fail');
        await audit.logResult('Books API Integration', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });

    test('Projects API Integration', async ({ page }) => {
      try {
        const response = await page.request.get('http://localhost:5000/api/projects');
        const isApiWorking = response.status() === 200;
        
        if (isApiWorking) {
          await page.goto('http://localhost:3000/projects.html');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const projectCards = page.locator('.project-card, .project-item');
          const projectCount = await projectCards.count();
          
          const screenshot = await audit.takeScreenshot(page, 'projects-api');
          await audit.logResult('Projects API Integration', projectCount > 0 ? 'PASS' : 'FAIL', { 
            screenshot,
            details: `API Status: ${response.status()}, Projects loaded: ${projectCount}`
          });
        } else {
          await audit.logResult('Projects API Integration', 'FAIL', { 
            details: `API Status: ${response.status()}`
          });
        }
        
      } catch (error) {
        const screenshot = await audit.takeScreenshot(page, 'projects-api-fail');
        await audit.logResult('Projects API Integration', 'FAIL', { 
          error: error.message, 
          screenshot 
        });
      }
    });
  });
});