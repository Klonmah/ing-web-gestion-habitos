import { Navigate, Route } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';

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
import { rutaDeInicio } from '../services/auth';

// La raiz no tiene pantalla propia: lleva al login o al inicio del rol.
const RedireccionInicial = () => <Navigate to={rutaDeInicio()} replace />;

function AppRoutes() {
  return (
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
  );
}

export default AppRoutes;
