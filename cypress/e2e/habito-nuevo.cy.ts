// Habito nuevo (RF-02) contra el backend real.
const API = 'http://localhost:3000/api';
const NOMBRE_NUEVO = 'Meditar E2E';

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

// Deja a ana como estaba: sin el habito de prueba.
const limpiar = () => {
  loginApi();
  cy.then(() => cy.request({ url: `${API}/habitos`, headers: auth })).then(({ body }) => {
    (body as { id_habito: number; nombre: string }[])
      .filter((h) => h.nombre === NOMBRE_NUEVO)
      .forEach((h) => cy.request({ method: 'DELETE', url: `${API}/habitos/${h.id_habito}`, headers: auth }));
  });
};

describe('Hábito nuevo (RF-02)', () => {
  before(limpiar);
  after(limpiar);
  beforeEach(() => cy.viewport(1280, 800));

  it('valida, muestra el error del backend bajo el campo y crea el hábito', () => {
    loginUI();
    cy.contains('ion-button', 'Agregar hábito').click();
    cy.location('pathname').should('eq', '/habitos/nuevo');
    cy.wait(800);

    // Sin nombre: no se envia nada.
    cy.contains('#contenido-nuevo-habito ion-button', 'Crear hábito').click();
    cy.contains('#contenido-nuevo-habito', 'El nombre es obligatorio.').should('be.visible');

    // 400 del backend con detalle de campo: se muestra bajo "Meta".
    cy.intercept({ method: 'POST', url: `${API}/habitos`, times: 1 }, {
      statusCode: 400,
      body: { error: 'Los datos enviados no son validos', detalles: [{ campo: 'meta', mensaje: 'La meta es demasiado larga' }] },
    }).as('falla');
    cy.get('#contenido-nuevo-habito ion-input input').eq(0).type(NOMBRE_NUEVO);
    cy.contains('#contenido-nuevo-habito ion-button', 'Crear hábito').click();
    cy.wait('@falla');
    cy.contains('#contenido-nuevo-habito', 'La meta es demasiado larga').should('be.visible');

    // Ahora contra el backend real.
    cy.intercept('POST', `${API}/habitos`).as('crear');
    cy.contains('#contenido-nuevo-habito ion-segment-button', 'Semanal').click();
    cy.get('#contenido-nuevo-habito ion-input input').eq(1).type('5 minutos');
    cy.get('#contenido-nuevo-habito ion-input input').eq(2).type('07:30');
    cy.contains('#contenido-nuevo-habito ion-button', 'Crear hábito').click();
    cy.wait('@crear').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body).to.deep.equal({
        nombre: NOMBRE_NUEVO, frecuencia: 'semanal', meta: '5 minutos', horario_objetivo: '07:30',
      });
      expect(response?.body.id_plantilla).to.eq(null);
    });

    // Vuelve a Inicio y el habito aparece sin recargar la pagina.
    cy.location('pathname').should('eq', '/inicio');
    toast(`"${NOMBRE_NUEVO}" agregado`);
    cy.contains('#main-content h2', NOMBRE_NUEVO).parent()
      .should('contain.text', 'Semanal · 5 minutos · a las 07:30');
  });
});
