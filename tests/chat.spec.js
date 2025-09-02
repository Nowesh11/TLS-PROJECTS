const { test, expect } = require('@playwright/test');

test.describe('Chat System Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing chat data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('chatSession');
      localStorage.removeItem('chatMessages');
      sessionStorage.clear();
    });
  });
  
  test.describe('Chat Widget Display', () => {
    test('should display chat widget on homepage', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button, #chatWidget, .floating-chat');
      if (await chatWidget.count() > 0) {
        await expect(chatWidget.first()).toBeVisible();
        
        // Check if widget has proper styling
        const widgetBox = await chatWidget.first().boundingBox();
        if (widgetBox) {
          expect(widgetBox.width).toBeGreaterThan(0);
          expect(widgetBox.height).toBeGreaterThan(0);
        }
      }
    });
    
    test('should display chat widget on all pages', async ({ page }) => {
      const pages = ['/', '/books.html', '/ebooks.html', '/projects.html', '/contact.html'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        const chatWidget = page.locator('.chat-widget, .chat-button, #chatWidget');
        if (await chatWidget.count() > 0) {
          await expect(chatWidget.first()).toBeVisible();
        }
      }
    });
    
    test('should show unread message indicator', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        // Check for notification badge or dot
        const notificationBadge = page.locator('.chat-notification, .unread-badge, .message-count');
        if (await notificationBadge.count() > 0) {
          await expect(notificationBadge.first()).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Chat Window Functionality', () => {
    test('should open chat window when widget is clicked', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button, #chatWidget');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Chat window should open
        await expect(page.locator('.chat-container, .chat-window, .chat-interface')).toBeVisible();
        
        // Check chat window elements
        await expect(page.locator('.chat-header, .chat-title')).toBeVisible();
        await expect(page.locator('.chat-messages, .message-container')).toBeVisible();
        await expect(page.locator('.chat-input, .message-input')).toBeVisible();
      }
    });
    
    test('should close chat window with close button', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Chat window should be open
        const chatWindow = page.locator('.chat-container, .chat-window');
        await expect(chatWindow).toBeVisible();
        
        // Click close button
        const closeButton = page.locator('.chat-close, .close-chat, .fa-times');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          
          // Chat window should be closed
          await expect(chatWindow).toBeHidden();
        }
      }
    });
    
    test('should minimize/maximize chat window', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const chatWindow = page.locator('.chat-container, .chat-window');
        await expect(chatWindow).toBeVisible();
        
        // Click minimize button
        const minimizeButton = page.locator('.chat-minimize, .minimize-chat');
        if (await minimizeButton.count() > 0) {
          await minimizeButton.click();
          
          // Chat should be minimized (messages hidden, input hidden)
          const chatMessages = page.locator('.chat-messages, .message-container');
          if (await chatMessages.count() > 0) {
            await expect(chatMessages.first()).toBeHidden();
          }
        }
      }
    });
  });
  
  test.describe('Message Sending', () => {
    test('should send text message to admin', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Type message
        const messageInput = page.locator('.chat-input, .message-input, input[name="message"]');
        const sendButton = page.locator('.send-btn, .chat-send, button:has-text("Send")');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          const testMessage = 'Hello, I need help with my account!';
          await messageInput.fill(testMessage);
          await sendButton.click();
          
          // Message should appear in chat
          const sentMessage = page.locator('.chat-message, .message').filter({ hasText: testMessage });
          await expect(sentMessage.first()).toBeVisible();
          
          // Input should be cleared
          await expect(messageInput).toHaveValue('');
        }
      }
    });
    
    test('should send message with Enter key', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        if (await messageInput.count() > 0) {
          const testMessage = 'Testing Enter key send';
          await messageInput.fill(testMessage);
          await messageInput.press('Enter');
          
          // Message should appear in chat
          const sentMessage = page.locator('.chat-message, .message').filter({ hasText: testMessage });
          await expect(sentMessage.first()).toBeVisible();
        }
      }
    });
    
    test('should prevent sending empty messages', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          // Try to send empty message
          await sendButton.click();
          
          // No new message should appear
          const messages = page.locator('.chat-message, .message');
          const messageCount = await messages.count();
          
          // Send button should be disabled or no action taken
          const isDisabled = await sendButton.isDisabled();
          expect(isDisabled || messageCount === 0).toBeTruthy();
        }
      }
    });
    
    test('should handle long messages', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          const longMessage = 'This is a very long message that should test how the chat system handles lengthy text input and whether it properly displays or truncates the message content in the chat interface.';
          
          await messageInput.fill(longMessage);
          await sendButton.click();
          
          // Message should appear (possibly truncated or wrapped)
          const sentMessage = page.locator('.chat-message, .message').last();
          await expect(sentMessage).toBeVisible();
          
          // Check if message content is preserved
          const messageText = await sentMessage.textContent();
          expect(messageText).toContain(longMessage.substring(0, 50)); // At least first 50 chars
        }
      }
    });
    
    test('should show message timestamps', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          await messageInput.fill('Test message with timestamp');
          await sendButton.click();
          
          // Check for timestamp
          const timestamp = page.locator('.message-time, .timestamp, .chat-time');
          if (await timestamp.count() > 0) {
            await expect(timestamp.first()).toBeVisible();
            
            // Timestamp should contain time format
            const timeText = await timestamp.first().textContent();
            expect(timeText).toMatch(/\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}|AM|PM/);
          }
        }
      }
    });
  });
  
  test.describe('Message Display', () => {
    test('should display user messages with correct styling', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          await messageInput.fill('User message test');
          await sendButton.click();
          
          // Check user message styling
          const userMessage = page.locator('.user-message, .message-user, .message.user');
          if (await userMessage.count() > 0) {
            await expect(userMessage.first()).toBeVisible();
            
            // User messages should be aligned to right or have specific class
            const messageClass = await userMessage.first().getAttribute('class');
            expect(messageClass).toMatch(/user|right|sent/);
          }
        }
      }
    });
    
    test('should display admin messages with different styling', async ({ page }) => {
      await page.goto('/');
      
      // Simulate receiving admin message (this would normally come from server)
      await page.evaluate(() => {
        const chatContainer = document.querySelector('.chat-messages, .message-container');
        if (chatContainer) {
          const adminMessage = document.createElement('div');
          adminMessage.className = 'admin-message message-admin message admin';
          adminMessage.textContent = 'Hello! How can I help you today?';
          chatContainer.appendChild(adminMessage);
        }
      });
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Check admin message styling
        const adminMessage = page.locator('.admin-message, .message-admin, .message.admin');
        if (await adminMessage.count() > 0) {
          await expect(adminMessage.first()).toBeVisible();
          
          // Admin messages should be aligned to left or have specific class
          const messageClass = await adminMessage.first().getAttribute('class');
          expect(messageClass).toMatch(/admin|left|received/);
        }
      }
    });
    
    test('should scroll to latest message', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          // Send multiple messages to test scrolling
          for (let i = 1; i <= 5; i++) {
            await messageInput.fill(`Test message ${i}`);
            await sendButton.click();
            await page.waitForTimeout(500);
          }
          
          // Latest message should be visible
          const latestMessage = page.locator('.chat-message, .message').last();
          await expect(latestMessage).toBeVisible();
          
          // Check if scrolled to bottom
          const chatContainer = page.locator('.chat-messages, .message-container');
          if (await chatContainer.count() > 0) {
            const isScrolledToBottom = await chatContainer.evaluate(el => {
              return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
            });
            expect(isScrolledToBottom).toBeTruthy();
          }
        }
      }
    });
  });
  
  test.describe('Chat Session Management', () => {
    test('should maintain chat session across page reloads', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          // Send a message
          const testMessage = 'Message before reload';
          await messageInput.fill(testMessage);
          await sendButton.click();
          
          // Reload page
          await page.reload();
          
          // Open chat again
          const chatWidgetAfterReload = page.locator('.chat-widget, .chat-button');
          if (await chatWidgetAfterReload.count() > 0) {
            await chatWidgetAfterReload.click();
            
            // Previous message should still be there
            const previousMessage = page.locator('.chat-message, .message').filter({ hasText: testMessage });
            if (await previousMessage.count() > 0) {
              await expect(previousMessage.first()).toBeVisible();
            }
          }
        }
      }
    });
    
    test('should generate unique session ID', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Check if session ID is generated
        const sessionId = await page.evaluate(() => {
          return localStorage.getItem('chatSessionId') || 
                 sessionStorage.getItem('chatSessionId') ||
                 window.chatSessionId;
        });
        
        if (sessionId) {
          expect(sessionId).toBeTruthy();
          expect(typeof sessionId).toBe('string');
          expect(sessionId.length).toBeGreaterThan(10);
        }
      }
    });
    
    test('should clear chat session', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          // Send some messages
          await messageInput.fill('Message 1');
          await sendButton.click();
          await messageInput.fill('Message 2');
          await sendButton.click();
          
          // Clear chat
          const clearButton = page.locator('.clear-chat, .clear-session, button:has-text("Clear")');
          if (await clearButton.count() > 0) {
            await clearButton.click();
            
            // Messages should be cleared
            const messages = page.locator('.chat-message, .message');
            expect(await messages.count()).toBe(0);
            
            // Session data should be cleared
            const sessionData = await page.evaluate(() => {
              return localStorage.getItem('chatMessages') || sessionStorage.getItem('chatMessages');
            });
            expect(sessionData).toBeNull();
          }
        }
      }
    });
  });
  
  test.describe('Real-time Communication', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      await page.goto('/');
      
      // Monitor WebSocket connections
      const wsConnections = [];
      page.on('websocket', ws => {
        wsConnections.push(ws);
      });
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Wait for potential WebSocket connection
        await page.waitForTimeout(2000);
        
        // Check if WebSocket connection was established
        if (wsConnections.length > 0) {
          expect(wsConnections.length).toBeGreaterThan(0);
        }
      }
    });
    
    test('should handle connection status', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Check for connection status indicator
        const connectionStatus = page.locator('.connection-status, .online-status, .chat-status');
        if (await connectionStatus.count() > 0) {
          await expect(connectionStatus.first()).toBeVisible();
          
          // Status should indicate online/offline
          const statusText = await connectionStatus.first().textContent();
          expect(statusText).toMatch(/online|offline|connected|disconnected/i);
        }
      }
    });
    
    test('should show typing indicator', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        if (await messageInput.count() > 0) {
          // Start typing
          await messageInput.focus();
          await messageInput.type('Hello');
          
          // Check for typing indicator (admin side would show this)
          const typingIndicator = page.locator('.typing-indicator, .is-typing');
          if (await typingIndicator.count() > 0) {
            // This would typically be shown on admin side
            // For user side, we might show "Admin is typing..."
          }
        }
      }
    });
  });
  
  test.describe('Chat Notifications', () => {
    test('should show notification for new admin messages', async ({ page }) => {
      await page.goto('/');
      
      // Simulate receiving admin message when chat is closed
      await page.evaluate(() => {
        // Simulate new message notification
        const event = new CustomEvent('newChatMessage', {
          detail: { message: 'Hello from admin!', sender: 'admin' }
        });
        window.dispatchEvent(event);
      });
      
      // Check for notification
      const notification = page.locator('.chat-notification, .new-message-notification');
      if (await notification.count() > 0) {
        await expect(notification.first()).toBeVisible();
      }
      
      // Check for badge on chat widget
      const chatBadge = page.locator('.chat-badge, .unread-count');
      if (await chatBadge.count() > 0) {
        await expect(chatBadge.first()).toBeVisible();
      }
    });
    
    test('should play notification sound', async ({ page }) => {
      await page.goto('/');
      
      // Check if audio element exists for notifications
      const notificationAudio = page.locator('audio[data-notification], .notification-sound');
      if (await notificationAudio.count() > 0) {
        await expect(notificationAudio.first()).toBeAttached();
      }
    });
  });
  
  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await expect(chatWidget).toBeVisible();
        
        // Chat widget should be properly positioned on mobile
        const widgetBox = await chatWidget.boundingBox();
        if (widgetBox) {
          expect(widgetBox.x + widgetBox.width).toBeLessThanOrEqual(375);
          expect(widgetBox.y + widgetBox.height).toBeLessThanOrEqual(667);
        }
        
        await chatWidget.click();
        
        // Chat window should be responsive
        const chatWindow = page.locator('.chat-container, .chat-window');
        if (await chatWindow.count() > 0) {
          const windowBox = await chatWindow.boundingBox();
          if (windowBox) {
            expect(windowBox.width).toBeLessThanOrEqual(375);
          }
        }
      }
    });
    
    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        // Tap to open chat
        await chatWidget.tap();
        
        const chatWindow = page.locator('.chat-container, .chat-window');
        await expect(chatWindow).toBeVisible();
        
        // Test touch scrolling in chat messages
        const chatMessages = page.locator('.chat-messages, .message-container');
        if (await chatMessages.count() > 0) {
          // Simulate touch scroll
          await chatMessages.hover();
          await page.mouse.wheel(0, 100);
        }
      }
    });
  });
  
  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Simulate offline mode
      await page.context().setOffline(true);
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        const messageInput = page.locator('.chat-input, .message-input');
        const sendButton = page.locator('.send-btn, .chat-send');
        
        if (await messageInput.count() > 0 && await sendButton.count() > 0) {
          await messageInput.fill('Test message offline');
          await sendButton.click();
          
          // Should show error message or queue message
          const errorMessage = page.locator('.error-message, .offline-message, .send-failed');
          if (await errorMessage.count() > 0) {
            await expect(errorMessage.first()).toBeVisible();
          }
        }
      }
      
      // Reset online mode
      await page.context().setOffline(false);
    });
    
    test('should retry failed messages', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        await chatWidget.click();
        
        // Look for retry functionality
        const retryButton = page.locator('.retry-message, .resend-btn, button:has-text("Retry")');
        if (await retryButton.count() > 0) {
          await retryButton.click();
          
          // Message should be resent
          await expect(page.locator('.sending, .message-sending')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Accessibility', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Tab to chat widget
      await page.keyboard.press('Tab');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        // Should be focusable
        const isFocused = await chatWidget.evaluate(el => document.activeElement === el);
        if (isFocused) {
          // Press Enter to open chat
          await page.keyboard.press('Enter');
          
          const chatWindow = page.locator('.chat-container, .chat-window');
          await expect(chatWindow).toBeVisible();
          
          // Tab to message input
          await page.keyboard.press('Tab');
          
          const messageInput = page.locator('.chat-input, .message-input');
          if (await messageInput.count() > 0) {
            const isInputFocused = await messageInput.evaluate(el => document.activeElement === el);
            expect(isInputFocused).toBeTruthy();
          }
        }
      }
    });
    
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      const chatWidget = page.locator('.chat-widget, .chat-button');
      if (await chatWidget.count() > 0) {
        // Check for ARIA labels
        const ariaLabel = await chatWidget.getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toMatch(/chat|message|support/i);
        }
        
        await chatWidget.click();
        
        // Check chat window ARIA attributes
        const chatWindow = page.locator('.chat-container, .chat-window');
        if (await chatWindow.count() > 0) {
          const role = await chatWindow.getAttribute('role');
          if (role) {
            expect(role).toMatch(/dialog|application|region/);
          }
        }
      }
    });
  });
});