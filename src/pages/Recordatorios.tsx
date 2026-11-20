import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton, IonCard, IonCardContent, IonChip, IonLabel, IonSelect, IonSelectOption, IonInput,
  IonToggle, IonIcon, IonAlert, IonToast, IonSpinner, IonText, IonList, IonItem
} from '@ionic/react';
import { addOutline, trashOutline, alarmOutline } from 'ionicons/icons';
import PaginaConMenu from '../components/PaginaConMenu';
import { ApiError } from '../services/api';
import { listarMisHabitos } from '../services/habitosService';
import type { HabitoResumen } from '../services/habitosService';
import {
  DIAS_SEMANA, nombreDia, listarRecordatorios, crearRecordatorio, cambiarActivoRecordatorio,
  eliminarRecordatorio
} from '../services/recordatoriosService';
import type { Recordatorio } from '../services/recordatoriosService';

const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;

interface Aviso {
  texto: string;
  color: 'success' | 'danger' | 'warning';
}

type Errores = Partial<Record<'habito' | 'dias' | 'hora', string>>;

/**
 * Recordatorios (RF-05).
 *
 * Lista los recordatorios del usuario agrupados por habito y permite
 * crearlos (eligiendo uno o varios dias y una hora), activarlos o
 * desactivarlos y eliminarlos. Cada dia es un recordatorio en el
 * backend: "Lun, Mié y Vie a las 08:00" se guarda como tres.
 */
