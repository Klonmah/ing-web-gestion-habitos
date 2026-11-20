import React from 'react';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { arrowBackOutline } from 'ionicons/icons';
import { obtenerUsuario, rutaDeInicio } from '../services/auth';

interface PaginaAvisoProps {
  icono: string;
  codigo: string;
  titulo: string;
  texto: string;
  testId: string;
}

// Texto del boton segun a donde lleva.
const destinoTexto = (): string => {
  const usuario = obtenerUsuario();
  if (!usuario) return 'Ir a iniciar sesión';
  return usuario.rol === 'admin' ? 'Volver al panel de administración' : 'Volver al inicio';
};

/**
 * Pagina de aviso a pantalla completa (404, acceso denegado). Tiene un
 * solo boton que lleva a la pantalla que corresponde: el login si no hay
 * sesion, o el inicio de su rol si la hay.
 */
const PaginaAviso: React.FC<PaginaAvisoProps> = ({ icono, codigo, titulo, texto, testId }) => {
  const navigate = useNavigate();
  return (
    <IonPage data-testid={testId}>
      <IonContent className="ion-padding">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100%', maxWidth: 420, margin: '0 auto', textAlign: 'center', gap: 8,
        }}>
          <IonIcon icon={icono} aria-hidden="true" style={{ fontSize: 64, color: '#2E6F5E' }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#5F6B68', letterSpacing: 1 }}>{codigo}</p>
          <h1 style={{ margin: 0, fontWeight: 'bold', color: '#1A1D1C' }}>{titulo}</h1>
          <p style={{ margin: '0 0 16px', color: '#5F6B68' }}>{texto}</p>
          <IonButton
            onClick={() => navigate(rutaDeInicio(), { replace: true })}
            style={{ '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties}
          >
            <IonIcon slot="start" icon={arrowBackOutline} />
            {destinoTexto()}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PaginaAviso;
