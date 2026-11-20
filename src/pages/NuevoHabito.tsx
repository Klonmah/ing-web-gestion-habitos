import React, { useState } from 'react';
import {
  IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel, IonText, IonIcon
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import PaginaConMenu from '../components/PaginaConMenu';
import { ApiError } from '../services/api';
import { crearHabito } from '../services/habitosService';
import type { DatosHabitoNuevo, Frecuencia } from '../services/habitosService';

type Campo = 'nombre' | 'frecuencia' | 'meta' | 'horario';
type Errores = Partial<Record<Campo, string>>;

// Nombre del campo en el backend -> campo del formulario.
const CAMPO_DEL_BACKEND: Record<string, Campo> = {
  nombre: 'nombre',
  frecuencia: 'frecuencia',
  meta: 'meta',
  horario_objetivo: 'horario',
};

const FORM_VACIO: DatosHabitoNuevo = { nombre: '', frecuencia: 'diaria', meta: '', horario: '' };

const estiloBotonPrimario = { '--background': '#2e6f5e', '--border-radius': '8px', textTransform: 'none' } as React.CSSProperties;

/**
 * Habito nuevo (RF-02): crea un habito propio, sin plantilla del
 * catalogo, con POST /api/habitos.
 *
 * Las reglas de cada campo las valida el backend con zod; si algo falla
 * responde 400 con el campo, y aqui el mensaje se muestra bajo el input
 * que corresponde. En el front solo se revisa que haya nombre.
 */
const NuevoHabito: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<DatosHabitoNuevo>(FORM_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = <K extends keyof DatosHabitoNuevo>(campo: K, valor: DatosHabitoNuevo[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrorGeneral('');
    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio.' });
      return;
    }

    setGuardando(true);
    try {
      await crearHabito(form);
      setForm(FORM_VACIO);
      setErrores({});
      // Inicio recarga la lista al volver a mostrarse.
      navigate('/inicio', { state: { habitoCreado: form.nombre.trim() } });
    } catch (err) {
      if (err instanceof ApiError && err.detalles.length > 0) {
        const porCampo: Errores = {};
        for (const { campo, mensaje } of err.detalles) {
          const propio = CAMPO_DEL_BACKEND[campo];
          if (propio && !porCampo[propio]) porCampo[propio] = mensaje;
        }
        setErrores(porCampo);
        if (Object.keys(porCampo).length === 0) setErrorGeneral(err.message);
      } else {
        setErrorGeneral(err instanceof Error ? err.message : 'No se pudo crear el hábito.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const claseCampo = (campo: Campo) => `ion-margin-bottom ${errores[campo] ? 'ion-invalid ion-touched' : ''}`;

  return (
    <PaginaConMenu titulo="Hábito nuevo" contentId="contenido-nuevo-habito" volverA="/inicio" volverTexto="Volver a Inicio">
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Hábito nuevo</h1>
        <p style={{ color: '#5F6B68', marginTop: 0 }}>
          Crea un hábito propio. Si prefieres uno sugerido, búscalo en el{' '}
          <a style={{ color: '#2e6f5e' }} href="/catalogo" onClick={(e) => { e.preventDefault(); navigate('/catalogo'); }}>catálogo</a>.
        </p>

        <form onSubmit={guardar} noValidate style={{ marginTop: '1.5rem' }}>
          <IonInput
            className={claseCampo('nombre')}
            label="Nombre"
            labelPlacement="floating"
            fill="outline"
            maxlength={60}
            counter
            value={form.nombre}
            errorText={errores.nombre}
            onIonInput={(e) => cambiar('nombre', e.detail.value ?? '')}
          />

          <p style={{ margin: '0.5rem 0', fontSize: 14, color: '#5F6B68' }}>Frecuencia</p>
          <IonSegment
            value={form.frecuencia}
            onIonChange={(e) => cambiar('frecuencia', (e.detail.value as Frecuencia) ?? 'diaria')}
            style={{ marginBottom: errores.frecuencia ? 4 : 16, '--ion-color-primary': '#2e6f5e', '--ion-color-primary-rgb': '46, 111, 94' } as React.CSSProperties}
          >
            <IonSegmentButton value="diaria"><IonLabel>Diaria</IonLabel></IonSegmentButton>
            <IonSegmentButton value="semanal"><IonLabel>Semanal</IonLabel></IonSegmentButton>
          </IonSegment>
          {errores.frecuencia && (
            <IonText color="danger"><p style={{ margin: '0 0 16px', fontSize: 12 }}>{errores.frecuencia}</p></IonText>
          )}

          <IonInput
            className={claseCampo('meta')}
            label="Meta (opcional)"
            labelPlacement="floating"
            fill="outline"
            placeholder="Ej.: 20 minutos, 2 litros"
            maxlength={60}
            value={form.meta}
            errorText={errores.meta}
            onIonInput={(e) => cambiar('meta', e.detail.value ?? '')}
          />

          <IonInput
            className={claseCampo('horario')}
            type="time"
            label="Horario objetivo (opcional)"
            labelPlacement="stacked"
            fill="outline"
            value={form.horario}
            errorText={errores.horario}
            onIonInput={(e) => cambiar('horario', e.detail.value ?? '')}
          />

          {errorGeneral && (
            <IonText color="danger"><p role="alert">{errorGeneral}</p></IonText>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: '1rem', flexWrap: 'wrap' }}>
            <IonButton type="submit" style={estiloBotonPrimario} disabled={guardando}>
              <IonIcon slot="start" icon={addOutline} />
              {guardando ? 'Guardando...' : 'Crear hábito'}
            </IonButton>
            <IonButton fill="clear" style={{ textTransform: 'none', '--color': '#2e6f5e' } as React.CSSProperties} onClick={() => navigate('/inicio')}>
              Cancelar
            </IonButton>
          </div>
        </form>
      </div>
    </PaginaConMenu>
  );
};

export default NuevoHabito;
