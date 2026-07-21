import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { ObtenerLogsSchema } from './auditoria.schemas';
import { AuditoriaService } from './auditoria.service';

const lectura = protectedProcedure.use(hasModulePermission('Configuracion', false));

export const auditoriaRouter = router({
  obtenerLogs: lectura
    .input(ObtenerLogsSchema)
    .query(async ({ input }) => {
      return AuditoriaService.obtenerLogs(input);
    }),
});
