import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonInput, IonText, IonIcon } from '@ionic/react';
import { Link, useNavigate } from 'react-router-dom';
import { personAddOutline } from 'ionicons/icons';
import { api, ApiError } from '../services/api';
import { guardarSesion, RUTA_INICIO } from '../services/auth';
import type { UsuarioSesion } from '../services/auth';

// Campos del formulario. "confirmar" solo existe en el front.
type Campo = 'nombre' | 'correo' | 'contrasena' | 'confirmar';
type Errores = Partial<Record<Campo, string>>;

const estiloBotonPrimario = { '--ion-color-primary': '#2e6f5e' } as React.CSSProperties;

/**
 * Registro de usuario (POST /api/auth/registro).
 *
 * Las reglas de cada campo (largo del nombre, formato del correo,
 * RNF-02 para la contrasena) las valida el BACKEND con zod y responde
 * un 400 con un detalle por campo. Esta pantalla muestra cada mensaje
 * debajo del input que corresponde, en vez de un error generico.
 * En el front solo se revisa lo que el backend no puede saber: que
 * no falten campos y que las dos contrasenas coincidan.
 */
const Registro: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<Campo, string>>({
    nombre: '', correo: '', contrasena: '', confirmar: '',
  });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: Campo, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    // Al corregir un campo se limpia su error.
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const validarLocal = (): Errores => {
    const e: Errores = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.correo.trim()) e.correo = 'El correo es obligatorio.';
    if (!form.contrasena) e.contrasena = 'La contraseña es obligatoria.';
    if (form.contrasena && form.confirmar !== form.contrasena) {
      e.confirmar = 'Las contraseñas no coinciden.';
    }
    return e;
  };

  const registrar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrorGeneral('');

    const locales = validarLocal();
    setErrores(locales);
    if (Object.keys(locales).length > 0) return;

    setCargando(true);
    try {
      const { usuario, token } = await api<{ usuario: UsuarioSesion; token: string }>(
        '/auth/registro',
        {
          metodo: 'POST',
          cuerpo: { nombre: form.nombre.trim(), correo: form.correo.trim(), contrasena: form.contrasena },
          publica: true,
        }
      );
      // El backend devuelve el token al registrarse: se entra directo.
      const sesion = guardarSesion(token, usuario);
      navigate(RUTA_INICIO[sesion.rol], { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.detalles.length > 0) {
        // 400 de validacion: un mensaje por campo (el primero de cada uno).
        const porCampo: Errores = {};
        for (const { campo, mensaje } of err.detalles) {
          if ((campo === 'nombre' || campo === 'correo' || campo === 'contrasena') && !porCampo[campo]) {
            porCampo[campo] = mensaje;
          }
        }
        setErrores(porCampo);
        if (Object.keys(porCampo).length === 0) setErrorGeneral(err.message);
      } else if (err instanceof ApiError && err.estado === 409) {
        // Correo ya registrado: el error es del campo correo.
        setErrores({ correo: err.message });
      } else {
        setErrorGeneral(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
      }
    } finally {
      setCargando(false);
    }
  };

  // Clases de Ionic para que el input muestre su errorText en rojo.
  const claseCampo = (campo: Campo) =>
    `ion-margin-bottom ${errores[campo] ? 'ion-invalid ion-touched' : ''}`;

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100%',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <h1 style={{ textAlign: 'center' }}>Crear cuenta</h1>

          <form onSubmit={registrar} noValidate>
            <IonInput
              className={claseCampo('nombre')}
              label="Nombre"
              labelPlacement="floating"
              fill="outline"
              autocomplete="name"
              maxlength={80}
              value={form.nombre}
              errorText={errores.nombre}
              onIonInput={(e) => cambiar('nombre', e.detail.value ?? '')}
            />

            <IonInput
              className={claseCampo('correo')}
              type="email"
              label="Correo electrónico"
              labelPlacement="floating"
              fill="outline"
              autocomplete="email"
              maxlength={120}
              value={form.correo}
              errorText={errores.correo}
              onIonInput={(e) => cambiar('correo', e.detail.value ?? '')}
            />

            <IonInput
              className={claseCampo('contrasena')}
              type="password"
              label="Contraseña"
              labelPlacement="floating"
              fill="outline"
              autocomplete="new-password"
              value={form.contrasena}
              helperText="Mínimo 8 caracteres, con al menos una mayúscula y un número."
              errorText={errores.contrasena}
              onIonInput={(e) => cambiar('contrasena', e.detail.value ?? '')}
            />

            <IonInput
              className={claseCampo('confirmar')}
              type="password"
              label="Repite la contraseña"
              labelPlacement="floating"
              fill="outline"
              autocomplete="new-password"
              value={form.confirmar}
              errorText={errores.confirmar}
              onIonInput={(e) => cambiar('confirmar', e.detail.value ?? '')}
            />

            {errorGeneral && (
              <IonText color="danger">
                <p style={{ textAlign: 'center', margin: '10px 0' }}>{errorGeneral}</p>
              </IonText>
            )}

            <IonButton expand="block" type="submit" disabled={cargando} className="ion-margin-top" style={estiloBotonPrimario}>
              <IonIcon slot="start" icon={personAddOutline} />
              {cargando ? 'Creando cuenta...' : 'Registrarme'}
            </IonButton>
          </form>

          <IonText color="medium">
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#2e6f5e' }}>Inicia sesión</Link>
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Registro;
