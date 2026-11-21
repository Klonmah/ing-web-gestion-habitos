// Recordatorios (RF-05) contra el backend real.
const API = 'http://localhost:3000/api';
const LEER = 4; // "Leer 20 minutos" de ana
const HORA = '06:15';

let auth: { Authorization: string };

const toast = (texto: string) =>
  cy.get('ion-toast:not(.overlay-hidden)').invoke('prop', 'message').should('contain', texto);

const loginApi = () =>
  cy.request('POST', `${API}/auth/login`, { correo: 'ana@geshab.cl', contrasena: 'Usuario123' })
    .then(({ body }) => { auth = { Authorization: `Bearer ${body.token}` }; });

const loginUI = (correo = 'ana@geshab.cl', clave = 'Usuario123', destino = '/inicio') => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type(correo);
  cy.get('ion-input input').eq(1).type(`${clave}{enter}`);
  cy.location('pathname').should('eq', destino);
  cy.wait(800);
};

const irA = (opcion: string, ruta: string) => {
  cy.contains('ion-menu ion-item', opcion).click();
  cy.location('pathname').should('eq', ruta);
  cy.wait(800);
};

// Deja a ana como estaba: sin recordatorios a las 06:15.
const limpiar = () => {
  loginApi();
  cy.then(() => cy.request({ url: `${API}/recordatorios`, headers: auth })).then(({ body }) => {
    (body as { id_recordatorio: number; hora: string }[])
      .filter((r) => r.hora === HORA)
      .forEach((r) => cy.request({ method: 'DELETE', url: `${API}/recordatorios/${r.id_recordatorio}`, headers: auth }));
  });
};

describe('Recordatorios (RF-05)', () => {
  before(limpiar);
  after(limpiar);
  beforeEach(() => cy.viewport(1280, 800));

  it('lista los del backend agrupados por hábito', () => {
    loginApi();
    loginUI();
    irA('Recordatorios', '/recordatorios');
    cy.then(() => cy.request({ url: `${API}/recordatorios`, headers: auth })).then(({ body }) => {
      const lista = body as { id_recordatorio: number; id_habito: number; hora: string }[];
      expect(lista.length).to.be.greaterThan(0);
      lista.forEach((r) => {
        cy.get(`[data-testid="grupo-${r.id_habito}"] [data-testid="recordatorio-${r.id_recordatorio}"]`)
          .should('contain.text', r.hora);
      });
    });
    cy.get('[data-testid="grupo-1"] h2').should('contain.text', 'Tomar 2 litros de agua');
    cy.get('[data-testid="recordatorio-1"]').should('contain.text', 'Lunes · 09:00');
  });

  it('crea para varios días, avisa el repetido, desactiva y elimina', () => {
    loginUI();
    irA('Recordatorios', '/recordatorios');

    // Validacion local
    cy.contains('#contenido-recordatorios ion-button', 'Agregar').click();
    cy.contains('Elige un hábito.').should('exist');
    cy.contains('Elige al menos un día.').should('exist');
    cy.contains('Indica la hora.').should('exist');

    // Habito, lunes y miercoles, 06:15
    cy.get('[data-testid="select-habito"]').click();
    cy.get('ion-select-popover').contains('Leer 20 minutos').click();
    cy.get('[data-testid="dia-1"]').click();
    cy.get('[data-testid="dia-3"]').click();
    cy.get('#contenido-recordatorios ion-input input[type="time"]').type(HORA);
    cy.intercept('POST', `${API}/recordatorios`).as('crear');
    cy.contains('#contenido-recordatorios ion-button', 'Agregar').click();
    cy.wait('@crear').its('response.statusCode').should('eq', 201);
    cy.wait('@crear').its('response.statusCode').should('eq', 201);
    toast('Recordatorio agregado: Lunes, Miércoles a las 06:15.');
    cy.get(`[data-testid="grupo-${LEER}"]`).should('contain.text', 'Lunes · 06:15').and('contain.text', 'Miércoles · 06:15');

    // Repetir el lunes: el backend responde 409 y se avisa
    cy.wait(2500);
    cy.get('[data-testid="dia-1"]').click();
    cy.intercept('POST', `${API}/recordatorios`).as('repetido');
    cy.contains('#contenido-recordatorios ion-button', 'Agregar').click();
    cy.wait('@repetido').its('response.statusCode').should('eq', 409);
    toast('Ya existía un recordatorio a las 06:15 para: Lunes.');

    // Desactivar el del miercoles
    cy.intercept('PUT', `${API}/recordatorios/*`).as('cambiar');
    cy.contains(`[data-testid="grupo-${LEER}"] ion-item`, 'Miércoles · 06:15').find('ion-toggle').click();
    cy.wait('@cambiar').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ activo: false });
      expect(response?.statusCode).to.eq(200);
    });
    cy.contains(`[data-testid="grupo-${LEER}"] ion-item`, 'Miércoles · 06:15').should('contain.text', 'Desactivado');

    // Eliminar el del lunes, con confirmacion
    cy.intercept('DELETE', `${API}/recordatorios/*`).as('eliminar');
    cy.contains(`[data-testid="grupo-${LEER}"] ion-item`, 'Lunes · 06:15').find('ion-button').click();
    cy.get('ion-alert:not(.overlay-hidden)').contains('button', 'Eliminar').click();
    cy.wait('@eliminar').its('response.statusCode').should('eq', 200);
    cy.get(`[data-testid="grupo-${LEER}"]`).should('not.contain.text', 'Lunes · 06:15');

    // Lo que quedo en el backend
    loginApi();
    cy.then(() => cy.request({ url: `${API}/recordatorios?id_habito=${LEER}`, headers: auth })).then(({ body }) => {
      const nuevos = (body as { dia_semana: number; hora: string; activo: boolean }[]).filter((r) => r.hora === HORA);
      expect(nuevos).to.deep.equal([{ ...nuevos[0], dia_semana: 3, hora: HORA, activo: false }]);
    });
  });
});
