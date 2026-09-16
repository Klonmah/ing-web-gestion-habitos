import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h1>Administración</h1>

        <IonButton onClick={() => navigate('/home')}>
          Volver a inicio
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Admin;