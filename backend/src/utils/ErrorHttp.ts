/**
 * Error con un codigo HTTP asociado.
 *
 * Permite que los servicios lancen errores sin saber nada de HTTP
 * mas alla del numero, y que un unico middleware al final decida
 * como responder. Asi no hay respuestas armadas a mano repartidas
 * por todo el codigo.
 *
 * Todas las respuestas de error de la API tienen la misma forma:
 *     { "error": "mensaje", "detalles": [{ "campo": "...", "mensaje": "..." }] }
 * "detalles" solo aparece cuando el error es de uno o mas campos
 * concretos (validacion), para que el frontend marque el input.
 *
 * Ejemplo de uso en un servicio:
 *     throw new ErrorHttp(409, 'El correo ya esta registrado');
 *     throw new ErrorHttp(400, 'Datos invalidos', [{ campo: 'fecha', mensaje: '...' }]);
 */
export interface DetalleError {
  campo: string;
  mensaje: string;
}

export class ErrorHttp extends Error {
  public readonly estado: number;
  public readonly detalles?: DetalleError[];

  constructor(estado: number, mensaje: string, detalles?: DetalleError[]) {
    super(mensaje);
    this.estado = estado;
    this.name = 'ErrorHttp';
    if (detalles && detalles.length > 0) this.detalles = detalles;

    // Necesario al extender clases nativas compilando a ES5/ES6:
    // sin esto, "error instanceof ErrorHttp" puede dar false.
    Object.setPrototypeOf(this, ErrorHttp.prototype);
  }
}

/** Atajo para el 400 de un solo campo. */
export const errorDeCampo = (campo: string, mensaje: string): ErrorHttp =>
  new ErrorHttp(400, 'Los datos enviados no son validos', [{ campo, mensaje }]);
