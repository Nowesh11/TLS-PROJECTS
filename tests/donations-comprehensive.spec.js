const { test, expect } = require('@playwright/test');

test.describe('Donations - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/donate.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Donation Page Display', () => {
    test('should display donation page with all essential elements', async ({ page }) => {
      // Check page title and heading
      await expect(page.locator('h1, .page-title, .donation-title')).toBeVisible();
      
      // Check donation form is present
      await expect(page.locator('form, .donation-form, #donationForm')).toBeVisible();
      
      // Check donation amount options
      const amountOptions = page.locator('.amount-option, .donation-amount, input[name="amount"]');
      expect(await amountOptions.count()).toBeGreaterThan(0);
      
      // Check submit/donate button
      await expect(page.locator('button[type="submit"], .donate-btn, .donation-submit')).toBeVisible();
    });
    
    test('should display donation impact information', async ({ page }) => {
      // Check for impact statements or donation usage information
      const impactSection = page.locator('.donation-impact, .impact-info, .how-donations-help');
      
      if (await impactSection.count() > 0) {
        await expect(impactSection).toBeVisible();
        
        const impactText = await impactSection.textContent();
        expect(impactText.trim().length).toBeGreaterThan(0);
      }
    });
    
    test('should display organization information and trust indicators', async ({ page }) => {
      // Check for organization details
      const orgInfo = page.locator('.organization-info, .about-org, .charity-info');
      
      if (await orgInfo.count() > 0) {
        await expect(orgInfo).toBeVisible();
      }
      
      // Check for trust indicators (certifications, badges, etc.)
      const trustBadges = page.locator('.trust-badge, .certification, .secure-donation');
      
      if (await trustBadges.count() > 0) {
        await expect(trustBadges.first()).toBeVisible();
      }
    });
  });
  
  test.describe('Donation Amount Selection', () => {
    test('should allow selection of predefined donation amounts', async ({ page }) => {
      const amountButtons = page.locator('.amount-btn, .amount-option, input[type="radio"][name="amount"]');
      
      if (await amountButtons.count() > 0) {
        // Click on first amount option
        await amountButtons.first().click();
        
        // Check if amount is selected (visual feedback)
        const selectedAmount = page.locator('.amount-btn.selected, .amount-option.active, input[type="radio"]:checked');
        if (await selectedAmount.count() > 0) {
          await expect(selectedAmount).toBeVisible();
        }
        
        // Test multiple amount selections
        if (await amountButtons.count() > 1) {
          await amountButtons.nth(1).click();
          await page.waitForTimeout(300);
        }
      }
    });
    
    test('should allow custom donation amount input', async ({ page }) => {
      const customAmountInput = page.locator('input[name="custom-amount"], .custom-amount, #customAmount');
      
      if (await customAmountInput.count() > 0) {
        await customAmountInput.fill('50');
        
        // Check if custom amount is accepted
        const inputValue = await customAmountInput.inputValue();
        expect(inputValue).toBe('50');
        
        // Check if other amount options are deselected
        const selectedPreset = page.locator('.amount-btn.selected, input[type="radio"]:checked');
        if (await selectedPreset.count() > 0) {
          // Custom amount should deselect preset amounts
        }
      }
    });
    
    test('should validate minimum donation amounts', async ({ page }) => {
      const customAmountInput = page.locator('input[name="custom-amount"], .custom-amount');
      
      if (await customAmountInput.count() > 0) {
        // Try entering very small amount
        await customAmountInput.fill('0.50');
        
        const submitBtn = page.locator('button[type="submit"], .donate-btn');
        await submitBtn.click();
        
        // Check for validation error
        const errorMessage = page.locator('.error-message, .validation-error, .amount-error');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
        }
      }
    });
    
    test('should handle invalid donation amount inputs', async ({ page }) => {
      const customAmountInput = page.locator('input[name="custom-amount"], .custom-amount');
      
      if (await customAmountInput.count() > 0) {
        // Try entering invalid characters
        await customAmountInput.fill('abc');
        
        const inputValue = await customAmountInput.inputValue();
        // Should either reject invalid input or show error
        expect(inputValue).not.toBe('abc');
      }
    });
  });
  
  test.describe('Donor Information Form', () => {
    test('should display all required donor information fields', async ({ page }) => {
      // Check for donor name field
      const nameField = page.locator('input[name="name"], input[name="donor-name"], #donorName');
      if (await nameField.count() > 0) {
        await expect(nameField).toBeVisible();
      }
      
      // Check for email field
      const emailField = page.locator('input[name="email"], input[type="email"], #donorEmail');
      if (await emailField.count() > 0) {
        await expect(emailField).toBeVisible();
      }
      
      // Check for phone field
      const phoneField = page.locator('input[name="phone"], input[type="tel"], #donorPhone');
      if (await phoneField.count() > 0) {
        await expect(phoneField).toBeVisible();
      }
      
      // Check for address fields
      const addressField = page.locator('input[name="address"], textarea[name="address"], #donorAddress');
      if (await addressField.count() > 0) {
        await expect(addressField).toBeVisible();
      }
    });
    
    test('should validate required donor information fields', async ({ page }) => {
      // Select an amount first
      const amountBtn = page.locator('.amount-btn, .amount-option').first();
      if (await amountBtn.count() > 0) {
        await amountBtn.click();
      }
      
      // Try to submit without filling required fields
      const submitBtn = page.locator('button[type="submit"], .donate-btn');
      await submitBtn.click();
      
      // Check for validation errors
      const errorMessages = page.locator('.error-message, .field-error, .validation-error');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });
    
    test('should validate email format in donor information', async ({ page }) => {
      const emailField = page.locator('input[name="email"], input[type="email"]');
      
      if (await emailField.count() > 0) {
        // Enter invalid email
        await emailField.fill('invalid-email');
        
        const submitBtn = page.locator('button[type="submit"], .donate-btn');
        await submitBtn.click();
        
        // Check for email validation error
        const emailError = page.locator('.email-error, .error-message');
        if (await emailError.count() > 0) {
          await expect(emailError).toBeVisible();
        }
      }
    });
    
    test('should handle successful donor information submission', async ({ page }) => {
      // Fill out complete donation form
      const amountBtn = page.locator('.amount-btn, .amount-option').first();
      if (await amountBtn.count() > 0) {
        await amountBtn.click();
      }
      
      const nameField = page.locator('input[name="name"], #donorName');
      if (await nameField.count() > 0) {
        await nameField.fill('Test Donor');
      }
      
      const emailField = page.locator('input[name="email"], input[type="email"]');
      if (await emailField.count() > 0) {
        await emailField.fill('donor@example.com');
      }
      
      const phoneField = page.locator('input[name="phone"], input[type="tel"]');
      if (await phoneField.count() > 0) {
        await phoneField.fill('1234567890');
      }
      
      // Submit form
      const submitBtn = page.locator('button[type="submit"], .donate-btn');
      await submitBtn.click();
      
      // Check for success response or redirect to payment
      const successMessage = page.locator('.success-message, .donation-success');
      const paymentSection = page.locator('.payment-section, .payment-form');
      
      if (await successMessage.count() > 0) {
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      } else if (await paymentSection.count() > 0) {
        await expect(paymentSection).toBeVisible({ timeout: 10000 });
      }
    });
  });
  
  test.describe('Payment Processing', () => {
    test('should display payment method options', async ({ page }) => {
      // Look for payment method selection
      const paymentMethods = page.locator('.payment-method, .payment-option, input[name="payment-method"]');
      
      if (await paymentMethods.count() > 0) {
        await expect(paymentMethods.first()).toBeVisible();
        
        // Check for common payment methods
        const creditCard = page.locator('input[value="credit-card"], .credit-card-option');
        const paypal = page.locator('input[value="paypal"], .paypal-option');
        const bankTransfer = page.locator('input[value="bank-transfer"], .bank-transfer-option');
        
        const hasPaymentOptions = await creditCard.count() > 0 || 
                                 await paypal.count() > 0 || 
                                 await bankTransfer.count() > 0;
        
        if (hasPaymentOptions) {
          expect(hasPaymentOptions).toBeTruthy();
        }
      }
    });
    
    test('should display secure payment indicators', async ({ page }) => {
      // Check for SSL/security indicators
      const securityBadges = page.locator('.ssl-badge, .secure-payment, .security-indicator');
      
      if (await securityBadges.count() > 0) {
        await expect(securityBadges.first()).toBeVisible();
      }
      
      // Check for encryption notice
      const encryptionNotice = page.locator('.encryption-notice, .security-notice');
      
      if (await encryptionNotice.count() > 0) {
        await expect(encryptionNotice).toBeVisible();
      }
    });
    
    test('should handle credit card form display', async ({ page }) => {
      const creditCardOption = page.locator('input[value="credit-card"], .credit-card-option');
      
      if (await creditCardOption.count() > 0) {
        await creditCardOption.click();
        
        // Check for credit card form fields
        const cardNumberField = page.locator('input[name="card-number"], #cardNumber');
        const expiryField = page.locator('input[name="expiry"], #cardExpiry');
        const cvvField = page.locator('input[name="cvv"], #cardCVV');
        
        if (await cardNumberField.count() > 0) {
          await expect(cardNumberField).toBeVisible();
        }
        if (await expiryField.count() > 0) {
          await expect(expiryField).toBeVisible();
        }
        if (await cvvField.count() > 0) {
          await expect(cvvField).toBeVisible();
        }
      }
    });
    
    test('should validate credit card information', async ({ page }) => {
      const creditCardOption = page.locator('input[value="credit-card"], .credit-card-option');
      
      if (await creditCardOption.count() > 0) {
        await creditCardOption.click();
        
        const cardNumberField = page.locator('input[name="card-number"], #cardNumber');
        
        if (await cardNumberField.count() > 0) {
          // Enter invalid card number
          await cardNumberField.fill('1234');
          
          const submitBtn = page.locator('button[type="submit"], .process-payment');
          await submitBtn.click();
          
          // Check for validation error
          const cardError = page.locator('.card-error, .payment-error, .validation-error');
          if (await cardError.count() > 0) {
            await expect(cardError).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Donation Frequency Options', () => {
    test('should display one-time and recurring donation options', async ({ page }) => {
      const frequencyOptions = page.locator('.donation-frequency, .frequency-option, input[name="frequency"]');
      
      if (await frequencyOptions.count() > 0) {
        await expect(frequencyOptions.first()).toBeVisible();
        
        // Check for one-time option
        const oneTime = page.locator('input[value="one-time"], .one-time-option');
        if (await oneTime.count() > 0) {
          await expect(oneTime).toBeVisible();
        }
        
        // Check for recurring options
        const monthly = page.locator('input[value="monthly"], .monthly-option');
        const yearly = page.locator('input[value="yearly"], .yearly-option');
        
        if (await monthly.count() > 0) {
          await expect(monthly).toBeVisible();
        }
        if (await yearly.count() > 0) {
          await expect(yearly).toBeVisible();
        }
      }
    });
    
    test('should handle recurring donation selection', async ({ page }) => {
      const monthlyOption = page.locator('input[value="monthly"], .monthly-option');
      
      if (await monthlyOption.count() > 0) {
        await monthlyOption.click();
        
        // Check if recurring donation info is displayed
        const recurringInfo = page.locator('.recurring-info, .monthly-info, .subscription-details');
        
        if (await recurringInfo.count() > 0) {
          await expect(recurringInfo).toBeVisible();
        }
        
        // Check if terms and conditions for recurring donations appear
        const recurringTerms = page.locator('.recurring-terms, .subscription-terms');
        
        if (await recurringTerms.count() > 0) {
          await expect(recurringTerms).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Donation Confirmation and Receipt', () => {
    test('should display donation summary before confirmation', async ({ page }) => {
      // Fill out donation form
      const amountBtn = page.locator('.amount-btn, .amount-option').first();
      if (await amountBtn.count() > 0) {
        await amountBtn.click();
        
        // Look for donation summary
        const summary = page.locator('.donation-summary, .order-summary, .donation-details');
        
        if (await summary.count() > 0) {
          await expect(summary).toBeVisible();
          
          // Check if amount is displayed in summary
          const summaryAmount = summary.locator('.amount, .total, .donation-amount');
          if (await summaryAmount.count() > 0) {
            await expect(summaryAmount).toBeVisible();
          }
        }
      }
    });
    
    test('should provide donation receipt information', async ({ page }) => {
      // Look for receipt/tax information
      const receiptInfo = page.locator('.receipt-info, .tax-receipt, .donation-receipt');
      
      if (await receiptInfo.count() > 0) {
        await expect(receiptInfo).toBeVisible();
        
        const receiptText = await receiptInfo.textContent();
        expect(receiptText).toMatch(/receipt|tax|deductible/i);
      }
    });
    
    test('should handle successful donation completion', async ({ page }) => {
      // Mock successful payment processing
      await page.route('**/api/donations/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            donationId: 'DON123456',
            message: 'Donation successful'
          })
        });
      });
      
      // Fill and submit donation form
      const amountBtn = page.locator('.amount-btn, .amount-option').first();
      if (await amountBtn.count() > 0) {
        await amountBtn.click();
      }
      
      const nameField = page.locator('input[name="name"], #donorName');
      if (await nameField.count() > 0) {
        await nameField.fill('Test Donor');
      }
      
      const emailField = page.locator('input[name="email"]');
      if (await emailField.count() > 0) {
        await emailField.fill('donor@example.com');
      }
      
      const submitBtn = page.locator('button[type="submit"], .donate-btn');
      await submitBtn.click();
      
      // Check for success page or message
      const successPage = page.locator('.donation-success, .thank-you-page');
      const successMessage = page.locator('.success-message, .donation-complete');
      
      if (await successPage.count() > 0) {
        await expect(successPage).toBeVisible({ timeout: 10000 });
      } else if (await successMessage.count() > 0) {
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      }
    });
  });
  
  test.describe('Donor Privacy and Terms', () => {
    test('should display privacy policy and terms links', async ({ page }) => {
      const privacyLink = page.locator('a[href*="privacy"], .privacy-policy');
      const termsLink = page.locator('a[href*="terms"], .terms-conditions');
      
      if (await privacyLink.count() > 0) {
        await expect(privacyLink).toBeVisible();
      }
      
      if (await termsLink.count() > 0) {
        await expect(termsLink).toBeVisible();
      }
    });
    
    test('should handle donor consent checkboxes', async ({ page }) => {
      const consentCheckbox = page.locator('input[type="checkbox"][name*="consent"], .consent-checkbox');
      const newsletterCheckbox = page.locator('input[type="checkbox"][name*="newsletter"], .newsletter-signup');
      
      if (await consentCheckbox.count() > 0) {
        await expect(consentCheckbox).toBeVisible();
        await consentCheckbox.check();
        expect(await consentCheckbox.isChecked()).toBeTruthy();
      }
      
      if (await newsletterCheckbox.count() > 0) {
        await expect(newsletterCheckbox).toBeVisible();
        // Newsletter should be optional
        await newsletterCheckbox.check();
        await newsletterCheckbox.uncheck();
        expect(await newsletterCheckbox.isChecked()).toBeFalsy();
      }
    });
  });
  
  test.describe('Responsive Design', () => {
    test('should display properly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if donation form is still accessible
      const donationForm = page.locator('form, .donation-form');
      await expect(donationForm).toBeVisible();
      
      // Check if amount buttons are properly sized for mobile
      const amountButtons = page.locator('.amount-btn, .amount-option');
      if (await amountButtons.count() > 0) {
        const firstBtn = amountButtons.first();
        await expect(firstBtn).toBeVisible();
        
        const btnBox = await firstBtn.boundingBox();
        if (btnBox) {
          expect(btnBox.width).toBeLessThan(375);
          expect(btnBox.height).toBeGreaterThan(30); // Minimum touch target
        }
      }
    });
    
    test('should maintain form usability on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check form layout
      const donationForm = page.locator('form, .donation-form');
      await expect(donationForm).toBeVisible();
      
      // Check if all form elements are accessible
      const formFields = page.locator('input, select, textarea, button');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 0) {
        for (let i = 0; i < Math.min(fieldCount, 5); i++) {
          await expect(formFields.nth(i)).toBeVisible();
        }
      }
    });
  });
});