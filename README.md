# App de Gestión de Hábitos y tareas

# Integrantes:
- Martin Díaz Valle
- Gabriel Martinez Oyarce
- Matias Labra Concha
- Ignacio Reyes Torres

# Distribución de responsabilidades
- Ignacio Reyes Torres / ROL A - ANALISIS Y DOCUMENTACIÓN
- Martin Díaz Valle / ROL B - UX Y ARQUITECTURA DE NAVEGACIÓN
- Gabriel Martinez Oyarce / ROL C - UI, COMPONENTES Y 2 PANTALLAS
- Matias Labra Concha / ROL D - FRONTEND (IONIC + REACT)
---

# Descripción general del sistema
El sistema es un gestor de hábitos hecho para ayudar a usuarios para que puedan construir, organizar y mantener rutinas diarias de manera eficiente. El objetivo principal de nuestra aplicación es fomentar tanto la constancia como la productividad personal a través de este sistema con un registro rápido y recordatorios.
La aplicación será completamente gratuita en donde todos los usuarios registrados tienen acceso a todas las funciones de la aplicación sin restricciones de suscripción.

## Índice
1. [Justificación del problema](#justificación-del-problema)
2. [Usuarios objetivo](#usuarios-objetivo)
    - [Roles del Sistema](#roles-del-sistema)
    - [Proto-personas](#proto-personas)
3. [Requerimientos](#requerimientos)
4. [Arquitectura de Navegación](#arquitectura-de-navegación)
    - [Diferenciación por roles](#diferenciación-de-acceso-según-roles)
    - [Flujos de Tareas](#flujos-de-tareas)
    - [Puntos críticos de interacción](#puntos-críticos-de-interacción)
    - [Justificación Técnica](#justificación-técnica)
5. [Bocetos UI/UX](#bocetos-uiux)
6. [Tecnologías y Librerías](#tecnologías)

---

## Justificación del problema
El sedentarismo y la falta de organización personal afectan negativamente el bienestar general. Más de 1.400 millones de personas adultas suelen abandonar sus metas de actividad física o productividad. El desarrollo de esta plataforma permitirá centralizar la gestión de hábitos y tareas en una interfaz ágil, reduciendo el abandono y fomentando la constancia a través de rachas de cumplimiento.

---

## Usuarios objetivo (quienes usarán la aplicación)
Realmente un gestor de hábitos se puede hacer para una amplia variedad de usuarios que busquen mejorar su constancia, poder organizar sus rutinas o alcanzar metas específicas, como por ejemplo tenemos a estudiantes, profesionales, deportistas, diseñadores, etc.

---

### Roles del Sistema
- **Usuario:** Gestiona sus propias tareas y hábitos. Su experiencia e información es individual y privada.
- **Administrador:** Usuario encargado en gestionar generalmente la plataforma sin acceder a los datos personales de los usuarios.

---

## Proto-personas
> **Nota:** Las siguientes proto-personas corresponden a perfiles hipotéticos. No representan resultados obtenidos de usuarios reales.

### Proto-persona 1: Usuario Estándar enfocado en la constancia
**Nombre ficticio:** Anselmo
**Tipo de usuario o rol:** Usuario
**Características:** Universitario de 22 años con poco tiempo libre. Combina sus clases con entrenamientos en el gimnasio.
**Necesidades principales:** 
- Registrar rápidamente el cumplimiento de un hábito.
- Privacidad absoluta sobre su información.
- Conocer su porcentaje de cumplimiento semanal.
**Objetivos de uso:** Unificar sus recordatorios y mantener rachas de hábitos para no perder la motivación.
**Dificultades/Frustraciones:** Aplicaciones lentas o que requieren más de 4 clics para registrar una tarea.
**Funcionalidades que utilizaría:** Gestión de tareas (RF-01), Registro de cumplimiento (RF-03), Panel de progreso (RF-04) y Recordatorios (RF-05).
**Dispositivo probable:** Principalmente teléfono móvil.

### Proto-persona 2: Usuario enfocado en la organización laboral
**Nombre ficticio:** lucy
**Tipo de usuario o rol:** Usuario
**Características:** Profesional de 28 años encargada de liderar varios proyectos simultáneos por lo que mantiene una agenda bastante ocupada y ajustada.
**Necesidades principales:**
- Planificar hábitos para días específicos de la semana.
- Poder ver de forma clara su agenda de tareas para poder organizar sus mañanas de manera rápida.
**Objetivos de uso:** Poder agendar sus rutinas diarias para poder ser eficiente, evitar la procrastinación en sus metas personales y tener un balance en el día a día
**Dificultades/Frustraciones:** Aplicaciones que mezclan todas las tareas en una sola lista desorganizada o que no permite configurar hábitos para días específicos.
**Funcionalidades que utilizaría:** Gestión de tareas (RF-01), Categorización/Filtros de hábitos (RF-02), Registro de cumplimiento (RF-03) y Recordatorios (RF-05).
**Dispositivo probable:** Teléfono móvil.

---

### Requerimientos Funcionales
| ID | Requerimiento funcional | Rol |
|---|---|---|
| **RF-01** | Permitir al usuario crear, consultar, editar y eliminar tareas personales (título, descripción, fecha límite y prioridad). | Usuario |
| **RF-02** | Permitir adoptar un hábito del catálogo o definir uno propio (frecuencia, meta, horario). | Usuario |
| **RF-03** | Registrar la fecha de cumplimiento y actualizar la racha de días consecutivos. | Usuario |
| **RF-04** | Permitir consultar porcentaje de cumplimiento semanal y mensual. | Usuario |
| **RF-05** | Notificar al usuario en el día y hora configurados para el hábito. | Usuario |
| **RF-06** | Filtrar catálogo de hábitos por categoría y nivel de dificultad. | Usuario |
| **RF-07** | Permitir al administrador crear, editar y desactivar plantillas de hábitos (sin eliminarlas si están en uso). | Admin |
| **RF-08** | Gestionar categorías y consultar métricas agregadas anonimizadas (acceso denegado con 403 a usuarios normales). | Admin |

### Requerimientos No Funcionales
Los requerimientos no funcionales establecen condiciones de calidad que deberá cumplir la plataforma.

- **RNF-01 (Rendimiento):** Desplegar el listado de hábitos del día en máximo 2 segundos (conexión 4G).
- **RNF-02 (Seguridad):** Contraseñas con bcrypt, mínimo 8 caracteres alfanuméricos y rechazo de JWT expirado (>24h).
- **RNF-03 (Usabilidad):** Registrar un hábito en máximo 2 interacciones desde el inicio.
- **RNF-04 (Accesibilidad):** Contraste mínimo 4.5:1 y escalado de texto hasta 200%.
- **RNF-05 (Compatibilidad):** Renderizar sin scroll horizontal entre 360 y 1280 píxeles.

---

## Arquitectura de Navegación
---

### 1.Rutas Principales y Secundarias:

**Rutas públicas:**

| Ruta               | Vista           | Redirección                                                                                | Descripción                                                                                       |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `/login`           | Login           | Tiene sesión de Usuario -> `/inicio`, Tiene sesión de Administrador -> `/admin/plantillas` | Permite al Usuario ingresar a la App con los datos de su cuenta                                   |
| `/registro`        | Registro        | Tiene sesión de Usuario -> `/inicio`, Tiene sesión de Administrador -> `/admin/plantillas` | Permite Crear una nueva cuenta para el Usuario.                                                   |
| `/acceso-denegado` | Acceso Denegado | Ninguna                                                                                    | Página a la cual se envían a las personas que intentan entrar a rutas de administrador sin serlo. |


**Rutas Protegidas del Usuario:**

| Ruta        | Vista      | RF           | Descripción                                                                                                                |
| ----------- | ---------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/inicio`   | Inicio     | RF-03        | Lista los hábitos del día. Al marcar uno como cumplido se guarda la fecha y hora del cumplimiento y se actualiza su racha. |
| `/tareas`   | Mis tareas | RF-01        | Lista las tareas del usuario con su fecha límite y prioridad, y permite crear, editar o eliminar cada una                  |
| `/catalogo` | Catálogo   | RF-02, RF-06 | Muestra plantillas de hábitos filtrables por categoría y dificultad, y permite adoptarlas                                  |
| `/progreso` | Progreso   | RF-04        | Permite ver el porcentaje de cumplimiento de hábitos de forma semanal y mensual.                                           |
| `/perfil`   | Perfil     |              | Permite ver y cambiar el nombre de usuario, foto y sirve para entrar a las configuraciones.                                |

Si no hay sesión, todas redirigen a `/login`.

 **Rutas Secundarias del Usuario:**

| Ruta                  | Vista               | Padre                   | RF           | Descripción                                                                                                                                   |
| --------------------- | ------------------- | ----------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tareas/nueva`       | Nueva tarea         | `/tareas`               | RF-01        | Página para que el usuario pueda crear una nueva tarea.                                                                                       |
| `/tareas/:id/editar`  | Editar tarea        | `/tareas`               | RF-01        | Permite al usuario cambiar la información de una tarea ya creada o eliminarla.                                                                |
| `/habitos/nuevo`      | Nuevo hábito propio | `/catalogo` o `/inicio` | RF-02        | Permite al usuario crear un nuevo hábito desde cero o precargar uno de `/catalogo`.                                                           |
| `/habitos/:id`        | Detalle del hábito  | `/inicio`               | RF-02, RF-03 | Muestra la racha actual, el historial de cumplimientos (con fecha y hora) y el acceso a editar el hábito.                                     |
| `/habitos/:id/editar` | Editar hábito       | `/habitos/:id`          | RF-02        | Página que permite al usuario editar los datos del hábito y eliminarlo.                                                                       |
| `/recordatorios`      | Recordatorios       | `/perfil`               | RF-05        | Permite al Usuario gestionar sus notificaciones, para ver qué hábito necesita recordatorio, cuál no y a qué hora debe llegar el recordatorio. |
| `/configuraciones`    | Configuraciones     | `/perfil`               |              | Permite cambiar entre el modo oscuro y el claro"y cerrar sesión.                                                                              |
Si no hay sesión, todas redirigen a `/login`.

**Rutas Protegidas del Administrador:**

| Ruta                           | Vista                 | RF    | Descripción                                                                                                                             |
| ------------------------------ | --------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/plantillas`            | Gestión de Plantillas | RF-07 | Página en la cual el administrador podrá decidir si crear, editar o desactivar una plantilla (no se pueden desactivar si están en uso). |
| `/admin/plantillas/nueva`      | Nueva plantilla       | RF-07 | Página en la cual el Administrador creará una nueva plantilla.                                                                          |
| `/admin/plantillas/:id/editar` | Editar plantilla      | RF-07 | Página en la cual el Administrador podrá editar una plantilla por su ID.                                                                |
| `/admin/categorias-metricas`   | Categorías y métricas | RF-08 | Permite gestionar categorías y consultar métricas agregadas y anonimizadas del uso de la app                                            |
Todas las rutas de administrador requieren sesión activa y rol de administrador. Sin sesión → `/login`. Usuario normal → `/acceso-denegado`.

**Rutas especiales:**

| Ruta | Vista                                                                                 | Redirección                                                                     | Descripción                                                                 |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/`  | Ninguna (solo redirige a inicio o login o admin/plantillas dependiendo de la persona) | Sin sesión → `/login`; usuario → `/inicio`; administrador → `/admin/plantillas` | Ruta raíz de la aplicación.                                                 |
| `*`  | Página no encontrada (404)                                                            | Ninguna                                                                         | Se muestra cuando la URL no existe y ofrece un botón para volver al inicio. |

### 2. Relaciones jerárquicas entre vistas

La aplicación se organiza mediante una estructura jerárquica en la cual solo se puede acceder a ciertas páginas si la persona que ingresa es un Usuario registrado o un Administrador.

```text
Aplicación
│
├── Rutas públicas
│   ├── / (redirige según sesión y rol)
│   ├── /login 
│   ├── /registro 
│   ├── /acceso-denegado 
│   └── * (Página no encontrada)
│
└── Rutas protegidas
    │
    ├── Usuario
    │   ├── /inicio 
    │   │   └── /habitos/:id 
    │   │       └── /habitos/:id/editar 
    │   ├── /tareas 
    │   │   ├── /tareas/nueva 
    │   │   └── /tareas/:id/editar 
    │   ├── /catalogo 
    │   │   └── /habitos/nuevo 
    │   ├── /progreso 
    │   └── /perfil 
    │       ├── /recordatorios 
    │       └── /configuraciones 
    │
    └── Administrador
        ├── /admin/plantillas 
        │   ├── /admin/plantillas/nueva 
        │   └── /admin/plantillas/:id/editar
        └── /admin/categorias-metricas 
```

*Nota: `/habitos/nuevo` aparece bajo `/catalogo`, pero también se puede acceder desde `/inicio`.*

## Diferenciación de acceso según roles

La aplicación controla el acceso a diferentes funcionalidades dependiendo del rol de la persona que entre al sistema, la cual tiene los siguientes roles principales:

- **Usuario**
- **Administrador**

### Matriz de acceso por rol


|                     Funcionalidad                      |  RF   | Usuario | Administrador |
| :----------------------------------------------------: | :---: | :-----: | :-----------: |
|       Crear, consultar, editar y eliminar tareas       | RF-01 |    ✓    |       -       |
|             Adoptar un hábito del catálogo             | RF-02 |    ✓    |       -       |
|             Crear y editar hábitos propios             | RF-02 |    ✓    |       -       |
|     Filtrar el catálogo por categoría y dificultad     | RF-06 |    ✓    |       -       |
|   Registrar cumplimiento de un hábito y ver su racha   | RF-03 |    ✓    |       -       |
| Consultar porcentaje de cumplimiento semanal y mensual | RF-04 |    ✓    |       -       |
|                Configurar recordatorios                | RF-05 |    ✓    |       -       |
|            Editar perfil y configuraciones             |   -   |    ✓    |       -       |
|                     Cerrar sesión                      |   -   |    ✓    |       ✓       |
|    Crear, editar y desactivar plantillas de hábitos    | RF-07 |    -    |       ✓       |
|                  Gestionar categorías                  | RF-08 |    -    |       ✓       |
|      Consultar métricas agregadas y anonimizadas       | RF-08 |    -    |       ✓       |
### Acceso del Usuario 
El usuario tiene acceso a las funcionalidades relacionadas con la gestión de sus propios hábitos y tareas. 
Podrá:
- Crear, editar y eliminar tareas.
- Adoptar hábitos del catálogo o crear hábitos propios.
- Registrar el cumplimiento de sus hábitos y consultar su racha.
- Consultar su porcentaje de cumplimiento semanal y mensual.
- Configurar recordatorios.
- Editar su perfil y configuraciones.

El usuario no podrá acceder a las rutas de administración ni a la información de otros usuarios.
### Acceso del Administrador 
El administrador es responsable de la gestión general de la plataforma. 
Podrá: 
- crear, editar y desactivar plantillas de hábitos.
- gestionar las categorías.
- consultar métricas agregadas y anonimizadas.

 El administrador no tiene acceso a las tareas ni a los hábitos personales de los usuarios.
 
### Control de acceso a rutas
 
 La diferenciación por roles se aplica tanto en la interfaz como en las rutas de la aplicación. El menú muestra solo las opciones correspondientes al rol, y las rutas protegidas verifican la sesión y el rol antes de mostrarse: sin sesión se redirige a `/login`, y un usuario que intenta entrar a una ruta de administrador se redirige a `/acceso-denegado`. Además, el servidor valida el rol en cada solicitud y responde 403 ante un acceso no autorizado (RF-08).
 
 Por ejemplo:
```text
# Públicas
/login
/registro
/acceso-denegado

# Usuario 
/inicio
/tareas
/tareas/nueva
/tareas/:id/editar
/catalogo
/habitos/nuevo
/habitos/:id
/habitos/:id/editar
/progreso
/perfil
/recordatorios
/configuraciones

# Administrador
/admin/plantillas
/admin/plantillas/nueva
/admin/plantillas/:id/editar
/admin/categorias-metricas

## Flujos de Tareas


## Bocetos UI/UX
[Enlace a nuestro Figma] .....

## Tecnologías
- **Frontend:** Ionic Framework con React, TypeScript.
- **Estilos:** TailwindCSS / CSS.
- **Librerías principales:** 
