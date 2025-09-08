// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to visit a page and wait for it to load
Cypress.Commands.add('visitAndWait', (url, options = {}) => {
  const defaultOptions = {
    failOnStatusCode: false,
    timeout: 30000,
    ...options
  };
  cy.visit(url, defaultOptions);
  cy.get('body').should('be.visible');
  cy.wait(2000); // Wait for any dynamic content to load
});

// Custom command to check language toggle functionality
Cypress.Commands.add('checkLanguageToggle', () => {
  // Check if language toggle exists
  cy.get('[data-cy="language-toggle"], .language-toggle, #languageToggle').should('exist');
});

// Custom command to switch language
Cypress.Commands.add('switchLanguage', (language) => {
  cy.get('[data-cy="language-toggle"], .language-toggle, #languageToggle').click();
  cy.get(`[data-lang="${language}"], .lang-${language}`).click();
});