// INDEX TEMPORAL!!!

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { z } from 'zod';
import 'dotenv/config'; 

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de la Base de Datos 
const pool = new Pool({
  user: process.env.DB_USER, 
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// 2. Extender Request para TypeScript
declare global {
  namespace Express {
    interface Request {
      usuario?: { id_usuario: number; rol: string };
    }
  }
}

// 3. Mock del Middleware de Autenticación
const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.usuario = { id_usuario: 1, rol: 'usuario' }; // Finge que somos el usuario 1
  next();
};

app.use('/tareas', mockAuthMiddleware);

// 4. Esquema de Validación
const tareaSchema = z.object({
  titulo: z.string().min(1, 'El título no puede estar vacío').max(80),
  descripcion: z.string().optional(),
  fecha_limite: z.string(), // YYYY-MM-DD
  prioridad: z.enum(['alta', 'media', 'baja']),
  completada: z.boolean().optional(),
});

// 5. RUTAS DE TAREAS

// GET /tareas
app.get('/tareas', async (req: Request, res: Response): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const result = await pool.query('SELECT * FROM tarea WHERE id_usuario = $1 ORDER BY fecha_limite ASC', [id_usuario]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las tareas' });
  }
});

// POST /tareas
app.post('/tareas', async (req: Request, res: Response): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const validData = tareaSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO tarea (id_usuario, titulo, descripcion, fecha_limite, prioridad, completada) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id_usuario, validData.titulo, validData.descripcion, validData.fecha_limite, validData.prioridad, validData.completada || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errores: error.issues });
    console.error(error);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// PUT /tareas/:id
app.put('/tareas/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;
    const validData = tareaSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE tarea 
       SET titulo = $1, descripcion = $2, fecha_limite = $3, prioridad = $4, completada = $5 
       WHERE id_tarea = $6 AND id_usuario = $7 RETURNING *`,
      [validData.titulo, validData.descripcion, validData.fecha_limite, validData.prioridad, validData.completada, id, id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o no pertenece al usuario' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errores: error.issues });
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

// DELETE /tareas/:id
app.delete('/tareas/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tarea WHERE id_tarea = $1 AND id_usuario = $2 RETURNING *', [id, id_usuario]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o no pertenece al usuario' });
    }
    res.json({ mensaje: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// 6. Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo y escuchando en http://localhost:${PORT}`);
});