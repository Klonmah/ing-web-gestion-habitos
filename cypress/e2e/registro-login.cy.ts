// Registro y login contra el backend real. Las cuentas que se crean son
// prueba.e2e.<fecha>@geshab.cl, una distinta en cada corrida.
const API = 'http://localhost:3000/api';
// Campos en orden: 0 nombre, 1 correo, 2 contrasena, 3 confirmar.
const campo = (i: number) => cy.get('ion-input').eq(i);
const escribir = (i: number, texto: string) => campo(i).find('input').clear().type(texto);

describe('Registro conectado a POST /api/auth/registro', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.intercept('POST', `${API}/auth/registro`).as('registro');
    cy.visit('/registro');
  });

  it('muestra bajo cada campo el error 400 que devuelve el backend', () => {
    escribir(0, 'A');
    escribir(1, 'no-es-correo');
    escribir(2, 'corta');
    escribir(3, 'corta');
    cy.contains('ion-button', 'Registrarme').click();

    cy.wait('@registro').then(({ response }) => {
      expect(response!.statusCode).to.eq(400);
      cy.log(JSON.stringify(response!.body));
    });
    campo(0).contains('El nombre debe tener al menos 2 caracteres').should('be.visible');
    campo(1).contains('El correo no tiene un formato valido').should('be.visible');
    campo(2).contains('La contrasena debe tener al menos 8 caracteres').should('be.visible');

    // Al corregir el campo su error desaparece.
    escribir(0, 'Ana Prueba');
    campo(0).contains('El nombre debe tener').should('not.exist');
  });

  it('marca el correo cuando ya existe (409)', () => {
    escribir(0, 'Ana Repetida');
    escribir(1, 'ana@geshab.cl');
    escribir(2, 'Usuario123');
    escribir(3, 'Usuario123');
    cy.contains('ion-button', 'Registrarme').click();
    cy.wait('@registro').its('response.statusCode').should('eq', 409);
    campo(1).contains('Ya existe una cuenta registrada con ese correo').should('be.visible');
  });

  it('no envia nada si las contrasenas no coinciden', () => {
    escribir(0, 'Ana Prueba');
    escribir(1, 'ana.prueba@geshab.cl');
    escribir(2, 'Usuario123');
    escribir(3, 'Usuario124');
    cy.contains('ion-button', 'Registrarme').click();
    campo(3).contains('Las contraseñas no coinciden.').should('be.visible');
    cy.get('@registro.all').should('have.length', 0);
  });

  it('registra con contrasena con simbolos, entra al inicio y luego vuelve a entrar por login', () => {
    const correo = `prueba.e2e.${Date.now()}@geshab.cl`;
    const clave = 'Clave#2026!';
    escribir(0, 'Camila Prueba');
    escribir(1, correo);
    escribir(2, clave);
    escribir(3, clave);
    cy.contains('ion-button', 'Registrarme').click();

    cy.wait('@registro').its('response.statusCode').should('eq', 201);
    cy.location('pathname').should('eq', '/inicio');
    cy.contains('h1', 'Hola, Camila');
    cy.contains('Aún no tienes hábitos activos.');

    // Cerrar sesion y entrar por el login con la contrasena con simbolos:
    // el regex viejo del front (^[A-Za-z\d]{8,}$) la habria rechazado.
    cy.contains('Cerrar sesión').click();
    cy.location('pathname').should('eq', '/login');
    cy.wait(1000); // fin de la transicion
    cy.intercept('POST', `${API}/auth/login`).as('login');
    cy.get('ion-input input').eq(0).type(correo);
    cy.get('ion-input input').eq(1).type(`${clave}{enter}`); // Enter, sin perder el foco
    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/inicio');
    cy.contains('h1', 'Hola, Camila');
  });

  it('el login muestra el 401 del backend con contrasena incorrecta', () => {
    cy.intercept('POST', `${API}/auth/login`).as('login');
    cy.visit('/login');
    cy.get('ion-input input').eq(0).type('ana@geshab.cl');
    cy.get('ion-input input').eq(1).type('Cualquier#cosa1{enter}');
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.contains('Correo o contrasena incorrectos');
  });

  it('al cerrar sesion el login queda vacio (no muestra la clave anterior)', () => {
    cy.visit('/login');
    cy.get('ion-input input').eq(0).type('ana@geshab.cl');
    cy.get('ion-input input').eq(1).type('Usuario123{enter}');
    cy.location('pathname').should('eq', '/inicio');
    cy.wait(1000);
    cy.contains('Cerrar sesión').click();
    cy.location('pathname').should('eq', '/login');
    cy.wait(1000);
    cy.get('ion-input input').eq(0).should('have.value', '');
    cy.get('ion-input input').eq(1).should('have.value', '');
  });
});
