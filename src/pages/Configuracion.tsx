import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton, IonCard, IonCardContent, IonIcon, IonAlert, IonSpinner, IonText, IonList, IonItem, IonLabel
} from '@ionic/react';
import { logOutOutline, alarmOutline, personOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import PaginaConMenu from '../components/PaginaConMenu';
import { cerrarSesion, obtenerToken } from '../services/auth';
import { obtenerCuenta, vencimientoDelToken } from '../services/perfilService';
import type { DatosCuenta } from '../services/perfilService';

/**
 * Configuracion: datos de la sesion actual (cuenta, rol y vencimiento
 * del token) y el cierre de sesion.
 *
 * Cerrar sesion borra el token y los datos del usuario del
 * localStorage. El JWT no se puede invalidar en el servidor (no hay
 * lista de tokens revocados), pero sin el token el cliente ya no puede
 * hacer peticiones y las rutas protegidas lo devuelven al login.
 */
const Configuracion: React.FC = () => {
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState<DatosCuenta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  const vence = vencimientoDelToken(obtenerToken());

  const ultimaPeticion = useRef(0);
  const cargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setErrorCarga('');
    try {
      const datos = await obtenerCuenta();
      if (vigente()) setCuenta(datos);
    } catch (err) {
      if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar los datos de la cuenta.');
    } finally {
      if (vigente()) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const salir = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <PaginaConMenu titulo="Configuración" contentId="contenido-configuracion" volverA="/perfil" volverTexto="Volver">
      <h1 style={{ fontWeight: 'bold', margin: '1rem 0 1.5rem' }}>Configuración</h1>

      <IonCard className="ion-no-margin" style={{ borderRadius: 12, maxWidth: 640, marginBottom: 24 }}>
        <IonCardContent>
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: '#1A1D1C' }}>Sesión</h2>
          {cargando ? (
            <IonSpinner name="crescent" />
          ) : errorCarga || !cuenta ? (
            <>
              <IonText color="danger"><p>{errorCarga}</p></IonText>
              <IonButton fill="outline" size="small" onClick={() => { setCargando(true); void cargar(); }}>Reintentar</IonButton>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 4px', color: '#1A1D1C' }}>
                Sesión iniciada como <strong data-testid="config-nombre">{cuenta.nombre}</strong>{' '}
                (<span data-testid="config-correo">{cuenta.correo}</span>)
              </p>
              <p style={{ margin: '0 0 4px', color: '#5F6B68' }}>
                Rol: {cuenta.rol === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
              {vence && (
                <p style={{ margin: 0, color: '#5F6B68' }} data-testid="config-vence">
                  La sesión vence el {vence.toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })}.
                </p>
              )}
            </>
          )}

          <IonButton
            color="danger"
            style={{ textTransform: 'none', marginTop: 16 }}
            onClick={() => setConfirmarSalida(true)}
            data-testid="boton-cerrar-sesion"
          >
            <IonIcon slot="start" icon={logOutOutline} />
            Cerrar sesión
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonList lines="full" style={{ maxWidth: 640, borderRadius: 12 }}>
        <IonItem button detail onClick={() => navigate('/perfil')}>
          <IonIcon slot="start" icon={personOutline} aria-hidden="true" />
          <IonLabel>Ver mi perfil</IonLabel>
        </IonItem>
        {cuenta?.rol !== 'admin' && (
          <IonItem button detail onClick={() => navigate('/recordatorios')}>
            <IonIcon slot="start" icon={alarmOutline} aria-hidden="true" />
            <IonLabel>Recordatorios de hábitos</IonLabel>
          </IonItem>
        )}
      </IonList>

      <IonAlert
        isOpen={confirmarSalida}
        header="Cerrar sesión"
        message="¿Quieres cerrar la sesión en este dispositivo?"
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Cerrar sesión', role: 'confirm', handler: salir },
        ]}
        onDidDismiss={() => setConfirmarSalida(false)}
      />
    </PaginaConMenu>
  );
};

export default Configuracion;
