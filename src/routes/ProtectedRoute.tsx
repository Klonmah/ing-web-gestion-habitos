import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuario } from '../services/api';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const user = obtenerUsuario();

  // Sin sesion (usuario + token) se manda al login.
  if (!user || !obtenerToken()) {
    return <Navigate to="/login" replace />;
  }

  // Esto solo decide que pantallas se muestran; la proteccion real de
  // /admin/* la hace el backend con 403 (requiereAdmin).
  if (requireAdmin && user.rol !== 'admin') {
    return <Navigate to="/acceso-denegado" replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;