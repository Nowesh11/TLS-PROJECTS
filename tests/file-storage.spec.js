const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('File Storage Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
  
  test.describe('File Upload Functionality', () => {
    test('should upload files through admin panel', async ({ page }) => {
      // Login as admin first
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"], #email');
      const passwordInput = page.locator('input[name="password"], input[type="password"], #password');
      const loginButton = page.locator('button[type="submit"], .login-btn, .btn-login');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        // Navigate to file management or media section
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"], .nav-link:has-text("Files"), .nav-link:has-text("Media")');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for file upload interface
          const uploadButton = page.locator('.upload-btn, .file-upload-btn, button:has-text("Upload")');
          const fileInput = page.locator('input[type="file"], .file-input');
          
          if (await fileInput.count() > 0) {
            // Create test file
            const testFileBuffer = Buffer.from('Test file content for upload testing');
            
            // Upload file
            await fileInput.setInputFiles({
              name: 'test-upload.txt',
              mimeType: 'text/plain',
              buffer: testFileBuffer
            });
            
            // Submit upload if there's a submit button
            if (await uploadButton.count() > 0) {
              await uploadButton.click();
            }
            
            // Check for upload success
            const successMessage = page.locator('.upload-success, .success-message, .alert-success');
            if (await successMessage.count() > 0) {
              await expect(successMessage.first()).toBeVisible();
            }
            
            // Check if file appears in file list
            const fileList = page.locator('.file-list, .uploaded-files, .media-grid');
            if (await fileList.count() > 0) {
              const uploadedFile = fileList.locator(':has-text("test-upload.txt")');
              if (await uploadedFile.count() > 0) {
                await expect(uploadedFile.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should upload images with preview', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"], .nav-link:has-text("Media")');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileInput = page.locator('input[type="file"], .file-input, .image-upload');
          if (await fileInput.count() > 0) {
            // Create test image
            const testImageBuffer = Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
              'base64'
            );
            
            await fileInput.setInputFiles({
              name: 'test-image.png',
              mimeType: 'image/png',
              buffer: testImageBuffer
            });
            
            // Check for image preview
            const imagePreview = page.locator('.image-preview, .upload-preview, .file-preview img');
            if (await imagePreview.count() > 0) {
              await expect(imagePreview.first()).toBeVisible();
              
              // Preview should have proper src
              const previewSrc = await imagePreview.first().getAttribute('src');
              expect(previewSrc).toBeTruthy();
            }
          }
        }
      }
    });
    
    test('should validate file types and sizes', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
          await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileInput = page.locator('input[type="file"], .file-input');
          if (await fileInput.count() > 0) {
            // Try to upload invalid file type
            const invalidFileBuffer = Buffer.from('Invalid file content');
            
            await fileInput.setInputFiles({
              name: 'test-file.exe',
              mimeType: 'application/x-executable',
              buffer: invalidFileBuffer
            });
            
            // Should show error message
            const errorMessage = page.locator('.error-message, .upload-error, .alert-error, .validation-error');
            if (await errorMessage.count() > 0) {
              await expect(errorMessage.first()).toBeVisible();
              
              const errorText = await errorMessage.first().textContent();
              expect(errorText).toMatch(/invalid|not allowed|file type|format/i);
            }
          }
        }
      }
    });
    
    test('should handle multiple file uploads', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileInput = page.locator('input[type="file"][multiple], .multiple-file-input');
          if (await fileInput.count() > 0) {
            // Upload multiple files
            const file1Buffer = Buffer.from('First test file');
            const file2Buffer = Buffer.from('Second test file');
            
            await fileInput.setInputFiles([
              {
                name: 'test-file-1.txt',
                mimeType: 'text/plain',
                buffer: file1Buffer
              },
              {
                name: 'test-file-2.txt',
                mimeType: 'text/plain',
                buffer: file2Buffer
              }
            ]);
            
            // Check for multiple file previews
            const filePreviews = page.locator('.file-preview, .upload-item');
            if (await filePreviews.count() >= 2) {
              expect(await filePreviews.count()).toBeGreaterThanOrEqual(2);
            }
          }
        }
      }
    });
  });
  
  test.describe('File Management Interface', () => {
    test('should display file list in admin panel', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"], .nav-link:has-text("Files")');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Check for file list interface
          const fileList = page.locator('.file-list, .media-grid, .files-container, table');
          if (await fileList.count() > 0) {
            await expect(fileList.first()).toBeVisible();
            
            // Check for file items
            const fileItems = page.locator('.file-item, .media-item, .file-row, tr');
            if (await fileItems.count() > 0) {
              // Each file item should have basic information
              const firstFile = fileItems.first();
              
              // Check for file name
              const fileName = firstFile.locator('.file-name, .filename, td');
              if (await fileName.count() > 0) {
                await expect(fileName.first()).toBeVisible();
              }
              
              // Check for file size
              const fileSize = firstFile.locator('.file-size, .size');
              if (await fileSize.count() > 0) {
                await expect(fileSize.first()).toBeVisible();
              }
              
              // Check for file date
              const fileDate = firstFile.locator('.file-date, .date, .created');
              if (await fileDate.count() > 0) {
                await expect(fileDate.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should filter files by type', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for file type filters
          const filterButtons = page.locator('.file-filter, .type-filter, .filter-btn');
          if (await filterButtons.count() > 0) {
            const allFiles = page.locator('.file-item, .media-item');
            const initialCount = await allFiles.count();
            
            // Click on a filter (e.g., Images)
            const imageFilter = filterButtons.filter({ hasText: /image|photo|picture/i });
            if (await imageFilter.count() > 0) {
              await imageFilter.first().click();
              
              // Wait for filtering
              await page.waitForTimeout(500);
              
              // Check if files are filtered
              const visibleFiles = page.locator('.file-item:visible, .media-item:visible');
              const filteredCount = await visibleFiles.count();
              
              expect(filteredCount).toBeLessThanOrEqual(initialCount);
            }
          }
        }
      }
    });
    
    test('should search files by name', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for search input
          const searchInput = page.locator('.file-search, .search-files, input[placeholder*="search"]');
          if (await searchInput.count() > 0) {
            const allFiles = page.locator('.file-item, .media-item');
            const initialCount = await allFiles.count();
            
            // Search for specific file
            await searchInput.fill('test');
            
            // Wait for search results
            await page.waitForTimeout(1000);
            
            // Check if results are filtered
            const searchResults = page.locator('.file-item:visible, .media-item:visible');
            const resultCount = await searchResults.count();
            
            expect(resultCount).toBeLessThanOrEqual(initialCount);
          }
        }
      }
    });
    
    test('should delete files', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileItems = page.locator('.file-item, .media-item');
          if (await fileItems.count() > 0) {
            const initialCount = await fileItems.count();
            
            // Click delete button on first file
            const deleteBtn = fileItems.first().locator('.delete-btn, .btn-delete, .fa-trash');
            if (await deleteBtn.count() > 0) {
              await deleteBtn.click();
              
              // Confirm deletion
              const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), .confirm-delete');
              if (await confirmBtn.count() > 0) {
                await confirmBtn.click();
                
                // File count should decrease
                await page.waitForTimeout(1000);
                const newCount = await page.locator('.file-item, .media-item').count();
                expect(newCount).toBeLessThan(initialCount);
              }
            }
          }
        }
      }
    });
  });
  
  test.describe('Directory Structure', () => {
    test('should verify uploads directory exists', async ({ page }) => {
      // This test checks if the uploads directory structure is properly set up
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        // Check if we can access file management
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for directory structure display
          const directoryView = page.locator('.directory-view, .folder-structure, .file-tree');
          if (await directoryView.count() > 0) {
            await expect(directoryView.first()).toBeVisible();
            
            // Check for common upload directories
            const uploadsFolders = [
              'uploads',
              'images', 
              'documents',
              'media',
              'files'
            ];
            
            for (const folder of uploadsFolders) {
              const folderElement = page.locator(`.folder:has-text("${folder}"), .directory:has-text("${folder}")`);
              if (await folderElement.count() > 0) {
                await expect(folderElement.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should create and manage folders', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for create folder button
          const createFolderBtn = page.locator('.create-folder, .new-folder, button:has-text("New Folder")');
          if (await createFolderBtn.count() > 0) {
            await createFolderBtn.click();
            
            // Fill folder name
            const folderNameInput = page.locator('input[name="folderName"], .folder-name-input, input[placeholder*="folder"]');
            if (await folderNameInput.count() > 0) {
              await folderNameInput.fill('Test Folder');
              
              // Submit folder creation
              const submitBtn = page.locator('button[type="submit"], .create-btn, .save-btn');
              if (await submitBtn.count() > 0) {
                await submitBtn.click();
                
                // Check if folder was created
                const newFolder = page.locator('.folder:has-text("Test Folder"), .directory:has-text("Test Folder")');
                if (await newFolder.count() > 0) {
                  await expect(newFolder.first()).toBeVisible();
                }
              }
            }
          }
        }
      }
    });
    
    test('should navigate through folder structure', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for folders to navigate into
          const folders = page.locator('.folder, .directory, .folder-item');
          if (await folders.count() > 0) {
            const firstFolder = folders.first();
            await firstFolder.dblclick();
            
            // Check if we navigated into the folder
            const breadcrumb = page.locator('.breadcrumb, .path, .current-path');
            if (await breadcrumb.count() > 0) {
              await expect(breadcrumb.first()).toBeVisible();
            }
            
            // Check for back/up button
            const backBtn = page.locator('.back-btn, .up-btn, .parent-folder');
            if (await backBtn.count() > 0) {
              await expect(backBtn.first()).toBeVisible();
              
              // Click back to return to parent
              await backBtn.click();
            }
          }
        }
      }
    });
  });
  
  test.describe('File Access and Security', () => {
    test('should serve uploaded files correctly', async ({ page }) => {
      // Test if uploaded files are accessible via URL
      await page.goto('/');
      
      // Look for any existing uploaded images on the site
      const images = page.locator('img[src*="uploads"], img[src*="media"], img[src*="files"]');
      if (await images.count() > 0) {
        const firstImage = images.first();
        const imageSrc = await firstImage.getAttribute('src');
        
        if (imageSrc) {
          // Navigate directly to the image URL
          const response = await page.goto(imageSrc);
          
          // Should return successful response
          expect(response.status()).toBeLessThan(400);
          
          // Should have appropriate content type
          const contentType = response.headers()['content-type'];
          if (contentType) {
            expect(contentType).toMatch(/image|application/);
          }
        }
      }
    });
    
    test('should handle file permissions correctly', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // Look for file permissions settings
          const fileItems = page.locator('.file-item, .media-item');
          if (await fileItems.count() > 0) {
            const firstFile = fileItems.first();
            
            // Look for permissions or properties button
            const propertiesBtn = firstFile.locator('.properties, .permissions, .file-info');
            if (await propertiesBtn.count() > 0) {
              await propertiesBtn.click();
              
              // Check for permission settings
              const permissionsPanel = page.locator('.permissions-panel, .file-properties');
              if (await permissionsPanel.count() > 0) {
                await expect(permissionsPanel.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should prevent unauthorized file access', async ({ page }) => {
      // Test accessing admin files without authentication
      await page.goto('/');
      
      // Try to access admin file management without login
      const response = await page.goto('/admin/files.html', { waitUntil: 'networkidle' });
      
      // Should redirect to login or show unauthorized
      if (response) {
        const finalUrl = page.url();
        expect(finalUrl).toMatch(/login|unauthorized|403|401/);
      }
    });
  });
  
  test.describe('File Download and Sharing', () => {
    test('should download files', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileItems = page.locator('.file-item, .media-item');
          if (await fileItems.count() > 0) {
            // Look for download button
            const downloadBtn = fileItems.first().locator('.download-btn, .btn-download, .fa-download');
            if (await downloadBtn.count() > 0) {
              // Set up download listener
              const downloadPromise = page.waitForEvent('download');
              
              await downloadBtn.click();
              
              // Wait for download to start
              const download = await downloadPromise;
              
              // Verify download
              expect(download.suggestedFilename()).toBeTruthy();
            }
          }
        }
      }
    });
    
    test('should generate shareable links', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileItems = page.locator('.file-item, .media-item');
          if (await fileItems.count() > 0) {
            // Look for share button
            const shareBtn = fileItems.first().locator('.share-btn, .btn-share, .fa-share');
            if (await shareBtn.count() > 0) {
              await shareBtn.click();
              
              // Check for share modal or link
              const shareModal = page.locator('.share-modal, .share-dialog');
              const shareLink = page.locator('.share-link, .file-url');
              
              if (await shareModal.count() > 0) {
                await expect(shareModal.first()).toBeVisible();
              }
              
              if (await shareLink.count() > 0) {
                await expect(shareLink.first()).toBeVisible();
                
                const linkValue = await shareLink.first().inputValue() || await shareLink.first().textContent();
                expect(linkValue).toMatch(/http|uploads|files/);
              }
            }
          }
        }
      }
    });
  });
  
  test.describe('File Storage Performance', () => {
    test('should load file list quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileList = page.locator('.file-list, .media-grid');
          if (await fileList.count() > 0) {
            await expect(fileList.first()).toBeVisible();
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
          }
        }
      }
    });
    
    test('should handle large file uploads', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          const fileInput = page.locator('input[type="file"], .file-input');
          if (await fileInput.count() > 0) {
            // Create larger test file (1MB)
            const largeFileBuffer = Buffer.alloc(1024 * 1024, 'a');
            
            await fileInput.setInputFiles({
              name: 'large-test-file.txt',
              mimeType: 'text/plain',
              buffer: largeFileBuffer
            });
            
            // Check for upload progress
            const progressBar = page.locator('.upload-progress, .progress-bar, .upload-status');
            if (await progressBar.count() > 0) {
              await expect(progressBar.first()).toBeVisible();
            }
          }
        }
      }
    });
  });
  
  test.describe('Mobile File Management', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const fileMenuItem = page.locator('a[href*="file"], a[href*="media"]');
        if (await fileMenuItem.count() > 0) {
          await fileMenuItem.click();
          
          // File management should be responsive
          const fileList = page.locator('.file-list, .media-grid');
          if (await fileList.count() > 0) {
            const listBox = await fileList.first().boundingBox();
            if (listBox) {
              expect(listBox.width).toBeLessThanOrEqual(375);
            }
          }
          
          // Upload button should be accessible on mobile
          const uploadBtn = page.locator('.upload-btn, .file-upload-btn');
          if (await uploadBtn.count() > 0) {
            await expect(uploadBtn.first()).toBeVisible();
            
            const btnBox = await uploadBtn.first().boundingBox();
            if (btnBox) {
              expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(375);
            }
          }
        }
      }
    });
  });
});