const Recordatorios: React.FC = () => {
  const [habitos, setHabitos] = useState<HabitoResumen[]>([]);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [idHabito, setIdHabito] = useState<number | null>(null);
  const [dias, setDias] = useState<number[]>([]);
  const [hora, setHora] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  const [cambiandoId, setCambiandoId] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<Recordatorio | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // Si falla un cambio de estado se vuelve a montar el toggle para que
  // muestre el valor real (Ionic lo deja movido aunque no se guardo).
  const [revision, setRevision] = useState(0);

  const ultimaPeticion = useRef(0);
  const cargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current;
    const vigente = () => numero === ultimaPeticion.current;
    setErrorCarga('');
    try {
      const [listaHabitos, listaRecordatorios] = await Promise.all([listarMisHabitos(), listarRecordatorios()]);
      if (!vigente()) return;
      setHabitos(listaHabitos);
      setRecordatorios(listaRecordatorios);
    } catch (err) {
      if (vigente()) setErrorCarga(err instanceof Error ? err.message : 'No se pudieron cargar los recordatorios.');
    } finally {
      if (vigente()) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Recordatorios agrupados por habito, en el orden de la lista de habitos.
  const grupos = useMemo(() => {
    const porHabito = new Map<number, Recordatorio[]>();
    for (const r of recordatorios) {
      porHabito.set(r.id_habito, [...(porHabito.get(r.id_habito) ?? []), r]);
    }
    return habitos
      .filter((h) => porHabito.has(h.id))
      .map((h) => ({ habito: h, lista: porHabito.get(h.id)! }));
  }, [habitos, recordatorios]);

  const alternarDia = (numero: number) => {
    setDias((d) => (d.includes(numero) ? d.filter((x) => x !== numero) : [...d, numero].sort()));
    setErrores((e) => ({ ...e, dias: undefined }));
  };

  const agregar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const locales: Errores = {};
    if (idHabito === null) locales.habito = 'Elige un hábito.';
    if (dias.length === 0) locales.dias = 'Elige al menos un día.';
    if (!hora) locales.hora = 'Indica la hora.';
    setErrores(locales);
    if (Object.keys(locales).length > 0 || idHabito === null) return;

    setGuardando(true);
    const creados: number[] = [];
    const repetidos: number[] = [];
    let error: Error | null = null;
    // Un POST por dia. Si un dia ya tenia recordatorio a esa hora el
    // backend responde 409 y se sigue con los demas.
    for (const dia of dias) {
      try {
        await crearRecordatorio(idHabito, dia, hora);
        creados.push(dia);
      } catch (err) {
        if (err instanceof ApiError && err.estado === 409) {
          repetidos.push(dia);
        } else if (err instanceof ApiError && err.detalles.some((d) => d.campo === 'hora')) {
          setErrores({ hora: err.detalles.find((d) => d.campo === 'hora')!.mensaje });
          error = err;
          break;
        } else {
          error = err instanceof Error ? err : new Error('No se pudo crear el recordatorio.');
          break;
        }
      }
    }
    setGuardando(false);
    await cargar();

    if (error) {
      setAviso({ texto: error.message, color: 'danger' });
      return;
    }
    if (creados.length > 0) setDias([]);
    const nombres = (lista: number[]) => lista.map(nombreDia).join(', ');
    if (repetidos.length === 0) {
      setAviso({ texto: `Recordatorio agregado: ${nombres(creados)} a las ${hora}.`, color: 'success' });
    } else if (creados.length === 0) {
      setAviso({ texto: `Ya existía un recordatorio a las ${hora} para: ${nombres(repetidos)}.`, color: 'warning' });
    } else {
      setAviso({
        texto: `Agregado para ${nombres(creados)}. Ya existía para ${nombres(repetidos)}.`,
        color: 'warning',
      });
    }
  };

  const cambiarActivo = async (r: Recordatorio, activo: boolean) => {
    setCambiandoId(r.id_recordatorio);
    try {
      const actualizado = await cambiarActivoRecordatorio(r.id_recordatorio, activo);
      setRecordatorios((lista) => lista.map((x) => (x.id_recordatorio === r.id_recordatorio ? actualizado : x)));
    } catch (err) {
      setRevision((n) => n + 1);
      setAviso({ texto: err instanceof Error ? err.message : 'No se pudo actualizar el recordatorio.', color: 'danger' });
    } finally {
      setCambiandoId(null);
    }
  };

  const eliminar = async (r: Recordatorio) => {
    try {
      await eliminarRecordatorio(r.id_recordatorio);
      setRecordatorios((lista) => lista.filter((x) => x.id_recordatorio !== r.id_recordatorio));
      setAviso({ texto: 'Recordatorio eliminado.', color: 'success' });
    } catch (err) {
      setAviso({ texto: err instanceof Error ? err.message : 'No se pudo eliminar el recordatorio.', color: 'danger' });
      await cargar();
    }
  };

  return (
    <PaginaConMenu titulo="Recordatorios" contentId="contenido-recordatorios" volverA="/perfil" volverTexto="Volver">
      <h1 style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Recordatorios</h1>
      <p style={{ color: '#5F6B68', marginTop: 0 }}>
        Elige qué días y a qué hora quieres que te recordemos cada hábito.
      </p>

      {cargando ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}><IonSpinner name="crescent" /></div>
      ) : errorCarga ? (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <IonText color="danger"><p>{errorCarga}</p></IonText>
          <IonButton fill="outline" onClick={() => { setCargando(true); void cargar(); }}>Reintentar</IonButton>
        </div>
      ) : habitos.length === 0 ? (
        <p style={{ color: '#5F6B68', textAlign: 'center', marginTop: '3rem' }}>
          Primero crea o adopta un hábito para poder agregarle recordatorios.
        </p>
      ) : (
        <>
          {/* Formulario: habito, dias y hora */}
          <IonCard className="ion-no-margin" style={{ borderRadius: 12, marginBottom: 24, maxWidth: 640 }}>
            <IonCardContent>
              <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: '#1A1D1C' }}>Nuevo recordatorio</h2>
              <form onSubmit={agregar} noValidate>
                <IonSelect
                  label="Hábito"
                  labelPlacement="floating"
                  fill="outline"
                  interface="popover"
                  value={idHabito}
                  onIonChange={(e) => { setIdHabito(e.detail.value as number); setErrores((x) => ({ ...x, habito: undefined })); }}
                  className={errores.habito ? 'ion-invalid ion-touched' : ''}
                  data-testid="select-habito"
                >
                  {habitos.map((h) => (
                    <IonSelectOption key={h.id} value={h.id}>
                      {h.nombre}{h.activo ? '' : ' (inactivo)'}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                {errores.habito && <IonText color="danger"><p style={{ margin: '4px 0 0', fontSize: 12 }}>{errores.habito}</p></IonText>}

                <p style={{ margin: '16px 0 4px', fontSize: 14, color: '#5F6B68' }}>Días</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' }} role="group" aria-label="Días de la semana">
                  {DIAS_SEMANA.map((d) => {
                    const activo = dias.includes(d.numero);
                    return (
                      <IonChip
                        key={d.numero}
                        onClick={() => alternarDia(d.numero)}
                        aria-pressed={activo}
                        aria-label={d.largo}
                        data-testid={`dia-${d.numero}`}
                        style={{
                          '--background': activo ? '#2E6F5E' : '#FFFFFF',
                          '--color': activo ? '#FFFFFF' : '#1A1D1C',
                          border: '1px solid #D9DEDC',
                        } as React.CSSProperties}
                      >
                        <IonLabel>{d.corto}</IonLabel>
                      </IonChip>
                    );
                  })}
                </div>
                {errores.dias && <IonText color="danger"><p style={{ margin: '4px 0 0', fontSize: 12 }}>{errores.dias}</p></IonText>}

                <IonInput
                  type="time"
                  label="Hora"
                  labelPlacement="stacked"
                  fill="outline"
                  value={hora}
                  onIonInput={(e) => { setHora(e.detail.value ?? ''); setErrores((x) => ({ ...x, hora: undefined })); }}
                  className={`ion-margin-top ${errores.hora ? 'ion-invalid ion-touched' : ''}`}
                  errorText={errores.hora}
                  style={{ maxWidth: 220 }}
                />

                <IonButton type="submit" style={{ ...estiloBotonPrimario, marginTop: 16 }} disabled={guardando}>
                  <IonIcon slot="start" icon={addOutline} />
                  {guardando ? 'Guardando...' : 'Agregar'}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>

          {/* Listado agrupado por habito */}
          {grupos.length === 0 ? (
            <p style={{ color: '#5F6B68' }}>Todavía no tienes recordatorios.</p>
          ) : (
            grupos.map(({ habito, lista }) => (
              <section key={habito.id} style={{ marginBottom: 24, maxWidth: 640 }} data-testid={`grupo-${habito.id}`}>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={alarmOutline} aria-hidden="true" />
                  {habito.nombre}
                </h2>
                <IonList lines="full" style={{ borderRadius: 12 }}>
                  {lista.map((r) => (
                    <IonItem key={r.id_recordatorio} data-testid={`recordatorio-${r.id_recordatorio}`}>
                      <IonLabel style={{ opacity: r.activo ? 1 : 0.55 }}>
                        <h3 style={{ fontWeight: 600 }}>{nombreDia(r.dia_semana)} · {r.hora}</h3>
                        <p>{r.activo ? 'Activo' : 'Desactivado'}</p>
                      </IonLabel>
                      <IonToggle
                        key={`${r.id_recordatorio}-${revision}`}
                        slot="end"
                        checked={r.activo}
                        disabled={cambiandoId === r.id_recordatorio}
                        onIonChange={(e) => void cambiarActivo(r, e.detail.checked)}
                        aria-label={`Activar recordatorio del ${nombreDia(r.dia_semana)} a las ${r.hora}`}
                        style={{ '--ion-color-primary': '#2e6f5e', '--ion-color-primary-rgb': '46, 111, 94' } as React.CSSProperties}
                      />
                      <IonButton
                        slot="end"
                        fill="clear"
                        color="danger"
                        onClick={() => setPorEliminar(r)}
                        aria-label={`Eliminar recordatorio del ${nombreDia(r.dia_semana)} a las ${r.hora}`}
                      >
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              </section>
            ))
          )}
        </>
      )}

      <IonAlert
        isOpen={porEliminar !== null}
        header="Eliminar recordatorio"
        message={porEliminar ? `¿Eliminar el recordatorio de "${porEliminar.nombre_habito}" del ${nombreDia(porEliminar.dia_semana).toLowerCase()} a las ${porEliminar.hora}?` : ''}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Eliminar', role: 'destructive', handler: () => { if (porEliminar) void eliminar(porEliminar); } },
        ]}
        onDidDismiss={() => setPorEliminar(null)}
      />

      <IonToast
        isOpen={aviso !== null}
        message={aviso?.texto}
        duration={aviso?.color === 'success' ? 2000 : 3500}
        color={aviso?.color}
        position="bottom"
        onDidDismiss={() => setAviso(null)}
      />
    </PaginaConMenu>
  );
};

export default Recordatorios;
