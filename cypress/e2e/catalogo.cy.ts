// Catalogo (RF-06) contra el backend real: filtros y adopcion de plantillas.
const API = 'http://localhost:3000/api';

interface Plantilla { id_plantilla: number; nombre: string; categoria: string; dificultad: string; ya_adoptada: boolean }

const loginUI = () => {
  cy.visit('/login');
  cy.get('ion-input input').eq(0).type('ana@geshab.cl');
  cy.get('ion-input input').eq(1).type('Usuario123{enter}');
  cy.location('pathname').should('eq', '/inicio');
  cy.wait(800);
};

const token = () => cy.window().then((w) => w.localStorage.getItem('token') as string);
const tarjeta = (nombre: string) => cy.contains('#contenido-catalogo ion-card', nombre);

// Borra el habito "Comer una fruta" si quedo adoptado (deja a ana como estaba).
const limpiar = () =>
  cy.request({ method: 'POST', url: `${API}/auth/login`, body: { correo: 'ana@geshab.cl', contrasena: 'Usuario123' } })
    .then(({ body }) => {
      const auth = { Authorization: `Bearer ${body.token}` };
      cy.request({ url: `${API}/habitos`, headers: auth }).then(({ body: habitos }) => {
        (habitos as { id_habito: number; id_plantilla: number | null }[])
          .filter((h) => h.id_plantilla === 2)
          .forEach((h) => cy.request({ method: 'DELETE', url: `${API}/habitos/${h.id_habito}`, headers: auth }));
      });
    });

describe('Catalogo (RF-06)', () => {
  before(limpiar);
  after(limpiar);
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.intercept('GET', `${API}/catalogo*`, (req) => { delete req.headers['if-none-match']; });
  });

  it('lista las plantillas activas y filtra por categoria y dificultad en el servidor', () => {
    cy.intercept('GET', `${API}/catalogo*`).as('catalogo');
    loginUI();
    cy.contains('ion-item', 'Catálogo').click();

    cy.wait('@catalogo').then(({ request, response }) => {
      expect(request.url).to.eq(`${API}/catalogo`);
      const lista = response!.body as Plantilla[];
      cy.get('#contenido-catalogo ion-card').should('have.length', lista.length);
      lista.forEach((p) => {
        tarjeta(p.nombre).should('contain.text', `Dificultad ${p.dificultad}`);
        tarjeta(p.nombre).contains(p.ya_adoptada ? 'Ya está en tus hábitos' : 'Adoptar');
      });
    });
    cy.wait(800);

    cy.intercept({ method: 'GET', pathname: '/api/catalogo', query: { categoria: 'Salud' } }).as('salud');
    cy.contains('ion-chip', 'Salud').click();
    cy.wait('@salud').then(({ request, response }) => {
      expect(request.url).to.eq(`${API}/catalogo?categoria=Salud`);
      const lista = response!.body as Plantilla[];
      expect(lista.every((p) => p.categoria === 'Salud')).to.eq(true);
      cy.get('#contenido-catalogo ion-card').should('have.length', lista.length);
    });

    cy.intercept({ method: 'GET', pathname: '/api/catalogo', query: { categoria: 'Salud', dificultad: 'alta' } }).as('saludAlta');
    cy.contains('ion-chip', 'Alta').click();
    cy.wait('@saludAlta').its('request.url').should('eq', `${API}/catalogo?categoria=Salud&dificultad=alta`);
    cy.contains('No hay hábitos que coincidan con los filtros.');

    cy.intercept({ method: 'GET', pathname: '/api/catalogo', query: { dificultad: 'alta' } }).as('alta');
    cy.contains('ion-chip', 'Todas').click(); // primera fila: categoria
    cy.wait('@alta').its('request.url').should('eq', `${API}/catalogo?dificultad=alta`);
    cy.get('#contenido-catalogo ion-card').should('have.length', 1).and('contain.text', 'Entrenamiento de fuerza');
  });

  it('Adoptar crea el habito, aparece en Inicio y queda marcado tras recargar', () => {
    cy.intercept('POST', `${API}/habitos`).as('adoptar');
    loginUI();
    cy.contains('ion-item', 'Catálogo').click();
    tarjeta('Comer una fruta').contains('ion-button', 'Adoptar').click();

    cy.wait('@adoptar').then(({ request, response }) => {
      expect(request.body).to.deep.eq({ id_plantilla: 2, nombre: 'Comer una fruta', frecuencia: 'diaria' });
      expect(response!.statusCode).to.eq(201);
    });
    tarjeta('Comer una fruta').contains('Ya está en tus hábitos');
    cy.contains('agregado a tus hábitos');
    cy.wait(500);

    cy.reload();
    tarjeta('Comer una fruta').contains('Ya está en tus hábitos');

    cy.contains('ion-item', 'Inicio').click();
    cy.contains('h2', 'Comer una fruta').should('be.visible');
  });

  it('adoptar dos veces la misma plantilla: lo que responde el backend', () => {
    loginUI();
    // 1) Directo a la API, con la plantilla ya adoptada en la prueba anterior.
    token().then((t) => {
      cy.request({
        method: 'POST', url: `${API}/habitos`, failOnStatusCode: false,
        headers: { Authorization: `Bearer ${t}` },
        body: { id_plantilla: 2, nombre: 'Comer una fruta', frecuencia: 'diaria' },
      }).then(({ status, body }) => {
        cy.log(`Segunda adopcion por API: HTTP ${status} ${JSON.stringify(body)}`);
        expect(status).to.eq(409);
        expect(body.error).to.eq('Ya adoptaste esta plantilla');
      });
    });

    // 2) Desde la interfaz: se simula un listado desactualizado (ya_adoptada
    //    en false) para poder pulsar Adoptar; el POST va al backend REAL.
    cy.intercept('GET', `${API}/catalogo*`, (req) => {
      delete req.headers['if-none-match'];
      req.continue((res) => {
        res.body = (res.body as Plantilla[]).map((p) => ({ ...p, ya_adoptada: false }));
      });
    });
    cy.intercept('POST', `${API}/habitos`).as('adoptar');
    cy.contains('ion-item', 'Catálogo').click();
    tarjeta('Comer una fruta').contains('ion-button', 'Adoptar').click();
    cy.wait('@adoptar').then(({ response }) => {
      cy.log(`Segunda adopcion por la UI: HTTP ${response!.statusCode} ${JSON.stringify(response!.body)}`);
    });
    cy.get('ion-toast:not(.overlay-hidden)').should('have.class', 'ion-color-danger');
    // El boton vuelve a estar disponible y la tarjeta no se marca como adoptada.
    tarjeta('Comer una fruta').contains('ion-button', 'Adoptar').should('not.have.attr', 'disabled');
    cy.wait(300);
  });
});
