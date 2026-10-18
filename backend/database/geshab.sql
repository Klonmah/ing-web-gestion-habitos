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