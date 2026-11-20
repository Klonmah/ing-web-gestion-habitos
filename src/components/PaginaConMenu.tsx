import React from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonBackButton, IonButton, IonIcon, useIonRouter
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import LeftSideMenu from './LeftSideMenu';
import { obtenerUsuario } from '../services/auth';

interface PaginaConMenuProps {
  // Titulo de la barra superior (solo se ve en movil).
  titulo: string;
  // Id unico del contenido: el menu lateral lo usa para enlazarse.
  contentId: string;
  // Pantallas secundarias: a donde vuelve el boton "Volver" si no hay
  // una pantalla anterior en el historial (por ejemplo, al abrir la URL
  // directamente).
  volverA?: string;
  // Texto del boton de volver en web ("Volver a Perfil").
  volverTexto?: string;
  children: React.ReactNode;
}

/**
 * Estructura comun de las pantallas con menu lateral: en web el menu
 * queda fijo al costado y en movil se abre con el boton de la barra.
 * El menu muestra las opciones del rol de la sesion.
 *
 * Las pantallas secundarias (Habito nuevo, Recordatorios, Configuracion)
 * pasan "volverA" y muestran un boton para volver: en movil, la flecha
 * de la barra superior (IonBackButton); en web, donde esa barra no se
 * muestra, un boton sobre el titulo.
 */
const PaginaConMenu: React.FC<PaginaConMenuProps> = ({ titulo, contentId, volverA, volverTexto, children }) => {
  const rol = obtenerUsuario()?.rol ?? 'usuario';
  const router = useIonRouter();

  // Vuelve a la pantalla anterior si la hay; si no, a la pantalla padre.
  const volver = () => {
    if (router.canGoBack()) router.goBack();
    else if (volverA) router.push(volverA, 'back', 'replace');
  };

  return (
    <IonPage>
      <IonSplitPane contentId={contentId} when="md">
        <LeftSideMenu rol={rol} contentId={contentId} />

        <div id={contentId} className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                {volverA ? <IonBackButton defaultHref={volverA} text="" data-testid="volver-movil" /> : <IonMenuButton />}
              </IonButtons>
              <IonTitle>{titulo}</IonTitle>
              {volverA && (
                <IonButtons slot="end">
                  <IonMenuButton />
                </IonButtons>
              )}
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {volverA && (
              <IonButton
                fill="clear"
                size="small"
                className="ion-hide-md-down"
                onClick={volver}
                data-testid="volver-web"
                style={{ '--color': '#2e6f5e', textTransform: 'none', margin: '0 0 0 -8px' } as React.CSSProperties}
              >
                <IonIcon slot="start" icon={arrowBackOutline} />
                {volverTexto ?? 'Volver'}
              </IonButton>
            )}
            {children}
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default PaginaConMenu;
