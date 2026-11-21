// Rutas segun el rol: redireccion de la raiz y del login, rutas protegidas,
// pagina 404, acceso denegado y link a Registro sin recargar.
const API = 'http://localhost:3000/api';

const CUENTAS = {
  usuario: { correo: 'ana@geshab.cl', contrasena: 'Usuario123' },
  admin: { correo: 'admin@geshab.cl', contrasena: 'Admin1234' },
};

// Inicia sesion por API y deja la sesion en localStorage antes de cargar.
const visitarCon = (rol: 'usuario' | 'admin' | null, ruta: string) => {
  if (!rol) {
    cy.visit(ruta, { onBeforeLoad: (w) => w.localStorage.clear() });
    return;
  }
  cy.request('POST', `${API}/auth/login`, CUENTAS[rol]).then(({ body }) => {
    cy.visit(ruta, {
      onBeforeLoad: (w) => {
        w.localStorage.setItem('token', body.token);
        w.localStorage.setItem('usuario', JSON.stringify(body.usuario));
      },
    });
  });
};

const loginUI = (rol: 'usuario' | 'admin') => {
  cy.visit('/login', { onBeforeLoad: (w) => w.localStorage.clear() });
  cy.get('ion-input input').eq(0).type(CUENTAS[rol].correo);
  cy.get('ion-input input').eq(1).type(`${CUENTAS[rol].contrasena}{enter}`);
};

describe('La raíz y el login llevan al inicio de cada rol', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('sin sesión, / va al login', () => {
    visitarCon(null, '/');
    cy.location('pathname').should('eq', '/login');
    cy.contains('ion-button', 'Ingresar').should('be.visible');
  });

  it('usuario: / va a /inicio', () => {
    visitarCon('usuario', '/');
    cy.location('pathname').should('eq', '/inicio');
    cy.contains('h1', 'Hola, Ana').should('exist');
  });

  it('admin: / va a /admin/plantillas, no al Inicio de usuario', () => {
    visitarCon('admin', '/');
    cy.location('pathname').should('eq', '/admin/plantillas');
    cy.contains('Hola, Ana').should('not.exist');
  });

  it('después de iniciar sesión cada rol llega a su pantalla', () => {
    loginUI('admin');
    cy.location('pathname').should('eq', '/admin/plantillas');
    // Visible de verdad (no solo la URL): la pantalla no queda en opacidad 0.
    cy.get('ion-content:visible').contains('Gestión de plantillas').should('be.visible');
    cy.get('.ion-page-invisible').should('not.exist');
    loginUI('usuario');
    cy.location('pathname').should('eq', '/inicio');
    cy.contains('h1', 'Hola, Ana').should('be.visible');
    cy.get('.ion-page-invisible').should('not.exist');
  });

  it('login, cierre de sesión y nuevo login sin recargar', () => {
    loginUI('usuario');
    cy.contains('h1', 'Hola, Ana').should('be.visible');
    cy.get('ion-menu').contains('Cerrar sesión').click();
    cy.location('pathname').should('eq', '/login');
    cy.contains('ion-button', 'Ingresar').should('be.visible');
    cy.get('ion-input input').eq(0).type(CUENTAS.admin.correo);
    cy.get('ion-input input').eq(1).type(`${CUENTAS.admin.contrasena}{enter}`);
    cy.location('pathname').should('eq', '/admin/plantillas');
    cy.get('ion-content:visible').contains('Gestión de plantillas').should('be.visible');
    cy.get('.ion-page-invisible').should('not.exist');
  });

  it('con sesión iniciada, /login y /registro llevan al inicio del rol', () => {
    visitarCon('usuario', '/login');
    cy.location('pathname').should('eq', '/inicio');
    visitarCon('admin', '/registro');
    cy.location('pathname').should('eq', '/admin/plantillas');
  });
});

describe('Rutas protegidas por rol', () => {
  beforeEach(() => cy.viewport(1280, 800));

  ['/inicio', '/tareas', '/catalogo', '/progreso', '/recordatorios', '/habitos/nuevo'].forEach((ruta) => {
    it(`admin en ${ruta} vuelve a su panel`, () => {
      cy.intercept('GET', `${API}/habitos`).as('habitos');
      cy.intercept('GET', `${API}/tareas`).as('tareas');
      visitarCon('admin', ruta);
      cy.location('pathname').should('eq', '/admin/plantillas');
      // La pantalla de usuario no llego a pedir datos.
      cy.get('@habitos.all').should('have.length', 0);
      cy.get('@tareas.all').should('have.length', 0);
    });
  });

  ['/perfil', '/configuraciones'].forEach((ruta) => {
    it(`${ruta} sigue disponible para los dos roles`, () => {
      visitarCon('admin', ruta);
      cy.location('pathname').should('eq', ruta);
      visitarCon('usuario', ruta);
      cy.location('pathname').should('eq', ruta);
    });
  });

  it('sin sesión, una ruta protegida va al login', () => {
    visitarCon(null, '/tareas');
    cy.location('pathname').should('eq', '/login');
  });
});

describe('Página 404 y acceso denegado', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('usuario en ruta de admin ve Acceso denegado y vuelve a su inicio', () => {
    visitarCon('usuario', '/admin/categorias-metricas');
    cy.location('pathname').should('eq', '/acceso-denegado');
    cy.get('[data-testid="pagina-acceso-denegado"]').should('contain.text', 'No tienes permiso para ver esta página');
    cy.contains('ion-button', 'Volver al inicio').click();
    cy.location('pathname').should('eq', '/inicio');
  });

  it('ruta inexistente con usuario: 404 y botón al inicio', () => {
    visitarCon('usuario', '/esto/no/existe');
    cy.location('pathname').should('eq', '/esto/no/existe');
    cy.get('[data-testid="pagina-404"]').should('contain.text', 'Página no encontrada');
    cy.contains('ion-button', 'Volver al inicio').click();
    cy.location('pathname').should('eq', '/inicio');
  });

  it('ruta inexistente con admin: el botón lleva a su panel', () => {
    visitarCon('admin', '/tareas/nueva');
    cy.get('[data-testid="pagina-404"]').should('exist');
    cy.contains('ion-button', 'Volver al panel de administración').click();
    cy.location('pathname').should('eq', '/admin/plantillas');
  });

  it('ruta inexistente sin sesión: el botón lleva al login', () => {
    visitarCon(null, '/no-existe');
    cy.get('[data-testid="pagina-404"]').should('exist');
    cy.contains('ion-button', 'Ir a iniciar sesión').click();
    cy.location('pathname').should('eq', '/login');
  });
});

describe('El link a Registro no recarga la página', () => {
  it('navega con el router y conserva el estado de la ventana', () => {
    cy.viewport(1280, 800);
    visitarCon(null, '/login');
    // Marca en window: si la pagina se recargara, desapareceria.
    cy.window().then((w) => { (w as unknown as { sinRecarga: boolean }).sinRecarga = true; });
    cy.contains('a', 'Regístrate aquí').click();
    cy.location('pathname').should('eq', '/registro');
    cy.contains('h1', 'Crear cuenta').should('be.visible');
    cy.window().its('sinRecarga').should('eq', true);
  });
});
