/**
 * Error con un codigo HTTP asociado.
 *
 * Permite que los servicios lancen errores sin saber nada de HTTP
 * mas alla del numero, y que un unico middleware al final decida
 * como responder. Asi no hay respuestas armadas a mano repartidas
 * por todo el codigo.
 *
 * Ejemplo de uso en un servicio:
 *     throw new ErrorHttp(409, 'El correo ya esta registrado');
 */
export class ErrorHttp extends Error {
  public readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
    this.name = 'ErrorHttp';

    // Necesario al extender clases nativas compilando a ES5/ES6:
    // sin esto, "error instanceof ErrorHttp" puede dar false.
    Object.setPrototypeOf(this, ErrorHttp.prototype);
  }
}
