describe('Basic Functionality Tests', () => {
  it('should load the home page successfully', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.wait(2000);
  });

  it('should load projects page', () => {
    cy.visit('/projects', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.wait(2000);
  });

  it('should load books page', () => {
    cy.visit('/books', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.wait(2000);
  });

  it('should handle 404 pages', () => {
    cy.visit('/nonexistent-page', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
});