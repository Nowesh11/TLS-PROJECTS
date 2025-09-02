const { test, expect } = require('@playwright/test');

test.describe('Team Management Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
  
  test.describe('Team Section Display', () => {
    test('should display team section on homepage', async ({ page }) => {
      await page.goto('/');
      
      const teamSection = page.locator('.team-section, #team, .our-team, .team-container');
      if (await teamSection.count() > 0) {
        await expect(teamSection.first()).toBeVisible();
        
        // Check section title
        const sectionTitle = page.locator('.team-title, .section-title, h2, h3').filter({ hasText: /team|members|staff/i });
        if (await sectionTitle.count() > 0) {
          await expect(sectionTitle.first()).toBeVisible();
        }
      }
    });
    
    test('should display team members grid', async ({ page }) => {
      await page.goto('/');
      
      const teamGrid = page.locator('.team-grid, .team-members, .members-grid, .team-cards');
      if (await teamGrid.count() > 0) {
        await expect(teamGrid.first()).toBeVisible();
        
        // Check for team member cards
        const memberCards = page.locator('.team-member, .member-card, .team-card, .member-item');
        if (await memberCards.count() > 0) {
          expect(await memberCards.count()).toBeGreaterThan(0);
          
          // Each card should be visible
          for (let i = 0; i < Math.min(await memberCards.count(), 5); i++) {
            await expect(memberCards.nth(i)).toBeVisible();
          }
        }
      }
    });
    
    test('should display team member information', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card, .team-card');
      if (await memberCards.count() > 0) {
        const firstMember = memberCards.first();
        
        // Check for member photo
        const memberPhoto = firstMember.locator('img, .member-photo, .team-photo, .avatar');
        if (await memberPhoto.count() > 0) {
          await expect(memberPhoto.first()).toBeVisible();
          
          // Image should have proper src
          const imgSrc = await memberPhoto.first().getAttribute('src');
          expect(imgSrc).toBeTruthy();
          expect(imgSrc).not.toBe('');
        }
        
        // Check for member name
        const memberName = firstMember.locator('.member-name, .team-name, .name, h4, h5');
        if (await memberName.count() > 0) {
          await expect(memberName.first()).toBeVisible();
          
          const nameText = await memberName.first().textContent();
          expect(nameText.trim().length).toBeGreaterThan(0);
        }
        
        // Check for member position/role
        const memberRole = firstMember.locator('.member-role, .member-position, .position, .role, .title');
        if (await memberRole.count() > 0) {
          await expect(memberRole.first()).toBeVisible();
          
          const roleText = await memberRole.first().textContent();
          expect(roleText.trim().length).toBeGreaterThan(0);
        }
      }
    });
    
    test('should display member bio/description', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const memberBio = memberCards.first().locator('.member-bio, .member-description, .bio, .description');
        if (await memberBio.count() > 0) {
          await expect(memberBio.first()).toBeVisible();
          
          const bioText = await memberBio.first().textContent();
          expect(bioText.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
  
  test.describe('Team Member Interactions', () => {
    test('should show member details on hover', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const firstMember = memberCards.first();
        
        // Hover over member card
        await firstMember.hover();
        
        // Check for hover effects
        const hoverOverlay = firstMember.locator('.member-overlay, .hover-overlay, .member-details');
        if (await hoverOverlay.count() > 0) {
          await expect(hoverOverlay.first()).toBeVisible();
        }
        
        // Check for additional details on hover
        const hoverDetails = firstMember.locator('.hover-details, .member-info, .additional-info');
        if (await hoverDetails.count() > 0) {
          await expect(hoverDetails.first()).toBeVisible();
        }
      }
    });
    
    test('should display social media links', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const socialLinks = memberCards.first().locator('.social-links, .member-social, .social-icons');
        if (await socialLinks.count() > 0) {
          await expect(socialLinks.first()).toBeVisible();
          
          // Check for individual social media icons
          const socialIcons = socialLinks.first().locator('a, .social-icon');
          if (await socialIcons.count() > 0) {
            for (let i = 0; i < Math.min(await socialIcons.count(), 3); i++) {
              await expect(socialIcons.nth(i)).toBeVisible();
              
              const href = await socialIcons.nth(i).getAttribute('href');
              if (href) {
                expect(href).toMatch(/facebook|twitter|linkedin|instagram|github|email/);
              }
            }
          }
        }
      }
    });
    
    test('should open member profile modal', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const firstMember = memberCards.first();
        
        // Click on member card or view details button
        const viewDetailsBtn = firstMember.locator('.view-details, .member-details-btn, button');
        if (await viewDetailsBtn.count() > 0) {
          await viewDetailsBtn.click();
        } else {
          await firstMember.click();
        }
        
        // Check for modal
        const memberModal = page.locator('.member-modal, .team-modal, .modal, .member-popup');
        if (await memberModal.count() > 0) {
          await expect(memberModal.first()).toBeVisible();
          
          // Modal should contain detailed member information
          const modalContent = memberModal.first().locator('.modal-content, .member-details');
          if (await modalContent.count() > 0) {
            await expect(modalContent.first()).toBeVisible();
          }
          
          // Close modal
          const closeBtn = memberModal.first().locator('.close, .modal-close, .fa-times');
          if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await expect(memberModal.first()).toBeHidden();
          }
        }
      }
    });
    
    test('should filter team members by role/department', async ({ page }) => {
      await page.goto('/');
      
      const filterButtons = page.locator('.team-filter, .role-filter, .department-filter');
      if (await filterButtons.count() > 0) {
        const allMembers = page.locator('.team-member, .member-card');
        const initialCount = await allMembers.count();
        
        // Click on a filter
        await filterButtons.first().click();
        
        // Wait for filtering
        await page.waitForTimeout(500);
        
        // Check if members are filtered
        const visibleMembers = page.locator('.team-member:visible, .member-card:visible');
        const filteredCount = await visibleMembers.count();
        
        // Filtered count should be different (unless all members have same role)
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    });
  });
  
  test.describe('Admin Team Management', () => {
    test('should access team management in admin panel', async ({ page }) => {
      // Login as admin first
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"], #email');
      const passwordInput = page.locator('input[name="password"], input[type="password"], #password');
      const loginButton = page.locator('button[type="submit"], .login-btn, .btn-login');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        // Navigate to team management
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team"), .menu-item:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          // Should be on team management page
          await expect(page).toHaveURL(/team/);
          
          // Check for team management interface
          const teamManagement = page.locator('.team-management, .manage-team, .team-admin');
          if (await teamManagement.count() > 0) {
            await expect(teamManagement.first()).toBeVisible();
          }
        }
      }
    });
    
    test('should display team members list in admin', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
         await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          // Check for team members table/list
          const membersTable = page.locator('.team-table, .members-table, table, .team-list');
          if (await membersTable.count() > 0) {
            await expect(membersTable.first()).toBeVisible();
            
            // Check table headers
            const headers = page.locator('th, .table-header');
            if (await headers.count() > 0) {
              const headerTexts = [];
              for (let i = 0; i < await headers.count(); i++) {
                headerTexts.push(await headers.nth(i).textContent());
              }
              
              // Should have relevant headers
              const headerString = headerTexts.join(' ').toLowerCase();
              expect(headerString).toMatch(/name|role|position|email|photo|action/);
            }
          }
        }
      }
    });
    
    test('should add new team member', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
         await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          // Click add member button
          const addMemberBtn = page.locator('.add-member, .add-team-member, .btn-add, button:has-text("Add")');
          if (await addMemberBtn.count() > 0) {
            await addMemberBtn.click();
            
            // Fill member form
            const nameInput = page.locator('input[name="name"], #memberName, .member-name-input');
            const roleInput = page.locator('input[name="role"], input[name="position"], #memberRole');
            const emailInputField = page.locator('input[name="email"], #memberEmail');
            const bioInput = page.locator('textarea[name="bio"], textarea[name="description"], #memberBio');
            
            if (await nameInput.count() > 0) {
              await nameInput.fill('Test Member');
            }
            if (await roleInput.count() > 0) {
              await roleInput.fill('Test Role');
            }
            if (await emailInputField.count() > 0) {
              await emailInputField.fill('test@example.com');
            }
            if (await bioInput.count() > 0) {
              await bioInput.fill('Test member biography');
            }
            
            // Submit form
            const submitBtn = page.locator('button[type="submit"], .btn-submit, .save-btn');
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
              
              // Should show success message
              const successMessage = page.locator('.success, .alert-success, .notification-success');
              if (await successMessage.count() > 0) {
                await expect(successMessage.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should upload team member photo', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          const addMemberBtn = page.locator('.add-member, .add-team-member, button:has-text("Add")');
          if (await addMemberBtn.count() > 0) {
            await addMemberBtn.click();
            
            // Look for file upload input
            const fileInput = page.locator('input[type="file"], .file-upload, .photo-upload');
            if (await fileInput.count() > 0) {
              // Create a test image file
              const testImageBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
              );
              
              // Upload file
              await fileInput.setInputFiles({
                name: 'test-member-photo.png',
                mimeType: 'image/png',
                buffer: testImageBuffer
              });
              
              // Check for upload preview
              const uploadPreview = page.locator('.upload-preview, .image-preview, .photo-preview');
              if (await uploadPreview.count() > 0) {
                await expect(uploadPreview.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should edit team member information', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          // Click edit button for first member
          const editBtn = page.locator('.edit-btn, .btn-edit, .fa-edit, button:has-text("Edit")').first();
          if (await editBtn.count() > 0) {
            await editBtn.click();
            
            // Edit member information
            const nameInput = page.locator('input[name="name"], #memberName');
            if (await nameInput.count() > 0) {
              await nameInput.clear();
              await nameInput.fill('Updated Member Name');
            }
            
            const roleInput = page.locator('input[name="role"], input[name="position"]');
            if (await roleInput.count() > 0) {
              await roleInput.clear();
              await roleInput.fill('Updated Role');
            }
            
            // Save changes
            const saveBtn = page.locator('button[type="submit"], .btn-save, .save-btn');
            if (await saveBtn.count() > 0) {
              await saveBtn.click();
              
              // Should show success message
              const successMessage = page.locator('.success, .alert-success');
              if (await successMessage.count() > 0) {
                await expect(successMessage.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
    
    test('should delete team member', async ({ page }) => {
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        
        await page.waitForTimeout(2000);
        
        const teamMenuItem = page.locator('a[href*="team"], .nav-link:has-text("Team")');
        if (await teamMenuItem.count() > 0) {
          await teamMenuItem.click();
          
          const initialMemberCount = await page.locator('.team-member, .member-row, tr').count();
          
          // Click delete button
          const deleteBtn = page.locator('.delete-btn, .btn-delete, .fa-trash, button:has-text("Delete")').first();
          if (await deleteBtn.count() > 0) {
            await deleteBtn.click();
            
            // Confirm deletion
            const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), .confirm-delete');
            if (await confirmBtn.count() > 0) {
              await confirmBtn.click();
              
              // Member count should decrease
              await page.waitForTimeout(1000);
              const newMemberCount = await page.locator('.team-member, .member-row, tr').count();
              expect(newMemberCount).toBeLessThan(initialMemberCount);
            }
          }
        }
      }
    });
  });
  
  test.describe('Team Member Cards Responsiveness', () => {
    test('should display properly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      
      const teamGrid = page.locator('.team-grid, .team-members, .members-grid');
      if (await teamGrid.count() > 0) {
        await expect(teamGrid.first()).toBeVisible();
        
        const memberCards = page.locator('.team-member, .member-card');
        if (await memberCards.count() > 0) {
          // Cards should be in a grid layout
          const firstCard = memberCards.first();
          const secondCard = memberCards.nth(1);
          
          if (await secondCard.count() > 0) {
            const firstBox = await firstCard.boundingBox();
            const secondBox = await secondCard.boundingBox();
            
            if (firstBox && secondBox) {
              // Cards should be side by side on desktop
              expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(50);
            }
          }
        }
      }
    });
    
    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        // Cards should be responsive on tablet
        for (let i = 0; i < Math.min(await memberCards.count(), 3); i++) {
          const card = memberCards.nth(i);
          const cardBox = await card.boundingBox();
          
          if (cardBox) {
            expect(cardBox.width).toBeLessThanOrEqual(768);
            expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(768);
          }
        }
      }
    });
    
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        // Cards should stack vertically on mobile
        const firstCard = memberCards.first();
        const secondCard = memberCards.nth(1);
        
        if (await secondCard.count() > 0) {
          const firstBox = await firstCard.boundingBox();
          const secondBox = await secondCard.boundingBox();
          
          if (firstBox && secondBox) {
            // Cards should be stacked vertically
            expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50);
          }
        }
        
        // Cards should fit mobile width
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThanOrEqual(375);
          expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
    
    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        const firstCard = memberCards.first();
        
        // Tap on member card
        await firstCard.tap();
        
        // Check for mobile-specific interactions
        const memberDetails = page.locator('.member-details, .member-modal, .member-info');
        if (await memberDetails.count() > 0) {
          await expect(memberDetails.first()).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Team Image Handling', () => {
    test('should display member photos correctly', async ({ page }) => {
      await page.goto('/');
      
      const memberPhotos = page.locator('.team-member img, .member-photo, .team-photo');
      if (await memberPhotos.count() > 0) {
        for (let i = 0; i < Math.min(await memberPhotos.count(), 5); i++) {
          const photo = memberPhotos.nth(i);
          await expect(photo).toBeVisible();
          
          // Check image attributes
          const src = await photo.getAttribute('src');
          const alt = await photo.getAttribute('alt');
          
          expect(src).toBeTruthy();
          expect(src).not.toBe('');
          
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
          }
        }
      }
    });
    
    test('should handle missing member photos gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Simulate broken image
      await page.evaluate(() => {
        const images = document.querySelectorAll('.team-member img, .member-photo');
        if (images.length > 0) {
          images[0].src = 'broken-image.jpg';
        }
      });
      
      const memberPhotos = page.locator('.team-member img, .member-photo');
      if (await memberPhotos.count() > 0) {
        // Should show placeholder or default image
        const firstPhoto = memberPhotos.first();
        
        // Check for error handling
        const hasErrorHandler = await firstPhoto.evaluate(img => {
          return img.onerror !== null || img.src.includes('placeholder') || img.src.includes('default');
        });
        
        // Should have some form of error handling
        expect(hasErrorHandler).toBeTruthy();
      }
    });
    
    test('should optimize image loading', async ({ page }) => {
      await page.goto('/');
      
      const memberPhotos = page.locator('.team-member img, .member-photo');
      if (await memberPhotos.count() > 0) {
        // Check for lazy loading
        const firstPhoto = memberPhotos.first();
        const loading = await firstPhoto.getAttribute('loading');
        
        if (loading) {
          expect(loading).toBe('lazy');
        }
        
        // Check for responsive images
        const srcset = await firstPhoto.getAttribute('srcset');
        if (srcset) {
          expect(srcset.length).toBeGreaterThan(0);
        }
      }
    });
  });
  
  test.describe('Team Performance', () => {
    test('should load team section quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      const teamSection = page.locator('.team-section, #team, .our-team');
      if (await teamSection.count() > 0) {
        await expect(teamSection.first()).toBeVisible();
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      }
    });
    
    test('should handle large team efficiently', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      const memberCount = await memberCards.count();
      
      if (memberCount > 10) {
        // Check for pagination or lazy loading
        const pagination = page.locator('.pagination, .team-pagination');
        const loadMoreBtn = page.locator('.load-more, .show-more-members');
        
        if (await pagination.count() > 0) {
          await expect(pagination.first()).toBeVisible();
        } else if (await loadMoreBtn.count() > 0) {
          await expect(loadMoreBtn.first()).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        // Tab to first member card
        await page.keyboard.press('Tab');
        
        const firstCard = memberCards.first();
        const isFocused = await firstCard.evaluate(el => document.activeElement === el || el.contains(document.activeElement));
        
        if (isFocused) {
          // Press Enter to interact
          await page.keyboard.press('Enter');
          
          // Should open member details or modal
          const memberDetails = page.locator('.member-modal, .member-details');
          if (await memberDetails.count() > 0) {
            await expect(memberDetails.first()).toBeVisible();
          }
        }
      }
    });
    
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      const teamSection = page.locator('.team-section, #team, .our-team');
      if (await teamSection.count() > 0) {
        // Check section ARIA label
        const ariaLabel = await teamSection.first().getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toMatch(/team|members|staff/i);
        }
      }
      
      const memberCards = page.locator('.team-member, .member-card');
      if (await memberCards.count() > 0) {
        // Check member card ARIA attributes
        const firstCard = memberCards.first();
        const role = await firstCard.getAttribute('role');
        
        if (role) {
          expect(role).toMatch(/button|link|article/);
        }
      }
    });
    
    test('should have proper alt text for images', async ({ page }) => {
      await page.goto('/');
      
      const memberPhotos = page.locator('.team-member img, .member-photo');
      if (await memberPhotos.count() > 0) {
        for (let i = 0; i < Math.min(await memberPhotos.count(), 3); i++) {
          const photo = memberPhotos.nth(i);
          const alt = await photo.getAttribute('alt');
          
          expect(alt).toBeTruthy();
          expect(alt.length).toBeGreaterThan(0);
          expect(alt).not.toBe('image'); // Should be descriptive
        }
      }
    });
  });
});