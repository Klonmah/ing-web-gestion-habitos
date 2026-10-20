import { z } from 'zod';

/**
 * Esquemas de validacion de los datos que llegan en el body.
 *
 * zod comprueba la forma de los datos ANTES de que lleguen al
 * controlador. Si algo no calza, la peticion se rechaza con un 400 y
 * un detalle por campo, y la logica de negocio nunca llega a
 * ejecutarse con datos basura.
 */

// RNF-02: minimo 8 caracteres, al menos una mayuscula y un digito.
// Se valida con tres reglas separadas en vez de una expresion
// regular unica, para poder decirle al usuario exactamente cual
// falto en lugar de un mensaje generico.
const contrasena = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contrasena debe incluir al menos una mayuscula')
  .regex(/[0-9]/, 'La contrasena debe incluir al menos un numero');

export const esquemaRegistro = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato valido')
    .max(120, 'El correo no puede superar los 120 caracteres'),
  contrasena,
  // Nota de seguridad: el esquema NO acepta un campo "rol".
  // Aunque alguien lo mande en el body, se descarta aqui y el
  // INSERT deja que la base aplique su valor por defecto
  // ('usuario'). Si se aceptara, cualquiera podria registrarse
  // como administrador.
});

export const esquemaLogin = z.object({
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato valido'),
  // En el login no se validan las reglas de la contrasena: solo se
  // comprueba que venga. Validar el formato aqui le diria a un
  // atacante que esa contrasena no puede existir en el sistema, y
  // ademas rechazaria cuentas antiguas si las reglas cambiaran.
  contrasena: z.string().min(1, 'La contrasena es obligatoria'),
});

// Tipos derivados de los esquemas: se escriben una sola vez y
// TypeScript los mantiene sincronizados con la validacion.
export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;
