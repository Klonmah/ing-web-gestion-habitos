import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonCheckbox, IonToast, IonCol, IonGrid, IonRow, IonSplitPane, IonSpinner, IonText
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import LeftSideMenu from '../components/LeftSideMenu';
import { obtenerUsuario } from '../services/api';
import {
  listarHabitosDeHoy, marcarCumplidoHoy, desmarcarCumplidoHoy
} from '../services/habitosService';
import type { HabitoHoy } from '../services/habitosService';

const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;

interface Aviso {
  texto: string;
  color: 'success' | 'danger';
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [habitos, setHabitos] = useState<HabitoHoy[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  // Habito cuyo check-in se esta enviando: su casilla queda deshabilitada
  // para que un doble toque no mande dos peticiones.
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // Al fallar un check-in se incrementa para volver a montar la casilla:
  // si no, Ionic la deja marcada aunque el backend no guardo nada.
  const [revision, setRevision] = useState(0);

  const usuario = obtenerUsuario();
  const nombreCorto = usuario?.nombre.split(' ')[0] ?? 'Usuario';

  // Habitos y rachas vienen del backend (GET /api/habitos y /api/progreso).
  // Si llegan dos respuestas (reintento, doble efecto de StrictMode),
  // solo se aplica la de la ultima peticion.
  const ultimaPeticion = useRef(0);
  const cargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setErrorCarga('');
    try {
      const lista = await listarHabitosDeHoy();
      if (vigente()) setHabitos(lista);
    } catch (err) {
      if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar tus hábitos.');
    } finally {
      if (vigente()) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // RNF-03: check-in de un toque desde el inicio.
  // RF-03: la racha la recalcula el backend; tras marcar se vuelve a pedir.
  const alternarHabito = async (habito: HabitoHoy, completado: boolean) => {
    setEnviandoId(habito.id);
    try {
      if (completado) {
        await marcarCumplidoHoy(habito.id);
        setAviso({ texto: `¡"${habito.nombre}" registrado por hoy!`, color: 'success' });
      } else {
        await desmarcarCumplidoHoy(habito.id);
      }
    } catch (err) {
      setRevision((r) => r + 1); // la casilla vuelve a su estado real
      setAviso({
        texto: err instanceof Error ? err.message : 'No se pudo registrar el cumplimiento.',
        color: 'danger',
      });
    } finally {
      // Se recarga tambien si fallo, para que la casilla vuelva al
      // estado real que tiene el backend.
      await cargar();
      setEnviandoId(null);
    }
  };

  const completados = habitos.filter((h) => h.completadoHoy).length;
  const porcentaje = habitos.length > 0 ? Math.round((completados / habitos.length) * 100) : 0;

  return (
    <IonPage>
      <IonSplitPane contentId="main-content" when="md">
        <LeftSideMenu />

        <div id="main-content" className="ion-page">
          {/* En móvil el menú se abre con este botón; en web queda fijo al costado */}
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Inicio</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontWeight: 'bold', margin: 0 }}>Hola, {nombreCorto}</h1>
              <IonButton style={estiloBotonPrimario} onClick={() => navigate('/habitos/nuevo')}>
                Agregar hábito
              </IonButton>
            </div>

            {cargando ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : errorCarga ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonText color="danger"><p>{errorCarga}</p></IonText>
                <IonButton fill="outline" onClick={() => { setCargando(true); void cargar(); }}>
                  Reintentar
                </IonButton>
              </div>
            ) : habitos.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '3rem', color: '#5F6B68' }}>
                <p>Aún no tienes hábitos activos.</p>
                <IonButton fill="outline" onClick={() => navigate('/catalogo')}>
                  Explorar el catálogo
                </IonButton>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h6 style={{ fontWeight: 'bold', margin: 0 }}>Resumen del día</h6>
                  <IonText color="dark">
                    <h6 style={{ margin: '5px 0', fontWeight: 'bold' }}>
                      {porcentaje}% · {completados} de {habitos.length} hábitos cumplidos
                    </h6>
                  </IonText>
                </div>

                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    {habitos.map((habito) => (
                      <IonCol size="12" sizeMd="6" key={habito.id}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '20px',
                          marginBottom: '15px',
                          borderRadius: '12px',
                        }}>
                          {/* Checkbox circular: el check-in de un toque */}
                          <IonCheckbox
                            key={`${habito.id}-${revision}`}
                            checked={habito.completadoHoy}
                            disabled={enviandoId === habito.id}
                            onIonChange={(e) => void alternarHabito(habito, e.detail.checked)}
                            aria-label={`Marcar "${habito.nombre}" como cumplido hoy`}
                            style={{ '--border-radius': '50%', '--size': '24px', marginRight: '20px', '--checkmark-color': 'transparent', '--ion-color-primary': '#2e6f5e', '--border-color-checked': '#2e6f5e' } as React.CSSProperties}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{
                              margin: 0,
                              fontSize: '1.4rem',
                              // Variables de Ionic: se leen bien en modo claro y oscuro.
                              color: habito.completadoHoy ? 'var(--ion-color-medium)' : 'var(--ion-text-color)',
                            }}>
                              {habito.nombre}
                            </h2>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>
                              {[
                                habito.frecuencia === 'diaria' ? 'Diario' : 'Semanal',
                                habito.meta,
                                habito.horario && `a las ${habito.horario}`,
                              ].filter(Boolean).join(' · ')}
                            </p>
                          </div>

                          {/* Racha actual, calculada por el backend */}
                          <div
                            title="Días seguidos cumplidos"
                            style={{
                              background: '#f4f4f4',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              fontSize: '0.85rem',
                              color: '#555',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            🔥 {habito.racha} {habito.racha === 1 ? 'día' : 'días'}
                          </div>
                        </div>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </>
            )}

            <IonToast
              isOpen={aviso !== null}
              onDidDismiss={() => setAviso(null)}
              message={aviso?.texto}
              duration={2000}
              color={aviso?.color}
              position="bottom"
            />
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default Home;
