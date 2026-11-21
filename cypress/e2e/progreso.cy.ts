// Progreso (RF-04) contra el backend real.
// Se siembran 3 check-ins de "Leer 20 minutos" (hoy, ayer, anteayer) y se
// comparan los porcentajes con valores calculados a mano.
const API = 'http://localhost:3000/api';
const LEER = 4; // "Leer 20 minutos": habito de ana sin plantilla (Personalizados)

const fechaLocal = (desfaseDias: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - desfaseDias);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const SEMBRADAS = [0, 1, 2].map(fechaLocal);

let auth: { Authorization: string };
const registrosSembrados: number[] = [];

const loginApi = () =>
  cy.request('POST', `${API}/auth/login`, { correo: 'ana@geshab.cl', contrasena: 'Usuario123' })
    .then(({ body }) => { auth = { Authorization: `Bearer ${body.token}` }; });

describe('Progreso (RF-04)', () => {
  before(() => {
    loginApi();
    // Precondicion: sin cumplimientos en los ultimos 30 dias.
    cy.then(() => cy.request({ url: `${API}/progreso?periodo=mensual`, headers: auth })).then(({ body }) => {
      const conDatos = (body.progreso as { cumplimientos_periodo: string[] }[]).filter((p) => p.cumplimientos_periodo.length);
      expect(conDatos, 'ana sin cumplimientos en 30 dias').to.have.length(0);
    });
    cy.then(() => SEMBRADAS.forEach((fecha) =>
      cy.request({ method: 'POST', url: `${API}/registros`, headers: auth, body: { id_habito: LEER, fecha } })
        .then(({ status, body }) => { expect(status).to.eq(201); registrosSembrados.push(body.id_registro); })
    ));
  });

  after(() => {
    loginApi();
    cy.then(() => registrosSembrados.forEach((id) =>
      cy.request({ method: 'DELETE', url: `${API}/registros/${id}`, headers: auth })
    ));
  });

  it('muestra porcentajes semanal y mensual por habito y por categoria', () => {
    cy.viewport(1280, 900);
    cy.visit('/login');
    cy.get('ion-input input').eq(0).type('ana@geshab.cl');
    cy.get('ion-input input').eq(1).type('Usuario123{enter}');
    cy.location('pathname').should('eq', '/inicio');
    cy.wait(800);
    cy.contains('ion-item', 'Progreso').click();

    // Semanal: Leer 3/7 = 43%; Agua y Caminar 0/7. General 3/21 = 14%.
    cy.get('[data-testid="porcentaje-general"]').should('have.text', '14%');
    cy.get(`[data-testid="habito-${LEER}"]`).should('contain.text', '3 de 7 días').and('contain.text', '43%')
      .and('contain.text', 'Racha: 3 días').and('contain.text', 'Personalizados');
    cy.get('[data-testid="habito-1"]').should('contain.text', '0 de 7 días').and('contain.text', 'Salud');
    cy.get('[data-testid="habito-5"]').should('contain.text', '0 de 7 días').and('contain.text', 'Ejercicio');
    cy.get('[data-testid="categoria-Personalizados"]').should('contain.text', '43%');
    cy.get('[data-testid="categoria-Salud"]').should('contain.text', '0%');
    cy.get('[data-testid="categoria-Ejercicio"]').should('contain.text', '0%');
    cy.wait(600);

    // Mensual: Leer 3/30 = 10%; general 3/90 = 3%.
    cy.intercept('GET', `${API}/progreso?periodo=mensual`).as('mensual');
    cy.contains('ion-segment-button', 'Mensual').click();
    cy.wait('@mensual').its('response.statusCode').should('eq', 200);
    cy.get('[data-testid="porcentaje-general"]').should('have.text', '3%');
    cy.get(`[data-testid="habito-${LEER}"]`).should('contain.text', '3 de 30 días').and('contain.text', '10%');
    cy.get('[data-testid="categoria-Personalizados"]').should('contain.text', '10%');
    cy.contains('últimos 30 días');
    cy.wait(600);
  });

  it('error del backend muestra Reintentar', () => {
    cy.viewport(1280, 900);
    cy.visit('/login');
    cy.get('ion-input input').eq(0).type('ana@geshab.cl');
    cy.get('ion-input input').eq(1).type('Usuario123{enter}');
    cy.location('pathname').should('eq', '/inicio');
    cy.wait(800);
    cy.intercept('GET', `${API}/progreso*`, { statusCode: 500, body: { error: 'Error al obtener el progreso' } });
    cy.contains('ion-item', 'Progreso').click();
    cy.contains('Error al obtener el progreso').should('be.visible');
    cy.contains('ion-button', 'Reintentar');
  });
});
