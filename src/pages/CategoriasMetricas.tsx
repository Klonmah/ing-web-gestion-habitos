import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonModal, IonInput, IonTextarea,
  IonAlert, IonToast, IonSpinner, IonText
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import LeftSideMenu from '../components/LeftSideMenu';
import {
  listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria, obtenerMetricas
} from '../services/adminService';
import type { Categoria, DatosCategoria, Metricas } from '../services/adminService';
import { ApiError } from '../services/api';

const VERDE = '#2E6F5E';
const TEXTO = '#1A1D1C';
const TEXTO_SECUNDARIO = '#5F6B68';
const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;
const estiloTarjeta: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 16, height: '100%' };
const estiloCabecera: React.CSSProperties = { fontSize: 13, color: TEXTO_SECUNDARIO };

interface Aviso {
  texto: string;
  color: 'success' | 'danger';
}

type Errores = Partial<Record<'nombre' | 'descripcion', string>>;

// Indicador: un numero destacado con su rotulo (RF-08, datos agregados).
const Indicador: React.FC<{ valor: number | string; rotulo: string; detalle?: string }> = ({ valor, rotulo, detalle }) => (
  <div style={estiloTarjeta} data-testid={`indicador-${rotulo}`}>
    <p style={{ margin: 0, fontSize: 13, color: TEXTO_SECUNDARIO }}>{rotulo}</p>
    <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, color: TEXTO }}>{valor}</p>
    {detalle && <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXTO_SECUNDARIO }}>{detalle}</p>}
  </div>
);

// Barras horizontales de una sola serie: un tono, el valor escrito al
// lado (no depende solo del largo ni del color) y tooltip al pasar.
const BarrasHorizontales: React.FC<{ filas: { etiqueta: string; valor: number }[]; unidad: string; vacio: string }> = ({ filas, unidad, vacio }) => {
  const maximo = Math.max(...filas.map((f) => f.valor), 0);
  if (filas.length === 0) return <p style={{ color: TEXTO_SECUNDARIO }}>{vacio}</p>;
  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filas.map((f) => (
        <div
          role="listitem"
          key={f.etiqueta}
          title={`${f.etiqueta}: ${f.valor} ${unidad}`}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 40%) 1fr 36px', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: 14, color: TEXTO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.etiqueta}</span>
          <div style={{ height: 12, display: 'flex', alignItems: 'center' }}>
            {f.valor > 0 && (
              <div style={{
                width: `${maximo > 0 ? (f.valor / maximo) * 100 : 0}%`, minWidth: 6, height: 12,
                background: VERDE, borderRadius: '0 4px 4px 0',
              }} />
            )}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXTO, textAlign: 'right' }}>{f.valor}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Categorias y metricas del administrador (RF-08).
 * - Metricas agregadas y anonimizadas de GET /api/admin/metricas.
 * - CRUD de categorias contra /api/admin/categorias. Una categoria con
 *   plantillas no se puede eliminar (el backend responde 409).
 */
