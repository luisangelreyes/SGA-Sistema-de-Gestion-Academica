import { router, protectedProcedure, hasModulePermission, gestorProcedure } from '../../trpc';
import { z } from 'zod';
import { GruposService } from './grupos.service';
import {
  createNivelEducativoSchema, updateNivelEducativoSchema,
  createGradoSchema, updateGradoSchema,
  createCicloEscolarSchema, updateCicloEscolarSchema,
  createMateriaSchema, updateMateriaSchema,
  createGrupoSchema, updateGrupoSchema,
  assignMateriaGrupoSchema, unassignMateriaGrupoSchema,
  getAlumnosCierreGrupoSchema, cerrarCicloGrupoSchema,
  getGradosParaInicializarSchema, inicializarGruposSeleccionadosSchema,
  reinscripcionMasivaGrupoSchema
} from './grupos.schema';

const lectura = protectedProcedure.use(hasModulePermission('Grupos', false));
const escritura = protectedProcedure.use(hasModulePermission('Grupos', true));

const lecturaMaterias = protectedProcedure.use(hasModulePermission('Materias', false));
const escrituraMaterias = protectedProcedure.use(hasModulePermission('Materias', true));

export const gruposRouter = router({
  // --- Niveles Educativos ---
  getNiveles: protectedProcedure.query(() => GruposService.getNiveles()),
  createNivel: gestorProcedure.input(createNivelEducativoSchema).mutation(({ input }) => GruposService.createNivel(input)),
  updateNivel: gestorProcedure.input(updateNivelEducativoSchema).mutation(({ input }) => GruposService.updateNivel(input)),
  deleteNivel: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteNivel(input)),

  // --- Grados ---
  getGrados: protectedProcedure.query(() => GruposService.getGrados()),
  createGrado: gestorProcedure.input(createGradoSchema).mutation(({ input }) => GruposService.createGrado(input)),
  updateGrado: gestorProcedure.input(updateGradoSchema).mutation(({ input }) => GruposService.updateGrado(input)),
  deleteGrado: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrado(input)),

  // --- Ciclos Escolares ---
  getCiclos: protectedProcedure.query(() => GruposService.getCiclos()),
  createCiclo: gestorProcedure.input(createCicloEscolarSchema).mutation(({ input }) => GruposService.createCiclo(input)),
  updateCiclo: gestorProcedure.input(updateCicloEscolarSchema).mutation(({ input }) => GruposService.updateCiclo(input)),
  deleteCiclo: gestorProcedure.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteCiclo(input)),

  // --- Materias ---
  getMaterias: lecturaMaterias.query(() => GruposService.getMaterias()),
  createMateria: escrituraMaterias.input(createMateriaSchema).mutation(({ input }) => GruposService.createMateria(input)),
  updateMateria: escrituraMaterias.input(updateMateriaSchema).mutation(({ input }) => GruposService.updateMateria(input)),
  deleteMateria: escrituraMaterias.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteMateria(input)),

  // --- Grupos ---
  getGrupos: lectura
    .input(z.object({ cicloId: z.number().int().positive().optional() }).optional())
    .query(({ input }) => GruposService.getGrupos(input?.cicloId)),
  createGrupo: escritura.input(createGrupoSchema).mutation(({ input }) => GruposService.createGrupo(input)),
  updateGrupo: escritura.input(updateGrupoSchema).mutation(({ input }) => GruposService.updateGrupo(input)),
  deleteGrupo: escritura.input(z.number().int().positive()).mutation(({ input }) => GruposService.deleteGrupo(input)),

  // --- Asignación Materias a Grupos ---
  assignMateria: escritura.input(assignMateriaGrupoSchema).mutation(({ input }) => GruposService.assignMateriaToGrupo(input)),
  unassignMateria: escritura.input(unassignMateriaGrupoSchema).mutation(({ input }) => GruposService.unassignMateriaFromGrupo(input)),
  getAlumnosCierreGrupo: escritura.input(getAlumnosCierreGrupoSchema).query(({ input }) => GruposService.getAlumnosCierreGrupo(input.grupoId)),
  cerrarCicloGrupo: escritura.input(cerrarCicloGrupoSchema).mutation(({ input }) => GruposService.cerrarCicloGrupo(input)),

  reinscripcionMasivaGrupo: escritura
    .input(reinscripcionMasivaGrupoSchema)
    .mutation(({ input }) => GruposService.reinscripcionMasivaGrupo(input)),

  // --- Inicialización Selectiva de Grupos ---
  getGradosParaInicializar: lectura
    .input(getGradosParaInicializarSchema)
    .query(({ input }) => GruposService.getGradosParaInicializar(input.cicloId)),
  inicializarGruposSeleccionados: escritura
    .input(inicializarGruposSeleccionadosSchema)
    .mutation(({ input }) => GruposService.inicializarGruposSeleccionados(input)),
});
