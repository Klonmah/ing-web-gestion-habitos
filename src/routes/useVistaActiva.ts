import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Indica si la vista que usa el hook es la que se esta mostrando.
 *
 * IonRouterOutlet no desmonta las pantallas que quedan atras: las deja
 * ocultas en la pila para poder volver con animacion. Si una pantalla
 * oculta devuelve un <Navigate>, ese redirect se vuelve a ejecutar cada
 * vez que se re-renderiza y saca al usuario de la pantalla en que esta
 * (por ejemplo, el Login oculto mandaba de vuelta a /inicio al ir a
 * /tareas). Por eso las guardas de ruta solo redirigen desde la vista
 * activa: la que se monto con la URL actual.
 */
export const useVistaActiva = (): boolean => {
  const { pathname } = useLocation();
  const rutaAlMontar = useRef(pathname);
  return pathname === rutaAlMontar.current;
};
