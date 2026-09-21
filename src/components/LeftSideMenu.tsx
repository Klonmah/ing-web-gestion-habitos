import React from 'react';
import {
    IonMenu, IonContent, IonList, IonItem, IonLabel, IonMenuToggle
} from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LeftSideMenuProps {
    // Qué opciones mostrar. El administrador no accede a las secciones del
    // usuario (ver matriz de acceso en el README).
    rol?: 'usuario' | 'admin';
    // Debe coincidir con el id del contenido principal de la página.
    contentId?: string;
}

const paginasUsuario = [
    { title: 'Inicio', url: '/inicio' },
    { title: 'Mis tareas', url: '/tareas' },
    { title: 'Catálogo', url: '/catalogo' },
    { title: 'Progreso', url: '/progreso' },
    { title: 'Perfil', url: '/perfil' }
];

const paginasAdmin = [
    { title: 'Plantillas', url: '/admin/plantillas' },
    { title: 'Categorías y métricas', url: '/admin/categorias-metricas' }
];

const LeftSideMenu: React.FC<LeftSideMenuProps> = ({ rol = 'usuario', contentId = 'main-content' }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    const appPages = rol === 'admin' ? paginasAdmin : paginasUsuario;

    return (
        <IonMenu contentId={contentId} type="overlay">
            <IonContent className="ion-padding-vertical" style={{ '--background': '#f8f9fa' } as React.CSSProperties}>
                <div className="ion-padding" style={{ paddingBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>GesHab</h2>
                </div>

                <IonList style={{ background: 'transparent' }} lines="none">
                    {appPages.map((appPage) => {
                        const isSelected = location.pathname === appPage.url;
                        return (
                            <IonMenuToggle key={appPage.url} autoHide={false}>
                                <IonItem
                                    routerLink={appPage.url}
                                    routerDirection="none"
                                    style={{
                                        '--background': isSelected ? '#e2f0e9' : 'transparent',
                                        '--color': '#4a7060',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <IonLabel style={{ textAlign: 'center', fontWeight: isSelected ? 'bold' : 'normal' }}>
                                        {appPage.title}
                                    </IonLabel>
                                </IonItem>
                            </IonMenuToggle>
                        );
                    })}
                </IonList>

                <div style={{ position: 'absolute', bottom: '20px', width: '100%' }}>
                    <IonMenuToggle autoHide={false}>
                        <IonItem
                            button
                            onClick={handleLogout}
                            lines="none"
                            style={{ '--background': 'transparent', '--color': '#C0392B', textAlign: 'center' } as React.CSSProperties}>
                            <IonLabel>Cerrar sesión</IonLabel>
                        </IonItem>
                    </IonMenuToggle>
                </div>

            </IonContent>
        </IonMenu>
    );
};

export default LeftSideMenu;
