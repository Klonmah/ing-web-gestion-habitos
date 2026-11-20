import { Route } from 'react-router-dom';

import Home from '../pages/Home';
import MisTareas from '../pages/MisTareas';
import Admin from '../pages/Admin';
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import Catalogo from '../pages/Catalogo';
import Progreso from '../pages/Progreso';
import CategoriasMetricas from '../pages/CategoriasMetricas';
import NuevoHabito from '../pages/NuevoHabito';
import Recordatorios from '../pages/Recordatorios';
import Perfil from '../pages/Perfil';
import Configuracion from '../pages/Configuracion';
import PaginaPlaceholder from '../pages/PaginaPlaceholder';
import { IonRouterOutlet } from '@ionic/react';
import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
    return (

        <IonRouterOutlet>

            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/acceso-denegado" element={<PaginaPlaceholder />} />

            {/* Rutas protegidas */}
            <Route path="/tareas" element={<ProtectedRoute><MisTareas /></ProtectedRoute>} />

            <Route path="/inicio" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/catalogo" element={<ProtectedRoute><Catalogo /></ProtectedRoute>} />

            <Route path="/habitos/nuevo" element={<ProtectedRoute><NuevoHabito /></ProtectedRoute>} />

            <Route path="/progreso" element={<ProtectedRoute><Progreso /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/recordatorios" element={<ProtectedRoute><Recordatorios /></ProtectedRoute>} />
            <Route path="/configuraciones" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />


            {/* Rutas de admin */}
            <Route path="/admin/plantillas" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
            <Route path="/admin/categorias-metricas" element={<ProtectedRoute requireAdmin={true}><CategoriasMetricas /></ProtectedRoute>} />

            {/* Ruta por defecto */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        </IonRouterOutlet>

    );
}

export default AppRoutes;
