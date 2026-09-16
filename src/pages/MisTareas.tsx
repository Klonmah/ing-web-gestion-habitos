import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

const MisTareas: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h1>Mis tareas</h1>

        <IonButton onClick={() => navigate('/home')}>
          Volver a inicio
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default MisTareas;