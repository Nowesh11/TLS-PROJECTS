describe('Navigation Tests', () => {
  beforeEach(() => {
    // Add delay to avoid rate limiting
    cy.wait(1000);
    
    // Visit the home page before each test
    cy.visitAndWait('/');
  });

  it('should load the home page successfully', () => {
    cy.url().should('include', '/');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('should navigate to all main pages', () => {
    const pages = [
      { path: '/about.html', title: 'About' },
      { path: '/projects.html', title: 'Projects' },
      { path: '/books.html', title: 'Books' },
      { path: '/ebooks.html', title: 'E-Books' },
      { path: '/contact.html', title: 'Contact' }
    ];

    pages.forEach(page => {
      cy.visitAndWait(page.path);
      cy.url().should('include', page.path);
      cy.get('body').should('be.visible');
    });
  });

  it('should have working navigation menu', () => {
    // Check if navigation menu exists
    cy.get('nav, .navbar, .navigation, header').should('exist');
    
    // Check for common navigation links
    cy.get('a[href*="about"], a[href*="projects"], a[href*="books"]').should('have.length.at.least', 1);
  });

  it('should handle 404 pages gracefully', () => {
    cy.visit('/nonexistent-page.html', { failOnStatusCode: false });
    // Should either redirect to 404 page or show error message
    cy.get('body').should('contain.text', '404').or('contain.text', 'Not Found').or('contain.text', 'Page not found');
  });
});