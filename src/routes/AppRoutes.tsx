import {Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import MisTareas from '../pages/MisTareas';
import Admin from '../pages/Admin';
import Login from '../pages/Login';
import PaginaPlaceholder from '../pages/PaginaPlaceholder';
import { IonRouterOutlet } from '@ionic/react';
import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
    return (

        <IonRouterOutlet>

            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<PaginaPlaceholder />} />
            <Route path="/acceso-denegado" element={<PaginaPlaceholder />} />

            {/* Rutas protegidas */}
            <Route path="/tareas" element={<ProtectedRoute><MisTareas /></ProtectedRoute>} />

            <Route path="/inicio" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/catalogo" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />

            <Route path="/habitos/nuevo" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />

            <Route path="/progreso" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />
            <Route path="/recordatorios" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />
            <Route path="/configuraciones" element={<ProtectedRoute><PaginaPlaceholder /></ProtectedRoute>} />


            {/* Ruta de admin */}
            <Route path="/admin/plantillas" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />

            {/* Ruta por defecto */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        </IonRouterOutlet>

    );
}

export default AppRoutes;