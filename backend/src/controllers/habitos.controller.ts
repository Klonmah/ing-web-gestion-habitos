import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';

// Esquema de Validación (RF-02)
const habitoSchema = z.object({
  id_plantilla: z.number().int().optional().nullable(),
  nombre: z.string().min(1, 'El nombre no puede estar vacío').max(60),
  frecuencia: z.enum(['diaria', 'semanal']),
  meta: z.string().max(60).optional().nullable(),
  horario_objetivo: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)').optional().nullable(),
  activo: z.boolean().optional(),
});

// GET /api/habitos
export const getHabitos = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const result = await pool.query(
      'SELECT * FROM habito WHERE id_usuario = $1 ORDER BY fecha_adopcion DESC',
      [id_usuario]
    );
    res.json(result.rows);
  } catch (error) {
    next(new ErrorHttp(500, 'Error al obtener los hábitos'));
  }
};

// POST /api/habitos
export const createHabito = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const validData = habitoSchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO habito (id_usuario, id_plantilla, nombre, frecuencia, meta, horario_objetivo, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id_usuario,
        validData.id_plantilla || null,
        validData.nombre,
        validData.frecuencia,
        validData.meta || null,
        validData.horario_objetivo || null,
        validData.activo ?? true, // Por defecto true si no se envía
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ErrorHttp(400, 'Datos inválidos'));
    next(new ErrorHttp(500, 'Error al crear el hábito'));
  }
};

// PUT /api/habitos/:id
export const updateHabito = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;
    const validData = habitoSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE habito 
       SET id_plantilla = $1, nombre = $2, frecuencia = $3, meta = $4, horario_objetivo = $5, activo = $6 
       WHERE id_habito = $7 AND id_usuario = $8 RETURNING *`,
      [
        validData.id_plantilla || null,
        validData.nombre,
        validData.frecuencia,
        validData.meta || null,
        validData.horario_objetivo || null,
        validData.activo,
        id,
        id_usuario,
      ]
    );

    if (result.rows.length === 0) {
      return next(new ErrorHttp(404, 'Hábito no encontrado o no pertenece al usuario'));
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ErrorHttp(400, 'Datos inválidos'));
    next(new ErrorHttp(500, 'Error al actualizar el hábito'));
  }
};

// DELETE /api/habitos/:id
export const deleteHabito = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM habito WHERE id_habito = $1 AND id_usuario = $2 RETURNING *',
      [id, id_usuario]
    );

    if (result.rows.length === 0) {
      return next(new ErrorHttp(404, 'Hábito no encontrado o no pertenece al usuario'));
    }
    res.json({ mensaje: 'Hábito eliminado exitosamente' });
  } catch (error) {
    next(new ErrorHttp(500, 'Error al eliminar el hábito'));
  }
};

// --- NUEVO ENDPOINT (RF-03): Marcar cumplimiento ---
const cumplimientoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
});

export const marcarCumplimiento = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const id_habito = req.params.id; // Toma el ID de la URL
    const validData = cumplimientoSchema.parse(req.body);

    // 1. Verificar si el habito le pertenece al usuario
    const habitoResult = await pool.query(
      'SELECT id_habito FROM habito WHERE id_habito = $1 AND id_usuario = $2',
      [id_habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
      return next(new ErrorHttp(404, 'Hábito no encontrado o no te pertenece'));
    }

    // 2. Insertar cumplimiento
    const result = await pool.query(
      'INSERT INTO registro_cumplimiento (id_habito, fecha) VALUES ($1, $2) RETURNING *',
      [id_habito, validData.fecha]
    );
    res.status(201).json(result.rows[0]);

  } catch (error: any) {
    if (error instanceof z.ZodError) return next(new ErrorHttp(400, 'Datos inválidos'));
    if (error.code === '23505') return next(new ErrorHttp(400, 'Ya marcaste este hábito en esta fecha'));
    if (error.code === '23514') return next(new ErrorHttp(400, 'La fecha no puede ser futura'));
    next(new ErrorHttp(500, 'Error al registrar cumplimiento'));
  }
};