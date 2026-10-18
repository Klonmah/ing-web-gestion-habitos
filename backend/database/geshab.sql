-- Motor: PostgreSQL
-- Ejecutar desde la raiz del repo con:
-- psql -U postgres -f backend/database/geshab.sql
\encoding UTF8


-- Creacion de la base de datos

DROP DATABASE IF EXISTS geshab;
CREATE DATABASE geshab ENCODING 'UTF8';

-- Cambia la conexion a la base recien creada
\c geshab

-- pgcrypto permite generar hashes bcrypt para los usuarios de prueba
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

-- 1.1 usuario 
CREATE TABLE usuario (
    id_usuario       SERIAL        PRIMARY KEY,
    nombre           VARCHAR(80)   NOT NULL,
    correo           VARCHAR(120)  NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(60)   NOT NULL,   -- bcrypt siempre mide 60
    rol              VARCHAR(20)   NOT NULL DEFAULT 'usuario',
    fecha_registro   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuario_rol
        CHECK (rol IN ('usuario', 'admin')),
    CONSTRAINT chk_usuario_correo
        CHECK (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- 1.2 categoria (RF-08) 
CREATE TABLE categoria (
    id_categoria  SERIAL       PRIMARY KEY,
    nombre        VARCHAR(50)  NOT NULL UNIQUE,
    descripcion   TEXT
);

-- 1.3 plantilla_habito (RF-06, RF-07)
CREATE TABLE plantilla_habito (
    id_plantilla         SERIAL       PRIMARY KEY,
    id_categoria         INT          NOT NULL,
    nombre               VARCHAR(60)  NOT NULL UNIQUE,
    descripcion          TEXT,
    dificultad           VARCHAR(10)  NOT NULL,
    frecuencia_sugerida  VARCHAR(10)  NOT NULL,
    activa               BOOLEAN      NOT NULL DEFAULT TRUE,

    -- No se puede borrar una categoria que aun tenga plantillas
    CONSTRAINT fk_plantilla_categoria
        FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
        ON DELETE RESTRICT,
    CONSTRAINT chk_plantilla_dificultad
        CHECK (dificultad IN ('baja', 'media', 'alta')),
    CONSTRAINT chk_plantilla_frecuencia
        CHECK (frecuencia_sugerida IN ('diaria', 'semanal'))
);

-- 1.4 tarea (RF-01)
CREATE TABLE tarea (
    id_tarea        SERIAL       PRIMARY KEY,
    id_usuario      INT          NOT NULL,
    titulo          VARCHAR(80)  NOT NULL,
    descripcion     TEXT,
    fecha_limite    DATE         NOT NULL,
    prioridad       VARCHAR(10)  NOT NULL,
    completada      BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tarea_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT chk_tarea_titulo_no_vacio
        CHECK (length(trim(titulo)) > 0),
    CONSTRAINT chk_tarea_prioridad
        CHECK (prioridad IN ('alta', 'media', 'baja'))
);


-- 1.5 habito (RF-02)
-- Acá se ve el habito activo de un usuario. NO confundir con plantilla_habito.
CREATE TABLE habito (
    id_habito         SERIAL       PRIMARY KEY,
    id_usuario        INT          NOT NULL,
    id_plantilla      INT,                       -- NULL = habito propio
    nombre            VARCHAR(60)  NOT NULL,
    frecuencia        VARCHAR(10)  NOT NULL,
    meta              VARCHAR(60),
    horario_objetivo  TIME,
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_adopcion    DATE         NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_habito_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE CASCADE,
    -- RF-07: no se puede borrar una plantilla que alguien adopto
    CONSTRAINT fk_habito_plantilla
        FOREIGN KEY (id_plantilla) REFERENCES plantilla_habito (id_plantilla)
        ON DELETE RESTRICT,
    CONSTRAINT chk_habito_frecuencia
        CHECK (frecuencia IN ('diaria', 'semanal')),
    -- Un usuario no adopta dos veces la misma plantilla
    CONSTRAINT uq_habito_usuario_plantilla
        UNIQUE (id_usuario, id_plantilla)
);


-- 1.6 registro_cumplimiento (RF-03, RF-04)
-- Una fila por habito y dia cumplido. La racha NO se guarda: se calcula.
CREATE TABLE registro_cumplimiento (
    id_registro          SERIAL     PRIMARY KEY,
    id_habito            INT        NOT NULL,
    fecha                DATE       NOT NULL,
    fecha_hora_registro  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_registro_habito
        FOREIGN KEY (id_habito) REFERENCES habito (id_habito)
        ON DELETE CASCADE,
    CONSTRAINT chk_registro_fecha_no_futura
        CHECK (fecha <= CURRENT_DATE),
    -- No se puede marcar dos veces el mismo habito el mismo dia
    CONSTRAINT uq_registro_habito_fecha
        UNIQUE (id_habito, fecha)
);


-- 1.7 recordatorio (RF-05)
-- dia_semana: 1 = lunes ... 7 = domingo
CREATE TABLE recordatorio (
    id_recordatorio  SERIAL    PRIMARY KEY,
    id_habito        INT       NOT NULL,
    dia_semana       SMALLINT  NOT NULL,
    hora             TIME      NOT NULL,
    activo           BOOLEAN   NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_recordatorio_habito
        FOREIGN KEY (id_habito) REFERENCES habito (id_habito)
        ON DELETE CASCADE,
    CONSTRAINT chk_recordatorio_dia
        CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT uq_recordatorio_habito_dia_hora
        UNIQUE (id_habito, dia_semana, hora)
);

-- ---------------------------------------------------------------------
-- 2. Indices (RNF-01:) para que postgre busque las tablas mas rapido y cumplir con el rnf-01 de cargar el lista en menos de 2 segundos
-- ---------------------------------------------------------------------
CREATE INDEX idx_tarea_usuario          ON tarea (id_usuario);
CREATE INDEX idx_habito_usuario         ON habito (id_usuario);
CREATE INDEX idx_registro_habito_fecha  ON registro_cumplimiento (id_habito, fecha DESC);
CREATE INDEX idx_plantilla_categoria    ON plantilla_habito (id_categoria);
CREATE INDEX idx_recordatorio_activo    ON recordatorio (dia_semana, hora)
    WHERE activo = TRUE;
--Create index crea el indice, idx.... es el nmbre del indice(etiqueta), on ... indica en que tabla y (...) indica la columna en la que se va a buscar.



-- ---------------------------------------------------------------------
-- 3. Datos de prueba
-- ---------------------------------------------------------------------

-- 3.1 Usuarios
--   Contrasenas (solo para pruebas):
--     admin@geshab.cl: Admin1234
--     ana@geshab.cl: Usuario123
--     benja@geshab.cl: Usuario123
--     carla@geshab.cl: Usuario123
INSERT INTO usuario (id_usuario, nombre, correo, contrasena_hash, rol) VALUES
    (1, 'Administrador',  'admin@geshab.cl', crypt('Admin1234',  gen_salt('bf', 10)), 'admin'),
    (2, 'Ana Torres',     'ana@geshab.cl',   crypt('Usuario123', gen_salt('bf', 10)), 'usuario'),
    (3, 'Benjamin Rojas', 'benja@geshab.cl', crypt('Usuario123', gen_salt('bf', 10)), 'usuario'),
    (4, 'Carla Munoz',    'carla@geshab.cl', crypt('Usuario123', gen_salt('bf', 10)), 'usuario');


-- 3.2 Categorias
INSERT INTO categoria (id_categoria, nombre, descripcion) VALUES
    (1, 'Salud',     'Hidratacion, alimentacion y cuidado general'),
    (2, 'Ejercicio', 'Actividad fisica y movimiento'),
    (3, 'Estudio',   'Habitos de aprendizaje y concentracion'),
    (4, 'Sueno',     'Descanso y rutina nocturna');


-- 3.3 Plantillas (la 6 esta inactiva para probar el filtro del catalogo de desactivar plantillas)
INSERT INTO plantilla_habito
    (id_plantilla, id_categoria, nombre, descripcion, dificultad, frecuencia_sugerida, activa) VALUES
    (1, 1, 'Tomar 2 litros de agua',  'Mantenerse hidratado durante el dia',  'baja',  'diaria',  TRUE),
    (2, 1, 'Comer una fruta',         'Al menos una porcion de fruta al dia', 'baja',  'diaria',  TRUE),
    (3, 2, 'Caminar 30 minutos',      'Caminata a paso moderado',             'media', 'diaria',  TRUE),
    (4, 2, 'Entrenamiento de fuerza', 'Rutina de 45 minutos con pesas',       'alta',  'semanal', TRUE),
    (5, 3, 'Repasar apuntes',         'Revisar la materia del dia',           'media', 'diaria',  TRUE),
    (6, 4, 'Dormir 8 horas',          'Acostarse antes de las 23:30',         'alta',  'diaria',  FALSE);

    

-- 3.4 Tareas (prioridades mezcladas, algunas completadas, algunas vencidas)
INSERT INTO tarea (id_usuario, titulo, descripcion, fecha_limite, prioridad, completada) VALUES
    (2, 'Entregar informe de laboratorio', 'Fisica II, seccion 3',    CURRENT_DATE + 2, 'alta',  FALSE),
    (2, 'Comprar verduras',                NULL,                      CURRENT_DATE + 1, 'baja',  FALSE),
    (2, 'Pagar cuenta de luz',             'Vence a fin de mes',      CURRENT_DATE - 3, 'media', FALSE), -- vencida
    (2, 'Pedir hora al dentista',          NULL,                      CURRENT_DATE - 5, 'media', TRUE),  -- completada
    (3, 'Estudiar para certamen',          'Calculo, unidades 1 a 3', CURRENT_DATE + 4, 'alta',  FALSE),
    (3, 'Renovar pase escolar',            NULL,                      CURRENT_DATE - 1, 'alta',  FALSE), -- vencida
    (3, 'Ordenar escritorio',              NULL,                      CURRENT_DATE + 7, 'baja',  TRUE),
    (4, 'Preparar presentacion',           'Ingenieria web y movil',  CURRENT_DATE + 3, 'alta',  FALSE),
    (4, 'Llamar a la abuela',              NULL,                      CURRENT_DATE,     'media', FALSE);


-- 3.5 Habitos adoptados
INSERT INTO habito
    (id_habito, id_usuario, id_plantilla, nombre, frecuencia, meta, horario_objetivo, activo, fecha_adopcion) VALUES
    (1, 2, 1,    'Tomar 2 litros de agua',  'diaria',  '8 vasos',  '09:00', TRUE,  CURRENT_DATE - 20),
    (2, 3, 1,    'Tomar agua',              'diaria',  '2 litros', '10:00', TRUE,  CURRENT_DATE - 15),
    (3, 4, 1,    'Tomar 2 litros de agua',  'diaria',  NULL,       NULL,    TRUE,  CURRENT_DATE - 2),
    (4, 2, NULL, 'Leer 20 minutos',         'diaria',  '20 min',   '22:00', TRUE,  CURRENT_DATE - 10),
    (5, 2, 3,    'Caminar 30 minutos',      'diaria',  '30 min',   '19:00', TRUE,  CURRENT_DATE - 12),
    (6, 3, 4,    'Entrenamiento de fuerza', 'semanal', '2 veces',  '18:00', TRUE,  CURRENT_DATE - 30),
    (7, 4, NULL, 'Meditar',                 'diaria',  '10 min',   '07:30', FALSE, CURRENT_DATE - 8);


-- 3.6 Registros de cumplimiento
-- Habito 1: racha larga, 7 dias seguidos hasta hoy (racha = 7)
INSERT INTO registro_cumplimiento (id_habito, fecha, fecha_hora_registro)
SELECT 1, d::date, d::date + TIME '09:15'
FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') AS d;

-- Habito 2: racha cortada, cumplio hace 5 a 2 dias pero no ayer ni hoy (racha = 0)
INSERT INTO registro_cumplimiento (id_habito, fecha, fecha_hora_registro)
SELECT 2, d::date, d::date + TIME '10:30'
FROM generate_series(CURRENT_DATE - 5, CURRENT_DATE - 2, INTERVAL '1 day') AS d;

-- Habito 3: SIN registros (para probar el estado vacio de la pantalla de progreso)

-- Habito 4: dias salteados (racha = 2: ayer y hoy)
INSERT INTO registro_cumplimiento (id_habito, fecha, fecha_hora_registro) VALUES
    (4, CURRENT_DATE - 6, (CURRENT_DATE - 6) + TIME '22:10'),
    (4, CURRENT_DATE - 4, (CURRENT_DATE - 4) + TIME '22:05'),
    (4, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '22:20'),
    (4, CURRENT_DATE,     CURRENT_TIMESTAMP);

-- Habito 5: 3 dias seguidos hasta ayer
INSERT INTO registro_cumplimiento (id_habito, fecha, fecha_hora_registro)
SELECT 5, d::date, d::date + TIME '19:40'
FROM generate_series(CURRENT_DATE - 3, CURRENT_DATE - 1, INTERVAL '1 day') AS d;

-- Habito 6 (semanal): una vez por semana las ultimas 3 semanas
INSERT INTO registro_cumplimiento (id_habito, fecha, fecha_hora_registro) VALUES
    (6, CURRENT_DATE - 14, (CURRENT_DATE - 14) + TIME '18:30'),
    (6, CURRENT_DATE - 7,  (CURRENT_DATE - 7)  + TIME '18:45'),
    (6, CURRENT_DATE - 1,  (CURRENT_DATE - 1)  + TIME '18:20');


-- 3.7 Recordatorios (activos y desactivados)
INSERT INTO recordatorio (id_habito, dia_semana, hora, activo) VALUES
    (1, 1, '09:00', TRUE),   -- lunes
    (1, 3, '09:00', TRUE),   -- miercoles
    (1, 5, '09:00', TRUE),   -- viernes
    (4, 7, '21:45', TRUE),   -- domingo
    (5, 2, '19:00', TRUE),   -- martes
    (5, 4, '19:00', FALSE),  -- jueves, desactivado
    (6, 6, '17:30', TRUE),   -- sabado
    (7, 1, '07:30', FALSE);  -- habito inactivo, recordatorio apagado

-- ---------------------------------------------------------------------
-- 4. Sincronizar secuencias (para que los ids automaticos no choquen con los ids de prueba en el backend)
-- ---------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'),
              (SELECT MAX(id_usuario) FROM usuario));
SELECT setval(pg_get_serial_sequence('categoria', 'id_categoria'),
              (SELECT MAX(id_categoria) FROM categoria));
SELECT setval(pg_get_serial_sequence('plantilla_habito', 'id_plantilla'),
              (SELECT MAX(id_plantilla) FROM plantilla_habito));
SELECT setval(pg_get_serial_sequence('habito', 'id_habito'),
              (SELECT MAX(id_habito) FROM habito));

-- tarea, registroCumplimiento y recordatorio no usaron ids a mano.
-- ---------------------------------------------------------------------
-- 5. Pruebas de restricciones (comentadas; ejecutar a mano en psql)
--    Las tres primeras DEBEN dar error.
-- ---------------------------------------------------------------------
-- 1) Cumplimiento duplicado -> error de UNIQUE
-- INSERT INTO registro_cumplimiento (id_habito, fecha) VALUES (1, CURRENT_DATE);
--
-- 2) Borrar plantilla adoptada -> error de clave foranea (RF-07)
-- DELETE FROM plantilla_habito WHERE id_plantilla = 1;
--
-- 3) Prioridad invalida -> error de CHECK
-- INSERT INTO tarea (id_usuario, titulo, fecha_limite, prioridad) VALUES (2, 'Prueba', CURRENT_DATE, 'urgente');
--
-- 4) Borrar usuario -> se borran sus tareas, habitos, cumplimientos y recordatorios, el catalogo queda intacto
-- DELETE FROM usuario WHERE id_usuario = 4;