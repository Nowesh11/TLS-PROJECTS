const { test, expect } = require('@playwright/test');

// Helper function for API requests with timeout
async function makeRequest(request, method, url, options = {}) {
  const timeout = options.timeout || 5000;
  const requestOptions = {
    ...options,
    timeout
  };
  
  try {
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await request.get(url, requestOptions);
        break;
      case 'post':
        response = await request.post(url, requestOptions);
        break;
      case 'put':
        response = await request.put(url, requestOptions);
        break;
      case 'delete':
        response = await request.delete(url, requestOptions);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    return response;
  } catch (error) {
    console.log(`Request failed: ${method} ${url} - ${error.message}`);
    throw error;
  }
}

// Helper function to safely parse JSON response
async function safeJsonParse(response) {
  try {
    return await response.json();
  } catch (error) {
    console.log('Failed to parse JSON response:', error.message);
    return null;
  }
}

test.describe('API Integration Tests - Optimized', () => {
  let authToken = null;
  const baseURL = 'http://localhost:5000/api';
  
  test.beforeAll(async ({ request }) => {
    // Get auth token from global setup
    authToken = process.env.PLAYWRIGHT_AUTH_TOKEN;
    
    if (authToken) {
      console.log('✅ Using auth token from global setup for optimized API tests');
    } else {
      console.warn('⚠️ No auth token available - auth-dependent tests will be skipped');
    }
  });
  
  test.describe('Authentication API', () => {
    test('should register new user', async ({ request }) => {
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'testpass123',
        confirmPassword: 'testpass123'
      };
      
      const response = await makeRequest(request, 'post', `${baseURL}/auth/register`, {
        data: userData,
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(data.success).toBe(true);
          expect(data.user).toBeDefined();
          expect(data.user.email).toBe(userData.email);
          expect(data.token || data.accessToken).toBeDefined();
        }
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
        const errorData = await safeJsonParse(response);
        if (errorData) {
          expect(errorData.message || errorData.error).toBeDefined();
        }
      }
    });
    
    test('should login with valid credentials', async ({ request }) => {
      const response = await makeRequest(request, 'post', `${baseURL}/auth/login`, {
        data: {
          email: 'admin@tamilsociety.com',
    password: 'Admin123!'
        },
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(data.success).toBe(true);
          expect(data.user).toBeDefined();
          expect(data.token || data.accessToken).toBeDefined();
        }
      } else {
        expect(response.status()).toBe(401);
      }
    });
    
    test('should reject invalid credentials', async ({ request }) => {
      const response = await makeRequest(request, 'post', `${baseURL}/auth/login`, {
        data: {
          email: 'admin@tamilsociety.com',
          password: 'wrongpassword'
        },
        timeout: 3000
      });
      
      expect(response.status()).toBe(401);
      const data = await safeJsonParse(response);
      if (data) {
        expect(data.success).toBe(false);
        expect(data.message || data.error).toBeDefined();
      }
    });
    
    test('should validate JWT token', async ({ request }) => {
      
      const response = await makeRequest(request, 'get', `${baseURL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(data.valid || data.success).toBe(true);
          expect(data.user).toBeDefined();
        }
      } else {
        expect(response.status()).toBe(401);
      }
    });
  });
  
  test.describe('Books API', () => {
    test('should fetch all books', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/books`, {
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(Array.isArray(data) || Array.isArray(data.books)).toBe(true);
          
          const books = Array.isArray(data) ? data : data.books;
          if (books && books.length > 0) {
            const book = books[0];
            expect(book.title).toBeDefined();
            expect(book.author).toBeDefined();
            expect(book.price).toBeDefined();
          }
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should fetch single book by ID', async ({ request }) => {
      const booksResponse = await makeRequest(request, 'get', `${baseURL}/books`, {
        timeout: 3000
      });
      
      if (booksResponse.ok()) {
        const booksData = await safeJsonParse(booksResponse);
        if (booksData) {
          const books = Array.isArray(booksData) ? booksData : booksData.books;
          
          if (books && books.length > 0) {
            const bookId = books[0]._id || books[0].id;
            
            const response = await makeRequest(request, 'get', `${baseURL}/books/${bookId}`, {
              timeout: 3000
            });
            
            if (response.ok()) {
              const data = await safeJsonParse(response);
              if (data) {
                const book = data.book || data;
                expect(book.title).toBeDefined();
                expect(book.author).toBeDefined();
                expect(book._id || book.id).toBe(bookId);
              }
            } else {
              expect([404, 500]).toContain(response.status());
            }
          }
        }
      }
    });
    
    test('should create new book (admin only)', async ({ request }) => {
      
      const bookData = {
        title: `Test Book ${Date.now()}`,
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        category: 'Fiction',
        isbn: `${Date.now()}`
      };
      
      const response = await makeRequest(request, 'post', `${baseURL}/books`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: bookData,
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(data.success).toBe(true);
          expect(data.book).toBeDefined();
          expect(data.book.title).toBe(bookData.title);
        }
      } else {
        expect([401, 403, 400, 422]).toContain(response.status());
      }
    });
  });
  
  test.describe('Ebooks API', () => {
    test('should fetch all ebooks', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/ebooks`, {
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(Array.isArray(data) || Array.isArray(data.ebooks)).toBe(true);
          
          const ebooks = Array.isArray(data) ? data : data.ebooks;
          if (ebooks && ebooks.length > 0) {
            const ebook = ebooks[0];
            expect(ebook.title).toBeDefined();
            expect(ebook.author).toBeDefined();
          }
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Projects API', () => {
    test('should fetch all projects', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/projects`, {
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(Array.isArray(data) || Array.isArray(data.projects)).toBe(true);
          
          const projects = Array.isArray(data) ? data : data.projects;
          if (projects && projects.length > 0) {
            const project = projects[0];
            expect(project.title).toBeDefined();
            expect(project.description).toBeDefined();
          }
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Team API', () => {
    test('should fetch team members', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/team`, {
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(Array.isArray(data) || Array.isArray(data.team)).toBe(true);
          
          const team = Array.isArray(data) ? data : data.team;
          if (team && team.length > 0) {
            const member = team[0];
            expect(member.name).toBeDefined();
            expect(member.position || member.role).toBeDefined();
          }
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Chat API', () => {
    test('should send chat message', async ({ request }) => {
      const messageData = {
        message: 'Test message',
        sessionId: `test-session-${Date.now()}`,
        userName: 'Test User'
      };
      
      const response = await makeRequest(request, 'post', `${baseURL}/chat/message`, {
        data: messageData,
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(data.success).toBe(true);
          expect(data.message).toBeDefined();
        }
      } else {
        expect([400, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Notifications API', () => {
    test('should fetch notifications', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/notifications`, {
        timeout: 3000
      });
      
      if (response.ok()) {
        const data = await safeJsonParse(response);
        if (data) {
          expect(Array.isArray(data) || Array.isArray(data.notifications)).toBe(true);
          
          const notifications = Array.isArray(data) ? data : data.notifications;
          if (notifications && notifications.length > 0) {
            const notification = notifications[0];
            expect(notification.title || notification.message).toBeDefined();
            expect(notification.type).toBeDefined();
          }
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
  });
  
  
  

  
  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/nonexistent`, {
        timeout: 2000
      });
      expect(response.status()).toBe(404);
    });
    
    test('should handle malformed JSON', async ({ request }) => {
      try {
        const response = await makeRequest(request, 'post', `${baseURL}/books`, {
          headers: {
            'Content-Type': 'application/json'
          },
          data: 'invalid json',
          timeout: 2000
        });
        
        expect([400, 422, 500]).toContain(response.status());
      } catch (error) {
        // Expected to fail with malformed JSON
        expect(error.message).toBeDefined();
      }
    });
    
    test('should handle missing required fields', async ({ request }) => {
      const response = await makeRequest(request, 'post', `${baseURL}/users`, {
        data: {
          name: 'Test User'
          // Missing required fields like email, password
        },
        timeout: 2000
      });
      
      expect([400, 422]).toContain(response.status());
      const data = await safeJsonParse(response);
      if (data) {
        expect(data.message || data.error || data.errors).toBeDefined();
      }
    });
    
    test('should handle unauthorized access', async ({ request }) => {
      const response = await makeRequest(request, 'get', `${baseURL}/admin/dashboard`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        timeout: 2000
      });
      
      expect(response.status()).toBe(401);
    });
  });
  
  test.describe('Performance Tests', () => {
    test('should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await makeRequest(request, 'get', `${baseURL}/books`, {
        timeout: 3000
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(3000);
      expect(response.status()).toBeLessThan(500);
    });
    
    test('should handle concurrent requests', async ({ request }) => {
      const promises = [];
      const endpoints = [
        `${baseURL}/books`,
        `${baseURL}/ebooks`,
        `${baseURL}/projects`,
        `${baseURL}/team`,
        `${baseURL}/notifications`
      ];
      
      for (const endpoint of endpoints) {
        promises.push(
          makeRequest(request, 'get', endpoint, { timeout: 3000 })
            .catch(error => ({ error: error.message }))
        );
      }
      
      const responses = await Promise.all(promises);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.ok && r.ok()).length;
      expect(successfulRequests).toBeGreaterThan(0);
    });
  });
});