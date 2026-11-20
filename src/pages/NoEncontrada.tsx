import React from 'react';
import { compassOutline } from 'ionicons/icons';
import PaginaAviso from '../components/PaginaAviso';

/** Cualquier ruta que no existe (ruta "*" de AppRoutes). */
const NoEncontrada: React.FC = () => (
  <PaginaAviso
    icono={compassOutline}
    codigo="ERROR 404"
    titulo="Página no encontrada"
    texto="La dirección que abriste no existe en GesHab. Revisa el enlace o vuelve a tu pantalla principal."
    testId="pagina-404"
  />
);

export default NoEncontrada;
