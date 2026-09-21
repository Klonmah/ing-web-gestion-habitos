import { IonPage, IonContent, IonButton, IonSplitPane } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import LeftSideMenu from '../components/LeftSideMenu';

const PaginaPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    

    <IonPage id="main-content">
      <IonSplitPane contentId="main-content" when="md">

      <LeftSideMenu />

      <div id="main-content" className="ion-page">
      <IonContent className="ion-padding">
        <h1>Esta es una página placeholder</h1>

        <IonButton onClick={() => navigate('/inicio')}>
          Ir a Inicio
        </IonButton>
      </IonContent>
      </div>
    
    </IonSplitPane>
    </IonPage>
  );
};

export default PaginaPlaceholder;