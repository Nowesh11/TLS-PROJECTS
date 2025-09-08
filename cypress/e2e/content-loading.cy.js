describe('Content Loading Tests', () => {
  beforeEach(() => {
    // Add delay to avoid rate limiting
    cy.wait(1000);
    
    // Intercept API calls to monitor them
    cy.intercept('GET', '/api/projects*').as('getProjects');
    cy.intercept('GET', '/api/books*').as('getBooks');
    cy.intercept('GET', '/api/ebooks*').as('getEbooks');
    cy.intercept('GET', '/api/websiteContent*').as('getWebsiteContent');
  });

  it('should load projects page content', () => {
    cy.visitAndWait('/projects.html');
    
    // Wait for API call
    cy.wait('@getProjects', { timeout: 10000 });
    
    // Check if projects are displayed
    cy.get('body').should('contain.text', 'Project');
    
    // Verify API response
    cy.get('@getProjects').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('success', true);
      expect(interception.response.body).to.have.property('data');
    });
  });

  it('should load books page content', () => {
    cy.visitAndWait('/books.html');
    
    // Wait for API call
    cy.wait('@getBooks', { timeout: 10000 });
    
    // Check if books are displayed
    cy.get('body').should('contain.text', 'Book');
    
    // Verify API response
    cy.get('@getBooks').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('success', true);
      expect(interception.response.body).to.have.property('data');
    });
  });

  it('should load ebooks page content', () => {
    cy.visitAndWait('/ebooks.html');
    
    // Wait for API call
    cy.wait('@getEbooks', { timeout: 10000 });
    
    // Check if ebooks are displayed
    cy.get('body').should('contain.text', 'E-book');
    
    // Verify API response
    cy.get('@getEbooks').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('success', true);
      expect(interception.response.body).to.have.property('data');
    });
  });

  it('should handle API errors gracefully', () => {
    // Mock a failed API response
    cy.intercept('GET', '/api/projects*', { statusCode: 500, body: { error: 'Server Error' } }).as('getProjectsError');
    
    cy.visitAndWait('/projects.html');
    
    // Wait for the failed API call
    cy.wait('@getProjectsError');
    
    // Check that the page still loads (should handle errors gracefully)
    cy.get('body').should('be.visible');
  });

  it('should load content with language parameter', () => {
    cy.visitAndWait('/projects.html');
    
    // Wait for API call and check if it includes language parameter
    cy.wait('@getProjects').then((interception) => {
      const url = interception.request.url;
      // Should include lang parameter (en or ta)
      expect(url).to.match(/[?&]lang=(en|ta)/);
    });
  });

  it('should handle pagination if implemented', () => {
    cy.visitAndWait('/projects.html');
    
    // Wait for initial load
    cy.wait('@getProjects');
    
    // Check if pagination controls exist
    cy.get('body').then($body => {
      if ($body.find('.pagination, .page-nav, [data-cy="pagination"]').length > 0) {
        cy.get('.pagination, .page-nav, [data-cy="pagination"]').should('be.visible');
        
        // Try to click next page if it exists
        cy.get('.next, .page-next, [data-cy="next-page"]').then($next => {
          if ($next.length > 0 && !$next.hasClass('disabled')) {
            cy.wrap($next).click();
            cy.wait('@getProjects');
          }
        });
      }
    });
  });
});