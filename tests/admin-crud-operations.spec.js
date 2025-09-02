const { test, expect } = require('@playwright/test');

test.describe('Admin Panel CRUD Operations', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as admin
    await page.goto('http://localhost:5000/admin-login.html');
    await page.fill('#email', 'admin@tamilsociety.com');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin panel
    await page.waitForURL('**/admin.html*');
  });

  test.afterEach(async () => {
    // Page cleanup is handled automatically by Playwright
  });

  test.describe('Books Management CRUD', () => {
    test('should create a new book', async () => {
      // Navigate to books section
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Click Add New Book button
      await page.click('#books .btn-primary');
      
      // Fill book form
      const bookData = {
        title: 'Test Book Title',
        author: 'Test Author',
        price: '29.99',
        description: 'This is a test book description',
        category: 'Fiction'
      };
      
      await page.fill('#bookTitle', bookData.title);
      await page.fill('#bookAuthor', bookData.author);
      await page.fill('#bookPrice', bookData.price);
      await page.fill('#bookDescription', bookData.description);
      await page.selectOption('#bookCategory', bookData.category);
      
      // Submit form
      await page.click('#bookForm button[type="submit"]');
      
      // Verify success message or redirect
      await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
    });

    test('should read/display books list', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Check if books table is visible
      await expect(page.locator('#books table, #books .book-item')).toBeVisible();
      
      // Verify table headers or book display elements
      const hasTableHeaders = await page.locator('#books th').count() > 0;
      const hasBookItems = await page.locator('#books .book-item').count() > 0;
      
      expect(hasTableHeaders || hasBookItems).toBeTruthy();
    });

    test('should update an existing book', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Look for edit button (could be in table or book cards)
      const editButton = page.locator('#books .btn-edit, #books .edit-btn, #books button:has-text("Edit")').first();
      
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Update book data
        await page.fill('#bookTitle', 'Updated Book Title');
        await page.fill('#bookPrice', '39.99');
        
        // Submit update
        await page.click('#bookForm button[type="submit"], .btn-update');
        
        // Verify success
        await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
      }
    });

    test('should delete a book', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Look for delete button
      const deleteButton = page.locator('#books .btn-delete, #books .delete-btn, #books button:has-text("Delete")').first();
      
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        
        // Handle confirmation dialog if present
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        
        // Verify success or removal
        await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('E-books Management CRUD', () => {
    test('should create a new ebook', async () => {
      await page.click('[data-section="ebooks"]');
      await page.waitForSelector('#ebooks', { state: 'visible' });
      
      await page.click('#ebooks .btn-primary');
      
      const ebookData = {
        title: 'Test E-book Title',
        author: 'Test E-book Author',
        price: '19.99',
        description: 'This is a test e-book description'
      };
      
      await page.fill('#ebookTitle', ebookData.title);
      await page.fill('#ebookAuthor', ebookData.author);
      await page.fill('#ebookPrice', ebookData.price);
      await page.fill('#ebookDescription', ebookData.description);
      
      await page.click('#ebookForm button[type="submit"]');
      await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
    });

    test('should read/display ebooks list', async () => {
      await page.click('[data-section="ebooks"]');
      await page.waitForSelector('#ebooks', { state: 'visible' });
      
      await expect(page.locator('#ebooks table, #ebooks .ebook-item')).toBeVisible();
    });
  });

  test.describe('Projects Management CRUD', () => {
    test('should create a new project', async () => {
      await page.click('[data-section="projects"]');
      await page.waitForSelector('#projects', { state: 'visible' });
      
      await page.click('#projects .btn-primary');
      
      const projectData = {
        title: 'Test Project Title',
        description: 'This is a test project description',
        status: 'Active'
      };
      
      await page.fill('#projectTitle', projectData.title);
      await page.fill('#projectDescription', projectData.description);
      await page.selectOption('#projectStatus', projectData.status);
      
      await page.click('#projectForm button[type="submit"]');
      await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
    });

    test('should read/display projects list', async () => {
      await page.click('[data-section="projects"]');
      await page.waitForSelector('#projects', { state: 'visible' });
      
      await expect(page.locator('#projects table, #projects .project-item')).toBeVisible();
    });
  });

  test.describe('Activities Management CRUD', () => {
    test('should create a new activity', async () => {
      await page.click('[data-section="activities"]');
      await page.waitForSelector('#activities', { state: 'visible' });
      
      await page.click('#activities .btn-primary');
      
      const activityData = {
        title: 'Test Activity Title',
        description: 'This is a test activity description',
        date: '2024-12-31'
      };
      
      await page.fill('#activityTitle', activityData.title);
      await page.fill('#activityDescription', activityData.description);
      await page.fill('#activityDate', activityData.date);
      
      await page.click('#activityForm button[type="submit"]');
      await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
    });

    test('should read/display activities list', async () => {
      await page.click('[data-section="activities"]');
      await page.waitForSelector('#activities', { state: 'visible' });
      
      await expect(page.locator('#activities table, #activities .activity-item')).toBeVisible();
    });
  });

  test.describe('Team Management CRUD', () => {
    test('should create a new team member', async () => {
      await page.click('[data-section="team"]');
      await page.waitForSelector('#team', { state: 'visible' });
      
      await page.click('#team .btn-primary');
      
      const memberData = {
        name: 'Test Team Member',
        position: 'Test Position',
        email: 'test@example.com',
        phone: '1234567890'
      };
      
      await page.fill('#memberName', memberData.name);
      await page.fill('#memberPosition', memberData.position);
      await page.fill('#memberEmail', memberData.email);
      await page.fill('#memberPhone', memberData.phone);
      
      await page.click('#teamForm button[type="submit"]');
      await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
    });

    test('should read/display team members list', async () => {
      await page.click('[data-section="team"]');
      await page.waitForSelector('#team', { state: 'visible' });
      
      await expect(page.locator('#team table, #team .member-item')).toBeVisible();
    });
  });

  test.describe('Users Management CRUD', () => {
    test('should read/display users list', async () => {
      await page.click('[data-section="users"]');
      await page.waitForSelector('#users', { state: 'visible' });
      
      await expect(page.locator('#users table')).toBeVisible();
      
      // Check for user data columns
      const expectedHeaders = ['Name', 'Email', 'Role', 'Status', 'Actions'];
      for (const header of expectedHeaders) {
        await expect(page.locator(`#users th:has-text("${header}")`)).toBeVisible();
      }
    });

    test('should update user status', async () => {
      await page.click('[data-section="users"]');
      await page.waitForSelector('#users', { state: 'visible' });
      
      // Look for status update buttons or dropdowns
      const statusButton = page.locator('#users .status-btn, #users .btn-status').first();
      
      if (await statusButton.count() > 0) {
        await statusButton.click();
        await expect(page.locator('.alert-success, .success-message')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Form Validation Tests', () => {
    test('should validate required fields in book form', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      await page.click('#books .btn-primary');
      
      // Try to submit empty form
      await page.click('#bookForm button[type="submit"]');
      
      // Check for validation messages
      const validationMessages = page.locator('.error-message, .invalid-feedback, .alert-danger');
      await expect(validationMessages.first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format in team member form', async () => {
      await page.click('[data-section="team"]');
      await page.waitForSelector('#team', { state: 'visible' });
      
      await page.click('#team .btn-primary');
      
      // Fill invalid email
      await page.fill('#memberEmail', 'invalid-email');
      await page.click('#teamForm button[type="submit"]');
      
      // Check for email validation
      const emailError = page.locator('.error-message:has-text("email"), .invalid-feedback:has-text("email")');
      await expect(emailError.first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate price format in book form', async () => {
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      await page.click('#books .btn-primary');
      
      // Fill invalid price
      await page.fill('#bookPrice', 'invalid-price');
      await page.click('#bookForm button[type="submit"]');
      
      // Check for price validation
      const priceError = page.locator('.error-message:has-text("price"), .invalid-feedback:has-text("price")');
      await expect(priceError.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('API Integration Tests', () => {
    test('should handle API errors gracefully', async () => {
      // Intercept API calls and simulate errors
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      // Try to create a book with API error
      await page.click('#books .btn-primary');
      await page.fill('#bookTitle', 'Test Book');
      await page.click('#bookForm button[type="submit"]');
      
      // Check for error handling
      await expect(page.locator('.alert-danger, .error-message')).toBeVisible({ timeout: 10000 });
    });

    test('should show loading states during API calls', async () => {
      // Intercept API calls and add delay
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      await page.click('[data-section="books"]');
      await page.waitForSelector('#books', { state: 'visible' });
      
      await page.click('#books .btn-primary');
      await page.fill('#bookTitle', 'Test Book');
      await page.click('#bookForm button[type="submit"]');
      
      // Check for loading indicator
      await expect(page.locator('.loading, .spinner, .btn:disabled')).toBeVisible({ timeout: 5000 });
    });
  });
});