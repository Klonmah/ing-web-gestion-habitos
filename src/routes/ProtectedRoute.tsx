import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerToken, obtenerUsuario, RUTA_INICIO } from '../services/auth';
import type { Rol } from '../services/auth';
import { useVistaActiva } from './useVistaActiva';

interface ProtectedRouteProps {
  children: ReactNode;
  // Rol que puede entrar. Sin "rol", entran los dos (Perfil, Configuracion).
  rol?: Rol;
}

/**
 * Protege una ruta del frontend:
 *  - Sin sesion (token + usuario): al login.
 *  - Un usuario normal en una ruta de admin: a /acceso-denegado.
 *  - Un admin en una ruta de usuario: vuelve a su panel.
 *
 * Solo redirige si la pantalla es la que se esta mostrando (ver
 * useVistaActiva): una pantalla oculta en la pila de Ionic, por ejemplo
 * Inicio despues de cerrar sesion, no debe navegar por su cuenta.
 *
 * Esto solo decide que pantallas se muestran; la proteccion real la hace
 * el backend (401 sin token y 403 en /api/admin para quien no es admin).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, rol }) => {
  const activa = useVistaActiva();
  const usuario = obtenerUsuario();

  let destino: string | null = null;
  if (!usuario || !obtenerToken()) {
    destino = '/login';
  } else if (rol && usuario.rol !== rol) {
    destino = rol === 'admin' ? '/acceso-denegado' : RUTA_INICIO[usuario.rol];
  }

  if (destino && activa) return <Navigate to={destino} replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
