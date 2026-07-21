import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { CalificacionesService } from './calificaciones.service';
import { 
  getCalificacionesGrupoSchema, 
  getCalificacionesAlumnoSchema, 
  upsertCalificacionSchema, 
  deleteCalificacionSchema,
  GenerarBoletaSchema,
  KardexSchema
} from './calificaciones.schema';

const lectura = protectedProcedure.use(hasModulePermission('Calificaciones', false));
const escritura = protectedProcedure.use(hasModulePermission('Calificaciones', true));

export const calificacionesRouter = router({
  
  /**
   * Obtiene la boleta/registro de calificaciones para un grupo (vista docente)
   */
  getPorGrupo: lectura
    .input(getCalificacionesGrupoSchema)
    .query(({ input }) => {
      return CalificacionesService.getCalificacionesGrupo(input);
    }),

  /**
   * Obtiene el kárdex completo de un alumno (vista administrativo/tutor)
   */
  getPorAlumno: lectura
    .input(getCalificacionesAlumnoSchema)
    .query(({ input }) => {
      return CalificacionesService.getCalificacionesAlumno(input);
    }),

  /**
   * Inserta o actualiza una calificación de un alumno
   */
  upsert: escritura
    .input(upsertCalificacionSchema)
    .mutation(({ input, ctx }) => {
      const registradorId = (ctx as any).user?.usuarioId;
      if (!registradorId) throw new Error("No user in context");
      return CalificacionesService.upsertCalificacion(input, registradorId);
    }),

  /**
   * Elimina una calificación registrada por error
   */
  delete: escritura
    .input(deleteCalificacionSchema)
    .mutation(({ input }) => {
      return CalificacionesService.deleteCalificacion(input);
    }),

  /**
   * Genera la boleta consolidada de un alumno en un ciclo escolar específico
   */
  generarBoletaCiclo: lectura
    .input(GenerarBoletaSchema)
    .query(async ({ input }) => {
      return CalificacionesService.generarBoletaCiclo(input);
    }),

  /**
   * Obtiene el historial académico completo de todos los ciclos
   */
  obtenerKardexCompleto: lectura
    .input(KardexSchema)
    .query(async ({ input }) => {
      return CalificacionesService.obtenerKardexCompleto(input);
    })
});
