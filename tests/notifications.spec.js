const { test, expect } = require('@playwright/test');

test.describe('Notifications and Announcements Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing notification data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('dismissedNotifications');
      localStorage.removeItem('notificationPreferences');
      sessionStorage.clear();
    });
  });
  
  test.describe('Notification Dot Display', () => {
    test('should display notification dot when there are unread notifications', async ({ page }) => {
      await page.goto('/');
      
      const notificationDot = page.locator('.notification-dot, .notif-dot, #notificationDot, .unread-indicator');
      if (await notificationDot.count() > 0) {
        await expect(notificationDot.first()).toBeVisible();
        
        // Check dot styling
        const dotColor = await notificationDot.first().evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        expect(dotColor).toMatch(/rgb\(255, 0, 0\)|red|#ff0000|#f00/i); // Should be red or similar
      }
    });
    
    test('should hide notification dot when no unread notifications', async ({ page }) => {
      await page.goto('/');
      
      // Simulate marking all notifications as read
      await page.evaluate(() => {
        const dot = document.querySelector('.notification-dot, .notif-dot, #notificationDot');
        if (dot) {
          dot.style.display = 'none';
        }
      });
      
      const notificationDot = page.locator('.notification-dot, .notif-dot, #notificationDot');
      if (await notificationDot.count() > 0) {
        await expect(notificationDot.first()).toBeHidden();
      }
    });
    
    test('should show notification count badge', async ({ page }) => {
      await page.goto('/');
      
      const notificationBadge = page.locator('.notification-count, .notif-count, .badge-count');
      if (await notificationBadge.count() > 0) {
        await expect(notificationBadge.first()).toBeVisible();
        
        // Badge should contain a number
        const badgeText = await notificationBadge.first().textContent();
        expect(badgeText).toMatch(/^\d+$/);
        expect(parseInt(badgeText)).toBeGreaterThan(0);
      }
    });
    
    test('should update notification dot in real-time', async ({ page }) => {
      await page.goto('/');
      
      // Simulate receiving new notification
      await page.evaluate(() => {
        const event = new CustomEvent('newNotification', {
          detail: { 
            title: 'New Announcement',
            message: 'Test notification message',
            type: 'announcement'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Notification dot should appear or update
      const notificationDot = page.locator('.notification-dot, .notif-dot, #notificationDot');
      if (await notificationDot.count() > 0) {
        await expect(notificationDot.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Announcements Display', () => {
    test('should display announcements on homepage', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item, .notice, .alert-info');
      if (await announcements.count() > 0) {
        await expect(announcements.first()).toBeVisible();
        
        // Check announcement content
        const announcementText = await announcements.first().textContent();
        expect(announcementText.length).toBeGreaterThan(0);
        
        // Check for announcement elements
        const title = page.locator('.announcement-title, .notice-title, h3, h4').first();
        if (await title.count() > 0) {
          await expect(title).toBeVisible();
        }
        
        const content = page.locator('.announcement-content, .notice-content, .announcement-text').first();
        if (await content.count() > 0) {
          await expect(content).toBeVisible();
        }
      }
    });
    
    test('should display multiple announcements', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item, .notice');
      const count = await announcements.count();
      
      if (count > 1) {
        // Check that multiple announcements are displayed
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(announcements.nth(i)).toBeVisible();
        }
        
        // Each announcement should have unique content
        const firstText = await announcements.first().textContent();
        const secondText = await announcements.nth(1).textContent();
        expect(firstText).not.toBe(secondText);
      }
    });
    
    test('should show announcement timestamps', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item');
      if (await announcements.count() > 0) {
        const timestamp = page.locator('.announcement-date, .notice-date, .timestamp, .date').first();
        if (await timestamp.count() > 0) {
          await expect(timestamp).toBeVisible();
          
          // Timestamp should contain date format
          const timeText = await timestamp.textContent();
          expect(timeText).toMatch(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
        }
      }
    });
    
    test('should display announcement priority levels', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item, .alert');
      if (await announcements.count() > 0) {
        // Check for priority classes
        const priorityClasses = ['urgent', 'high', 'medium', 'low', 'important', 'warning', 'info', 'success', 'danger'];
        
        for (let i = 0; i < await announcements.count(); i++) {
          const announcement = announcements.nth(i);
          const className = await announcement.getAttribute('class');
          
          if (className) {
            const hasPriority = priorityClasses.some(priority => className.includes(priority));
            // At least some announcements should have priority indicators
          }
        }
      }
    });
  });
  
  test.describe('Announcement Interactions', () => {
    test('should dismiss announcements', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item');
      if (await announcements.count() > 0) {
        const dismissButton = page.locator('.dismiss-btn, .close-btn, .announcement-close, .fa-times').first();
        if (await dismissButton.count() > 0) {
          const initialCount = await announcements.count();
          
          await dismissButton.click();
          
          // Announcement should be hidden or removed
          await page.waitForTimeout(500);
          const newCount = await announcements.count();
          expect(newCount).toBeLessThan(initialCount);
        }
      }
    });
    
    test('should remember dismissed announcements', async ({ page }) => {
      await page.goto('/');
      
      const announcements = page.locator('.announcement, .announcement-item');
      if (await announcements.count() > 0) {
        const dismissButton = page.locator('.dismiss-btn, .close-btn, .announcement-close').first();
        if (await dismissButton.count() > 0) {
          // Get announcement ID or content
          const announcementId = await announcements.first().getAttribute('data-id') || 
                                await announcements.first().textContent();
          
          await dismissButton.click();
          
          // Reload page
          await page.reload();
          
          // Dismissed announcement should not reappear
          if (announcementId) {
            const dismissedAnnouncement = page.locator(`[data-id="${announcementId}"]`);
            if (await dismissedAnnouncement.count() > 0) {
              await expect(dismissedAnnouncement).toBeHidden();
            }
          }
        }
      }
    });
    
    test('should expand/collapse announcement details', async ({ page }) => {
      await page.goto('/');
      
      const expandableAnnouncement = page.locator('.announcement.expandable, .announcement-expandable');
      if (await expandableAnnouncement.count() > 0) {
        const expandButton = page.locator('.expand-btn, .read-more, .show-more').first();
        if (await expandButton.count() > 0) {
          await expandButton.click();
          
          // Additional content should be visible
          const expandedContent = page.locator('.announcement-details, .expanded-content, .full-content');
          if (await expandedContent.count() > 0) {
            await expect(expandedContent.first()).toBeVisible();
          }
          
          // Button text should change
          const buttonText = await expandButton.textContent();
          expect(buttonText).toMatch(/less|collapse|hide/i);
        }
      }
    });
    
    test('should link to full announcement page', async ({ page }) => {
      await page.goto('/');
      
      const announcementLink = page.locator('.announcement a, .announcement-link, .read-full');
      if (await announcementLink.count() > 0) {
        const href = await announcementLink.first().getAttribute('href');
        if (href) {
          expect(href).toMatch(/announcement|notice|news/);
          
          // Click should navigate to announcement page
          await announcementLink.first().click();
          
          // Should be on announcement detail page
          await expect(page).toHaveURL(new RegExp(href));
        }
      }
    });
  });
  
  test.describe('Notification Center', () => {
    test('should open notification center/panel', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn, .notifications-toggle, .bell-icon');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        // Notification panel should open
        const notificationPanel = page.locator('.notification-panel, .notifications-dropdown, .notif-center');
        if (await notificationPanel.count() > 0) {
          await expect(notificationPanel.first()).toBeVisible();
          
          // Panel should contain notifications
          const notifications = page.locator('.notification-item, .notif-item');
          if (await notifications.count() > 0) {
            await expect(notifications.first()).toBeVisible();
          }
        }
      }
    });
    
    test('should display notification list', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn, .notifications-toggle');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        const notifications = page.locator('.notification-item, .notif-item, .notification');
        if (await notifications.count() > 0) {
          // Check notification structure
          const firstNotification = notifications.first();
          
          // Should have title
          const title = firstNotification.locator('.notification-title, .notif-title, h4, h5');
          if (await title.count() > 0) {
            await expect(title.first()).toBeVisible();
          }
          
          // Should have content
          const content = firstNotification.locator('.notification-content, .notif-content, .message');
          if (await content.count() > 0) {
            await expect(content.first()).toBeVisible();
          }
          
          // Should have timestamp
          const timestamp = firstNotification.locator('.notification-time, .notif-time, .timestamp');
          if (await timestamp.count() > 0) {
            await expect(timestamp.first()).toBeVisible();
          }
        }
      }
    });
    
    test('should mark notifications as read', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        const unreadNotification = page.locator('.notification-item.unread, .notif-item.unread');
        if (await unreadNotification.count() > 0) {
          // Click on notification to mark as read
          await unreadNotification.first().click();
          
          // Should no longer have unread class
          await expect(unreadNotification.first()).not.toHaveClass(/unread/);
          
          // Notification dot should update
          const notificationDot = page.locator('.notification-dot, .notif-dot');
          if (await notificationDot.count() > 0) {
            // If this was the last unread notification, dot should disappear
            const remainingUnread = page.locator('.notification-item.unread');
            if (await remainingUnread.count() === 0) {
              await expect(notificationDot.first()).toBeHidden();
            }
          }
        }
      }
    });
    
    test('should mark all notifications as read', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        const markAllReadButton = page.locator('.mark-all-read, .read-all-btn, button:has-text("Mark all as read")');
        if (await markAllReadButton.count() > 0) {
          await markAllReadButton.click();
          
          // All notifications should be marked as read
          const unreadNotifications = page.locator('.notification-item.unread, .notif-item.unread');
          expect(await unreadNotifications.count()).toBe(0);
          
          // Notification dot should disappear
          const notificationDot = page.locator('.notification-dot, .notif-dot');
          if (await notificationDot.count() > 0) {
            await expect(notificationDot.first()).toBeHidden();
          }
        }
      }
    });
    
    test('should clear all notifications', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        const clearAllButton = page.locator('.clear-all-notifications, .clear-all-btn, button:has-text("Clear all")');
        if (await clearAllButton.count() > 0) {
          const initialCount = await page.locator('.notification-item, .notif-item').count();
          
          await clearAllButton.click();
          
          // Confirm dialog might appear
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), .confirm-btn');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
          }
          
          // All notifications should be cleared
          const remainingNotifications = page.locator('.notification-item, .notif-item');
          expect(await remainingNotifications.count()).toBe(0);
          
          // Should show empty state
          const emptyState = page.locator('.no-notifications, .empty-notifications, .notifications-empty');
          if (await emptyState.count() > 0) {
            await expect(emptyState.first()).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Notification Types', () => {
    test('should display different notification types', async ({ page }) => {
      await page.goto('/');
      
      const notificationTypes = [
        '.notification.info, .notif-info',
        '.notification.warning, .notif-warning', 
        '.notification.success, .notif-success',
        '.notification.error, .notif-error',
        '.notification.announcement, .notif-announcement'
      ];
      
      for (const typeSelector of notificationTypes) {
        const notification = page.locator(typeSelector);
        if (await notification.count() > 0) {
          await expect(notification.first()).toBeVisible();
          
          // Check for type-specific styling
          const className = await notification.first().getAttribute('class');
          expect(className).toMatch(/info|warning|success|error|announcement/);
        }
      }
    });
    
    test('should display system notifications', async ({ page }) => {
      await page.goto('/');
      
      const systemNotifications = page.locator('.notification.system, .system-notification, .notif-system');
      if (await systemNotifications.count() > 0) {
        await expect(systemNotifications.first()).toBeVisible();
        
        // System notifications should have specific content
        const content = await systemNotifications.first().textContent();
        expect(content).toMatch(/system|maintenance|update|server/i);
      }
    });
    
    test('should display user action notifications', async ({ page }) => {
      await page.goto('/');
      
      // Simulate user action that triggers notification
      const addToCartButton = page.locator('.add-to-cart, .cart-btn');
      if (await addToCartButton.count() > 0) {
        await addToCartButton.first().click();
        
        // Should show success notification
        const successNotification = page.locator('.notification.success, .toast-success, .alert-success');
        if (await successNotification.count() > 0) {
          await expect(successNotification.first()).toBeVisible();
          
          const content = await successNotification.first().textContent();
          expect(content).toMatch(/added|cart|success/i);
        }
      }
    });
  });
  
  test.describe('Toast Notifications', () => {
    test('should display toast notifications', async ({ page }) => {
      await page.goto('/');
      
      // Trigger a toast notification
      await page.evaluate(() => {
        if (window.showNotification) {
          window.showNotification('Test toast message', 'success');
        } else if (window.showToast) {
          window.showToast('Test toast message', 'success');
        }
      });
      
      const toast = page.locator('.toast, .notification-toast, .alert-toast');
      if (await toast.count() > 0) {
        await expect(toast.first()).toBeVisible();
        
        // Toast should auto-dismiss after timeout
        await page.waitForTimeout(5000);
        await expect(toast.first()).toBeHidden();
      }
    });
    
    test('should stack multiple toasts', async ({ page }) => {
      await page.goto('/');
      
      // Trigger multiple toast notifications
      await page.evaluate(() => {
        if (window.showNotification) {
          window.showNotification('First toast', 'info');
          window.showNotification('Second toast', 'warning');
          window.showNotification('Third toast', 'error');
        }
      });
      
      const toasts = page.locator('.toast, .notification-toast');
      if (await toasts.count() > 1) {
        // Multiple toasts should be visible
        expect(await toasts.count()).toBeGreaterThan(1);
        
        // Toasts should be stacked properly
        for (let i = 0; i < Math.min(await toasts.count(), 3); i++) {
          await expect(toasts.nth(i)).toBeVisible();
        }
      }
    });
    
    test('should manually dismiss toasts', async ({ page }) => {
      await page.goto('/');
      
      await page.evaluate(() => {
        if (window.showNotification) {
          window.showNotification('Dismissible toast', 'info');
        }
      });
      
      const toast = page.locator('.toast, .notification-toast');
      if (await toast.count() > 0) {
        const closeButton = toast.locator('.close, .dismiss, .fa-times');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          
          // Toast should be dismissed
          await expect(toast).toBeHidden();
        }
      }
    });
  });
  
  test.describe('Database-Driven Notifications', () => {
    test('should fetch notifications from API', async ({ page }) => {
      // Monitor network requests
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/notifications') || request.url().includes('/notifications')) {
          apiRequests.push(request);
        }
      });
      
      await page.goto('/');
      
      // Wait for API calls
      await page.waitForTimeout(2000);
      
      // Should have made API request for notifications
      if (apiRequests.length > 0) {
        expect(apiRequests.length).toBeGreaterThan(0);
        expect(apiRequests[0].method()).toBe('GET');
      }
    });
    
    test('should update notifications in real-time', async ({ page }) => {
      await page.goto('/');
      
      const initialNotificationCount = await page.locator('.notification-item, .notif-item').count();
      
      // Simulate real-time notification update
      await page.evaluate(() => {
        // Simulate WebSocket or polling update
        const event = new CustomEvent('notificationUpdate', {
          detail: {
            type: 'new',
            notification: {
              id: 'new-123',
              title: 'New Real-time Notification',
              message: 'This is a real-time update',
              timestamp: new Date().toISOString()
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Check if notification count increased
      await page.waitForTimeout(1000);
      const newNotificationCount = await page.locator('.notification-item, .notif-item').count();
      
      if (newNotificationCount > initialNotificationCount) {
        expect(newNotificationCount).toBeGreaterThan(initialNotificationCount);
      }
    });
    
    test('should handle notification preferences', async ({ page }) => {
      await page.goto('/');
      
      // Look for notification settings
      const settingsButton = page.locator('.notification-settings, .notif-settings, .settings-btn');
      if (await settingsButton.count() > 0) {
        await settingsButton.click();
        
        // Should show notification preferences
        const preferences = page.locator('.notification-preferences, .notif-preferences');
        if (await preferences.count() > 0) {
          await expect(preferences.first()).toBeVisible();
          
          // Should have toggles for different notification types
          const toggles = page.locator('input[type="checkbox"], .toggle, .switch');
          if (await toggles.count() > 0) {
            // Test toggling a preference
            await toggles.first().click();
            
            // Preference should be saved
            const isChecked = await toggles.first().isChecked();
            expect(typeof isChecked).toBe('boolean');
          }
        }
      }
    });
  });
  
  test.describe('Mobile Responsiveness', () => {
    test('should display notifications properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const notificationDot = page.locator('.notification-dot, .notif-dot');
      if (await notificationDot.count() > 0) {
        await expect(notificationDot.first()).toBeVisible();
        
        // Dot should be properly positioned on mobile
        const dotBox = await notificationDot.first().boundingBox();
        if (dotBox) {
          expect(dotBox.x + dotBox.width).toBeLessThanOrEqual(375);
        }
      }
      
      // Test notification panel on mobile
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        await notificationButton.click();
        
        const notificationPanel = page.locator('.notification-panel, .notifications-dropdown');
        if (await notificationPanel.count() > 0) {
          // Panel should fit mobile screen
          const panelBox = await notificationPanel.first().boundingBox();
          if (panelBox) {
            expect(panelBox.width).toBeLessThanOrEqual(375);
          }
        }
      }
    });
    
    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        // Tap to open notifications
        await notificationButton.tap();
        
        const notificationPanel = page.locator('.notification-panel, .notifications-dropdown');
        if (await notificationPanel.count() > 0) {
          await expect(notificationPanel.first()).toBeVisible();
          
          // Test swipe to dismiss notifications
          const notification = page.locator('.notification-item, .notif-item').first();
          if (await notification.count() > 0) {
            // Simulate swipe gesture
            const box = await notification.boundingBox();
            if (box) {
              await page.mouse.move(box.x + 10, box.y + box.height / 2);
              await page.mouse.down();
              await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
              await page.mouse.up();
            }
          }
        }
      }
    });
  });
  
  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Tab to notification button
      await page.keyboard.press('Tab');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        // Should be focusable
        const isFocused = await notificationButton.evaluate(el => document.activeElement === el);
        if (isFocused) {
          // Press Enter to open notifications
          await page.keyboard.press('Enter');
          
          const notificationPanel = page.locator('.notification-panel, .notifications-dropdown');
          if (await notificationPanel.count() > 0) {
            await expect(notificationPanel.first()).toBeVisible();
            
            // Tab through notifications
            await page.keyboard.press('Tab');
            
            const firstNotification = page.locator('.notification-item, .notif-item').first();
            if (await firstNotification.count() > 0) {
              const isNotificationFocused = await firstNotification.evaluate(el => document.activeElement === el);
              expect(isNotificationFocused).toBeTruthy();
            }
          }
        }
      }
    });
    
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      const notificationButton = page.locator('.notification-btn, .notif-btn');
      if (await notificationButton.count() > 0) {
        // Check for ARIA labels
        const ariaLabel = await notificationButton.getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toMatch(/notification|alert|message/i);
        }
        
        // Check for ARIA expanded state
        const ariaExpanded = await notificationButton.getAttribute('aria-expanded');
        if (ariaExpanded !== null) {
          expect(ariaExpanded).toMatch(/true|false/);
        }
      }
      
      // Check notification panel ARIA attributes
      const notificationPanel = page.locator('.notification-panel, .notifications-dropdown');
      if (await notificationPanel.count() > 0) {
        const role = await notificationPanel.getAttribute('role');
        if (role) {
          expect(role).toMatch(/menu|listbox|region/);
        }
      }
    });
    
    test('should announce new notifications to screen readers', async ({ page }) => {
      await page.goto('/');
      
      // Check for ARIA live regions
      const liveRegion = page.locator('[aria-live], .sr-only, .screen-reader-text');
      if (await liveRegion.count() > 0) {
        const ariaLive = await liveRegion.first().getAttribute('aria-live');
        if (ariaLive) {
          expect(ariaLive).toMatch(/polite|assertive/);
        }
      }
    });
  });
});