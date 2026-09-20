import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h1>Login</h1>

        <IonButton onClick={() => navigate('/inicio')}>
          Iniciar sesión
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;