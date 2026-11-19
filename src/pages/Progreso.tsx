import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonText, IonButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import LeftSideMenu from '../components/LeftSideMenu';
import { obtenerProgreso, DIAS_PERIODO } from '../services/progresoService';
import type { Periodo, ResumenProgreso } from '../services/progresoService';

const VERDE = '#2E6F5E';
const estiloSegmento = { '--color-checked': VERDE, '--indicator-color': VERDE } as React.CSSProperties;

// Barra de progreso con el numero al lado: el estado no depende solo
// del color (RNF-04).
const Barra: React.FC<{ porcentaje: number; etiqueta: string }> = ({ porcentaje, etiqueta }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ flex: 1, height: 10, background: '#E3E8E6', borderRadius: 5, overflow: 'hidden' }}
    >
      <div style={{ width: `${porcentaje}%`, height: '100%', background: VERDE, borderRadius: 5 }} />
    </div>
    <strong style={{ minWidth: 44, textAlign: 'right', color: '#1A1D1C' }}>{porcentaje}%</strong>
  </div>
);

/**
 * Panel de progreso (RF-04): porcentaje de cumplimiento semanal y
 * mensual, en total, por categoria y por habito, mas la racha actual.
 */
const Progreso: React.FC = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>('semanal');
  const [datos, setDatos] = useState<ResumenProgreso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Solo se aplica la respuesta de la ultima peticion (cambio rapido de
  // periodo, doble efecto de StrictMode).
  const ultimaPeticion = useRef(0);
  const cargar = useCallback(() => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setCargando(true);
    setErrorCarga('');
    obtenerProgreso(periodo)
      .then((r) => { if (vigente()) setDatos(r); })
      .catch((err: unknown) => {
        if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar tu progreso.');
      })
      .finally(() => { if (vigente()) setCargando(false); });
  }, [periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const textoPeriodo = periodo === 'semanal' ? 'últimos 7 días' : 'últimos 30 días';

  return (
    <IonPage>
      <IonSplitPane contentId="contenido-progreso" when="md">
        <LeftSideMenu contentId="contenido-progreso" />

        <div id="contenido-progreso" className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Progreso</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding" style={{ '--background': '#F5F6F7' } as React.CSSProperties}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '1rem 0 1.5rem' }}>
              <h1 style={{ fontWeight: 'bold', margin: 0 }}>Mi progreso</h1>
              <IonSegment
                value={periodo}
                onIonChange={(e) => setPeriodo((e.detail.value as Periodo) ?? 'semanal')}
                style={{ maxWidth: 280 }}
              >
                <IonSegmentButton value="semanal" style={estiloSegmento}><IonLabel>Semanal</IonLabel></IonSegmentButton>
                <IonSegmentButton value="mensual" style={estiloSegmento}><IonLabel>Mensual</IonLabel></IonSegmentButton>
              </IonSegment>
            </div>

            {cargando && !datos ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : errorCarga ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonText color="danger"><p>{errorCarga}</p></IonText>
                <IonButton fill="outline" onClick={cargar}>Reintentar</IonButton>
              </div>
            ) : !datos || datos.habitos.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '3rem', color: '#5F6B68' }}>
                <p>Aún no tienes hábitos activos para medir tu progreso.</p>
                <IonButton fill="outline" onClick={() => navigate('/catalogo')}>Explorar el catálogo</IonButton>
              </div>
            ) : (
              <div style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {/* Resumen general */}
                <IonCard className="ion-no-margin" style={{ borderRadius: 12, marginBottom: 24 }}>
                  <IonCardContent>
                    <p style={{ margin: 0, color: '#5F6B68' }}>Cumplimiento general · {textoPeriodo}</p>
                    <p data-testid="porcentaje-general" style={{ margin: '4px 0 12px', fontSize: 40, fontWeight: 700, color: VERDE }}>
                      {datos.porcentajeGeneral}%
                    </p>
                    <Barra porcentaje={datos.porcentajeGeneral} etiqueta="Cumplimiento general" />
                  </IonCardContent>
                </IonCard>

                {/* Por categoria */}
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px' }}>Por categoría</h2>
                <IonGrid style={{ padding: 0, marginBottom: 16 }}>
                  <IonRow>
                    {datos.categorias.map((c) => (
                      <IonCol size="12" sizeMd="6" sizeXl="4" key={c.categoria}>
                        <IonCard className="ion-no-margin" data-testid={`categoria-${c.categoria}`} style={{ borderRadius: 12, marginBottom: 12 }}>
                          <IonCardContent>
                            <h3 style={{ margin: 0, fontWeight: 600, color: '#1A1D1C' }}>{c.categoria}</h3>
                            <p style={{ margin: '2px 0 10px', fontSize: 13, color: '#5F6B68' }}>
                              {c.habitos} {c.habitos === 1 ? 'hábito' : 'hábitos'} · {c.cumplidos} de {c.esperados} cumplimientos
                            </p>
                            <Barra porcentaje={c.porcentaje} etiqueta={`Cumplimiento de ${c.categoria}`} />
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>

                {/* Por habito */}
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px' }}>Por hábito</h2>
                <IonCard className="ion-no-margin" style={{ borderRadius: 12 }}>
                  <IonCardContent style={{ padding: 0 }}>
                    {datos.habitos.map((h, i) => (
                      <div
                        key={h.id}
                        data-testid={`habito-${h.id}`}
                        style={{ padding: 16, borderTop: i === 0 ? 'none' : '1px solid #D9DEDC' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div>
                            <h3 style={{ margin: 0, fontWeight: 600, color: '#1A1D1C' }}>{h.nombre}</h3>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#5F6B68' }}>
                              {h.categoria} · {h.frecuencia === 'diaria' ? 'Diario' : 'Semanal'} · {h.cumplidos} de {h.esperados}{' '}
                              {h.frecuencia === 'diaria' ? 'días' : (h.esperados === 1 ? 'semana' : 'semanas')}
                            </p>
                          </div>
                          <span title="Días seguidos cumplidos" style={{
                            alignSelf: 'flex-start', background: '#F4F4F4', padding: '4px 10px',
                            borderRadius: 16, fontSize: 13, color: '#555', whiteSpace: 'nowrap',
                          }}>
                            🔥 Racha: {h.racha} {h.racha === 1 ? 'día' : 'días'}
                          </span>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <Barra porcentaje={h.porcentaje} etiqueta={`Cumplimiento de ${h.nombre}`} />
                        </div>
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>

                <p style={{ fontSize: 12, color: '#5F6B68', marginTop: 16 }}>
                  El porcentaje compara los cumplimientos registrados con los esperados en el período
                  ({DIAS_PERIODO[periodo]} días): uno por día en hábitos diarios y uno por semana en los
                  semanales, contando desde que adoptaste cada hábito.
                </p>
              </div>
            )}
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default Progreso;
