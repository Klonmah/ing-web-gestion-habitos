import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';

// Esquema de Validación (Solo pide el id del hábito y la fecha cumplida)
const registroSchema = z.object({
  id_habito: z.number().int('El ID del hábito debe ser un número entero'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

// GET /api/registros
export const getRegistros = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    
    // Hacemos un JOIN con la tabla habito para asegurarnos de que el usuario
    // solo vea sus propios registros de cumplimiento.
    const result = await pool.query(
      `SELECT r.* FROM registro_cumplimiento r
       JOIN habito h ON r.id_habito = h.id_habito
       WHERE h.id_usuario = $1
       ORDER BY r.fecha DESC`,
      [id_usuario]
    );
    res.json(result.rows);
  } catch (error) {
    next(new ErrorHttp(500, 'Error al obtener los registros'));
  }
};

// POST /api/registros
export const createRegistro = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const validData = registroSchema.parse(req.body);

    // 1. Verificar que el hábito existe y le pertenece al usuario
    const habitoResult = await pool.query(
      'SELECT id_habito FROM habito WHERE id_habito = $1 AND id_usuario = $2',
      [validData.id_habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
      return next(new ErrorHttp(404, 'Hábito no encontrado o no te pertenece'));
    }

    // 2. Insertar el registro
    const result = await pool.query(
      `INSERT INTO registro_cumplimiento (id_habito, fecha) 
       VALUES ($1, $2) RETURNING *`,
      [validData.id_habito, validData.fecha]
    );
    res.status(201).json(result.rows[0]);

  } catch (error: any) {
    if (error instanceof z.ZodError) return next(new ErrorHttp(400, 'Datos inválidos'));
    
    // Atrapamos las restricciones de PostgreSQL que armó el Rol A
    if (error.code === '23505') return next(new ErrorHttp(400, 'Ya existe un registro para este hábito en esta fecha'));
    if (error.code === '23514') return next(new ErrorHttp(400, 'La fecha no puede ser en el futuro'));

    next(new ErrorHttp(500, 'Error al crear el registro'));
  }
};

// PUT /api/registros/:id
export const updateRegistro = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;
    const validData = registroSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE registro_cumplimiento 
       SET id_habito = $1, fecha = $2 
       WHERE id_registro = $3 
       AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $4)
       RETURNING *`,
      [validData.id_habito, validData.fecha, id, id_usuario]
    );

    if (result.rows.length === 0) {
      return next(new ErrorHttp(404, 'Registro no encontrado o no te pertenece'));
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) return next(new ErrorHttp(400, 'Datos inválidos'));
    if (error.code === '23505') return next(new ErrorHttp(400, 'Ya marcaste este hábito en esta fecha'));
    if (error.code === '23514') return next(new ErrorHttp(400, 'La fecha no puede ser en el futuro'));
    
    next(new ErrorHttp(500, 'Error al actualizar el registro'));
  }
};

// DELETE /api/registros/:id
export const deleteRegistro = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM registro_cumplimiento 
       WHERE id_registro = $1 
       AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $2) 
       RETURNING *`,
      [id, id_usuario]
    );

    if (result.rows.length === 0) {
      return next(new ErrorHttp(404, 'Registro no encontrado o no te pertenece'));
    }
    res.json({ mensaje: 'Registro de cumplimiento eliminado' });
  } catch (error) {
    next(new ErrorHttp(500, 'Error al eliminar el registro'));
  }
};