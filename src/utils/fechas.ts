// Utilidades de fecha compartidas por los servicios.
//
// El backend guarda fechas como DATE, pero el driver de PostgreSQL las
// entrega como fecha con hora en UTC ("2026-10-22T03:00:00.000Z"). Para
// comparar con "hoy" hay que llevarlas al dia en hora local.

/** Convierte una fecha del backend a AAAA-MM-DD en hora local. */
export const aFechaLocal = (valor: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Fecha de hoy en hora local, en formato AAAA-MM-DD. */
export const hoy = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
