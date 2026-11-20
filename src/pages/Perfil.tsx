import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton, IonCard, IonCardContent, IonCol, IonGrid, IonRow, IonSpinner, IonText, IonIcon
} from '@ionic/react';
import { personCircleOutline, settingsOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import PaginaConMenu from '../components/PaginaConMenu';
import { obtenerCuenta, obtenerResumenActividad } from '../services/perfilService';
import type { DatosCuenta, ResumenActividad } from '../services/perfilService';

const ROL_TEXTO: Record<DatosCuenta['rol'], string> = { usuario: 'Usuario', admin: 'Administrador' };

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode; testId?: string }> = ({ etiqueta, valor, testId }) => (
  <div style={{ marginBottom: 12 }}>
    <p style={{ margin: 0, fontSize: 13, color: '#5F6B68' }}>{etiqueta}</p>
    <p style={{ margin: '2px 0 0', fontSize: 16, color: '#1A1D1C', fontWeight: 500 }} data-testid={testId}>{valor}</p>
  </div>
);

const Cifra: React.FC<{ valor: React.ReactNode; texto: string; testId: string }> = ({ valor, texto, testId }) => (
  <IonCol size="6" sizeMd="3">
    <IonCard className="ion-no-margin" style={{ borderRadius: 12, height: '100%' }}>
      <IonCardContent style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#2E6F5E' }} data-testid={testId}>{valor}</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5F6B68' }}>{texto}</p>
      </IonCardContent>
    </IonCard>
  </IonCol>
);

/**
 * Perfil: datos de la cuenta leidos del backend (GET /api/auth/perfil)
 * y, para el usuario normal, un resumen de su actividad.
 */
const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState<DatosCuenta | null>(null);
  const [resumen, setResumen] = useState<ResumenActividad | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const ultimaPeticion = useRef(0);
  const cargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setErrorCarga('');
    try {
      const datos = await obtenerCuenta();
      // El resumen usa rutas del usuario normal; el admin no las tiene.
      const actividad = datos.rol === 'usuario' ? await obtenerResumenActividad() : null;
      if (!vigente()) return;
      setCuenta(datos);
      setResumen(actividad);
    } catch (err) {
      if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar tu perfil.');
    } finally {
      if (vigente()) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <PaginaConMenu titulo="Perfil" contentId="contenido-perfil">
      <h1 style={{ fontWeight: 'bold', margin: '1rem 0 1.5rem' }}>Perfil</h1>

      {cargando ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}><IonSpinner name="crescent" /></div>
      ) : errorCarga || !cuenta ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <IonText color="danger"><p>{errorCarga}</p></IonText>
          <IonButton fill="outline" onClick={() => { setCargando(true); void cargar(); }}>Reintentar</IonButton>
        </div>
      ) : (
        <>
          <IonCard className="ion-no-margin" style={{ borderRadius: 12, maxWidth: 640, marginBottom: 24 }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <IonIcon icon={personCircleOutline} style={{ fontSize: 56, color: '#2E6F5E' }} aria-hidden="true" />
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A1D1C' }} data-testid="perfil-nombre">{cuenta.nombre}</h2>
                  <p style={{ margin: '2px 0 0', color: '#5F6B68' }}>{ROL_TEXTO[cuenta.rol]}</p>
                </div>
              </div>
              <Dato etiqueta="Correo electrónico" valor={cuenta.correo} testId="perfil-correo" />
              <Dato etiqueta="Rol" valor={ROL_TEXTO[cuenta.rol]} testId="perfil-rol" />
              <IonButton fill="outline" style={{ textTransform: 'none', marginTop: 8, '--color': '#2e6f5e', '--border-color': '#2e6f5e' } as React.CSSProperties} onClick={() => navigate('/configuraciones')}>
                <IonIcon slot="start" icon={settingsOutline} />
                Configuración y cierre de sesión
              </IonButton>
            </IonCardContent>
          </IonCard>

          {resumen && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Tu actividad</h2>
              <div style={{ maxWidth: 900 }}>
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <Cifra valor={resumen.habitosActivos} texto="Hábitos activos" testId="perfil-habitos" />
                  <Cifra valor={`${resumen.porcentajeSemanal}%`} texto="Cumplimiento esta semana" testId="perfil-semanal" />
                  <Cifra valor={resumen.tareasPendientes} texto="Tareas pendientes" testId="perfil-pendientes" />
                  <Cifra valor={resumen.tareasCompletadas} texto="Tareas completadas" testId="perfil-completadas" />
                </IonRow>
              </IonGrid>
              </div>
              <p style={{ color: '#5F6B68', marginTop: 12 }} data-testid="perfil-racha">
                {resumen.mejorRacha
                  ? `Mejor racha actual: ${resumen.mejorRacha.nombre}, ${resumen.mejorRacha.dias} ${resumen.mejorRacha.dias === 1 ? 'día' : 'días'} seguidos.`
                  : 'Aún no tienes rachas activas. ¡Marca un hábito hoy para empezar una!'}
              </p>
            </>
          )}
        </>
      )}
    </PaginaConMenu>
  );
};

export default Perfil;
