import React, { useEffect, useState } from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonChip, IonLabel, IonSearchbar,
  IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonAlert, IonToast
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import LeftSideMenu from '../components/LeftSideMenu';
import {
  CATEGORIAS, listarPlantillas, crearPlantilla, actualizarPlantilla, eliminarPlantilla
} from '../services/plantillasService';
import type { Plantilla, DatosPlantilla, Frecuencia } from '../services/plantillasService';

const FORM_VACIO: DatosPlantilla = { nombre: '', descripcion: '', categoria: '', frecuencia: 'Diaria' };

type Errores = Partial<Record<'nombre' | 'categoria', string>>;

// Acción que requiere confirmación antes de ejecutarse.
interface AccionPendiente {
  tipo: 'eliminar' | 'desactivar';
  plantilla: Plantilla;
}

const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;
const estiloCabecera: React.CSSProperties = { fontSize: 13, color: '#5F6B68' };

const Admin: React.FC = () => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<DatosPlantilla>(FORM_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [pendiente, setPendiente] = useState<AccionPendiente | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    listarPlantillas().then(setPlantillas);
  }, []);

  const validar = (f: DatosPlantilla): Errores => {
    const e: Errores = {};
    const nombre = f.nombre.trim();
    if (!nombre) {
      e.nombre = 'El nombre es obligatorio.';
    } else if (plantillas.some((p) => p.id !== editandoId && p.nombre.toLowerCase() === nombre.toLowerCase())) {
      e.nombre = 'Ya existe una plantilla con ese nombre.';
    }
    if (!f.categoria) e.categoria = 'Selecciona una categoría.';
    return e;
  };

  const abrirNueva = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrores({});
    setModalAbierto(true);
  };

  const abrirEdicion = (p: Plantilla) => {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria, frecuencia: p.frecuencia });
    setErrores({});
    setModalAbierto(true);
  };

  const guardar = async () => {
    const nuevosErrores = validar(form);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const datos: DatosPlantilla = { ...form, nombre: form.nombre.trim(), descripcion: form.descripcion.trim() };
    if (editandoId) {
      const actualizada = await actualizarPlantilla(editandoId, datos);
      setPlantillas((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)));
      setMensaje('Plantilla actualizada.');
    } else {
      const nueva = await crearPlantilla(datos);
      setPlantillas((prev) => [...prev, nueva]);
      setMensaje('Plantilla creada.');
    }
    setModalAbierto(false);
  };

  const cambiarEstado = async (p: Plantilla, activa: boolean) => {
    const actualizada = await actualizarPlantilla(p.id, { activa });
    setPlantillas((prev) => prev.map((x) => (x.id === actualizada.id ? actualizada : x)));
    setMensaje(activa ? 'Plantilla activada.' : 'Plantilla desactivada.');
  };

  const ejecutarPendiente = async (accion: AccionPendiente) => {
    if (accion.tipo === 'desactivar') {
      await cambiarEstado(accion.plantilla, false);
      return;
    }
    try {
      await eliminarPlantilla(accion.plantilla.id);
      setPlantillas((prev) => prev.filter((x) => x.id !== accion.plantilla.id));
      setMensaje('Plantilla eliminada.');
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : 'No se pudo eliminar la plantilla.');
    }
  };

  const visibles = plantillas.filter((p) => {
    const coincideCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    const coincideTexto = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
    return coincideCategoria && coincideTexto;
  });

  return (
    <IonPage>
      <IonSplitPane contentId="contenido-admin" when="md">
        <LeftSideMenu rol="admin" contentId="contenido-admin" />

        <div id="contenido-admin" className="ion-page">
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Plantillas</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding" style={{ '--background': '#F5F6F7' } as React.CSSProperties}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 1.5rem', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontWeight: 'bold', margin: 0 }}>Gestión de plantillas</h1>
              <IonButton style={estiloBotonPrimario} onClick={abrirNueva}>
                <IonIcon slot="start" icon={addOutline} />
                Nueva plantilla
              </IonButton>
            </div>

            {/* Filtros: búsqueda por nombre y categoría */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <IonSearchbar
                style={{ maxWidth: 300, padding: 0 }}
                placeholder="Buscar por nombre"
                value={busqueda}
                onIonInput={(e) => setBusqueda(e.detail.value ?? '')}
              />
              {['Todas', ...CATEGORIAS].map((cat) => {
                const seleccionada = categoriaFiltro === cat;
                return (
                  <IonChip
                    key={cat}
                    onClick={() => setCategoriaFiltro(cat)}
                    style={{
                      '--background': seleccionada ? '#2E6F5E' : '#FFFFFF',
                      '--color': seleccionada ? '#FFFFFF' : '#1A1D1C',
                    } as React.CSSProperties}
                  >
                    <IonLabel>{cat}</IonLabel>
                  </IonChip>
                );
              })}
            </div>

            {/* Tabla de plantillas. En móvil cada fila se apila. */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, overflowX: 'auto' }}>
              <IonGrid style={{ padding: 0 }}>
                <IonRow className="ion-hide-md-down" style={{ padding: '12px 16px' }}>
                  <IonCol sizeMd="3" style={estiloCabecera}>Nombre</IonCol>
                  <IonCol sizeMd="2" style={estiloCabecera}>Categoría</IonCol>
                  <IonCol sizeMd="2" style={estiloCabecera}>Frecuencia</IonCol>
                  <IonCol sizeMd="2" style={estiloCabecera}>Estado</IonCol>
                  <IonCol sizeMd="3" style={estiloCabecera}>Acciones</IonCol>
                </IonRow>

                {visibles.length === 0 && (
                  <p style={{ padding: 16, color: '#5F6B68' }}>No hay plantillas que coincidan con el filtro.</p>
                )}

                {visibles.map((p) => {
                  const enUso = p.usuariosActivos > 0;
                  return (
                    <IonRow
                      key={p.id}
                      style={{ padding: '12px 16px', borderTop: '1px solid #D9DEDC', alignItems: 'center' }}
                    >
                      <IonCol size="12" sizeMd="3">
                        <strong>{p.nombre}</strong>
                      </IonCol>
                      <IonCol size="6" sizeMd="2">
                        <span className="ion-hide-md-up" style={estiloCabecera}>Categoría: </span>
                        {p.categoria}
                      </IonCol>
                      <IonCol size="6" sizeMd="2">
                        <span className="ion-hide-md-up" style={estiloCabecera}>Frecuencia: </span>
                        {p.frecuencia}
                      </IonCol>
                      <IonCol size="12" sizeMd="2">
                        <IonChip
                          style={{
                            margin: 0,
                            '--background': p.activa ? '#2E6F5E' : '#F5F6F7',
                            '--color': p.activa ? '#FFFFFF' : '#1A1D1C',
                          } as React.CSSProperties}
                        >
                          <IonLabel>{p.activa ? 'Activa' : 'Inactiva'}</IonLabel>
                        </IonChip>
                      </IonCol>
                      <IonCol size="12" sizeMd="3">
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <IonButton size="small" fill="outline" onClick={() => abrirEdicion(p)}>
                            Editar
                          </IonButton>
                          {p.activa ? (
                            <IonButton size="small" fill="outline" onClick={() => setPendiente({ tipo: 'desactivar', plantilla: p })}>
                              Desactivar
                            </IonButton>
                          ) : (
                            <IonButton size="small" fill="outline" onClick={() => cambiarEstado(p, true)}>
                              Activar
                            </IonButton>
                          )}
                          {/* RF-07: una plantilla en uso no se puede eliminar, solo desactivar */}
                          <IonButton
                            size="small"
                            fill="outline"
                            color="danger"
                            disabled={enUso}
                            onClick={() => setPendiente({ tipo: 'eliminar', plantilla: p })}
                          >
                            Eliminar
                          </IonButton>
                        </div>
                        {enUso && (
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5F6B68' }}>
                            En uso por {p.usuariosActivos} usuarios: solo puede desactivarse.
                          </p>
                        )}
                      </IonCol>
                    </IonRow>
                  );
                })}
              </IonGrid>
            </div>

            {/* Formulario de crear / editar plantilla */}
            <IonModal isOpen={modalAbierto} onDidDismiss={() => setModalAbierto(false)}>
              <IonHeader>
                <IonToolbar>
                  <IonButtons slot="start">
                    <IonButton onClick={() => setModalAbierto(false)}>Cancelar</IonButton>
                  </IonButtons>
                  <IonTitle>{editandoId ? 'Editar plantilla' : 'Nueva plantilla'}</IonTitle>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <IonInput
                  className={`ion-margin-bottom ${errores.nombre ? 'ion-invalid ion-touched' : ''}`}
                  label="Nombre *"
                  labelPlacement="floating"
                  fill="outline"
                  maxlength={60}
                  counter
                  value={form.nombre}
                  errorText={errores.nombre}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, nombre: valor }));
                  }}
                />

                <IonTextarea
                  className="ion-margin-bottom"
                  label="Descripción (opcional)"
                  labelPlacement="floating"
                  fill="outline"
                  autoGrow
                  value={form.descripcion}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, descripcion: valor }));
                  }}
                />

                <IonSelect
                  className="ion-margin-bottom"
                  label="Categoría *"
                  labelPlacement="floating"
                  fill="outline"
                  interface="popover"
                  value={form.categoria}
                  onIonChange={(e) => {
                    const valor = e.detail.value as string;
                    setForm((f) => ({ ...f, categoria: valor }));
                  }}
                >
                  {CATEGORIAS.map((c) => (
                    <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                  ))}
                </IonSelect>
                {errores.categoria && (
                  <p style={{ margin: '-8px 0 16px', fontSize: 12, color: '#C0392B' }}>{errores.categoria}</p>
                )}

                <IonSelect
                  className="ion-margin-bottom"
                  label="Frecuencia sugerida"
                  labelPlacement="floating"
                  fill="outline"
                  interface="popover"
                  value={form.frecuencia}
                  onIonChange={(e) => {
                    const valor = e.detail.value as Frecuencia;
                    setForm((f) => ({ ...f, frecuencia: valor }));
                  }}
                >
                  <IonSelectOption value="Diaria">Diaria</IonSelectOption>
                  <IonSelectOption value="Semanal">Semanal</IonSelectOption>
                </IonSelect>

                <p style={{ fontSize: 13, color: '#5F6B68' }}>Los campos con * son obligatorios.</p>

                <IonButton expand="block" style={estiloBotonPrimario} onClick={guardar}>
                  {editandoId ? 'Guardar cambios' : 'Crear plantilla'}
                </IonButton>
              </IonContent>
            </IonModal>

            {/* Confirmación para eliminar o desactivar */}
            <IonAlert
              isOpen={pendiente !== null}
              header={pendiente?.tipo === 'eliminar' ? '¿Eliminar plantilla?' : '¿Desactivar plantilla?'}
              message={
                pendiente?.tipo === 'eliminar'
                  ? `"${pendiente.plantilla.nombre}" se eliminará de forma permanente.`
                  : 'Dejará de aparecer en el catálogo. Los usuarios que ya la adoptaron conservan su hábito.'
              }
              buttons={[
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: pendiente?.tipo === 'eliminar' ? 'Eliminar' : 'Desactivar',
                  role: 'destructive',
                  handler: () => {
                    if (pendiente) void ejecutarPendiente(pendiente);
                  },
                },
              ]}
              onDidDismiss={() => setPendiente(null)}
            />

            <IonToast
              isOpen={mensaje !== ''}
              message={mensaje}
              duration={2500}
              position="bottom"
              onDidDismiss={() => setMensaje('')}
            />
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default Admin;
