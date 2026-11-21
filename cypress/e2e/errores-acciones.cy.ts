// Errores del backend al crear, completar, desactivar o eliminar en Mis
// tareas, Gestion de plantillas e Inicio: la pantalla no pierde datos.
const API = 'http://localhost:3000/api';

const loginUI = (correo: string, clave: string) => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type(correo);
  cy.get('ion-input input').eq(1).type(`${clave}{enter}`);
};

const toastRojo = (texto: string) =>
  cy.get('ion-toast:not(.overlay-hidden)').should('have.class', 'ion-color-danger')
    .invoke('prop', 'message').should('contain', texto);

describe('Errores en acciones de MisTareas', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginUI('ana@geshab.cl', 'Usuario123');
    cy.location('pathname').should('eq', '/inicio');
    cy.contains('ion-item', 'Mis tareas').click();
    cy.get('#contenido-tareas ion-card').should('have.length.greaterThan', 0);
    cy.wait(1000); // fin de la animacion de entrada de la pagina
  });

  it('crear: si el backend falla, el modal sigue abierto con lo escrito', () => {
    cy.intercept('POST', `${API}/tareas`, { statusCode: 400, body: { error: 'La fecha limite no es valida' } }).as('crear');
    cy.contains('ion-button', 'Agregar tarea').click();
    cy.get('ion-modal ion-input input').eq(0).type('Tarea que falla');
    cy.get('ion-modal ion-input input').eq(1).type('2026-12-01');
    cy.contains('ion-modal ion-button', 'Crear tarea').click();
    cy.wait('@crear');
    toastRojo('La fecha limite no es valida');
    cy.get('ion-modal ion-input input').eq(0).should('have.value', 'Tarea que falla');
    cy.contains('ion-modal ion-button', 'Crear tarea').should('not.have.attr', 'disabled');
  });

  it('completar: si el backend falla, la casilla vuelve a su estado real', () => {
    cy.intercept('PUT', `${API}/tareas/*`, { statusCode: 500, body: { error: 'Error al actualizar la tarea' } }).as('put');
    cy.get('#contenido-tareas ion-card').first().as('primera');
    cy.get('@primera').find('ion-checkbox').invoke('prop', 'checked').then((antes) => {
      cy.get('@primera').find('ion-checkbox').click();
      cy.wait('@put');
      toastRojo('Error al actualizar la tarea');
      cy.get('#contenido-tareas ion-card').first().find('ion-checkbox').should('have.prop', 'checked', antes);
    });
  });

  it('eliminar: si el backend falla, la tarea sigue en la lista', () => {
    cy.intercept('DELETE', `${API}/tareas/*`, { statusCode: 500, body: { error: 'Error al eliminar la tarea' } }).as('del');
    cy.get('#contenido-tareas ion-card').its('length').then((n) => {
      cy.get('#contenido-tareas ion-card').first().find('ion-button[aria-label="Eliminar tarea"]').click();
      cy.get('ion-alert').should('not.have.class', 'overlay-hidden').wait(500);
    cy.get('ion-alert button').contains('Eliminar').closest('button').then(($b) => $b[0].click());
      cy.wait('@del');
      toastRojo('Error al eliminar la tarea');
      cy.get('#contenido-tareas ion-card').should('have.length', n);
    });
  });
});

describe('Errores en acciones de Admin', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    loginUI('admin@geshab.cl', 'Admin1234');
    cy.location('pathname').should('eq', '/admin/plantillas');
    cy.contains('ion-button', 'Desactivar');
  });

  it('crear: el modal sigue abierto y muestra el error', () => {
    cy.intercept('POST', `${API}/admin/plantillas`, { statusCode: 500, body: { error: 'Error al crear la plantilla' } }).as('crear');
    cy.contains('ion-button', 'Nueva plantilla').click();
    cy.get('ion-modal ion-input input').first().type('Plantilla que falla');
    cy.get('ion-modal ion-select').first().click();
    cy.get('ion-popover ion-radio, ion-popover ion-item').contains('Salud').click();
    cy.contains('ion-modal ion-button', 'Crear plantilla').click();
    cy.wait('@crear');
    toastRojo('Error al crear la plantilla');
    cy.get('ion-modal ion-input input').first().should('have.value', 'Plantilla que falla');
  });

  it('desactivar: si falla, la plantilla sigue activa', () => {
    cy.intercept('PUT', `${API}/admin/plantillas/*`, { statusCode: 500, body: { error: 'Error al actualizar la plantilla' } }).as('put');
    cy.contains('ion-button', 'Desactivar').first().click();
    cy.get('ion-alert').should('not.have.class', 'overlay-hidden').wait(500);
    cy.get('ion-alert button').contains('Desactivar').click();
    cy.wait('@put');
    toastRojo('Error al actualizar la plantilla');
    cy.contains('ion-chip', 'Activa').should('exist');
  });

  it('eliminar: muestra el 409 del backend', () => {
    cy.intercept('DELETE', `${API}/admin/plantillas/*`, {
      statusCode: 409, body: { error: 'La plantilla esta en uso: solo puede desactivarse' },
    }).as('del');
    cy.get('ion-button[color="danger"]').not('[disabled]').first().click();
    cy.get('ion-alert').should('not.have.class', 'overlay-hidden').wait(500);
    cy.get('ion-alert button').contains('Eliminar').click();
    cy.wait('@del');
    toastRojo('La plantilla esta en uso');
  });
});

describe('Error en check-in de Home', () => {
  it('si el POST falla, la casilla queda desmarcada y la racha igual', () => {
    cy.viewport(1280, 800);
    loginUI('ana@geshab.cl', 'Usuario123');
    cy.intercept('POST', `${API}/habitos/*/cumplimientos`, { statusCode: 500, body: { error: 'Error al registrar cumplimiento' } }).as('checkin');
    cy.contains('h2', 'Leer 20 minutos').parent().parent().as('tarjeta');
    cy.get('@tarjeta').find('ion-checkbox').click();
    cy.wait('@checkin');
    toastRojo('Error al registrar cumplimiento');
    cy.contains('h2', 'Leer 20 minutos').parent().parent().find('ion-checkbox').should('have.prop', 'checked', false);
    cy.contains('h2', 'Leer 20 minutos').parent().parent().contains('🔥 0 días');
  });
});
