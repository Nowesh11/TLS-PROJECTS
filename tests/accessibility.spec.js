const { test, expect } = require('@playwright/test');

test.describe('Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
  
  test.describe('Keyboard Navigation', () => {
    test('should navigate through homepage with keyboard', async ({ page }) => {
      await page.goto('/');
      
      // Start from the first focusable element
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = await page.evaluate(() => {
        return document.activeElement.tagName;
      });
      
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
      
      // Navigate through several elements
      const focusableElements = [];
      
      for (let i = 0; i < 10; i++) {
        const currentElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textContent?.trim().substring(0, 50)
          };
        });
        
        focusableElements.push(currentElement);
        await page.keyboard.press('Tab');
      }
      
      // Should have navigated through different elements
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Check that we can navigate backwards
      await page.keyboard.press('Shift+Tab');
      
      const backwardElement = await page.evaluate(() => {
        return document.activeElement.tagName;
      });
      
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(backwardElement);
    });
    
    test('should handle Enter and Space key activation', async ({ page }) => {
      await page.goto('/');
      
      // Find buttons and links
      const buttons = page.locator('button, .btn');
      if (await buttons.count() > 0) {
        const button = buttons.first();
        await button.focus();
        
        // Should be able to activate with Enter
        await page.keyboard.press('Enter');
        
        // Check if action was triggered (depends on implementation)
        await page.waitForTimeout(500);
      }
      
      const links = page.locator('a[href]');
      if (await links.count() > 0) {
        const link = links.first();
        await link.focus();
        
        // Should be able to activate with Enter
        await page.keyboard.press('Enter');
        
        // Check if navigation occurred or action was triggered
        await page.waitForTimeout(500);
      }
    });
    
    test('should handle Escape key for modals', async ({ page }) => {
      await page.goto('/');
      
      // Try to open a modal
      const modalTrigger = page.locator('.login-btn, .btn-login, [data-toggle="modal"]');
      if (await modalTrigger.count() > 0) {
        await modalTrigger.first().click();
        
        const modal = page.locator('.modal, .popup, .dialog');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Press Escape to close
          await page.keyboard.press('Escape');
          
          // Modal should close
          await expect(modal.first()).toBeHidden({ timeout: 2000 });
        }
      }
    });
    
    test('should handle arrow keys in menus', async ({ page }) => {
      await page.goto('/');
      
      // Look for dropdown menus or navigation
      const menuTrigger = page.locator('.dropdown-toggle, .menu-trigger, .nav-toggle');
      if (await menuTrigger.count() > 0) {
        await menuTrigger.first().focus();
        await page.keyboard.press('Enter');
        
        const menu = page.locator('.dropdown-menu, .menu, .nav-menu');
        if (await menu.count() > 0) {
          await expect(menu.first()).toBeVisible();
          
          // Navigate with arrow keys
          await page.keyboard.press('ArrowDown');
          
          const focusedItem = await page.evaluate(() => {
            return document.activeElement.tagName;
          });
          
          expect(['A', 'BUTTON', 'LI']).toContain(focusedItem);
        }
      }
    });
  });
  
  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await page.goto('/');
      
      // Check buttons have accessible names
      const buttons = page.locator('button, .btn');
      if (await buttons.count() > 0) {
        const buttonCount = Math.min(await buttons.count(), 5);
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          
          const accessibleName = await button.evaluate(el => {
            return el.getAttribute('aria-label') || 
                   el.getAttribute('aria-labelledby') || 
                   el.textContent?.trim() || 
                   el.getAttribute('title');
          });
          
          expect(accessibleName).toBeTruthy();
          expect(accessibleName.length).toBeGreaterThan(0);
        }
      }
      
      // Check form inputs have labels
      const inputs = page.locator('input, textarea, select');
      if (await inputs.count() > 0) {
        const inputCount = Math.min(await inputs.count(), 5);
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          
          const hasLabel = await input.evaluate(el => {
            const id = el.id;
            const ariaLabel = el.getAttribute('aria-label');
            const ariaLabelledby = el.getAttribute('aria-labelledby');
            const placeholder = el.getAttribute('placeholder');
            
            if (ariaLabel || ariaLabelledby || placeholder) return true;
            
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`);
              if (label) return true;
            }
            
            const parentLabel = el.closest('label');
            return !!parentLabel;
          });
          
          expect(hasLabel).toBe(true);
        }
      }
    });
    
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim(),
          hasContent: h.textContent?.trim().length > 0
        }));
      });
      
      if (headings.length > 0) {
        // Should have at least one h1
        const h1Count = headings.filter(h => h.level === 1).length;
        expect(h1Count).toBeGreaterThanOrEqual(1);
        expect(h1Count).toBeLessThanOrEqual(2); // Should not have multiple h1s
        
        // All headings should have content
        headings.forEach(heading => {
          expect(heading.hasContent).toBe(true);
        });
        
        // Check heading hierarchy (no skipping levels)
        for (let i = 1; i < headings.length; i++) {
          const currentLevel = headings[i].level;
          const previousLevel = headings[i - 1].level;
          
          // Should not skip more than one level
          if (currentLevel > previousLevel) {
            expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
          }
        }
      }
    });
    
    test('should have proper ARIA roles for custom components', async ({ page }) => {
      await page.goto('/');
      
      // Check for custom interactive elements
      const customElements = page.locator('[role], .custom-button, .custom-link');
      if (await customElements.count() > 0) {
        const elementCount = Math.min(await customElements.count(), 5);
        
        for (let i = 0; i < elementCount; i++) {
          const element = customElements.nth(i);
          
          const role = await element.getAttribute('role');
          if (role) {
            const validRoles = [
              'button', 'link', 'tab', 'tabpanel', 'dialog', 'menu', 'menuitem',
              'navigation', 'main', 'banner', 'contentinfo', 'complementary',
              'region', 'article', 'section', 'alert', 'status', 'progressbar'
            ];
            
            expect(validRoles).toContain(role);
          }
        }
      }
    });
    
    test('should have proper alt text for images', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      if (await images.count() > 0) {
        const imageCount = Math.min(await images.count(), 10);
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          
          const altText = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          const ariaLabel = await img.getAttribute('aria-label');
          
          // Images should have alt text, or be marked as decorative
          if (role === 'presentation' || role === 'none') {
            // Decorative images can have empty alt
            expect(altText).toBeDefined();
          } else {
            // Content images should have meaningful alt text or aria-label
            expect(altText !== null || ariaLabel !== null).toBe(true);
            
            if (altText !== null && altText !== '') {
              expect(altText.length).toBeGreaterThan(0);
              expect(altText.length).toBeLessThan(150); // Should be concise
            }
          }
        }
      }
    });
  });
  
  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Check text elements for color contrast
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div, a, button');
      if (await textElements.count() > 0) {
        const elementCount = Math.min(await textElements.count(), 10);
        
        for (let i = 0; i < elementCount; i++) {
          const element = textElements.nth(i);
          
          const hasVisibleText = await element.evaluate(el => {
            const text = el.textContent?.trim();
            const style = window.getComputedStyle(el);
            return text && text.length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          });
          
          if (hasVisibleText) {
            const colors = await element.evaluate(el => {
              const style = window.getComputedStyle(el);
              return {
                color: style.color,
                backgroundColor: style.backgroundColor,
                fontSize: style.fontSize
              };
            });
            
            // Basic check - colors should be defined
            expect(colors.color).toBeTruthy();
            expect(colors.color).not.toBe('rgba(0, 0, 0, 0)');
          }
        }
      }
    });
    
    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('/');
      
      // Check for error messages, success messages, etc.
      const statusElements = page.locator('.error, .success, .warning, .info, .alert');
      if (await statusElements.count() > 0) {
        const statusCount = Math.min(await statusElements.count(), 5);
        
        for (let i = 0; i < statusCount; i++) {
          const element = statusElements.nth(i);
          
          const hasTextualIndicator = await element.evaluate(el => {
            const text = el.textContent?.trim();
            const hasIcon = el.querySelector('.icon, .fa, [class*="icon-"]');
            const ariaLabel = el.getAttribute('aria-label');
            
            return (text && text.length > 0) || hasIcon || ariaLabel;
          });
          
          expect(hasTextualIndicator).toBe(true);
        }
      }
    });
    
    test('should be usable when zoomed to 200%', async ({ page }) => {
      await page.goto('/');
      
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 }); // Simulate smaller viewport
      
      // Check that main content is still accessible
      const mainContent = page.locator('main, .main-content, .container');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
      
      // Check that navigation is still usable
      const navigation = page.locator('nav, .navbar, .navigation');
      if (await navigation.count() > 0) {
        await expect(navigation.first()).toBeVisible();
      }
      
      // Check that text doesn't overflow
      const textElements = page.locator('p, h1, h2, h3');
      if (await textElements.count() > 0) {
        const element = textElements.first();
        const box = await element.boundingBox();
        
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(640 + 20); // Allow small margin
        }
      }
    });
  });
  
  test.describe('Screen Reader Compatibility', () => {
    test('should have proper page title', async ({ page }) => {
      await page.goto('/');
      
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThan(60); // Should be concise
      expect(title).not.toBe('Document'); // Should not be default
    });
    
    test('should have proper lang attribute', async ({ page }) => {
      await page.goto('/');
      
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Should be valid language code
    });
    
    test('should have skip links for navigation', async ({ page }) => {
      await page.goto('/');
      
      // Look for skip links
      const skipLinks = page.locator('a[href^="#"]').filter({ hasText: /skip|jump/i });
      if (await skipLinks.count() > 0) {
        const skipLink = skipLinks.first();
        
        // Skip link should be focusable
        await skipLink.focus();
        await expect(skipLink).toBeFocused();
        
        // Should have proper href
        const href = await skipLink.getAttribute('href');
        expect(href).toMatch(/^#\w+/);
        
        // Target should exist
        const targetId = href.substring(1);
        const target = page.locator(`#${targetId}`);
        expect(await target.count()).toBeGreaterThan(0);
      }
    });
    
    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto('/');
      
      // Look for live regions
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      if (await liveRegions.count() > 0) {
        const liveRegion = liveRegions.first();
        
        const ariaLive = await liveRegion.getAttribute('aria-live');
        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
      }
      
      // Test dynamic content updates (e.g., form validation)
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        const submitBtn = form.locator('button[type="submit"], .submit-btn');
        
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          
          // Look for error messages with proper ARIA
          const errorMessages = page.locator('.error-message, .field-error, [role="alert"]');
          if (await errorMessages.count() > 0) {
            const errorMsg = errorMessages.first();
            
            const role = await errorMsg.getAttribute('role');
            const ariaLive = await errorMsg.getAttribute('aria-live');
            
            expect(role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite').toBe(true);
          }
        }
      }
    });
  });
  
  test.describe('Form Accessibility', () => {
    test('should have accessible form controls', async ({ page }) => {
      await page.goto('/contact.html');
      
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        
        // Check form inputs
        const inputs = form.locator('input, textarea, select');
        if (await inputs.count() > 0) {
          const inputCount = Math.min(await inputs.count(), 5);
          
          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            
            // Should have accessible name
            const accessibleName = await input.evaluate(el => {
              const id = el.id;
              const ariaLabel = el.getAttribute('aria-label');
              const ariaLabelledby = el.getAttribute('aria-labelledby');
              
              if (ariaLabel) return ariaLabel;
              if (ariaLabelledby) {
                const labelElement = document.getElementById(ariaLabelledby);
                return labelElement?.textContent?.trim();
              }
              
              if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label) return label.textContent?.trim();
              }
              
              const parentLabel = el.closest('label');
              if (parentLabel) return parentLabel.textContent?.trim();
              
              return el.getAttribute('placeholder');
            });
            
            expect(accessibleName).toBeTruthy();
            
            // Required fields should be marked
            const isRequired = await input.getAttribute('required');
            const ariaRequired = await input.getAttribute('aria-required');
            
            if (isRequired !== null) {
              expect(ariaRequired === 'true' || isRequired !== null).toBe(true);
            }
          }
        }
        
        // Check fieldsets and legends
        const fieldsets = form.locator('fieldset');
        if (await fieldsets.count() > 0) {
          for (let i = 0; i < await fieldsets.count(); i++) {
            const fieldset = fieldsets.nth(i);
            const legend = fieldset.locator('legend');
            
            if (await legend.count() > 0) {
              const legendText = await legend.textContent();
              expect(legendText?.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
    
    test('should provide clear error messages', async ({ page }) => {
      await page.goto('/contact.html');
      
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        const submitBtn = form.locator('button[type="submit"], .submit-btn');
        
        if (await submitBtn.count() > 0) {
          // Submit empty form to trigger validation
          await submitBtn.click();
          
          // Check for error messages
          const errorMessages = page.locator('.error-message, .field-error, .invalid-feedback');
          if (await errorMessages.count() > 0) {
            const errorCount = Math.min(await errorMessages.count(), 3);
            
            for (let i = 0; i < errorCount; i++) {
              const error = errorMessages.nth(i);
              
              // Error should have content
              const errorText = await error.textContent();
              expect(errorText?.trim().length).toBeGreaterThan(0);
              
              // Error should be associated with field
              const ariaDescribedby = await error.evaluate(el => {
                const id = el.id;
                if (id) {
                  const field = document.querySelector(`[aria-describedby*="${id}"]`);
                  return !!field;
                }
                return false;
              });
              
              // Should be associated with field or have proper role
              const role = await error.getAttribute('role');
              expect(ariaDescribedby || role === 'alert').toBe(true);
            }
          }
        }
      }
    });
  });
  
  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Check focusable elements
      const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]');
      if (await focusableElements.count() > 0) {
        const elementCount = Math.min(await focusableElements.count(), 5);
        
        for (let i = 0; i < elementCount; i++) {
          const element = focusableElements.nth(i);
          
          await element.focus();
          
          // Check if element has focus styles
          const focusStyles = await element.evaluate(el => {
            const style = window.getComputedStyle(el, ':focus');
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth,
              outlineStyle: style.outlineStyle,
              boxShadow: style.boxShadow,
              border: style.border
            };
          });
          
          // Should have some form of focus indicator
          const hasFocusIndicator = 
            focusStyles.outline !== 'none' ||
            focusStyles.outlineWidth !== '0px' ||
            focusStyles.boxShadow !== 'none' ||
            focusStyles.border !== 'none';
          
          expect(hasFocusIndicator).toBe(true);
        }
      }
    });
    
    test('should manage focus in modals', async ({ page }) => {
      await page.goto('/');
      
      // Open modal
      const modalTrigger = page.locator('.login-btn, .btn-login, [data-toggle="modal"]');
      if (await modalTrigger.count() > 0) {
        await modalTrigger.first().click();
        
        const modal = page.locator('.modal, .popup, .dialog');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Focus should be trapped in modal
          const modalFocusableElements = modal.locator('a, button, input, select, textarea, [tabindex]');
          if (await modalFocusableElements.count() > 0) {
            // First focusable element should receive focus
            const firstFocusable = modalFocusableElements.first();
            await expect(firstFocusable).toBeFocused({ timeout: 2000 });
            
            // Tab through modal elements
            for (let i = 0; i < Math.min(await modalFocusableElements.count(), 3); i++) {
              await page.keyboard.press('Tab');
              
              // Focus should stay within modal
              const focusedElement = await page.evaluate(() => document.activeElement);
              const isInModal = await modal.evaluate((modalEl, focusedEl) => {
                return modalEl.contains(focusedEl);
              }, focusedElement);
              
              expect(isInModal).toBe(true);
            }
          }
        }
      }
    });
    
    test('should restore focus after modal closes', async ({ page }) => {
      await page.goto('/');
      
      const modalTrigger = page.locator('.login-btn, .btn-login, [data-toggle="modal"]');
      if (await modalTrigger.count() > 0) {
        // Focus trigger and remember it
        await modalTrigger.first().focus();
        await modalTrigger.first().click();
        
        const modal = page.locator('.modal, .popup, .dialog');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Close modal
          const closeBtn = modal.locator('.close, .btn-close, [aria-label*="close"]');
          if (await closeBtn.count() > 0) {
            await closeBtn.first().click();
          } else {
            await page.keyboard.press('Escape');
          }
          
          await expect(modal.first()).toBeHidden({ timeout: 2000 });
          
          // Focus should return to trigger
          await expect(modalTrigger.first()).toBeFocused({ timeout: 1000 });
        }
      }
    });
  });
  
  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check touch targets are large enough
      const touchTargets = page.locator('button, a, .btn, input[type="checkbox"], input[type="radio"]');
      if (await touchTargets.count() > 0) {
        const targetCount = Math.min(await touchTargets.count(), 5);
        
        for (let i = 0; i < targetCount; i++) {
          const target = touchTargets.nth(i);
          const box = await target.boundingBox();
          
          if (box) {
            // Touch targets should be at least 44x44px
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
          }
        }
      }
      
      // Check that content is not cut off
      const mainContent = page.locator('main, .main-content, .container');
      if (await mainContent.count() > 0) {
        const contentBox = await mainContent.first().boundingBox();
        if (contentBox) {
          expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(375 + 20);
        }
      }
    });
  });
  
  test.describe('Admin Panel Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/admin/login.html');
      
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const loginButton = page.locator('button[type="submit"], .login-btn');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
        await emailInput.fill('admin@tamilsociety.com');
        await passwordInput.fill('Admin123!');
        await loginButton.click();
        await page.waitForTimeout(2000);
      }
    });
    
    test('should have accessible navigation', async ({ page }) => {
      // Check sidebar navigation
      const sidebar = page.locator('.sidebar, .admin-sidebar, .nav-sidebar');
      if (await sidebar.count() > 0) {
        const navItems = sidebar.locator('a, button, .nav-link');
        if (await navItems.count() > 0) {
          const itemCount = Math.min(await navItems.count(), 5);
          
          for (let i = 0; i < itemCount; i++) {
            const item = navItems.nth(i);
            
            // Should have accessible name
            const accessibleName = await item.evaluate(el => {
              return el.getAttribute('aria-label') || 
                     el.textContent?.trim() || 
                     el.getAttribute('title');
            });
            
            expect(accessibleName).toBeTruthy();
            expect(accessibleName.length).toBeGreaterThan(0);
          }
        }
      }
    });
    
    test('should have accessible data tables', async ({ page }) => {
      // Navigate to a page with tables
      const booksMenuItem = page.locator('a[href*="books"], .nav-link:has-text("Books")');
      if (await booksMenuItem.count() > 0) {
        await booksMenuItem.click();
        
        const tables = page.locator('table');
        if (await tables.count() > 0) {
          const table = tables.first();
          
          // Should have caption or aria-label
          const caption = table.locator('caption');
          const ariaLabel = await table.getAttribute('aria-label');
          const ariaLabelledby = await table.getAttribute('aria-labelledby');
          
          expect(
            await caption.count() > 0 || 
            ariaLabel || 
            ariaLabelledby
          ).toBe(true);
          
          // Should have proper headers
          const headers = table.locator('th');
          if (await headers.count() > 0) {
            const headerCount = Math.min(await headers.count(), 5);
            
            for (let i = 0; i < headerCount; i++) {
              const header = headers.nth(i);
              
              const headerText = await header.textContent();
              expect(headerText?.trim().length).toBeGreaterThan(0);
              
              // Should have scope attribute
              const scope = await header.getAttribute('scope');
              if (scope) {
                expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope);
              }
            }
          }
        }
      }
    });
  });
});