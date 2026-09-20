import {Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import MisTareas from '../pages/MisTareas';
import Admin from '../pages/Admin';
import Login from '../pages/Login';
import PaginaPlaceholder from '../pages/PaginaPlaceholder';
import { IonRouterOutlet } from '@ionic/react';

function AppRoutes() {
    return (

        <IonRouterOutlet>

            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<PaginaPlaceholder />} />
            <Route path="/acceso-denegado" element={<PaginaPlaceholder />} />

            {/* Rutas protegidas */}
            <Route path="/tareas" element={<MisTareas />} />

            <Route path="/inicio" element={<Home />} />
            <Route path="/catalogo" element={<PaginaPlaceholder />} />

            <Route path="/habitos" element={<PaginaPlaceholder />} />

            <Route path="/progreso" element={<PaginaPlaceholder />} />
            <Route path="/perfil" element={<PaginaPlaceholder />} />
            <Route path="/recordatorios" element={<PaginaPlaceholder />} />
            <Route path="/configuraciones" element={<PaginaPlaceholder />} />


            {/* Ruta de admin */}
            <Route path="/admin" element={<Admin />} />

            {/* Ruta por defecto */}
            <Route path="/" element={<Home />} />

        </IonRouterOutlet>

    );
}

export default AppRoutes;