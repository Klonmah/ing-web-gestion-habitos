import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import Inicio from '../pages/Inicio';
import MisTareas from '../pages/MisTareas';
import Admin from '../pages/Admin';

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas protegidas */}
                <Route path="/inicio" element={<Inicio />} />
                <Route path="/tareas" element={<MisTareas />} />

                {/* Ruta de admin */}
                <Route path="/admin" element={<Admin />} />

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;