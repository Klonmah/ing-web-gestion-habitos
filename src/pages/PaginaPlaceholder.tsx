import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

const PaginaPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h1>Esta es una página placeholder</h1>

        <IonButton onClick={() => navigate('/inicio')}>
          Ir a Inicio
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default PaginaPlaceholder;