describe('Login process', () => {
    it('can login with proper credentials', () => {
        cy.visit(
            'http://localhost:9090/semoss-ui/packages/client/dist/#/login',
        );

        cy.contains('Username');

        cy.get('#mui-1').type('admin');

        cy.get('#mui-2').type('Password4!');

        cy.get('.MuiButton-contained').parent().click();

        cy.contains('Welcome to SEMOSS');
    });

    it('fails login with invalid credentials', () => {
        cy.visit(
            'http://localhost:9090/semoss-ui/packages/client/dist/#/login',
        );

        cy.contains('Username');

        cy.contains('Password');

        cy.get('#mui-1').type('admin');

        cy.get('#mui-2').type('Password3!');

        cy.get('.MuiButton-contained').parent().click();

        cy.contains('The user name or password are invalid.');
    });
});
