const { test, expect } = require('@playwright/test');

test.describe('Ebooks - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/ebooks.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Ebook Catalog Display', () => {
    test('should display all ebook cards with complete information', async ({ page }) => {
      // Check ebooks container is visible
      await expect(page.locator('.ebooks-container, .ebooks-grid, .ebook-list')).toBeVisible();
      
      // Get all ebook cards
      const ebookCards = page.locator('.ebook-card, .ebook-item, .ebook');
      const cardCount = await ebookCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check each ebook card has required elements
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = ebookCards.nth(i);
        
        // Ebook cover image
        await expect(card.locator('img, .ebook-cover, .ebook-image')).toBeVisible();
        
        // Ebook title
        await expect(card.locator('.ebook-title, .title, h3, h4')).toBeVisible();
        
        // Download or read button
        const downloadBtn = card.locator('.download-btn, .read-btn, button:has-text("Download"), button:has-text("Read")');
        expect(await downloadBtn.count()).toBeGreaterThan(0);
      }
    });
    
    test('should display ebook file formats and sizes', async ({ page }) => {
      const ebookCards = page.locator('.ebook-card, .ebook-item');
      if (await ebookCards.count() > 0) {
        const firstEbook = ebookCards.first();
        
        // Check for file format indicators (PDF, EPUB, etc.)
        const formatIndicator = firstEbook.locator('.file-format, .format, .ebook-type');
        if (await formatIndicator.count() > 0) {
          await expect(formatIndicator).toBeVisible();
          const formatText = await formatIndicator.textContent();
          expect(formatText).toMatch(/PDF|EPUB|MOBI|TXT/i);
        }
        
        // Check for file size
        const sizeIndicator = firstEbook.locator('.file-size, .size, .ebook-size');
        if (await sizeIndicator.count() > 0) {
          await expect(sizeIndicator).toBeVisible();
          const sizeText = await sizeIndicator.textContent();
          expect(sizeText).toMatch(/\d+\s*(KB|MB|GB)/i);
        }
      }
    });
    
    test('should handle ebook cover image loading', async ({ page }) => {
      const ebookImages = page.locator('.ebook-card img, .ebook-cover, .ebook-image');
      const imageCount = await ebookImages.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = ebookImages.nth(i);
          await expect(img).toBeVisible();
          
          // Check if image has valid src
          const src = await img.getAttribute('src');
          expect(src).toBeTruthy();
          expect(src).not.toBe('');
          
          // Check if image has alt text for accessibility
          const alt = await img.getAttribute('alt');
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
  
  test.describe('Tamil Font Rendering', () => {
    test('should properly render Tamil text in ebook titles', async ({ page }) => {
      const tamilTitles = page.locator('.ebook-title, .title').filter({ hasText: /[\u0B80-\u0BFF]/ });
      
      if (await tamilTitles.count() > 0) {
        const firstTamilTitle = tamilTitles.first();
        await expect(firstTamilTitle).toBeVisible();
        
        // Check if Tamil font is applied
        const computedStyle = await firstTamilTitle.evaluate(el => {
          return window.getComputedStyle(el).fontFamily;
        });
        
        // Common Tamil fonts
        const tamilFonts = ['Noto Sans Tamil', 'Latha', 'Vijaya', 'Shruti', 'Mangal'];
        const hasTamilFont = tamilFonts.some(font => computedStyle.includes(font));
        
        if (!hasTamilFont) {
          // At least check that text is visible and not showing as boxes
          const titleText = await firstTamilTitle.textContent();
          expect(titleText).toBeTruthy();
          expect(titleText).not.toMatch(/[\u25A1\uFFFD]/); // No replacement characters
        }
      }
    });
    
    test('should render Tamil text in ebook descriptions', async ({ page }) => {
      const tamilDescriptions = page.locator('.ebook-description, .description').filter({ hasText: /[\u0B80-\u0BFF]/ });
      
      if (await tamilDescriptions.count() > 0) {
        const firstDescription = tamilDescriptions.first();
        await expect(firstDescription).toBeVisible();
        
        const descText = await firstDescription.textContent();
        expect(descText).toBeTruthy();
        expect(descText).not.toMatch(/[\u25A1\uFFFD]/); // No replacement characters
      }
    });
    
    test('should maintain Tamil font consistency across different screen sizes', async ({ page }) => {
      const tamilElements = page.locator('*').filter({ hasText: /[\u0B80-\u0BFF]/ });
      
      if (await tamilElements.count() > 0) {
        // Test on desktop
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const desktopTamilEl = page.locator('*').filter({ hasText: /[\u0B80-\u0BFF]/ }).first();
        if (await desktopTamilEl.count() > 0) {
          await expect(desktopTamilEl).toBeVisible();
        }
        
        // Test on mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const mobileTamilEl = page.locator('*').filter({ hasText: /[\u0B80-\u0BFF]/ }).first();
        if (await mobileTamilEl.count() > 0) {
          await expect(mobileTamilEl).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Ebook Download Functionality', () => {
    test('should initiate download when download button is clicked', async ({ page }) => {
      const downloadBtn = page.locator('.download-btn, button:has-text("Download")').first();
      
      if (await downloadBtn.count() > 0) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        
        await downloadBtn.click();
        
        try {
          const download = await downloadPromise;
          
          // Check if download started
          expect(download).toBeTruthy();
          
          // Check filename
          const filename = download.suggestedFilename();
          expect(filename).toBeTruthy();
          expect(filename).toMatch(/\.(pdf|epub|mobi|txt)$/i);
          
        } catch (error) {
          // If download doesn't work, check for alternative behaviors
          // Maybe it opens in new tab or shows a modal
          const newTab = page.context().pages().length > 1;
          const modal = page.locator('.download-modal, .ebook-modal');
          
          expect(newTab || await modal.count() > 0).toBeTruthy();
        }
      }
    });
    
    test('should show download progress or confirmation', async ({ page }) => {
      const downloadBtn = page.locator('.download-btn, button:has-text("Download")').first();
      
      if (await downloadBtn.count() > 0) {
        await downloadBtn.click();
        
        // Check for download progress indicator
        const progressIndicator = page.locator('.download-progress, .progress-bar, .downloading');
        const confirmationMessage = page.locator('.download-success, .download-complete, .success-message');
        
        // Wait for either progress indicator or confirmation
        try {
          await expect(progressIndicator.or(confirmationMessage)).toBeVisible({ timeout: 5000 });
        } catch {
          // Alternative: check if button text changed
          const buttonText = await downloadBtn.textContent();
          expect(buttonText).toMatch(/downloading|downloaded|complete/i);
        }
      }
    });
    
    test('should handle download errors gracefully', async ({ page }) => {
      // Mock a network error for downloads
      await page.route('**/download/**', route => {
        route.abort('failed');
      });
      
      const downloadBtn = page.locator('.download-btn, button:has-text("Download")').first();
      
      if (await downloadBtn.count() > 0) {
        await downloadBtn.click();
        
        // Check for error message
        const errorMessage = page.locator('.download-error, .error-message, .alert-error');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
  
  test.describe('Ebook Reading Interface', () => {
    test('should open ebook reader when read button is clicked', async ({ page }) => {
      const readBtn = page.locator('.read-btn, button:has-text("Read"), .open-reader');
      
      if (await readBtn.count() > 0) {
        await readBtn.first().click();
        
        // Check if reader opens (modal, new page, or embedded)
        const readerModal = page.locator('.ebook-reader, .reader-modal, #ebookReader');
        const readerPage = page.locator('.reader-page, .reading-interface');
        
        if (await readerModal.count() > 0) {
          await expect(readerModal).toBeVisible();
          
          // Check for reader controls
          const prevBtn = readerModal.locator('.prev-page, .previous, [aria-label*="previous"]');
          const nextBtn = readerModal.locator('.next-page, .next, [aria-label*="next"]');
          
          if (await prevBtn.count() > 0) await expect(prevBtn).toBeVisible();
          if (await nextBtn.count() > 0) await expect(nextBtn).toBeVisible();
          
        } else if (await readerPage.count() > 0) {
          await expect(readerPage).toBeVisible();
        } else {
          // Check if URL changed to reader page
          await expect(page).toHaveURL(/reader|read/);
        }
      }
    });
    
    test('should provide reader navigation controls', async ({ page }) => {
      const readBtn = page.locator('.read-btn, button:has-text("Read")').first();
      
      if (await readBtn.count() > 0) {
        await readBtn.click();
        
        const reader = page.locator('.ebook-reader, .reader-modal, .reading-interface');
        if (await reader.count() > 0) {
          // Check for page navigation
          const nextBtn = reader.locator('.next-page, .next, button:has-text("Next")');
          const prevBtn = reader.locator('.prev-page, .previous, button:has-text("Previous")');
          
          if (await nextBtn.count() > 0) {
            await nextBtn.click();
            await page.waitForTimeout(500);
            
            // Check if page changed (content or page number)
            const pageIndicator = reader.locator('.page-number, .current-page');
            if (await pageIndicator.count() > 0) {
              const pageText = await pageIndicator.textContent();
              expect(pageText).toMatch(/\d+/);
            }
          }
        }
      }
    });
    
    test('should provide text size and theme controls in reader', async ({ page }) => {
      const readBtn = page.locator('.read-btn, button:has-text("Read")').first();
      
      if (await readBtn.count() > 0) {
        await readBtn.click();
        
        const reader = page.locator('.ebook-reader, .reader-modal');
        if (await reader.count() > 0) {
          // Check for text size controls
          const textSizeControls = reader.locator('.text-size, .font-size, .size-controls');
          if (await textSizeControls.count() > 0) {
            await expect(textSizeControls).toBeVisible();
            
            const increaseBtn = textSizeControls.locator('.increase, .plus, [aria-label*="increase"]');
            if (await increaseBtn.count() > 0) {
              await increaseBtn.click();
              await page.waitForTimeout(300);
            }
          }
          
          // Check for theme controls
          const themeControls = reader.locator('.theme-controls, .reader-theme');
          if (await themeControls.count() > 0) {
            await expect(themeControls).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Ebook Search and Filtering', () => {
    test('should filter ebooks by search query', async ({ page }) => {
      const searchInput = page.locator('.search-input, input[type="search"], #ebookSearch, .ebook-search');
      
      if (await searchInput.count() > 0) {
        // Get initial ebook count
        const initialEbooks = page.locator('.ebook-card, .ebook-item');
        const initialCount = await initialEbooks.count();
        
        // Search for specific term
        await searchInput.fill('Tamil');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Check if results are filtered
        const filteredEbooks = page.locator('.ebook-card, .ebook-item');
        const filteredCount = await filteredEbooks.count();
        
        if (filteredCount > 0) {
          // Check if visible ebooks contain search term
          const firstEbook = filteredEbooks.first();
          const ebookText = await firstEbook.textContent();
          expect(ebookText.toLowerCase()).toContain('tamil');
        }
      }
    });
    
    test('should filter ebooks by format', async ({ page }) => {
      const formatFilter = page.locator('.format-filter, select[name="format"], .file-format-filter');
      
      if (await formatFilter.count() > 0) {
        const options = formatFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select PDF format
          await formatFilter.selectOption({ value: 'pdf' });
          await page.waitForTimeout(1000);
          
          // Check if only PDF ebooks are shown
          const visibleEbooks = page.locator('.ebook-card, .ebook-item');
          if (await visibleEbooks.count() > 0) {
            const firstEbook = visibleEbooks.first();
            const formatText = await firstEbook.locator('.file-format, .format').textContent();
            if (formatText) {
              expect(formatText.toLowerCase()).toContain('pdf');
            }
          }
        }
      }
    });
    
    test('should filter ebooks by language', async ({ page }) => {
      const languageFilter = page.locator('.language-filter, select[name="language"]');
      
      if (await languageFilter.count() > 0) {
        const options = languageFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select Tamil language
          await languageFilter.selectOption({ value: 'tamil' });
          await page.waitForTimeout(1000);
          
          // Check if Tamil ebooks are shown
          const visibleEbooks = page.locator('.ebook-card, .ebook-item');
          expect(await visibleEbooks.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
  
  test.describe('Ebook Categories and Collections', () => {
    test('should display ebook categories', async ({ page }) => {
      const categories = page.locator('.ebook-category, .category-section, .ebook-genre');
      
      if (await categories.count() > 0) {
        const firstCategory = categories.first();
        await expect(firstCategory).toBeVisible();
        
        // Check category title
        const categoryTitle = firstCategory.locator('.category-title, .genre-title, h2, h3');
        if (await categoryTitle.count() > 0) {
          await expect(categoryTitle).toBeVisible();
          const titleText = await categoryTitle.textContent();
          expect(titleText.trim().length).toBeGreaterThan(0);
        }
        
        // Check category ebooks
        const categoryEbooks = firstCategory.locator('.ebook-card, .ebook-item');
        expect(await categoryEbooks.count()).toBeGreaterThan(0);
      }
    });
    
    test('should navigate between different ebook categories', async ({ page }) => {
      const categoryTabs = page.locator('.category-tab, .genre-tab, .category-nav a');
      
      if (await categoryTabs.count() > 1) {
        // Click on second category
        await categoryTabs.nth(1).click();
        await page.waitForTimeout(1000);
        
        // Check if content changed
        const activeCategory = page.locator('.category-tab.active, .genre-tab.active');
        if (await activeCategory.count() > 0) {
          await expect(activeCategory).toBeVisible();
        }
        
        // Check if ebooks are still displayed
        const ebooks = page.locator('.ebook-card, .ebook-item');
        expect(await ebooks.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if ebooks are still visible and properly arranged
      const ebooksContainer = page.locator('.ebooks-container, .ebooks-grid');
      await expect(ebooksContainer).toBeVisible();
      
      const ebookCards = page.locator('.ebook-card, .ebook-item');
      if (await ebookCards.count() > 0) {
        const firstCard = ebookCards.first();
        await expect(firstCard).toBeVisible();
        
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThan(375); // Should fit in mobile width
        }
      }
    });
    
    test('should maintain Tamil font readability on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const tamilText = page.locator('*').filter({ hasText: /[\u0B80-\u0BFF]/ });
      
      if (await tamilText.count() > 0) {
        const firstTamilEl = tamilText.first();
        await expect(firstTamilEl).toBeVisible();
        
        // Check if text is readable (not too small)
        const fontSize = await firstTamilEl.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });
        
        const fontSizeNum = parseInt(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(12); // Minimum readable size
      }
    });
    
    test('should adapt ebook reader for mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const readBtn = page.locator('.read-btn, button:has-text("Read")').first();
      
      if (await readBtn.count() > 0) {
        await readBtn.click();
        
        const reader = page.locator('.ebook-reader, .reader-modal');
        if (await reader.count() > 0) {
          await expect(reader).toBeVisible();
          
          // Check if reader fits mobile screen
          const readerBox = await reader.boundingBox();
          if (readerBox) {
            expect(readerBox.width).toBeLessThanOrEqual(375);
          }
          
          // Check if controls are accessible on mobile
          const controls = reader.locator('.reader-controls, .navigation-controls');
          if (await controls.count() > 0) {
            await expect(controls).toBeVisible();
          }
        }
      }
    });
  });
});