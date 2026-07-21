import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { ReporteFechasSchema, ReporteAsistenciaSchema } from './reportes.schemas';
import { ReportesService } from './reportes.service';

const lectura = protectedProcedure.use(hasModulePermission('Reportes', false));

export const reportesRouter = router({
  reporteDeudores: lectura
    .query(async () => {
      return ReportesService.getReporteDeudores();
    }),

  reporteIngresos: lectura
    .input(ReporteFechasSchema)
    .query(async ({ input }) => {
      return ReportesService.getReporteIngresos(input);
    }),

  listaAsistencia: lectura
    .input(ReporteAsistenciaSchema)
    .query(async ({ input }) => {
      return ReportesService.getListaAsistencia(input);
    })
});
