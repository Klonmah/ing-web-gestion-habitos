import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const userStr = localStorage.getItem('usuario');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.email.includes('@admingeshab')) {
    return <Navigate to="/acceso-denegado" replace />;
  }


  return <>{children}</>;
};

export default ProtectedRoute;