import React from 'react';
import {
    IonMenu, IonContent, IonList, IonItem, IonLabel, IonMenuToggle
} from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';

const LeftSideMenu: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    const appPages = [
        { title: 'Inicio', url: '/inicio' },
        { title: 'Mis Tareas', url: '/tareas' },
        { title: 'Catalogo', url: '/catalogo' },
        { title: 'Progreso', url: '/progreso' },
        { title: 'Perfil', url: '/perfil' }
    ];

    return (
        <IonMenu contentId="main-content" type="overlay">
            <IonContent className="ion-padding-vertical" style={{ '--background': '#f8f9fa' } as React.CSSProperties}>
                <div className="ion-padding" style={{ paddingBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>GesHab</h2>
                </div>

                <IonList style={{ background: 'transparent' }} lines="none">
                    {appPages.map((appPage, index) => {
                        const isSelected = location.pathname === appPage.url;
                        return (
                            <IonMenuToggle key={index} autoHide={false}>
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
                            style={{ '--background': '#e2f0e9', '--color': '#333', textAlign: 'center' } as React.CSSProperties}>
                            <IonLabel>Cerrar<br />sesion</IonLabel>
                        </IonItem>
                    </IonMenuToggle>
                </div>

            </IonContent>
        </IonMenu>
    );
};

export default LeftSideMenu;