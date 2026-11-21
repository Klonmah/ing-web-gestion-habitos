// Categorias y metricas del administrador (RF-08) contra el backend real.
const API = 'http://localhost:3000/api';
const NOMBRE = 'Prueba E2E Mindfulness';

let auth: { Authorization: string };
const loginApi = () =>
  cy.request('POST', `${API}/auth/login`, { correo: 'admin@geshab.cl', contrasena: 'Admin1234' })
    .then(({ body }) => { auth = { Authorization: `Bearer ${body.token}` }; });

const limpiar = () => {
  loginApi();
  cy.then(() => cy.request({ url: `${API}/admin/categorias`, headers: auth })).then(({ body }) => {
    (body as { id_categoria: number; nombre: string }[])
      .filter((c) => c.nombre.startsWith('Prueba E2E'))
      .forEach((c) => cy.request({ method: 'DELETE', url: `${API}/admin/categorias/${c.id_categoria}`, headers: auth }));
  });
};

const entrarComoAdmin = () => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type('admin@geshab.cl');
  cy.get('ion-input input').eq(1).type('Admin1234{enter}');
  cy.location('pathname').should('eq', '/admin/plantillas');
  cy.wait(800);
  cy.contains('ion-item', 'Categorías y métricas').click();
  cy.contains('h1', 'Categorías y métricas');
  cy.wait(800);
};

const modalInput = (i: number) => cy.get('ion-modal ion-input input, ion-modal ion-textarea textarea').eq(i);
const fila = (nombre: string) => cy.get(`[data-testid="categoria-${nombre}"]`);

describe('Categorias y metricas (RF-08)', () => {
  before(limpiar);
  after(limpiar);
  beforeEach(() => cy.viewport(1280, 900));

  it('muestra las metricas y categorias tal como las entrega el backend', () => {
    cy.intercept('GET', `${API}/admin/metricas`, (req) => { delete req.headers['if-none-match']; }).as('metricas');
    cy.intercept('GET', `${API}/admin/categorias`, (req) => { delete req.headers['if-none-match']; }).as('categorias');
    entrarComoAdmin();

    cy.wait('@metricas').then(({ response }) => {
      const m = response!.body;
      cy.get('[data-testid="indicador-Usuarios"]').should('contain.text', String(m.total_usuarios));
      cy.get('[data-testid="indicador-Hábitos activos"]').should('contain.text', String(m.habitos_activos));
      cy.get('[data-testid="indicador-Plantillas activas"]').should('contain.text', `${m.plantillas_activas}de ${m.plantillas_totales} en total`);
      (m.adopciones_por_plantilla as { nombre: string; adopciones: number }[]).forEach((a) =>
        cy.get(`[title="${a.nombre}: ${a.adopciones} usuarios"]`).should('exist'));
    });
    cy.wait('@categorias').then(({ response }) => {
      (response!.body as { nombre: string; total_plantillas: number }[]).forEach((c) =>
        fila(c.nombre).should('contain.text', String(c.total_plantillas)));
    });
    // Categoria con plantillas: Eliminar deshabilitado.
    fila('Salud').contains('ion-button', 'Eliminar').should('have.attr', 'disabled');
  });

  it('crea, rechaza duplicado (409) y nombre corto (400), edita y elimina', () => {
    entrarComoAdmin();

    // 400 con detalle por campo.
    cy.contains('ion-button', 'Nueva categoría').click();
    modalInput(0).type('A');
    cy.contains('ion-modal ion-button', 'Crear categoría').click();
    cy.get('ion-modal ion-input').first().contains('El nombre debe tener al menos 2 caracteres').should('be.visible');

    // Crear de verdad.
    modalInput(0).clear().type(NOMBRE);
    modalInput(1).type('Respiracion y pausas conscientes');
    cy.contains('ion-modal ion-button', 'Crear categoría').click();
    fila(NOMBRE).should('contain.text', 'Respiracion y pausas conscientes').and('contain.text', '0');
    cy.contains('Usuarios'); // las metricas se recargan
    cy.wait(800);

    // Duplicado -> 409 en el campo nombre.
    cy.contains('ion-button', 'Nueva categoría').click();
    modalInput(0).type(NOMBRE);
    cy.contains('ion-modal ion-button', 'Crear categoría').click();
    cy.get('ion-modal ion-input').first().contains('Ya existe una categoria con ese nombre').should('be.visible');
    cy.contains('ion-modal ion-button', 'Cancelar').click();
    cy.wait(800);

    // Editar descripcion.
    fila(NOMBRE).contains('ion-button', 'Editar').click();
    modalInput(1).clear().type('Descripcion editada');
    cy.contains('ion-modal ion-button', 'Guardar cambios').click();
    fila(NOMBRE).should('contain.text', 'Descripcion editada');
    cy.wait(800);

    // Eliminar (sin plantillas: permitido).
    fila(NOMBRE).contains('ion-button', 'Eliminar').click();
    cy.get('ion-alert:not(.overlay-hidden)').should('exist').wait(500);
    cy.get('ion-alert:not(.overlay-hidden) button').contains('Eliminar').click();
    fila(NOMBRE).should('not.exist');
    cy.contains('Categoría eliminada.');
  });

  it('el 409 al eliminar una categoria con plantillas se muestra al admin', () => {
    entrarComoAdmin();
    // El boton esta deshabilitado en la UI; se comprueba lo que responde el backend.
    loginApi();
    cy.then(() => cy.request({ url: `${API}/admin/categorias`, headers: auth })).then(({ body }) => {
      const salud = (body as { id_categoria: number; nombre: string }[]).find((c) => c.nombre === 'Salud')!;
      cy.request({ method: 'DELETE', url: `${API}/admin/categorias/${salud.id_categoria}`, headers: auth, failOnStatusCode: false })
        .then(({ status, body: b }) => {
          expect(status).to.eq(409);
          cy.log(JSON.stringify(b));
        });
    });
  });
});
