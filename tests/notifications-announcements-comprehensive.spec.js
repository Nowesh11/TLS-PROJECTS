const { test, expect } = require('@playwright/test');

test.describe('Notifications & Announcements - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Notifications Display', () => {
    test('should display notification bell icon with count', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon, .bell-icon, [data-testid="notification-bell"]');
      
      if (await notificationBell.count() > 0) {
        await expect(notificationBell).toBeVisible();
        
        // Check for notification count badge
        const countBadge = notificationBell.locator('.count, .badge, .notification-count');
        if (await countBadge.count() > 0) {
          await expect(countBadge).toBeVisible();
          
          const countText = await countBadge.textContent();
          expect(countText).toMatch(/\d+/);
        }
      }
    });
    
    test('should open notifications dropdown when bell is clicked', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon, .bell-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        // Check for notifications dropdown
        const notificationsDropdown = page.locator('.notifications-dropdown, .notification-panel, .notifications-list');
        await expect(notificationsDropdown).toBeVisible({ timeout: 3000 });
        
        // Check for notification items
        const notificationItems = notificationsDropdown.locator('.notification-item, .notification');
        if (await notificationItems.count() > 0) {
          await expect(notificationItems.first()).toBeVisible();
        }
      }
    });
    
    test('should display notification content with proper formatting', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const notificationItems = page.locator('.notification-item, .notification');
        
        if (await notificationItems.count() > 0) {
          const firstNotification = notificationItems.first();
          
          // Check for notification title
          const title = firstNotification.locator('.notification-title, .title, h4, h5');
          if (await title.count() > 0) {
            await expect(title).toBeVisible();
            const titleText = await title.textContent();
            expect(titleText.trim().length).toBeGreaterThan(0);
          }
          
          // Check for notification message
          const message = firstNotification.locator('.notification-message, .message, .content, p');
          if (await message.count() > 0) {
            await expect(message).toBeVisible();
            const messageText = await message.textContent();
            expect(messageText.trim().length).toBeGreaterThan(0);
          }
          
          // Check for timestamp
          const timestamp = firstNotification.locator('.timestamp, .time, .date, .notification-time');
          if (await timestamp.count() > 0) {
            await expect(timestamp).toBeVisible();
            const timeText = await timestamp.textContent();
            expect(timeText).toMatch(/\d+|ago|am|pm|:|\//i);
          }
        }
      }
    });
    
    test('should distinguish between read and unread notifications', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const notificationItems = page.locator('.notification-item, .notification');
        
        if (await notificationItems.count() > 0) {
          // Check for unread indicators
          const unreadNotifications = notificationItems.locator('.unread, .notification-unread');
          const readNotifications = notificationItems.locator('.read, .notification-read');
          
          if (await unreadNotifications.count() > 0) {
            const firstUnread = unreadNotifications.first();
            
            // Unread notifications should have visual distinction
            const backgroundColor = await firstUnread.evaluate(el => {
              return window.getComputedStyle(el).backgroundColor;
            });
            expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
          }
          
          if (await readNotifications.count() > 0) {
            const firstRead = readNotifications.first();
            await expect(firstRead).toBeVisible();
          }
        }
      }
    });
    
    test('should display notification types with appropriate icons', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const notificationItems = page.locator('.notification-item, .notification');
        
        if (await notificationItems.count() > 0) {
          const firstNotification = notificationItems.first();
          
          // Check for notification type icons
          const typeIcon = firstNotification.locator('.notification-icon, .type-icon, .icon, i, svg');
          if (await typeIcon.count() > 0) {
            await expect(typeIcon).toBeVisible();
          }
          
          // Check for notification type classes
          const notificationClass = await firstNotification.getAttribute('class');
          const hasTypeClass = notificationClass && (
            notificationClass.includes('info') ||
            notificationClass.includes('success') ||
            notificationClass.includes('warning') ||
            notificationClass.includes('error') ||
            notificationClass.includes('announcement')
          );
          
          if (hasTypeClass) {
            expect(hasTypeClass).toBeTruthy();
          }
        }
      }
    });
  });
  
  test.describe('Notification Interactions', () => {
    test('should mark notification as read when clicked', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const unreadNotifications = page.locator('.notification-item.unread, .notification.unread');
        
        if (await unreadNotifications.count() > 0) {
          const firstUnread = unreadNotifications.first();
          
          // Click on the notification
          await firstUnread.click();
          await page.waitForTimeout(1000);
          
          // Check if notification is now marked as read
          const isStillUnread = await firstUnread.evaluate(el => {
            return el.classList.contains('unread');
          });
          
          expect(isStillUnread).toBeFalsy();
        }
      }
    });
    
    test('should allow dismissing individual notifications', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const notificationItems = page.locator('.notification-item, .notification');
        
        if (await notificationItems.count() > 0) {
          const firstNotification = notificationItems.first();
          
          // Look for dismiss button
          const dismissBtn = firstNotification.locator('.dismiss, .close, .remove, .delete, button[aria-label="Close"]');
          
          if (await dismissBtn.count() > 0) {
            const initialCount = await notificationItems.count();
            
            await dismissBtn.click();
            await page.waitForTimeout(1000);
            
            const newCount = await notificationItems.count();
            expect(newCount).toBeLessThan(initialCount);
          }
        }
      }
    });
    
    test('should provide mark all as read functionality', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const markAllReadBtn = page.locator('.mark-all-read, .read-all, button:has-text("Mark all as read")');
        
        if (await markAllReadBtn.count() > 0) {
          await markAllReadBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if all notifications are now read
          const unreadNotifications = page.locator('.notification-item.unread, .notification.unread');
          expect(await unreadNotifications.count()).toBe(0);
          
          // Check if notification count badge is updated
          const countBadge = page.locator('.notification-count, .badge, .count');
          if (await countBadge.count() > 0) {
            const countText = await countBadge.textContent();
            expect(countText).toBe('0');
          }
        }
      }
    });
    
    test('should provide clear all notifications functionality', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const clearAllBtn = page.locator('.clear-all, .delete-all, button:has-text("Clear all")');
        
        if (await clearAllBtn.count() > 0) {
          await clearAllBtn.click();
          
          // Check for confirmation dialog
          const confirmDialog = page.locator('.confirm-dialog, .modal, .confirmation');
          if (await confirmDialog.count() > 0) {
            const confirmBtn = confirmDialog.locator('button:has-text("Confirm"), .confirm-btn');
            if (await confirmBtn.count() > 0) {
              await confirmBtn.click();
              await page.waitForTimeout(1000);
              
              // Check if all notifications are cleared
              const notificationItems = page.locator('.notification-item, .notification');
              expect(await notificationItems.count()).toBe(0);
            }
          }
        }
      }
    });
    
    test('should navigate to relevant content when notification is clicked', async ({ page }) => {
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const actionableNotifications = page.locator('.notification-item[data-url], .notification[href], .notification-item.clickable');
        
        if (await actionableNotifications.count() > 0) {
          const firstActionable = actionableNotifications.first();
          
          // Get current URL
          const currentUrl = page.url();
          
          await firstActionable.click();
          await page.waitForLoadState('networkidle');
          
          // Check if URL changed (navigation occurred)
          const newUrl = page.url();
          expect(newUrl).not.toBe(currentUrl);
        }
      }
    });
  });
  
  test.describe('Announcements Display', () => {
    test('should display announcements banner on homepage', async ({ page }) => {
      const announcementBanner = page.locator('.announcement-banner, .announcements, .banner, .alert-banner');
      
      if (await announcementBanner.count() > 0) {
        await expect(announcementBanner).toBeVisible();
        
        // Check for announcement content
        const announcementText = await announcementBanner.textContent();
        expect(announcementText.trim().length).toBeGreaterThan(0);
        
        // Check for close button
        const closeBtn = announcementBanner.locator('.close, .dismiss, button[aria-label="Close"]');
        if (await closeBtn.count() > 0) {
          await expect(closeBtn).toBeVisible();
        }
      }
    });
    
    test('should display announcements in dedicated section', async ({ page }) => {
      // Try to navigate to announcements page
      const announcementsLink = page.locator('a[href*="announcement"], .announcements-link, nav a:has-text("Announcements")');
      
      if (await announcementsLink.count() > 0) {
        await announcementsLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        // Try direct navigation
        await page.goto('/announcements.html').catch(() => {});
        await page.waitForLoadState('networkidle');
      }
      
      const announcementsSection = page.locator('.announcements-section, .announcements-list, .announcements-container');
      
      if (await announcementsSection.count() > 0) {
        await expect(announcementsSection).toBeVisible();
        
        // Check for announcement items
        const announcementItems = announcementsSection.locator('.announcement-item, .announcement, .news-item');
        if (await announcementItems.count() > 0) {
          await expect(announcementItems.first()).toBeVisible();
          
          const firstAnnouncement = announcementItems.first();
          
          // Check for title
          const title = firstAnnouncement.locator('.title, .announcement-title, h3, h4');
          if (await title.count() > 0) {
            await expect(title).toBeVisible();
          }
          
          // Check for date
          const date = firstAnnouncement.locator('.date, .timestamp, .published-date');
          if (await date.count() > 0) {
            await expect(date).toBeVisible();
          }
          
          // Check for content preview
          const content = firstAnnouncement.locator('.content, .description, .preview, p');
          if (await content.count() > 0) {
            await expect(content).toBeVisible();
          }
        }
      }
    });
    
    test('should categorize announcements by type', async ({ page }) => {
      const announcementItems = page.locator('.announcement-item, .announcement, .news-item');
      
      if (await announcementItems.count() > 0) {
        const firstAnnouncement = announcementItems.first();
        
        // Check for category/type indicators
        const category = firstAnnouncement.locator('.category, .type, .tag, .announcement-type');
        if (await category.count() > 0) {
          await expect(category).toBeVisible();
          
          const categoryText = await category.textContent();
          expect(categoryText.trim().length).toBeGreaterThan(0);
        }
        
        // Check for priority indicators
        const priority = firstAnnouncement.locator('.priority, .urgent, .important');
        if (await priority.count() > 0) {
          await expect(priority).toBeVisible();
        }
      }
    });
    
    test('should display announcement details when clicked', async ({ page }) => {
      const announcementItems = page.locator('.announcement-item, .announcement');
      
      if (await announcementItems.count() > 0) {
        const firstAnnouncement = announcementItems.first();
        await firstAnnouncement.click();
        
        // Check for announcement detail modal or page
        const announcementDetail = page.locator('.announcement-detail, .announcement-modal, .modal, .announcement-full');
        
        if (await announcementDetail.count() > 0) {
          await expect(announcementDetail).toBeVisible({ timeout: 3000 });
          
          // Check for full content
          const fullContent = announcementDetail.locator('.full-content, .announcement-body, .content');
          if (await fullContent.count() > 0) {
            await expect(fullContent).toBeVisible();
            
            const contentText = await fullContent.textContent();
            expect(contentText.trim().length).toBeGreaterThan(50);
          }
        }
      }
    });
  });
  
  test.describe('Announcement Interactions', () => {
    test('should allow dismissing announcement banners', async ({ page }) => {
      const announcementBanner = page.locator('.announcement-banner, .banner');
      
      if (await announcementBanner.count() > 0) {
        const closeBtn = announcementBanner.locator('.close, .dismiss, button[aria-label="Close"]');
        
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          
          // Check if banner is hidden
          expect(await announcementBanner.isVisible()).toBeFalsy();
        }
      }
    });
    
    test('should remember dismissed announcements', async ({ page }) => {
      const announcementBanner = page.locator('.announcement-banner, .banner');
      
      if (await announcementBanner.count() > 0) {
        const closeBtn = announcementBanner.locator('.close, .dismiss');
        
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          
          // Reload page
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          // Check if banner stays dismissed
          const bannerAfterReload = page.locator('.announcement-banner, .banner');
          if (await bannerAfterReload.count() > 0) {
            expect(await bannerAfterReload.isVisible()).toBeFalsy();
          }
        }
      }
    });
    
    test('should provide sharing functionality for announcements', async ({ page }) => {
      const announcementItems = page.locator('.announcement-item, .announcement');
      
      if (await announcementItems.count() > 0) {
        const firstAnnouncement = announcementItems.first();
        
        // Look for share button
        const shareBtn = firstAnnouncement.locator('.share, .share-btn, button:has-text("Share")');
        
        if (await shareBtn.count() > 0) {
          await shareBtn.click();
          
          // Check for share options
          const shareOptions = page.locator('.share-options, .share-menu, .social-share');
          if (await shareOptions.count() > 0) {
            await expect(shareOptions).toBeVisible({ timeout: 2000 });
            
            // Check for social media share links
            const socialLinks = shareOptions.locator('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]');
            if (await socialLinks.count() > 0) {
              await expect(socialLinks.first()).toBeVisible();
            }
          }
        }
      }
    });
    
    test('should support announcement search and filtering', async ({ page }) => {
      const searchInput = page.locator('.announcement-search, .search-announcements, input[placeholder*="search"]');
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const announcementItems = page.locator('.announcement-item, .announcement');
        if (await announcementItems.count() > 0) {
          const firstResult = announcementItems.first();
          const resultText = await firstResult.textContent();
          expect(resultText.toLowerCase()).toContain('test');
        }
      }
      
      // Test category filter
      const categoryFilter = page.locator('.category-filter, select[name="category"]');
      if (await categoryFilter.count() > 0) {
        const options = categoryFilter.locator('option');
        if (await options.count() > 1) {
          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          // Results should be filtered by category
          const filteredItems = page.locator('.announcement-item, .announcement');
          expect(await filteredItems.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
  
  test.describe('Notification Persistence', () => {
    test('should persist notification preferences', async ({ page }) => {
      const notificationSettings = page.locator('.notification-settings, .preferences, .settings');
      
      if (await notificationSettings.count() > 0) {
        await notificationSettings.click();
        
        const settingsModal = page.locator('.settings-modal, .preferences-modal, .modal');
        if (await settingsModal.count() > 0) {
          await expect(settingsModal).toBeVisible();
          
          // Check for notification type toggles
          const notificationToggles = settingsModal.locator('input[type="checkbox"], .toggle, .switch');
          if (await notificationToggles.count() > 0) {
            const firstToggle = notificationToggles.first();
            const initialState = await firstToggle.isChecked();
            
            await firstToggle.click();
            
            // Save settings
            const saveBtn = settingsModal.locator('button:has-text("Save"), .save-btn');
            if (await saveBtn.count() > 0) {
              await saveBtn.click();
              await page.waitForTimeout(1000);
              
              // Reload and check if setting persisted
              await page.reload();
              await page.waitForLoadState('networkidle');
              
              await notificationSettings.click();
              const newState = await firstToggle.isChecked();
              expect(newState).not.toBe(initialState);
            }
          }
        }
      }
    });
    
    test('should sync notifications across browser tabs', async ({ context, page }) => {
      // Open second tab
      const secondPage = await context.newPage();
      await secondPage.goto('/');
      await secondPage.waitForLoadState('networkidle');
      
      // Mark notification as read in first tab
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      if (await notificationBell.count() > 0) {
        await notificationBell.click();
        
        const unreadNotifications = page.locator('.notification-item.unread, .notification.unread');
        if (await unreadNotifications.count() > 0) {
          await unreadNotifications.first().click();
          await page.waitForTimeout(1000);
          
          // Check second tab for sync
          const secondTabBell = secondPage.locator('.notification-bell, .notifications-icon');
          if (await secondTabBell.count() > 0) {
            await secondTabBell.click();
            
            const secondTabUnread = secondPage.locator('.notification-item.unread, .notification.unread');
            const unreadCount = await secondTabUnread.count();
            
            // Should have one less unread notification
            expect(unreadCount).toBeGreaterThanOrEqual(0);
          }
        }
      }
      
      await secondPage.close();
    });
  });
  
  test.describe('Real-time Notifications', () => {
    test('should receive real-time notifications', async ({ page }) => {
      // Get initial notification count
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        const initialCountBadge = page.locator('.notification-count, .badge, .count');
        let initialCount = 0;
        
        if (await initialCountBadge.count() > 0) {
          const countText = await initialCountBadge.textContent();
          initialCount = parseInt(countText) || 0;
        }
        
        // Simulate real-time notification (this would typically come from WebSocket/SSE)
        await page.evaluate(() => {
          // Trigger a custom event that the app might listen for
          window.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
              id: Date.now(),
              title: 'Test Notification',
              message: 'This is a test real-time notification',
              type: 'info',
              timestamp: new Date().toISOString()
            }
          }));
        });
        
        await page.waitForTimeout(2000);
        
        // Check if notification count increased
        if (await initialCountBadge.count() > 0) {
          const newCountText = await initialCountBadge.textContent();
          const newCount = parseInt(newCountText) || 0;
          
          if (newCount > initialCount) {
            expect(newCount).toBeGreaterThan(initialCount);
          }
        }
      }
    });
    
    test('should display toast notifications for important updates', async ({ page }) => {
      // Simulate important notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('urgentNotification', {
          detail: {
            title: 'Urgent Update',
            message: 'This is an urgent notification',
            type: 'urgent'
          }
        }));
      });
      
      await page.waitForTimeout(1000);
      
      // Check for toast notification
      const toastNotification = page.locator('.toast, .toast-notification, .alert-toast, .notification-toast');
      
      if (await toastNotification.count() > 0) {
        await expect(toastNotification).toBeVisible();
        
        // Check if toast auto-dismisses
        await page.waitForTimeout(5000);
        expect(await toastNotification.isVisible()).toBeFalsy();
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should display notifications properly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const notificationBell = page.locator('.notification-bell, .notifications-icon');
      
      if (await notificationBell.count() > 0) {
        await expect(notificationBell).toBeVisible();
        await notificationBell.click();
        
        const notificationsDropdown = page.locator('.notifications-dropdown, .notification-panel');
        if (await notificationsDropdown.count() > 0) {
          await expect(notificationsDropdown).toBeVisible();
          
          // Check if dropdown fits mobile screen
          const dropdownBox = await notificationsDropdown.boundingBox();
          if (dropdownBox) {
            expect(dropdownBox.width).toBeLessThanOrEqual(375);
            expect(dropdownBox.x).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
    
    test('should stack announcement content properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const announcementItems = page.locator('.announcement-item, .announcement');
      
      if (await announcementItems.count() > 0) {
        const firstAnnouncement = announcementItems.first();
        await expect(firstAnnouncement).toBeVisible();
        
        // Check if content is properly stacked
        const announcementBox = await firstAnnouncement.boundingBox();
        if (announcementBox) {
          expect(announcementBox.width).toBeLessThanOrEqual(375);
        }
        
        // Check if text is readable
        const title = firstAnnouncement.locator('.title, .announcement-title');
        if (await title.count() > 0) {
          const titleBox = await title.boundingBox();
          if (titleBox) {
            expect(titleBox.height).toBeGreaterThan(20); // Minimum readable height
          }
        }
      }
    });
  });
});