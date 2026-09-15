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


## Flujos de Tareas


## Bocetos UI/UX
[Enlace a nuestro Figma] .....

## Tecnologías
- **Frontend:** Ionic Framework con React, TypeScript.
- **Estilos:** TailwindCSS / CSS.
- **Librerías principales:** 