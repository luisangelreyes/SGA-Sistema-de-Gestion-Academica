import { router } from './trpc';
import { authRouter } from './modules/auth/auth.router';
import { configuracionRouter } from './modules/configuracion/configuracion.router';
import { gruposRouter } from './modules/grupos/grupos.router';
import { tutoresRouter } from './modules/tutores/tutores.router';
import { alumnosRouter } from './modules/alumnos/alumnos.router';
import { pagosRouter } from './modules/pagos/pagos.router';
import { becasRouter } from './modules/becas/becas.router';
import { calificacionesRouter } from './modules/calificaciones/calificaciones.router';
import { inscripcionesRouter } from './modules/inscripciones/inscripciones.router';
import { usuariosRouter } from './modules/usuarios/usuarios.router';
import { auditoriaRouter } from './modules/auditoria/auditoria.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { reportesRouter } from './modules/reportes/reportes.router';
import { docentesRouter } from './modules/docentes/docentes.router';

export const appRouter = router({
  auth: authRouter,
  configuracion: configuracionRouter,
  grupos: gruposRouter,
  tutores: tutoresRouter,
  alumnos: alumnosRouter,
  pagos: pagosRouter,
  becas: becasRouter,
  calificaciones: calificacionesRouter,
  inscripciones: inscripcionesRouter,
  usuarios: usuariosRouter,
  auditoria: auditoriaRouter,
  dashboard: dashboardRouter,
  reportes: reportesRouter,
  docentes: docentesRouter,
});

export type AppRouter = typeof appRouter;
