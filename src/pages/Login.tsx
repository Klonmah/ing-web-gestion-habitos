import { IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonText, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logInOutline } from 'ionicons/icons';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const validarPassword = (pass: string) => {
    // RNF-02: mínimo 8 caracteres, al menos una mayúscula y un dígito
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pass);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (!validarPassword(password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.');
      return;
    }

    // Simulamos un inicio de sesión exitoso como Usuario o Admin(usuario con correo que incluya "@admingeshab"), ya que necesitaríamos uso de backend para comprobar usuarios loggeados:
    localStorage.setItem('usuario', JSON.stringify({ email }));

    if (email.includes('@admingeshab')) {
      console.log('Login de Admin exitoso');
      navigate('/admin/plantillas'); 
    } else {
      console.log('Login de Usuario exitoso');
      navigate('/inicio'); 
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar Sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Login</h1>
        <p>Ingresa tus datos para continuar.</p>

        <form onSubmit={handleLogin}>
          <IonInput
            type="email"
            label="Correo Electrónico"
            labelPlacement="floating"
            fill="outline"
            value={email}
            onIonChange={e => setEmail(e.detail.value!)}
            className="ion-margin-bottom"
            required
          />

          <IonInput
            type="password"
            label="Contraseña"
            labelPlacement="floating"
            fill="outline"
            value={password}
            onIonChange={e => setPassword(e.detail.value!)}
            className="ion-margin-bottom"
            required
          />

          {error && (
            <IonText color="danger">
              <p style={{ textAlign: 'center', margin: '10px 0' }}>{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top">
            <IonIcon slot="start" icon={logInOutline} />
            Ingresar
          </IonButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <IonText color="medium">
            <p>¿No tienes cuenta? <a href="/registro">Regístrate aquí</a></p>
          </IonText>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Login;