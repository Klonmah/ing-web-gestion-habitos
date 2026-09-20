import { IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonText, IonIcon, IonBadge, IonList, IonCheckbox, IonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { libraryOutline, addOutline } from 'ionicons/icons';

interface Habito
{
  id:string;
  nombre: string;
  racha: number;
  completadoHoy: boolean;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  //Datos simulados temporales

  const [habitos, setHabitos] = useState<Habito[]>([
    { id: '1', nombre:'Jugar Warframe sus 10 horitas de chill', racha:28, completadoHoy:true},
    { id: '2', nombre:'Hacer ejercicio (30 minutos)', racha:0, completadoHoy:false},
    { id: '3', nombre:'Estudiar (2 horas)', racha:6, completadoHoy:true}
  ])

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

      <IonHeader>
        <IonToolbar>
          <IonTitle>Mis Hábitos de Hoy</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h1>Inicio: Gestión de Hábitos</h1>
        <p> Estas son tus metas para hoy. ¡Ánimo manteniendo esa racha!</p>

        <IonList>
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
        </IonList>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="¡Hábito registrado! Fecha guardada exitosamente."
          duration={2000}
          color="success"
          position="bottom"
        />

        <IonButton expand="block" onClick={() => navigate('/catalogo')} style={{ flex: 1 }}>
            <IonIcon slot="start" icon={libraryOutline} />
            Catálogo
          </IonButton>
          <IonButton expand="block" color="secondary" onClick={() => navigate('/habitos/nuevo')} style={{ flex: 1 }}>
            <IonIcon slot="start" icon={addOutline} />
            Nuevo Hábito
          </IonButton>

        <IonButton onClick={() => navigate('/tareas')}>
          Ir a mis tareas
        </IonButton>

      </IonContent>
    </IonPage>
  );
};

export default Home;