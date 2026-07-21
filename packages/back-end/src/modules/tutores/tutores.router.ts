import { router, protectedProcedure, hasModulePermission } from '../../trpc';
import { z } from 'zod';
import { TutoresService } from './tutores.service';
import { createTutorSchema, updateTutorSchema } from './tutores.schema';

const lectura = protectedProcedure.use(hasModulePermission('Tutores', false));
const escritura = protectedProcedure.use(hasModulePermission('Tutores', true));

export const tutoresRouter = router({
  /**
   * Listar todos los tutores activos.
   */
  getAll: lectura.query(() => {
    return TutoresService.getTutores();
  }),

  /**
   * Obtener detalle de un tutor específico por su ID.
   */
  getById: lectura
    .input(z.number().int().positive())
    .query(({ input }) => {
      return TutoresService.getTutorById(input);
    }),

  /**
   * Crear un nuevo tutor (y opcionalmente sus datos fiscales).
   */
  create: escritura
    .input(createTutorSchema)
    .mutation(({ input }) => {
      return TutoresService.createTutor(input);
    }),

  /**
   * Actualizar un tutor existente.
   */
  update: escritura
    .input(updateTutorSchema)
    .mutation(({ input }) => {
      return TutoresService.updateTutor(input);
    }),

  /**
   * Eliminar un tutor (Soft Delete).
   */
  delete: escritura
    .input(z.number().int().positive())
    .mutation(({ input }) => {
      return TutoresService.deleteTutor(input);
    }),
});
