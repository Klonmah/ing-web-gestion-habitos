import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';

export const getProgreso = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    const periodo = req.query.periodo as string;

    if (periodo !== 'semanal' && periodo !== 'mensual') {
      return next(new ErrorHttp(400, 'El parámetro ?periodo= debe ser "semanal" o "mensual"'));
    }

    const dias = periodo === 'semanal' ? 7 : 30;

    // 1. Obtener hábitos activos del usuario
    const habitosResult = await pool.query(
      'SELECT id_habito, nombre, frecuencia FROM habito WHERE id_usuario = $1 AND activo = TRUE',
      [id_usuario]
    );
    const habitos = habitosResult.rows;

    // 2. Pedirle las fechas a la Base de Datos (para evitar bugs de zona horaria en JS)
    const fechasResult = await pool.query(
      "SELECT CURRENT_DATE::text AS hoy, (CURRENT_DATE - 1)::text AS ayer, (CURRENT_DATE - $1::int)::text AS fecha_limite",
      [dias - 1]
    );
    const { hoy, ayer, fecha_limite } = fechasResult.rows[0];

    // 3. Obtener el historial completo para calcular rachas
    const historialResult = await pool.query(
      `SELECT id_habito, fecha::text 
       FROM registro_cumplimiento 
       WHERE id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $1)
       ORDER BY fecha DESC`,
      [id_usuario]
    );
    const todosLosRegistros = historialResult.rows;

    // 4. Calcular progreso y racha por cada hábito
    const progreso = habitos.map(habito => {
      const fechasDelHabito = todosLosRegistros
        .filter(r => r.id_habito === habito.id_habito)
        .map(r => r.fecha);

      let racha = 0;
      if (fechasDelHabito.length > 0) {
        // ¿Empezamos a contar desde hoy o desde ayer?
        let fechaAContar = hoy;
        if (fechasDelHabito.includes(hoy)) fechaAContar = hoy;
        else if (fechasDelHabito.includes(ayer)) fechaAContar = ayer;
        else fechaAContar = null; // Racha rota

        if (fechaAContar) {
          const [y, m, d] = fechaAContar.split('-').map(Number);
          let iterador = new Date(y, m - 1, d);

          for (const fechaCumplida of fechasDelHabito) {
            const yyyy = iterador.getFullYear();
            const mm = String(iterador.getMonth() + 1).padStart(2, '0');
            const dd = String(iterador.getDate()).padStart(2, '0');
            const fechaIteradorStr = `${yyyy}-${mm}-${dd}`;

            if (fechaCumplida === fechaIteradorStr) {
              racha++;
              iterador.setDate(iterador.getDate() - 1); // Retrocedemos un día
            } else if (fechaCumplida < fechaIteradorStr) {
              break; // Falta un día, se rompió la racha
            }
          }
        }
      }

      return {
        id_habito: habito.id_habito,
        nombre: habito.nombre,
        frecuencia: habito.frecuencia,
        racha_actual: racha,
        cumplimientos_periodo: fechasDelHabito.filter(f => f >= fecha_limite) // Filtro visual para el front
      };
    });

    res.json({ periodo, progreso });

  } catch (error) {
    next(new ErrorHttp(500, 'Error al obtener el progreso'));
  }
};