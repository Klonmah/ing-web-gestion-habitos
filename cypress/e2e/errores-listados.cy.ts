// Errores del backend al cargar los listados de Mis tareas y Gestion de
// plantillas: mensaje y boton Reintentar.
const API = 'http://localhost:3000/api';

const loginUI = (correo: string, clave: string) => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type(correo);
  cy.get('ion-input input').eq(1).type(`${clave}{enter}`);
};

// El backend "falla" con 500 mientras estado.falla sea true; despues
// las peticiones llegan al backend real.
const fallarHastaAviso = (url: string, mensaje: string, alias: string) => {
  const estado = { falla: true };
  cy.intercept('GET', url, (req) => {
    if (estado.falla) req.reply({ statusCode: 500, body: { error: mensaje } });
    else req.continue();
  }).as(alias);
  return estado;
};

describe('Listados con manejo de error', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('MisTareas: muestra el error del backend y Reintentar recupera la lista real', () => {
    loginUI('ana@geshab.cl', 'Usuario123');
    cy.location('pathname').should('eq', '/inicio');
    const estado = fallarHastaAviso(`${API}/tareas`, 'Error al obtener las tareas', 'tareas');

    cy.contains('ion-item', 'Mis tareas').click();
    cy.wait('@tareas').its('response.statusCode').should('eq', 500);
    cy.contains('Error al obtener las tareas').should('be.visible');
    cy.contains('Aún no tienes tareas').should('not.exist');
    cy.get('#contenido-tareas ion-card').should('not.exist');

    cy.then(() => { estado.falla = false; });
    cy.intercept('GET', `${API}/tareas`).as('tareasReal');
    cy.contains('ion-button', 'Reintentar').click();
    cy.wait('@tareasReal').then(({ response }) => {
      expect(response!.statusCode).to.eq(200);
      const tareas = response!.body as { titulo: string }[];
      expect(tareas.length).to.be.greaterThan(0);
      cy.contains('h2', tareas[0].titulo).should('be.visible');
    });
    cy.contains('Error al obtener las tareas').should('not.exist');
  });

  it('MisTareas: backend caido muestra "No se pudo conectar"', () => {
    loginUI('ana@geshab.cl', 'Usuario123');
    cy.location('pathname').should('eq', '/inicio');
    cy.intercept('GET', `${API}/tareas`, { forceNetworkError: true });
    cy.contains('ion-item', 'Mis tareas').click();
    cy.contains('No se pudo conectar con el servidor').should('be.visible');
  });

  it('Admin: muestra el error del backend y Reintentar recupera las plantillas reales', () => {
    loginUI('admin@geshab.cl', 'Admin1234');
    cy.location('pathname').should('eq', '/admin/plantillas');
    cy.contains('h1', 'Gestión de plantillas');

    const estado = fallarHastaAviso(`${API}/admin/plantillas`, 'Error al obtener las plantillas', 'plantillas');
    cy.reload();

    cy.wait('@plantillas').its('response.statusCode').should('eq', 500);
    cy.contains('Error al obtener las plantillas').should('be.visible');
    cy.contains('No hay plantillas que coincidan').should('not.exist');
    cy.contains('ion-button', 'Desactivar').should('not.exist'); // ninguna fila

    cy.then(() => { estado.falla = false; });
    cy.intercept('GET', `${API}/admin/plantillas`).as('plantillasReal');
    cy.contains('ion-button', 'Reintentar').click();
    cy.wait('@plantillasReal').then(({ response }) => {
      expect(response!.statusCode).to.eq(200);
      const plantillas = response!.body as { nombre: string }[];
      expect(plantillas.length).to.be.greaterThan(0);
      cy.contains('strong', plantillas[0].nombre).should('exist');
    });
    cy.contains('Error al obtener las plantillas').should('not.exist');
  });
});
