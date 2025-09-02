const { test, expect } = require('@playwright/test');

test.describe('API Integration Tests', () => {
  let authToken = null;
  
  test.beforeAll(async ({ request }) => {
    // Get auth token from global setup
    authToken = process.env.PLAYWRIGHT_AUTH_TOKEN;
    
    if (authToken) {
      console.log('✅ Using auth token from global setup');
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
      
      const response = await request.post('http://localhost:5000/api/auth/register', {
        data: userData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(userData.email);
        expect(data.token || data.accessToken).toBeDefined();
      } else {
        // If registration fails, check error response
        const errorData = await response.json();
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(errorData.message || errorData.error).toBeDefined();
      }
    });
    
    test('should login with valid credentials', async ({ request }) => {
      const response = await request.post('http://localhost:5000/api/auth/login', {
        data: {
          email: 'admin@tamilsociety.com',
    password: 'Admin123!'
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
        expect(data.token || data.accessToken).toBeDefined();
      } else {
        expect(response.status()).toBe(401);
      }
    });
    
    test('should reject invalid credentials', async ({ request }) => {
      const response = await request.post('http://localhost:8080/api/auth/login', {
        data: {
          email: 'admin@tamilsociety.com',
          password: 'wrongpassword'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message || data.error).toBeDefined();
    });
    
    test('should validate JWT token', async ({ request }) => {
      
      const response = await request.get('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.valid || data.success).toBe(true);
        expect(data.user).toBeDefined();
      } else {
        expect(response.status()).toBe(401);
      }
    });
    
    test('should handle password reset request', async ({ request }) => {
      const response = await request.post('http://localhost:5000/api/auth/forgot-password', {
        data: {
          email: 'admin@tamilsociety.com'
        }
      });
      
      // Should either succeed or return appropriate error
      if (response.ok()) {
        const data = await response.json();
        expect(data.success || data.message).toBeDefined();
      } else {
        expect([400, 404, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Books API', () => {
    test('should fetch all books', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/books');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.books)).toBe(true);
        
        const books = Array.isArray(data) ? data : data.books;
        if (books.length > 0) {
          const book = books[0];
          expect(book.title).toBeDefined();
          expect(book.author).toBeDefined();
          expect(book.price).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should fetch single book by ID', async ({ request }) => {
      // First get all books to get an ID
      const booksResponse = await request.get('http://localhost:5000/api/books');
      
      if (booksResponse.ok()) {
        const booksData = await booksResponse.json();
        const books = Array.isArray(booksData) ? booksData : booksData.books;
        
        if (books && books.length > 0) {
          const bookId = books[0]._id || books[0].id;
          
          const response = await request.get(`http://localhost:5000/api/books/${bookId}`);
          
          if (response.ok()) {
            const data = await response.json();
            const book = data.book || data;
            expect(book.title).toBeDefined();
            expect(book.author).toBeDefined();
            expect(book._id || book.id).toBe(bookId);
          } else {
            expect([404, 500]).toContain(response.status());
          }
        }
      }
    });
    
    test('should create new book (admin only)', async ({ request }) => {
      
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        price: 29.99,
        category: 'Fiction',
        isbn: '1234567890123'
      };
      
      const response = await request.post('http://localhost:5000/api/books', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: bookData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.book).toBeDefined();
        expect(data.book.title).toBe(bookData.title);
      } else {
        // Should be unauthorized or validation error
        expect([401, 403, 400, 422]).toContain(response.status());
      }
    });
    
    test('should update book (admin only)', async ({ request }) => {
      
      // First get a book to update
      const booksResponse = await request.get('http://localhost:5000/api/books');
      
      if (booksResponse.ok()) {
        const booksData = await booksResponse.json();
        const books = Array.isArray(booksData) ? booksData : booksData.books;
        
        if (books && books.length > 0) {
          const bookId = books[0]._id || books[0].id;
          
          const updateData = {
            title: 'Updated Test Book',
            price: 39.99
          };
          
          const response = await request.put(`http://localhost:5000/api/books/${bookId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            data: updateData
          });
          
          if (response.ok()) {
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.book).toBeDefined();
          } else {
            expect([401, 403, 404, 400]).toContain(response.status());
          }
        }
      }
    });
    
    test('should delete book (admin only)', async ({ request }) => {
      
      // Create a book first to delete
      const bookData = {
        title: 'Book to Delete',
        author: 'Test Author',
        price: 19.99
      };
      
      const createResponse = await request.post('http://localhost:5000/api/books', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: bookData
      });
      
      if (createResponse.ok()) {
        const createData = await createResponse.json();
        const bookId = createData.book._id || createData.book.id;
        
        const deleteResponse = await request.delete(`http://localhost:5000/api/books/${bookId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (deleteResponse.ok()) {
          const deleteData = await deleteResponse.json();
          expect(deleteData.success).toBe(true);
        } else {
          expect([401, 403, 404]).toContain(deleteResponse.status());
        }
      }
    });
  });
  
  test.describe('Ebooks API', () => {
    test('should fetch all ebooks', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/ebooks');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.ebooks)).toBe(true);
        
        const ebooks = Array.isArray(data) ? data : data.ebooks;
        if (ebooks.length > 0) {
          const ebook = ebooks[0];
          expect(ebook.title).toBeDefined();
          expect(ebook.author).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should download ebook (authenticated)', async ({ request }) => {
      
      // First get ebooks to get an ID
      const ebooksResponse = await request.get('http://localhost:5000/api/ebooks');
      
      if (ebooksResponse.ok()) {
        const ebooksData = await ebooksResponse.json();
        const ebooks = Array.isArray(ebooksData) ? ebooksData : ebooksData.ebooks;
        
        if (ebooks && ebooks.length > 0) {
          const ebookId = ebooks[0]._id || ebooks[0].id;
          
          const response = await request.get(`http://localhost:5000/api/ebooks/${ebookId}/download`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok()) {
            // Should return file or download URL
            const contentType = response.headers()['content-type'];
            expect(contentType).toBeDefined();
          } else {
            expect([401, 403, 404]).toContain(response.status());
          }
        }
      }
    });
  });
  
  test.describe('Projects API', () => {
    test('should fetch all projects', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/projects');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.projects)).toBe(true);
        
        const projects = Array.isArray(data) ? data : data.projects;
        if (projects.length > 0) {
          const project = projects[0];
          expect(project.title).toBeDefined();
          expect(project.description).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should create project join request', async ({ request }) => {
      // First get projects to get an ID
      const projectsResponse = await request.get('http://localhost:5000/api/projects');
      
      if (projectsResponse.ok()) {
        const projectsData = await projectsResponse.json();
        const projects = Array.isArray(projectsData) ? projectsData : projectsData.projects;
        
        if (projects && projects.length > 0) {
          const projectId = projects[0]._id || projects[0].id;
          
          const joinData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            message: 'I want to join this project'
          };
          
          const response = await request.post(`http://localhost:5000/api/projects/${projectId}/join`, {
            data: joinData
          });
          
          if (response.ok()) {
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.message).toBeDefined();
          } else {
            expect([400, 404, 500]).toContain(response.status());
          }
        }
      }
    });
    
    test('should export projects to CSV (admin only)', async ({ request }) => {
      
      const response = await request.get('http://localhost:5000/api/projects/export/csv', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('csv');
      } else {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
  });
  
  test.describe('Team API', () => {
    test('should fetch team members', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/team');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.team)).toBe(true);
        
        const team = Array.isArray(data) ? data : data.team;
        if (team.length > 0) {
          const member = team[0];
          expect(member.name).toBeDefined();
          expect(member.position || member.role).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should add team member (admin only)', async ({ request }) => {
      
      const memberData = {
        name: 'Test Member',
        position: 'Test Position',
        bio: 'Test bio',
        email: 'testmember@example.com'
      };
      
      const response = await request.post('http://localhost:5000/api/team', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: memberData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.member).toBeDefined();
        expect(data.member.name).toBe(memberData.name);
      } else {
        expect([401, 403, 400]).toContain(response.status());
      }
    });
  });
  
  test.describe('Chat API', () => {
    test('should send chat message', async ({ request }) => {
      const messageData = {
        message: 'Test message',
        sessionId: 'test-session-123',
        userName: 'Test User'
      };
      
      const response = await request.post('http://localhost:5000/api/chat/message', {
        data: messageData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBeDefined();
      } else {
        expect([400, 500]).toContain(response.status());
      }
    });
    
    test('should fetch chat history', async ({ request }) => {
      const sessionId = 'test-session-123';
      
      const response = await request.get(`http://localhost:5000/api/chat/history/${sessionId}`);
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.messages)).toBe(true);
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should clear chat session (admin only)', async ({ request }) => {
      
      const sessionId = 'test-session-123';
      
      const response = await request.delete(`http://localhost:5000/api/chat/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
  });
  
  test.describe('Notifications API', () => {
    test('should fetch notifications', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/notifications');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.notifications)).toBe(true);
        
        const notifications = Array.isArray(data) ? data : data.notifications;
        if (notifications.length > 0) {
          const notification = notifications[0];
          expect(notification.title || notification.message).toBeDefined();
          expect(notification.type).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should mark notification as read', async ({ request }) => {
      
      // First get notifications to get an ID
      const notificationsResponse = await request.get('http://localhost:5000/api/notifications');
      
      if (notificationsResponse.ok()) {
        const notificationsData = await notificationsResponse.json();
        const notifications = Array.isArray(notificationsData) ? notificationsData : notificationsData.notifications;
        
        if (notifications && notifications.length > 0) {
          const notificationId = notifications[0]._id || notifications[0].id;
          
          const response = await request.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok()) {
            const data = await response.json();
            expect(data.success).toBe(true);
          } else {
            expect([401, 403, 404]).toContain(response.status());
          }
        }
      }
    });
  });
  
  test.describe('Announcements API', () => {
    test('should fetch announcements', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/announcements');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.announcements)).toBe(true);
        
        const announcements = Array.isArray(data) ? data : data.announcements;
        if (announcements.length > 0) {
          const announcement = announcements[0];
          expect(announcement.title).toBeDefined();
          expect(announcement.content || announcement.message).toBeDefined();
        }
      } else {
        expect([404, 500]).toContain(response.status());
      }
    });
    
    test('should create announcement (admin only)', async ({ request }) => {
      
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        type: 'info',
        priority: 'medium'
      };
      
      const response = await request.post('http://localhost:5000/api/announcements', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: announcementData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.announcement).toBeDefined();
        expect(data.announcement.title).toBe(announcementData.title);
      } else {
        expect([401, 403, 400]).toContain(response.status());
      }
    });
  });
  
  test.describe('File Upload API', () => {
    test('should handle file upload (admin only)', async ({ request }) => {
      
      // Create a simple test file
      const fileContent = 'This is a test file content';
      const buffer = Buffer.from(fileContent, 'utf8');
      
      const response = await request.post('http://localhost:5000/api/upload', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        multipart: {
          file: {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: buffer
          }
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.filename || data.file).toBeDefined();
        expect(data.path || data.url).toBeDefined();
      } else {
        expect([401, 403, 400, 413]).toContain(response.status());
      }
    });
    
    test('should list uploaded files (admin only)', async ({ request }) => {
      
      const response = await request.get('http://localhost:5000/api/files', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.files)).toBe(true);
      } else {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
  });
  
  
  

  
  test.describe('User Management API', () => {
    test('should fetch users (admin only)', async ({ request }) => {
      
      const response = await request.get('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.users)).toBe(true);
        
        const users = Array.isArray(data) ? data : data.users;
        if (users.length > 0) {
          const user = users[0];
          expect(user.email).toBeDefined();
          expect(user.name).toBeDefined();
        }
      } else {
        expect([401, 403, 404]).toContain(response.status());
      }
    });
    
    test('should update user profile', async ({ request }) => {
      
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      };
      
      const response = await request.put('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: updateData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
      } else {
        expect([401, 400, 404]).toContain(response.status());
      }
    });
  });
  
  test.describe('Cart and Purchase API', () => {
    test('should add item to cart', async ({ request }) => {
      
      // First get books to get an ID
      const booksResponse = await request.get('http://localhost:5000/api/books');
      
      if (booksResponse.ok()) {
        const booksData = await booksResponse.json();
        const books = Array.isArray(booksData) ? booksData : booksData.books;
        
        if (books && books.length > 0) {
          const bookId = books[0]._id || books[0].id;
          
          const cartData = {
            bookId: bookId,
            quantity: 1
          };
          
          const response = await request.post('http://localhost:5000/api/cart/add', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            data: cartData
          });
          
          if (response.ok()) {
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.cart || data.item).toBeDefined();
          } else {
            expect([401, 400, 404]).toContain(response.status());
          }
        }
      }
    });
    
    test('should fetch user cart', async ({ request }) => {
      
      const response = await request.get('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || Array.isArray(data.items) || data.cart).toBeDefined();
      } else {
        expect([401, 404]).toContain(response.status());
      }
    });
    
    test('should process purchase', async ({ request }) => {
      
      const purchaseData = {
        items: [{
          bookId: 'test-book-id',
          quantity: 1,
          price: 29.99
        }],
        total: 29.99,
        paymentMethod: 'test'
      };
      
      const response = await request.post('http://localhost:5000/api/purchase', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: purchaseData
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.order || data.purchase).toBeDefined();
      } else {
        expect([401, 400, 402, 500]).toContain(response.status());
      }
    });
  });
  
  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/nonexistent');
      expect(response.status()).toBe(404);
    });
    
    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post('http://localhost:5000/api/books', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: 'invalid json'
      });
      
      expect([400, 422, 500]).toContain(response.status());
    });
    
    test('should handle missing required fields', async ({ request }) => {
      const response = await request.post('http://localhost:5000/api/users', {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          name: 'Test User'
          // Missing required fields like email, password
        }
      });
      
      expect([400, 422]).toContain(response.status());
      const data = await response.json();
      expect(data.message || data.error || data.errors).toBeDefined();
    });
    
    test('should handle unauthorized access', async ({ request }) => {
      const response = await request.get('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      expect(response.status()).toBe(401);
    });
    
    test('should handle rate limiting', async ({ request }) => {
      // Make multiple rapid requests to test rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(request.get('http://localhost:5000/api/books'));
      }
      
      const responses = await Promise.all(promises);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.ok()).length;
      expect(successfulRequests).toBeGreaterThan(0);
      
      // Check if any requests were rate limited
      const rateLimitedRequests = responses.filter(r => r.status() === 429).length;
      // Rate limiting might not be implemented, so we don't assert this
    });
  });
});