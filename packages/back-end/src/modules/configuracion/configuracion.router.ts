import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { updateConfigSchema } from './configuracion.schema';
import { ConfiguracionService } from './configuracion.service';

const lectura = protectedProcedure.use(hasModulePermission('Configuracion', false));
const escritura = protectedProcedure.use(hasModulePermission('Configuracion', true));

export const configuracionRouter = router({
  /**
   * Obtener la configuración global del sistema
   */
  get: lectura
    .query(async () => {
      return ConfiguracionService.getConfiguracion();
    }),

  /**
   * Actualizar la configuración global del sistema
   */
  update: escritura
    .input(updateConfigSchema)
    .mutation(async ({ input }) => {
      return ConfiguracionService.updateConfiguracion(input);
    })
});
