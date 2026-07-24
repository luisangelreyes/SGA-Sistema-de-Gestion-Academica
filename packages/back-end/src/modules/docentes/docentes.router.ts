import { z } from 'zod';
import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { DocentesService } from './docentes.service';

const lectura = protectedProcedure.use(hasModulePermission('Grupos', false));
const escritura = protectedProcedure.use(hasModulePermission('Grupos', true));

export const docentesRouter = router({
  getAll: lectura.query(async () => {
    return DocentesService.getAll();
  }),

  getActivos: lectura.query(async () => {
    return DocentesService.getActivos();
  }),

  create: escritura
    .input(z.object({
      nombreCompleto: z.string().min(1, 'El nombre es requerido'),
      correo: z.string().email('Correo inválido').optional().or(z.literal('')),
      telefono: z.string().optional().or(z.literal('')),
      especialidad: z.string().optional().or(z.literal('')),
      activo: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const data = {
        ...input,
        correo: input.correo || undefined,
        telefono: input.telefono || undefined,
        especialidad: input.especialidad || undefined,
      };
      return DocentesService.create(data);
    }),

  update: escritura
    .input(z.object({
      docenteId: z.number(),
      nombreCompleto: z.string().min(1, 'El nombre es requerido').optional(),
      correo: z.string().email('Correo inválido').optional().or(z.literal('')),
      telefono: z.string().optional().or(z.literal('')),
      especialidad: z.string().optional().or(z.literal('')),
      activo: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { docenteId, ...rest } = input;
      const data = {
        ...rest,
        correo: rest.correo === '' ? null : rest.correo,
        telefono: rest.telefono === '' ? null : rest.telefono,
        especialidad: rest.especialidad === '' ? null : rest.especialidad,
      };
      // Convert null to undefined for the service type
      const serviceData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
      );
      return DocentesService.update(docenteId, serviceData);
    }),

  delete: escritura
    .input(z.number())
    .mutation(async ({ input }) => {
      return DocentesService.delete(input);
    }),
});

