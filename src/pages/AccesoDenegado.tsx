import React from 'react';
import { lockClosedOutline } from 'ionicons/icons';
import PaginaAviso from '../components/PaginaAviso';

/**
 * Se muestra cuando un usuario normal intenta abrir una ruta de
 * administracion. El backend tambien lo impide: /api/admin responde 403.
 */
const AccesoDenegado: React.FC = () => (
  <PaginaAviso
    icono={lockClosedOutline}
    codigo="ACCESO DENEGADO"
    titulo="No tienes permiso para ver esta página"
    texto="Esta sección es solo para administradores de GesHab. Si crees que es un error, contacta al administrador."
    testId="pagina-acceso-denegado"
  />
);

export default AccesoDenegado;
