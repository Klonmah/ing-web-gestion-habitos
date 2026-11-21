// Navegacion: barra inferior (IonTabs) en movil, menu lateral en web y
// botones para volver en las pantallas secundarias.
const API = 'http://localhost:3000/api';

const CUENTAS = {
  usuario: { correo: 'ana@geshab.cl', contrasena: 'Usuario123' },
  admin: { correo: 'admin@geshab.cl', contrasena: 'Admin1234' },
};

const visitarCon = (rol: 'usuario' | 'admin', ruta: string) =>
  cy.request('POST', `${API}/auth/login`, CUENTAS[rol]).then(({ body }) => {
    cy.visit(ruta, {
      onBeforeLoad: (w) => {
        w.localStorage.setItem('token', body.token);
        w.localStorage.setItem('usuario', JSON.stringify(body.usuario));
      },
    });
  });

const barra = () => cy.get('ion-tab-bar[data-testid="barra-tabs"]');
const tab = (nombre: string) => cy.get(`ion-tab-button[tab="${nombre}"]`);

describe('Barra inferior en móvil (390 px)', () => {
  beforeEach(() => cy.viewport(390, 844));

  it('muestra las 5 secciones del usuario y navega entre ellas', () => {
    visitarCon('usuario', '/inicio');
    barra().should('be.visible');
    barra().find('ion-tab-button').should('have.length', 5);
    barra().should('contain.text', 'Inicio').and('contain.text', 'Tareas').and('contain.text', 'Catálogo')
      .and('contain.text', 'Progreso').and('contain.text', 'Perfil');
    tab('inicio').should('have.class', 'tab-selected');

    const pasos: [string, string, string][] = [
      ['tareas', '/tareas', 'Mis tareas'],
      ['catalogo', '/catalogo', 'Catálogo de hábitos'],
      ['progreso', '/progreso', 'Mi progreso'],
      ['perfil', '/perfil', 'Ana Torres'],
      ['inicio', '/inicio', 'Hola, Ana'],
    ];
    pasos.forEach(([nombre, ruta, texto]) => {
      tab(nombre).click();
      cy.location('pathname').should('eq', ruta);
      tab(nombre).should('have.class', 'tab-selected');
      cy.get('ion-content:visible').contains(texto).should('be.visible');
    });
  });

  it('al abrir una URL directa, la pestaña correcta queda marcada', () => {
    visitarCon('usuario', '/progreso');
    barra().should('be.visible');
    tab('progreso').should('have.class', 'tab-selected');
    tab('inicio').should('not.have.class', 'tab-selected');
  });

  it('el administrador no ve la barra de usuario', () => {
    visitarCon('admin', '/perfil');
    cy.get('[data-testid="perfil-rol"]').should('have.text', 'Administrador');
    barra().should('not.be.visible');
  });

  it('Hábito nuevo: la flecha de la barra superior vuelve a Inicio', () => {
    visitarCon('usuario', '/inicio');
    cy.contains('ion-button', 'Agregar hábito').click();
    cy.location('pathname').should('eq', '/habitos/nuevo');
    cy.wait(600);
    cy.get('ion-back-button[data-testid="volver-movil"]:visible').click();
    cy.location('pathname').should('eq', '/inicio');
  });

  it('Recordatorios abierto directo: la flecha vuelve a Perfil (pantalla padre)', () => {
    visitarCon('usuario', '/recordatorios');
    cy.contains('h1', 'Recordatorios').should('be.visible');
    cy.get('ion-back-button[data-testid="volver-movil"]:visible').click();
    cy.location('pathname').should('eq', '/perfil');
  });

  it('Configuración desde Perfil: la flecha vuelve a Perfil y el menú sigue disponible', () => {
    visitarCon('usuario', '/perfil');
    cy.contains('ion-button', 'Configuración y cierre de sesión').click();
    cy.location('pathname').should('eq', '/configuraciones');
    cy.wait(600);
    cy.get('ion-menu-button:visible').should('exist');
    cy.get('ion-back-button[data-testid="volver-movil"]:visible').click();
    cy.location('pathname').should('eq', '/perfil');
  });

  it('el botón de volver de web no aparece en móvil', () => {
    visitarCon('usuario', '/configuraciones');
    cy.contains('h1', 'Configuración').should('be.visible');
    cy.get('[data-testid="volver-web"]').should('not.be.visible');
  });
});

describe('En web (1280 px) sigue el menú lateral', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('no muestra la barra inferior y el menú lateral queda fijo', () => {
    visitarCon('usuario', '/inicio');
    cy.contains('h1', 'Hola, Ana').should('be.visible');
    barra().should('not.be.visible');
    cy.get('ion-menu').contains('Mis tareas').should('be.visible');
  });

  it('Configuración abierta directo: "Volver" lleva a Perfil', () => {
    visitarCon('usuario', '/configuraciones');
    cy.get('[data-testid="volver-web"]:visible').click();
    cy.location('pathname').should('eq', '/perfil');
  });

  it('Hábito nuevo desde Inicio: "Volver a Inicio" regresa', () => {
    visitarCon('usuario', '/inicio');
    cy.contains('ion-button', 'Agregar hábito').click();
    cy.location('pathname').should('eq', '/habitos/nuevo');
    cy.get('[data-testid="volver-web"]:visible').should('contain.text', 'Volver a Inicio').click();
    cy.location('pathname').should('eq', '/inicio');
  });
});
