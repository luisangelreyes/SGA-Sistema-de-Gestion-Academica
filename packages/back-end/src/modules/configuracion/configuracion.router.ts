import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
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
    }),

  /**
   * Exportar respaldo de base de datos
   */
  exportBackup: escritura
    .mutation(async () => {
      return ConfiguracionService.exportarBackup();
    }),

  /**
   * Importar respaldo de base de datos
   */
  importBackup: escritura
    .input(z.string())
    .mutation(async ({ input }) => {
      return ConfiguracionService.importarBackup(input);
    })
});