const CategoriasMetricas: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<DatosCategoria>({ nombre: '', descripcion: '' });
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Categoria | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Solo se aplica la respuesta de la ultima peticion.
  const ultimaPeticion = useRef(0);
  const cargar = useCallback(() => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setCargando(true);
    setErrorCarga('');
    Promise.all([listarCategorias(), obtenerMetricas()])
      .then(([cats, mets]) => {
        if (!vigente()) return;
        setCategorias(cats);
        setMetricas(mets);
      })
      .catch((err: unknown) => {
        if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar los datos.');
      })
      .finally(() => { if (vigente()) setCargando(false); });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNueva = () => {
    setEditandoId(null);
    setForm({ nombre: '', descripcion: '' });
    setErrores({});
    setModalAbierto(true);
  };

  const abrirEdicion = (c: Categoria) => {
    setEditandoId(c.id_categoria);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '' });
    setErrores({});
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio.' });
      return;
    }
    const datos: DatosCategoria = { nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() ?? '' };
    setGuardando(true);
    try {
      if (editandoId !== null) {
        await actualizarCategoria(editandoId, datos);
        setAviso({ texto: 'Categoría actualizada.', color: 'success' });
      } else {
        await crearCategoria(datos);
        setAviso({ texto: 'Categoría creada.', color: 'success' });
      }
      setModalAbierto(false);
      cargar(); // las metricas por categoria tambien cambian
    } catch (err) {
      // Errores por campo del backend (400) o nombre repetido (409).
      if (err instanceof ApiError && err.detalles.length > 0) {
        const porCampo: Errores = {};
        for (const { campo, mensaje } of err.detalles) {
          if ((campo === 'nombre' || campo === 'descripcion') && !porCampo[campo]) porCampo[campo] = mensaje;
        }
        setErrores(porCampo);
      } else if (err instanceof ApiError && err.estado === 409) {
        setErrores({ nombre: err.message });
      } else {
        setAviso({ texto: err instanceof Error ? err.message : 'No se pudo guardar la categoría.', color: 'danger' });
      }
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (c: Categoria) => {
    try {
      await eliminarCategoria(c.id_categoria);
      setAviso({ texto: 'Categoría eliminada.', color: 'success' });
      cargar();
    } catch (err) {
      setAviso({ texto: err instanceof Error ? err.message : 'No se pudo eliminar la categoría.', color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonSplitPane contentId="contenido-categorias" when="md">
        <LeftSideMenu rol="admin" contentId="contenido-categorias" />

        <div id="contenido-categorias" className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Categorías y métricas</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding" style={{ '--background': '#F5F6F7' } as React.CSSProperties}>
            <h1 style={{ fontWeight: 'bold', margin: '1rem 0 1.5rem' }}>Categorías y métricas</h1>

            {cargando && !metricas ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : errorCarga ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <IonText color="danger"><p>{errorCarga}</p></IonText>
                <IonButton fill="outline" onClick={cargar}>Reintentar</IonButton>
              </div>
            ) : metricas && (
              <>
                {/* Metricas: datos agregados, sin informacion personal (RF-08) */}
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 12px' }}>Métricas de uso</h2>
                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    <IonCol size="6" sizeMd="3"><Indicador rotulo="Usuarios" valor={metricas.total_usuarios} /></IonCol>
                    <IonCol size="6" sizeMd="3"><Indicador rotulo="Hábitos activos" valor={metricas.habitos_activos} /></IonCol>
                    <IonCol size="6" sizeMd="3">
                      <Indicador rotulo="Plantillas activas" valor={metricas.plantillas_activas} detalle={`de ${metricas.plantillas_totales} en total`} />
                    </IonCol>
                    <IonCol size="6" sizeMd="3">
                      <Indicador rotulo="Cumplimientos (7 días)" valor={metricas.cumplimientos_ultimos_7_dias} detalle={`${metricas.cumplimientos_ultimos_30_dias} en 30 días`} />
                    </IonCol>
                  </IonRow>
                  <IonRow style={{ marginTop: 8 }}>
                    <IonCol size="12" sizeMd="6">
                      <div style={estiloTarjeta}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: TEXTO }}>Adopciones por plantilla</h3>
                        <BarrasHorizontales
                          unidad="usuarios"
                          vacio="Aún no hay plantillas."
                          filas={metricas.adopciones_por_plantilla.map((a) => ({ etiqueta: a.nombre, valor: a.adopciones }))}
                        />
                      </div>
                    </IonCol>
                    <IonCol size="12" sizeMd="6">
                      <div style={estiloTarjeta}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: TEXTO }}>Cumplimientos por categoría (30 días)</h3>
                        <BarrasHorizontales
                          unidad="cumplimientos"
                          vacio="Aún no hay categorías."
                          filas={metricas.cumplimientos_por_categoria.map((c) => ({ etiqueta: c.categoria, valor: c.cumplimientos }))}
                        />
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                {/* Categorias */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 12px', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Categorías</h2>
                  <IonButton style={estiloBotonPrimario} onClick={abrirNueva}>
                    <IonIcon slot="start" icon={addOutline} />
                    Nueva categoría
                  </IonButton>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: 12 }}>
                  <IonGrid style={{ padding: 0 }}>
                    <IonRow className="ion-hide-md-down" style={{ padding: '12px 16px' }}>
                      <IonCol sizeMd="3" style={estiloCabecera}>Nombre</IonCol>
                      <IonCol sizeMd="5" style={estiloCabecera}>Descripción</IonCol>
                      <IonCol sizeMd="1" style={estiloCabecera}>Plantillas</IonCol>
                      <IonCol sizeMd="3" style={estiloCabecera}>Acciones</IonCol>
                    </IonRow>
                    {categorias.length === 0 && (
                      <p style={{ padding: 16, color: TEXTO_SECUNDARIO }}>Aún no hay categorías.</p>
                    )}
                    {categorias.map((c) => {
                      const enUso = c.total_plantillas > 0;
                      return (
                        <IonRow
                          key={c.id_categoria}
                          data-testid={`categoria-${c.nombre}`}
                          style={{ padding: '12px 16px', borderTop: '1px solid #D9DEDC', alignItems: 'center' }}
                        >
                          <IonCol size="12" sizeMd="3"><strong style={{ color: TEXTO }}>{c.nombre}</strong></IonCol>
                          <IonCol size="12" sizeMd="5" style={{ color: TEXTO_SECUNDARIO }}>{c.descripcion || '—'}</IonCol>
                          <IonCol size="12" sizeMd="1">
                            <span className="ion-hide-md-up" style={estiloCabecera}>Plantillas: </span>
                            {c.total_plantillas}
                          </IonCol>
                          <IonCol size="12" sizeMd="3">
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <IonButton size="small" fill="outline" onClick={() => abrirEdicion(c)}>Editar</IonButton>
                              <IonButton size="small" fill="outline" color="danger" disabled={enUso} onClick={() => setPorEliminar(c)}>
                                Eliminar
                              </IonButton>
                            </div>
                            {enUso && (
                              <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXTO_SECUNDARIO }}>
                                Tiene plantillas: muévelas o elimínalas antes de borrarla.
                              </p>
                            )}
                          </IonCol>
                        </IonRow>
                      );
                    })}
                  </IonGrid>
                </div>
              </>
            )}

            {/* Formulario de crear / editar categoria */}
            <IonModal isOpen={modalAbierto} onDidDismiss={() => setModalAbierto(false)}>
              <IonHeader>
                <IonToolbar>
                  <IonButtons slot="start">
                    <IonButton onClick={() => setModalAbierto(false)}>Cancelar</IonButton>
                  </IonButtons>
                  <IonTitle>{editandoId !== null ? 'Editar categoría' : 'Nueva categoría'}</IonTitle>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <IonInput
                  className={`ion-margin-bottom ${errores.nombre ? 'ion-invalid ion-touched' : ''}`}
                  label="Nombre *"
                  labelPlacement="floating"
                  fill="outline"
                  maxlength={50}
                  counter
                  value={form.nombre}
                  errorText={errores.nombre}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, nombre: valor }));
                    setErrores((er) => ({ ...er, nombre: undefined }));
                  }}
                />
                <IonTextarea
                  className={`ion-margin-bottom ${errores.descripcion ? 'ion-invalid ion-touched' : ''}`}
                  label="Descripción (opcional)"
                  labelPlacement="floating"
                  fill="outline"
                  autoGrow
                  value={form.descripcion}
                  errorText={errores.descripcion}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, descripcion: valor }));
                  }}
                />
                <IonButton expand="block" style={estiloBotonPrimario} onClick={() => void guardar()} disabled={guardando}>
                  {guardando ? 'Guardando...' : editandoId !== null ? 'Guardar cambios' : 'Crear categoría'}
                </IonButton>
              </IonContent>
            </IonModal>

            <IonAlert
              isOpen={porEliminar !== null}
              header="¿Eliminar categoría?"
              message={porEliminar ? `"${porEliminar.nombre}" se eliminará de forma permanente.` : ''}
              buttons={[
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: 'Eliminar',
                  role: 'destructive',
                  handler: () => {
                    if (porEliminar) void confirmarEliminar(porEliminar);
                  },
                },
              ]}
              onDidDismiss={() => setPorEliminar(null)}
            />

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

export default CategoriasMetricas;
