import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonChip,
  IonLabel, IonSpinner, IonText, IonToast, IonIcon
} from '@ionic/react';
import { checkmarkOutline, addOutline } from 'ionicons/icons';
import LeftSideMenu from '../components/LeftSideMenu';
import { listarCatalogo } from '../services/adminService';
import type { PlantillaCatalogo, FiltroCatalogo } from '../services/adminService';
import { adoptarPlantilla } from '../services/habitosService';

type Dificultad = NonNullable<FiltroCatalogo['dificultad']>;

const DIFICULTADES: { valor: Dificultad | ''; texto: string }[] = [
  { valor: '', texto: 'Todas' },
  { valor: 'baja', texto: 'Baja' },
  { valor: 'media', texto: 'Media' },
  { valor: 'alta', texto: 'Alta' },
];

const COLOR_DIFICULTAD: Record<Dificultad, string> = {
  baja: '#2E6F5E',
  media: '#E8A33D',
  alta: '#C0392B',
};

const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;
const estiloEtiqueta: React.CSSProperties = { fontSize: 13, color: '#5F6B68', margin: '0 8px 0 0' };

interface Aviso {
  texto: string;
  color: 'success' | 'danger';
}

// Chip de filtro: verde si esta seleccionado.
const Filtro: React.FC<{ texto: string; activo: boolean; onClick: () => void }> = ({ texto, activo, onClick }) => (
  <IonChip
    onClick={onClick}
    aria-pressed={activo}
    style={{
      '--background': activo ? '#2E6F5E' : '#FFFFFF',
      '--color': activo ? '#FFFFFF' : '#1A1D1C',
      border: '1px solid #D9DEDC',
    } as React.CSSProperties}
  >
    <IonLabel>{texto}</IonLabel>
  </IonChip>
);

/**
 * Catalogo de habitos (RF-06).
 *
 * Lista las plantillas ACTIVAS (el backend ya filtra las inactivas) y
 * permite filtrar por categoria y dificultad: los filtros se mandan a
 * GET /api/catalogo como ?categoria= y ?dificultad=. El boton Adoptar
 * crea el habito con POST /api/habitos.
 */
const Catalogo: React.FC = () => {
  const [plantillas, setPlantillas] = useState<PlantillaCatalogo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoria, setCategoria] = useState('');
  const [dificultad, setDificultad] = useState<Dificultad | ''>('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [adoptandoId, setAdoptandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Solo se aplica la respuesta de la ultima peticion (cambios de
  // filtro rapidos, doble efecto de StrictMode).
  const ultimaPeticion = useRef(0);
  const cargar = useCallback(() => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setCargando(true);
    setErrorCarga('');
    listarCatalogo({ categoria: categoria || undefined, dificultad: dificultad || undefined })
      .then((lista) => {
        if (!vigente()) return;
        setPlantillas(lista);
        // Las categorias del filtro salen del catalogo sin filtrar (el
        // usuario no tiene acceso a /api/admin/categorias).
        if (!categoria && !dificultad) {
          setCategorias([...new Set(lista.map((p) => p.categoria))].sort());
        }
      })
      .catch((err: unknown) => {
        if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
      })
      .finally(() => { if (vigente()) setCargando(false); });
  }, [categoria, dificultad]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const adoptar = async (p: PlantillaCatalogo) => {
    setAdoptandoId(p.id_plantilla);
    try {
      await adoptarPlantilla(p);
      setPlantillas((prev) => prev.map((x) => (x.id_plantilla === p.id_plantilla ? { ...x, ya_adoptada: true } : x)));
      setAviso({ texto: `"${p.nombre}" agregado a tus hábitos.`, color: 'success' });
    } catch (err) {
      setAviso({ texto: err instanceof Error ? err.message : 'No se pudo adoptar el hábito.', color: 'danger' });
    } finally {
      setAdoptandoId(null);
    }
  };

  return (
    <IonPage>
      <IonSplitPane contentId="contenido-catalogo" when="md">
        <LeftSideMenu contentId="contenido-catalogo" />

        <div id="contenido-catalogo" className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Catálogo</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <h1 style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Catálogo de hábitos</h1>
            <p style={{ color: '#5F6B68', marginTop: 0 }}>
              Elige un hábito sugerido y agrégalo a tu lista con un toque.
            </p>

            {/* Filtros: categoria y dificultad */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', margin: '1rem 0 0.25rem' }}>
              <span style={estiloEtiqueta}>Categoría</span>
              <Filtro texto="Todas" activo={categoria === ''} onClick={() => setCategoria('')} />
              {categorias.map((c) => (
                <Filtro key={c} texto={c} activo={categoria === c} onClick={() => setCategoria(c)} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={estiloEtiqueta}>Dificultad</span>
              {DIFICULTADES.map((d) => (
                <Filtro key={d.texto} texto={d.texto} activo={dificultad === d.valor} onClick={() => setDificultad(d.valor)} />
              ))}
            </div>

            {cargando ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : errorCarga ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonText color="danger"><p>{errorCarga}</p></IonText>
                <IonButton fill="outline" onClick={cargar}>Reintentar</IonButton>
              </div>
            ) : plantillas.length === 0 ? (
              <p style={{ color: '#5F6B68', textAlign: 'center', marginTop: '3rem' }}>
                No hay hábitos que coincidan con los filtros.
              </p>
            ) : (
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  {plantillas.map((p) => (
                    <IonCol size="12" sizeMd="6" sizeXl="4" key={p.id_plantilla}>
                      <IonCard className="ion-no-margin" style={{ borderRadius: 12, marginBottom: 16, height: 'calc(100% - 16px)' }}>
                        <IonCardContent style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1A1D1C' }}>{p.nombre}</h2>
                            {/* La dificultad se indica con texto, no solo con color (RNF-04) */}
                            <span style={{
                              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                              color: COLOR_DIFICULTAD[p.dificultad],
                              border: `1px solid ${COLOR_DIFICULTAD[p.dificultad]}`,
                              borderRadius: 12, padding: '2px 8px',
                            }}>
                              Dificultad {p.dificultad}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#5F6B68' }}>
                            {p.categoria} · {p.frecuencia_sugerida === 'diaria' ? 'Diario' : 'Semanal'}
                          </p>
                          {p.descripcion && <p style={{ margin: 0, color: '#1A1D1C' }}>{p.descripcion}</p>}

                          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                            {p.ya_adoptada ? (
                              <IonButton fill="outline" disabled style={{ textTransform: 'none' }}>
                                <IonIcon slot="start" icon={checkmarkOutline} />
                                Ya está en tus hábitos
                              </IonButton>
                            ) : (
                              <IonButton
                                style={estiloBotonPrimario}
                                disabled={adoptandoId === p.id_plantilla}
                                onClick={() => void adoptar(p)}
                              >
                                <IonIcon slot="start" icon={addOutline} />
                                {adoptandoId === p.id_plantilla ? 'Adoptando...' : 'Adoptar'}
                              </IonButton>
                            )}
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            )}

            <IonToast
              isOpen={aviso !== null}
              message={aviso?.texto}
              duration={aviso?.color === 'danger' ? 3500 : 2000}
              color={aviso?.color}
              position="bottom"
              onDidDismiss={() => setAviso(null)}
            />
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default Catalogo;
