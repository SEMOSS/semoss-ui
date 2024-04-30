/* eslint-disable no-undef */
describe('Login process', () => {
    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test
        cy.visit(
            'http://localhost:9090/semoss-ui/packages/client/dist/#/login',
        );

        cy.contains('Username');

        cy.get('#mui-1').type(`${Cypress.env('user')}`);

        cy.get('#mui-2').type(`${Cypress.env('pass')}`);

        cy.get('.MuiButton-contained').parent().click();
        cy.get('[data-testid="CloseIcon"]').click();
        cy.get('[data-testid="Settings-icon"]').click();
        cy.contains('Settings').should('exist');
    });
    it('contains non-admin tiles', () => {
        cy.contains('App Settings').should('exist');
        cy.contains('Function Settings').should('exist');
        cy.contains('Model Settings').should('exist');
        cy.contains('Database Settings').should('exist');
        cy.contains('Vector Settings').should('exist');
        cy.contains('Storage Settings').should('exist');
        cy.contains('Jobs').should('exist');
        cy.contains('My Profile').should('exist');
    });
});
