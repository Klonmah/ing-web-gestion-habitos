import { IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonText, IonIcon } from '@ionic/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { logInOutline } from 'ionicons/icons';
import { api, guardarSesion } from '../services/api';
import type { UsuarioSesion } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // api.ts redirige a /login?sesion=expirada cuando el token vence (401).
  const [params] = useSearchParams();
  const sesionExpirada = params.get('sesion') === 'expirada';

  const validarPassword = (pass: string) => {
    // RNF-02: mínimo 8 caracteres, al menos una mayúscula y un dígito
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pass);
  };

  const handleLogin = async (e: React.FormEvent) => {
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

    setCargando(true);
    try {
      const { usuario, token } = await api<{ usuario: Omit<UsuarioSesion, 'email'>; token: string }>(
        '/auth/login',
        { metodo: 'POST', cuerpo: { correo: email, contrasena: password }, publica: true }
      );
      const sesion = guardarSesion(token, usuario);
      navigate(sesion.rol === 'admin' ? '/admin/plantillas' : '/inicio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          maxWidth: '400px', 
          margin: '0 auto',
          textAlign: 'center' 
        }}>
        <h1>Iniciar Sesión</h1>

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

          {sesionExpirada && !error && (
            <IonText color="warning">
              <p style={{ textAlign: 'center', margin: '10px 0' }}>Tu sesión expiró. Vuelve a iniciar sesión.</p>
            </IonText>
          )}

          {error && (
            <IonText color="danger">
              <p style={{ textAlign: 'center', margin: '10px 0' }}>{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" disabled={cargando} className="ion-margin-top" style={{'--ion-color-primary': '#2e6f5e'}}>
            <IonIcon slot="start" icon={logInOutline} />
            Ingresar
          </IonButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', '--ion-color-primary': '#2e6f5e' }as React.CSSProperties}>
          <IonText color="medium">
            <p>¿No tienes cuenta? <a href="/registro">Regístrate aquí</a></p>
          </IonText>
        </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

export default Login;