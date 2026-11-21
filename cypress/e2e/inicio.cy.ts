// Inicio (RF-02, RF-03): habitos del backend, check-in y racha.
const API = 'http://localhost:3000/api';

const loginUI = (correo: string, clave: string) => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type(correo);
  cy.get('ion-input input').eq(1).type(clave);
  cy.contains('ion-button', 'Ingresar').click();
};

describe('Home con datos reales', () => {
  it('muestra los habitos del backend y el check-in actualiza la racha', () => {
    cy.viewport(1280, 800);
    cy.intercept('GET', `${API}/habitos`).as('habitos');
    cy.intercept('GET', `${API}/progreso?periodo=semanal`).as('progreso');
    cy.intercept('POST', `${API}/habitos/*/cumplimientos`).as('checkin');
    cy.intercept('DELETE', `${API}/registros/*`).as('borrarRegistro');

    loginUI('ana@geshab.cl', 'Usuario123');
    cy.location('pathname').should('eq', '/inicio');

    cy.wait('@habitos').then(({ response }) => {
      const activos = (response!.body as { nombre: string; activo: boolean }[]).filter((h) => h.activo);
      expect(activos.length).to.be.greaterThan(0);
      // Cada habito activo del backend aparece en pantalla.
      activos.forEach((h) => cy.contains('h2', h.nombre).should('be.visible'));
    });
    cy.wait('@progreso').its('response.statusCode').should('eq', 200);

    // Ningun dato escrito a mano.
    cy.contains('Warframe').should('not.exist');
    cy.contains('h1', 'Hola, Ana');
    cy.contains('0% · 0 de 3');

    // Check-in de "Leer 20 minutos".
    cy.contains('h2', 'Leer 20 minutos').parent().parent().as('tarjeta');
    cy.get('@tarjeta').contains('🔥 0 días');
    cy.get('@tarjeta').find('ion-checkbox').click();

    cy.wait('@checkin').then(({ request, response }) => {
      expect(response!.statusCode).to.eq(201);
      cy.log(`POST fecha=${request.body.fecha}`);
    });
    // La racha nueva viene del backend (se vuelve a pedir /progreso).
    cy.wait('@progreso');
    cy.get('@tarjeta').contains('🔥 1 día');
    cy.contains('33% · 1 de 3');
    cy.contains('registrado por hoy');

    // Recargar la pagina: el estado persiste porque esta en la base.
    cy.reload();
    cy.contains('h2', 'Leer 20 minutos').parent().parent().contains('🔥 1 día');
    cy.contains('h2', 'Leer 20 minutos').parent().parent().find('ion-checkbox').should('have.prop', 'checked', true);

    // Deshacer el check-in.
    cy.contains('h2', 'Leer 20 minutos').parent().parent().find('ion-checkbox').click();
    cy.wait('@borrarRegistro').its('response.statusCode').should('eq', 200);
    cy.contains('h2', 'Leer 20 minutos').parent().parent().contains('🔥 0 días');
    cy.contains('0% · 0 de 3');
  });

  it('muestra error y boton Reintentar si el backend falla', () => {
    cy.viewport(1280, 800);
    loginUI('ana@geshab.cl', 'Usuario123');
    cy.location('pathname').should('eq', '/inicio');
    cy.intercept('GET', `${API}/habitos`, { statusCode: 500, body: { error: 'Error al obtener los hábitos' } });
    cy.reload();
    cy.contains('Error al obtener los hábitos');
    cy.contains('ion-button', 'Reintentar');
  });
});
