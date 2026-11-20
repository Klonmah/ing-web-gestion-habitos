import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { haySesion, rutaDeInicio } from '../services/auth';
import { useVistaActiva } from './useVistaActiva';

/**
 * Login y Registro: quien ya inicio sesion no los ve, se le manda a la
 * pantalla de su rol (/inicio o /admin/plantillas).
 *
 * Solo redirige desde la vista activa: el Login queda oculto en la pila
 * de Ionic despues de entrar, y si redirigiera desde ahi devolveria al
 * usuario a su inicio en cada navegacion (ver useVistaActiva).
 */
const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const activa = useVistaActiva();
  if (activa && haySesion()) return <Navigate to={rutaDeInicio()} replace />;
  return <>{children}</>;
};

export default PublicRoute;
