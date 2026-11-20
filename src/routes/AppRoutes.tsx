import React from 'react';
import { Navigate, Route, useLocation } from 'react-router-dom';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import {
  homeOutline, checkboxOutline, gridOutline, statsChartOutline, personCircleOutline
} from 'ionicons/icons';

import Login from '../pages/Login';
import Registro from '../pages/Registro';
import AccesoDenegado from '../pages/AccesoDenegado';
import NoEncontrada from '../pages/NoEncontrada';
import Home from '../pages/Home';
import MisTareas from '../pages/MisTareas';
import Catalogo from '../pages/Catalogo';
import Progreso from '../pages/Progreso';
import NuevoHabito from '../pages/NuevoHabito';
import Recordatorios from '../pages/Recordatorios';
import Perfil from '../pages/Perfil';
import Configuracion from '../pages/Configuracion';
import Admin from '../pages/Admin';
import CategoriasMetricas from '../pages/CategoriasMetricas';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { obtenerUsuario, rutaDeInicio } from '../services/auth';

// La raiz no tiene pantalla propia: lleva al login o al inicio del rol.
const RedireccionInicial = () => <Navigate to={rutaDeInicio()} replace />;

// Secciones de la barra inferior (las mismas del menu lateral del usuario).
const TABS = [
  { tab: 'inicio', ruta: '/inicio', texto: 'Inicio', icono: homeOutline },
  { tab: 'tareas', ruta: '/tareas', texto: 'Tareas', icono: checkboxOutline },
  { tab: 'catalogo', ruta: '/catalogo', texto: 'Catálogo', icono: gridOutline },
  { tab: 'progreso', ruta: '/progreso', texto: 'Progreso', icono: statsChartOutline },
  { tab: 'perfil', ruta: '/perfil', texto: 'Perfil', icono: personCircleOutline },
];

/**
 * Rutas de la app, dentro de un unico IonTabs.
 *
 * Todas las rutas comparten el outlet de las tabs. No se usa una ruta
 * contenedora "/*" con un IonTabs anidado porque @ionic/react-router 9
 * trata a "/*" como un contenedor cuya base es "" y cree que /login y
 * /inicio estan "dentro del mismo contenedor": se salta la transicion y
 * la pantalla queda invisible (ion-page-invisible) al entrar desde Login.
 *
 * La barra inferior solo se ve en pantallas angostas (ion-hide-md-up) y
 * solo con sesion de usuario: en web, desde 768 px, se navega con el menu
 * lateral fijo, y el administrador y las pantallas publicas no la usan.
 */
function AppRoutes() {
  // Se lee la ubicacion para que la barra se actualice al navegar (por
  // ejemplo, al iniciar o cerrar sesion).
  useLocation();
  const conBarra = obtenerUsuario()?.rol === 'usuario';

  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Publicas: con sesion iniciada redirigen al inicio del rol */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/registro" element={<PublicRoute><Registro /></PublicRoute>} />
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />

        {/* Solo usuario: un admin vuelve a /admin/plantillas */}
        <Route path="/inicio" element={<ProtectedRoute rol="usuario"><Home /></ProtectedRoute>} />
        <Route path="/tareas" element={<ProtectedRoute rol="usuario"><MisTareas /></ProtectedRoute>} />
        <Route path="/catalogo" element={<ProtectedRoute rol="usuario"><Catalogo /></ProtectedRoute>} />
        <Route path="/progreso" element={<ProtectedRoute rol="usuario"><Progreso /></ProtectedRoute>} />
        <Route path="/recordatorios" element={<ProtectedRoute rol="usuario"><Recordatorios /></ProtectedRoute>} />
        <Route path="/habitos/nuevo" element={<ProtectedRoute rol="usuario"><NuevoHabito /></ProtectedRoute>} />

        {/* Ambos roles */}
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/configuraciones" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />

        {/* Solo admin: un usuario normal va a /acceso-denegado */}
        <Route path="/admin/plantillas" element={<ProtectedRoute rol="admin"><Admin /></ProtectedRoute>} />
        <Route path="/admin/categorias-metricas" element={<ProtectedRoute rol="admin"><CategoriasMetricas /></ProtectedRoute>} />

        <Route path="/" element={<RedireccionInicial />} />
        <Route path="*" element={<NoEncontrada />} />
      </IonRouterOutlet>

      <IonTabBar
        slot="bottom"
        className="ion-hide-md-up"
        style={conBarra ? undefined : { display: 'none' }}
        data-testid="barra-tabs"
      >
        {TABS.map((t) => (
          <IonTabButton
            key={t.tab}
            tab={t.tab}
            href={t.ruta}
            style={{ '--color-selected': '#2e6f5e' } as React.CSSProperties}
          >
            <IonIcon icon={t.icono} aria-hidden="true" />
            <IonLabel>{t.texto}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonTabs>
  );
}

export default AppRoutes;
