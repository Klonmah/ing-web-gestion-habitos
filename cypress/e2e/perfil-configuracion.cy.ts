// Perfil y Configuracion contra el backend real, con los dos roles.
const API = 'http://localhost:3000/api';

let auth: { Authorization: string };

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

describe('Perfil y Configuración', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('Perfil muestra los datos y la actividad que entrega el backend', () => {
    loginApi();
    loginUI();
    irA('Perfil', '/perfil');
    cy.get('[data-testid="perfil-nombre"]').should('have.text', 'Ana Torres');
    cy.get('[data-testid="perfil-correo"]').should('have.text', 'ana@geshab.cl');
    cy.get('[data-testid="perfil-rol"]').should('have.text', 'Usuario');
    cy.then(() => cy.request({ url: `${API}/habitos`, headers: auth })).then(({ body }) => {
      cy.get('[data-testid="perfil-habitos"]').should('have.text', String((body as { activo: boolean }[]).filter((h) => h.activo).length));
    });
    cy.then(() => cy.request({ url: `${API}/tareas`, headers: auth })).then(({ body }) => {
      const tareas = body as { completada: boolean }[];
      cy.get('[data-testid="perfil-pendientes"]').should('have.text', String(tareas.filter((t) => !t.completada).length));
      cy.get('[data-testid="perfil-completadas"]').should('have.text', String(tareas.filter((t) => t.completada).length));
    });
    cy.then(() => cy.request({ url: `${API}/progreso?periodo=semanal`, headers: auth })).then(({ body }) => {
      cy.get('[data-testid="perfil-semanal"]').should('have.text', `${body.porcentaje_general}%`);
    });
  });

  it('Perfil del administrador: datos de la cuenta sin actividad de usuario', () => {
    cy.intercept('GET', `${API}/habitos`).as('habitos');
    loginUI('admin@geshab.cl', 'Admin1234', '/admin/plantillas');
    irA('Perfil', '/perfil');
    cy.get('[data-testid="perfil-correo"]').should('have.text', 'admin@geshab.cl');
    cy.get('[data-testid="perfil-rol"]').should('have.text', 'Administrador');
    cy.contains('Tu actividad').should('not.exist');
    cy.get('@habitos.all').should('have.length', 0);
  });

  it('Configuración muestra la sesión y cierra sesión con confirmación', () => {
    loginUI();
    irA('Configuración', '/configuraciones');
    cy.get('[data-testid="config-correo"]').should('have.text', 'ana@geshab.cl');
    cy.get('[data-testid="config-vence"]').should('contain.text', 'La sesión vence el');

    // Cancelar no cierra la sesion
    cy.get('[data-testid="boton-cerrar-sesion"]').click();
    cy.get('ion-alert:not(.overlay-hidden)').contains('button', 'Cancelar').click();
    cy.location('pathname').should('eq', '/configuraciones');
    cy.window().its('localStorage.token').should('be.a', 'string');

    cy.wait(500);
    cy.get('[data-testid="boton-cerrar-sesion"]').click();
    cy.get('ion-alert:not(.overlay-hidden)').contains('button', 'Cerrar sesión').click();
    cy.location('pathname').should('eq', '/login');
    cy.window().then((w) => {
      expect(w.localStorage.getItem('token')).to.eq(null);
      expect(w.localStorage.getItem('usuario')).to.eq(null);
    });

    // Sin sesion, las rutas protegidas vuelven al login
    cy.visit('/inicio');
    cy.location('pathname').should('eq', '/login');
  });
});
