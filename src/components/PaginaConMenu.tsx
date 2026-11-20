import React from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent
} from '@ionic/react';
import LeftSideMenu from './LeftSideMenu';
import { obtenerUsuario } from '../services/api';

interface PaginaConMenuProps {
  // Titulo de la barra superior (solo se ve en movil).
  titulo: string;
  // Id unico del contenido: el menu lateral lo usa para enlazarse.
  contentId: string;
  children: React.ReactNode;
}

/**
 * Estructura comun de las pantallas con menu lateral: en web el menu
 * queda fijo al costado y en movil se abre con el boton de la barra.
 * El menu muestra las opciones del rol de la sesion.
 */
const PaginaConMenu: React.FC<PaginaConMenuProps> = ({ titulo, contentId, children }) => {
  const rol = obtenerUsuario()?.rol ?? 'usuario';
  return (
    <IonPage>
      <IonSplitPane contentId={contentId} when="md">
        <LeftSideMenu rol={rol} contentId={contentId} />

        <div id={contentId} className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>{titulo}</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">{children}</IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default PaginaConMenu;
