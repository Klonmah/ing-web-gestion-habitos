import React, { useEffect, useState } from 'react';
import {
  IonPage, IonSplitPane, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCheckbox, IonButton,
  IonIcon, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonAlert, IonToast
} from '@ionic/react';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import LeftSideMenu from '../components/LeftSideMenu';
import {
  listarTareas, crearTarea, actualizarTarea, eliminarTarea, estaVencida
} from '../services/tareasService';
import type { Tarea, DatosTarea, Prioridad } from '../services/tareasService';

// Colores del sistema de diseño (Figma).
const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  alta: '#C0392B',
  media: '#E8A33D',
  baja: '#5F6B68',
};

const FORM_VACIO: DatosTarea = { titulo: '', descripcion: '', fechaLimite: '', prioridad: 'media' };

type Errores = Partial<Record<'titulo' | 'fechaLimite', string>>;

const validar = (f: DatosTarea): Errores => {
  const errores: Errores = {};
  if (!f.titulo.trim()) errores.titulo = 'El título es obligatorio.';
  if (!f.fechaLimite) errores.fechaLimite = 'Selecciona una fecha límite.';
  return errores;
};

// "2026-09-24" -> "24 sept"
const formatearFecha = (iso: string): string =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

const MisTareas: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<DatosTarea>(FORM_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [porEliminar, setPorEliminar] = useState<Tarea | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    listarTareas().then(setTareas);
  }, []);

  const abrirNueva = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrores({});
    setModalAbierto(true);
  };

  const abrirEdicion = (t: Tarea) => {
    setEditandoId(t.id);
    setForm({ titulo: t.titulo, descripcion: t.descripcion, fechaLimite: t.fechaLimite, prioridad: t.prioridad });
    setErrores({});
    setModalAbierto(true);
  };

  const guardar = async () => {
    const nuevosErrores = validar(form);
    setErrores(nuevosErrores);
    // Si hay errores, el modal queda abierto y conserva lo escrito.
    if (Object.keys(nuevosErrores).length > 0) return;

    const datos: DatosTarea = { ...form, titulo: form.titulo.trim(), descripcion: form.descripcion.trim() };
    if (editandoId) {
      const actualizada = await actualizarTarea(editandoId, datos);
      setTareas((prev) => prev.map((t) => (t.id === actualizada.id ? actualizada : t)));
      setMensaje('Tarea actualizada.');
    } else {
      const nueva = await crearTarea(datos);
      setTareas((prev) => [...prev, nueva]);
      setMensaje('Tarea creada.');
    }
    setModalAbierto(false);
  };

  const alternarCompletada = async (t: Tarea, completada: boolean) => {
    const actualizada = await actualizarTarea(t.id, { completada });
    setTareas((prev) => prev.map((x) => (x.id === actualizada.id ? actualizada : x)));
  };

  const confirmarEliminar = async (t: Tarea) => {
    await eliminarTarea(t.id);
    setTareas((prev) => prev.filter((x) => x.id !== t.id));
    setMensaje('Tarea eliminada.');
  };

  // Pendientes primero, y dentro de cada grupo por fecha límite.
  const ordenadas = [...tareas].sort(
    (a, b) => Number(a.completada) - Number(b.completada) || a.fechaLimite.localeCompare(b.fechaLimite)
  );

  return (
    <IonPage>
      <IonSplitPane contentId="contenido-tareas" when="md">
        <LeftSideMenu contentId="contenido-tareas" />

        <div id="contenido-tareas" className="ion-page">
          {/* En móvil el menú se abre con este botón; en web queda fijo al costado */}
          <IonHeader className="ion-hide-md-up">
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Mis tareas</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 2rem' }}>
              <h1 style={{ fontWeight: 'bold', margin: 0 }}>Mis tareas</h1>
              <IonButton
                style={{ '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties}
                onClick={abrirNueva}
              >
                <IonIcon slot="start" icon={addOutline} />
                Agregar tarea
              </IonButton>
            </div>

            {ordenadas.length === 0 ? (
              <p style={{ color: '#5F6B68', textAlign: 'center', marginTop: '3rem' }}>
                Aún no tienes tareas. Crea la primera con “Agregar tarea”.
              </p>
            ) : (
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  {ordenadas.map((t) => {
                    const vencida = estaVencida(t);
                    return (
                      <IonCol size="12" sizeMd="6" key={t.id}>
                        <IonCard
                          className="ion-no-margin"
                          style={{ borderRadius: 12, marginBottom: 16, '--background': t.completada ? '#F5F6F7' : '#FFFFFF' } as React.CSSProperties}
                        >
                          <IonCardContent style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <IonCheckbox
                              checked={t.completada}
                              onIonChange={(e) => alternarCompletada(t, e.detail.checked)}
                              aria-label={`Marcar "${t.titulo}" como completada`}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h2 style={{
                                margin: 0, fontSize: 18, fontWeight: 600,
                                color: t.completada ? '#5F6B68' : '#1A1D1C',
                                textDecoration: t.completada ? 'line-through' : 'none'
                              }}>
                                {t.titulo}
                              </h2>
                              {/* La prioridad se indica con texto y no solo con color (RNF-04) */}
                              <p style={{ margin: '4px 0 0', fontSize: 13, color: vencida ? '#C0392B' : '#5F6B68' }}>
                                {vencida ? 'Vencida el ' : 'Vence '}{formatearFecha(t.fechaLimite)} · Prioridad {t.prioridad}
                              </p>
                            </div>

                            <span
                              aria-hidden="true"
                              style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_PRIORIDAD[t.prioridad], flexShrink: 0 }}
                            />

                            <IonButton fill="clear" onClick={() => abrirEdicion(t)} aria-label="Editar tarea">
                              <IonIcon slot="icon-only" icon={createOutline} />
                            </IonButton>
                            <IonButton fill="clear" color="danger" onClick={() => setPorEliminar(t)} aria-label="Eliminar tarea">
                              <IonIcon slot="icon-only" icon={trashOutline} />
                            </IonButton>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    );
                  })}
                </IonRow>
              </IonGrid>
            )}

            {/* Formulario de crear / editar */}
            <IonModal isOpen={modalAbierto} onDidDismiss={() => setModalAbierto(false)}>
              <IonHeader>
                <IonToolbar>
                  <IonButtons slot="start">
                    <IonButton onClick={() => setModalAbierto(false)}>Cancelar</IonButton>
                  </IonButtons>
                  <IonTitle>{editandoId ? 'Editar tarea' : 'Nueva tarea'}</IonTitle>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <IonInput
                  className={`ion-margin-bottom ${errores.titulo ? 'ion-invalid ion-touched' : ''}`}
                  label="Título *"
                  labelPlacement="floating"
                  fill="outline"
                  maxlength={80}
                  counter
                  value={form.titulo}
                  errorText={errores.titulo}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, titulo: valor }));
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

                <IonInput
                  className={`ion-margin-bottom ${errores.fechaLimite ? 'ion-invalid ion-touched' : ''}`}
                  type="date"
                  label="Fecha límite *"
                  labelPlacement="stacked"
                  fill="outline"
                  value={form.fechaLimite}
                  errorText={errores.fechaLimite}
                  onIonInput={(e) => {
                    const valor = e.detail.value ?? '';
                    setForm((f) => ({ ...f, fechaLimite: valor }));
                  }}
                />

                <IonSelect
                  className="ion-margin-bottom"
                  label="Prioridad"
                  labelPlacement="floating"
                  fill="outline"
                  interface="popover"
                  value={form.prioridad}
                  onIonChange={(e) => {
                    const valor = e.detail.value as Prioridad;
                    setForm((f) => ({ ...f, prioridad: valor }));
                  }}
                >
                  <IonSelectOption value="alta">Alta</IonSelectOption>
                  <IonSelectOption value="media">Media</IonSelectOption>
                  <IonSelectOption value="baja">Baja</IonSelectOption>
                </IonSelect>

                <p style={{ fontSize: 13, color: '#5F6B68' }}>Los campos con * son obligatorios.</p>

                <IonButton
                  expand="block"
                  style={{ '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties}
                  onClick={guardar}
                >
                  {editandoId ? 'Guardar cambios' : 'Crear tarea'}
                </IonButton>
              </IonContent>
            </IonModal>

            {/* Confirmación antes de una acción irreversible */}
            <IonAlert
              isOpen={porEliminar !== null}
              header="¿Eliminar tarea?"
              message={porEliminar ? `"${porEliminar.titulo}" se eliminará de forma permanente.` : ''}
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
              isOpen={mensaje !== ''}
              message={mensaje}
              duration={2000}
              color="success"
              position="bottom"
              onDidDismiss={() => setMensaje('')}
            />
          </IonContent>
        </div>
      </IonSplitPane>
    </IonPage>
  );
};

export default MisTareas;
