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