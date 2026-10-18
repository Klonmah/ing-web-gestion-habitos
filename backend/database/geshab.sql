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