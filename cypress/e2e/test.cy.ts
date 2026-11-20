// La ruta raiz no tiene pantalla propia: sin sesion lleva al login.
describe('Ruta raíz', () => {
  it('sin sesión redirige a /login', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
    cy.contains('ion-button', 'Ingresar').should('be.visible');
  });
});
