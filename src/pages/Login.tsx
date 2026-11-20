import { IonPage, IonContent, IonButton, IonHeader, IonInput, IonText, IonIcon } from '@ionic/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { logInOutline } from 'ionicons/icons';
import { api } from '../services/api';
import { guardarSesion, RUTA_INICIO } from '../services/auth';
import type { UsuarioSesion } from '../services/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // api.ts redirige a /login?sesion=expirada cuando el token vence (401).
  const [params] = useSearchParams();
  const sesionExpirada = params.get('sesion') === 'expirada';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mismas reglas que esquemaLogin del backend: solo se exige que
    // vengan ambos campos. El formato de la contrasena (RNF-02) se
    // valida al REGISTRARSE, no al entrar: validarlo aqui rechazaba
    // contrasenas validas con simbolos (p. ej. "Clave#2026") y le
    // diria a un atacante que contrasenas no pueden existir.
    if (!email.trim() || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      const { usuario, token } = await api<{ usuario: UsuarioSesion; token: string }>(
        '/auth/login',
        { metodo: 'POST', cuerpo: { correo: email.trim(), contrasena: password }, publica: true }
      );
      const sesion = guardarSesion(token, usuario);
      // Ionic mantiene montada esta pagina: sin esto, al cerrar sesion
      // el formulario volvia a mostrar el correo y la contrasena.
      setEmail('');
      setPassword('');
      navigate(RUTA_INICIO[sesion.rol], { replace: true });
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
            onIonInput={e => setEmail(e.detail.value ?? '')}
            className="ion-margin-bottom"
            required
          />

          <IonInput
            type="password"
            label="Contraseña"
            labelPlacement="floating"
            fill="outline"
            value={password}
            onIonInput={e => setPassword(e.detail.value ?? '')}
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
            <p>¿No tienes cuenta? <Link to="/registro" style={{ color: '#2e6f5e' }}>Regístrate aquí</Link></p>
          </IonText>
        </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

export default Login;