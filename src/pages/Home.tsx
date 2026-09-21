import { IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonText, IonIcon, IonBadge, IonList, IonCheckbox, IonToast, IonCol, IonGrid, IonRow, IonSplitPane } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { libraryOutline, addOutline } from 'ionicons/icons';
import LeftSideMenu from '../components/LeftSideMenu';

interface Habito {
  id: string;
  nombre: string;
  racha: number;
  completadoHoy: boolean;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  //Datos simulados temporales

  const [habitos, setHabitos] = useState<Habito[]>([
    { id: '1', nombre: 'Jugar Warframe sus 10 horitas de chill', racha: 28, completadoHoy: true },
    { id: '2', nombre: 'Hacer ejercicio (30 minutos)', racha: 0, completadoHoy: false },
    { id: '3', nombre: 'Estudiar (2 horas)', racha: 6, completadoHoy: true }
  ])

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{"email": "Usuario"}');
  const nombreCorto = usuario.email.split('@')[0];

  const toggleHabito = (id: string, completado: boolean) => {
    // RNF-03: Acción de 1 toque desde el inicio.
    // RF-03: Actualizar racha al cumplir.
    setHabitos(habitos.map(habito => {
      if (habito.id === id) {
        const nuevaRacha = completado ? habito.racha + 1 : habito.racha - 1;
        return { ...habito, completadoHoy: completado, racha: nuevaRacha };
      }
      return habito;
    }));

    if (completado) {
      setShowToast(true);
    }
  };


  return (


    <IonPage>
      <IonSplitPane contentId="main-content" when="md">

        <LeftSideMenu />
        <div id="main-content" className="ion-page">
        <IonContent className="ion-padding">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
            <h1 style={{ fontWeight: 'bold', margin: 0 }}>Hola - {nombreCorto}</h1>
            <IonButton
              style={{ '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' }}
              onClick={() => navigate('/habitos/nuevo')}>
              Agregar Habito
            </IonButton>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h6 style={{ fontWeight: 'bold', margin: 0 }}>Resumen del dia</h6>
            <IonText color="dark"><h6 style={{ margin: '5px 0', fontWeight: 'bold' }}>%67</h6></IonText>
          </div>

          {/*<IonList>
          {habitos.map((habito) => (
            
            <IonItem key={habito.id} lines="full">
              <IonCheckbox 
                slot="start" 
                checked={habito.completadoHoy}
                onIonChange={e => toggleHabito(habito.id, e.detail.checked)}
                justify="space-between"
              />
              <IonLabel>
                <h2 style={{ textDecoration: habito.completadoHoy ? 'line-through' : 'none' }}>
                  {habito.nombre}
                </h2>
              </IonLabel>
              <IonBadge color={habito.completadoHoy ? "success" : "medium"} slot="end">
                🔥 {habito.racha} días
              </IonBadge>
            </IonItem>
          ))}
        </IonList>*/}

          <IonGrid style={{ padding: 0 }}>
            <IonRow>
              {habitos.map((habito) => (
                <IonCol size="12" sizeMd="6" key={habito.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px',
                    marginBottom: '15px',
                    background: '#ffffff00',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0)'
                  }}>

                    {/* Checkbox circular */}
                    <IonCheckbox
                      checked={habito.completadoHoy}
                      onIonChange={e => toggleHabito(habito.id, e.detail.checked)}
                      style={{ '--border-radius': '50%', '--size': '24px', marginRight: '20px', '--checkmark-color': 'transparent', '--ion-color-primary': '#2e6f5e', '--border-color-checked': '#2e6f5e' } as React.CSSProperties}

                    />

                    {/* Texto de la tarjeta */}
                    <div style={{ flex: 1 }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        color: habito.completadoHoy ? '#7a8b83' : '#333',
                        textDecoration: habito.completadoHoy ? 'none' : 'none'
                      }}>
                        {habito.nombre}
                      </h2>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>
                        {habito.nombre}
                      </p>
                    </div>

                    {/* Badge de racha */}
                    <div style={{
                      background: '#f4f4f4',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      color: '#555',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      🔥 {habito.racha}
                    </div>

                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="¡Hábito registrado! Fecha guardada exitosamente."
            duration={2000}
            color="success"
            position="bottom"
          />

          {/*<IonButton expand="block" onClick={() => navigate('/catalogo')} style={{ flex: 1 }}>
            <IonIcon slot="start" icon={libraryOutline} />
            Catálogo
          </IonButton>
          <IonButton expand="block" color="secondary" onClick={() => navigate('/habitos/nuevo')} style={{ flex: 1 }}>
            <IonIcon slot="start" icon={addOutline} />
            Nuevo Hábito
          </IonButton>

        <IonButton onClick={() => navigate('/tareas')}>
          Ir a mis tareas
        </IonButton>*/}

        </IonContent>
      </div>

    </IonSplitPane>
    </IonPage >
  );
};

export default Home;