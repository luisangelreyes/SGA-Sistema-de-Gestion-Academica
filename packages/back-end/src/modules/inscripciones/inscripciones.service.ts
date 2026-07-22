import { prisma } from '@sga/data-access';
import { TRPCError } from '@trpc/server';
import type { 
  CreatePlanPagoInput, UpdatePlanPagoInput, 
  CreateVentanaInscripcionInput, UpdateVentanaInscripcionInput, 
  CreateInscripcionInput, UpdateInscripcionInput, AsignarPlanPagoInput, QuitarPlanPagoInput,
  GetTarifaColegiaturaInput
} from './inscripciones.schema';
import { InscripcionesRepository } from './inscripciones.repository';
import { CalculadoraPagos } from './inscripciones.utils';

export class InscripcionesService {
  // --- Planes de Pago ---
  static async getPlanesPago() {
    return InscripcionesRepository.getPlanesPago();
  }

  static async createPlanPago(input: CreatePlanPagoInput) {
    return InscripcionesRepository.createPlanPago(input);
  }

  static async updatePlanPago(input: UpdatePlanPagoInput) {
    const { planPagoId, ...data } = input;
    return InscripcionesRepository.updatePlanPago(planPagoId, { ...data, actualizadoEn: new Date() });
  }

  static async deletePlanPago(planPagoId: number) {
    return InscripcionesRepository.deletePlanPago(planPagoId);
  }

  // --- Ventanas de Inscripción Temprana ---
  static async getVentanas() {
    return InscripcionesRepository.getVentanas();
  }

  static async createVentana(input: CreateVentanaInscripcionInput) {
    return InscripcionesRepository.createVentana({
      cicloId: input.cicloId,
      nombrePromo: input.nombrePromo,
      becaId: input.becaId ?? null,
      descuentoInscripcion: input.descuentoInscripcion,
      fechaInicio: new Date(input.fechaInicio),
      fechaFin: new Date(input.fechaFin),
      activa: input.activa,
      gradosAplicables: {
        create: input.gradosId.map((id: number) => ({ gradoId: id }))
      }
    } as any);
  }

  static async updateVentana(input: UpdateVentanaInscripcionInput) {
    const { ventanaId, fechaInicio, fechaFin, gradosId, ...data } = input;
    return InscripcionesRepository.updateVentana(ventanaId, {
      ...data,
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      ...(gradosId && {
        gradosAplicables: {
          deleteMany: {},
          create: gradosId.map((id: number) => ({ gradoId: id }))
        }
      }),
      actualizadoEn: new Date()
    } as any);
  }

  static async deleteVentana(ventanaId: number) {
    return InscripcionesRepository.deleteVentana(ventanaId);
  }

  // --- Inscripciones de Alumnos ---
  static async getInscripciones(cicloId?: number) {
    return InscripcionesRepository.getInscripciones(cicloId);
  }

  static async createInscripcion(input: CreateInscripcionInput) {
    const existente = await InscripcionesRepository.findInscripcionExistente(input.alumnoId, input.cicloId, input.gradoId);

    if (existente) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'El alumno ya se encuentra inscrito en este ciclo escolar para este grado.'
      });
    }

    // GAP 3: Validar materias reprobadas del ciclo anterior
    const reprobadas = await prisma.calificacion.findFirst({
      where: {
        alumnoId: input.alumnoId,
        OR: [
          { valorNumerico: { lt: 6.0 } },
          { valorCualitativo: 'NA' }
        ]
      }
    });

    if (reprobadas) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'El alumno tiene materias reprobadas y no puede ser inscrito.'
      });
    }

    // Validar cupo del grupo si se proporciona grupoId
    if (input.grupoId) {
      const grupo = await prisma.grupo.findUnique({
        where: { grupoId: input.grupoId },
        include: {
          inscripciones: {
            where: { eliminadoEn: null }
          }
        }
      });

      if (!grupo || grupo.eliminadoEn) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'El grupo seleccionado no existe o ha sido eliminado.'
        });
      }

      if (grupo.inscripciones.length >= grupo.cupoMaximo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `El grupo ${grupo.nombre} ya ha alcanzado su cupo máximo de ${grupo.cupoMaximo} alumnos.`
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Crear Inscripcion Académica
      const inscripcion = await tx.inscripcionCiclo.create({
        data: {
          alumnoId: input.alumnoId,
          cicloId: input.cicloId,
          grupoId: input.grupoId,
          estadoEnCiclo: input.estadoEnCiclo,
          estadoFinanciero: input.estadoFinanciero,
          esIngresoTardio: input.esIngresoTardio,
          fechaIngreso: new Date(input.fechaIngreso)
        },
        include: { alumno: true, grupo: true }
      });

      // 2. Cambiar el estado del alumno a ACTIVO
      await tx.alumno.update({
        where: { alumnoId: input.alumnoId },
        data: {
          estado: 'ACTIVO',
          actualizadoEn: new Date()
        }
      });
      
      // 3. Verificar si aplica Promoción / Ventana de Inscripción Temprana
      const alumnoRef = await tx.alumno.findUnique({ where: { alumnoId: input.alumnoId } });
      const hoy = new Date();
      const gradoIdAlumno = input.gradoId ?? alumnoRef?.gradoId ?? 0;
      const ventanaPromocional = await tx.ventanaInscripcionTemprana.findFirst({
        where: {
          cicloId: input.cicloId,
          activa: true,
          eliminadoEn: null,
          fechaInicio: { lte: hoy },
          fechaFin: { gte: hoy },
          gradosAplicables: {
            some: { gradoId: gradoIdAlumno }
          }
        },
        orderBy: {
          descuentoInscripcion: 'desc'
        }
      });

      if (ventanaPromocional && ventanaPromocional.becaId) {
        // Asignarle la beca automáticamente
        await tx.asignacionBeca.create({
          data: {
            alumnoId: input.alumnoId,
            becaId: ventanaPromocional.becaId,
            cicloId: input.cicloId,
            estado: 'ACTIVA',
            fechaAsignacion: new Date(),
            asignadaPor: 1 // Por defecto sistema o un super usuario (O idealmente el userId en contexto si lo tuvieramos)
          }
        });
      }
      
      return inscripcion;
    });
  }

  static async updateInscripcion(input: UpdateInscripcionInput) {
    const { inscripcionId, fechaIngreso, ...data } = input;
    
    const inscripcion = await InscripcionesRepository.findInscripcionById(inscripcionId);

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' });
    }

    return InscripcionesRepository.updateInscripcion(inscripcionId, {
      ...data,
      ...(fechaIngreso && { fechaIngreso: new Date(fechaIngreso) }),
      actualizadoEn: new Date()
    });
  }

  static async asignarPlanPago(input: AsignarPlanPagoInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId },
      include: { alumno: true, ciclo: true }
    });

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada.' });
    }

    if (inscripcion.planPagoId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta inscripción ya tiene un plan de pagos asignado.' });
    }

    const planPago = await prisma.planPago.findUnique({ where: { planPagoId: input.planPagoId } });
    if (!planPago || planPago.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan de pago no encontrado.' });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Asignar el plan y estado a la inscripcion
      const inscActualizada = await tx.inscripcionCiclo.update({
        where: { inscripcionId: input.inscripcionId },
        data: { 
          planPagoId: input.planPagoId,
          estadoFinanciero: 'AL_CORRIENTE'
        }
      });

      // 1.5 Buscar todas las Tarifas relevantes
      const tarifasDb = await tx.tarifa.findMany({
        where: {
          cicloId: inscripcion.cicloId,
          nivelId: inscripcion.alumno.nivelId,
          concepto: { in: ['COLEGIATURA', 'INSCRIPCIÓN', 'INSCRIPCION', 'ARANCEL', 'MATERIAL ANUAL', 'MATERIAL'] },
          activa: true,
          eliminadoEn: null
        }
      });

      const tarifas = {
        colegiatura: Number(tarifasDb.find(t => t.concepto === 'COLEGIATURA')?.monto ?? 0),
        inscripcion: Number(tarifasDb.find(t => t.concepto === 'INSCRIPCIÓN' || t.concepto === 'INSCRIPCION')?.monto ?? 0),
        arancel: Number(tarifasDb.find(t => t.concepto === 'ARANCEL')?.monto ?? 0),
        materialAnual: Number(tarifasDb.find(t => t.concepto === 'MATERIAL ANUAL' || t.concepto === 'MATERIAL')?.monto ?? 0),
      };

      // 1.6 Buscar si la inscripción cayó en una Ventana Temprana para descuento de inscripción
      const gradoIdInsc = inscripcion.gradoId ?? inscripcion.alumno.gradoId ?? 0;
      const ventana = await tx.ventanaInscripcionTemprana.findFirst({
        where: {
          cicloId: inscripcion.cicloId,
          activa: true,
          eliminadoEn: null,
          fechaInicio: { lte: inscripcion.fechaIngreso },
          fechaFin: { gte: inscripcion.fechaIngreso },
          gradosAplicables: {
            some: { gradoId: gradoIdInsc }
          }
        },
        orderBy: {
          descuentoInscripcion: 'desc'
        }
      });
      const descuentoInscripcion = ventana ? Number(ventana.descuentoInscripcion) : 0;

      // 1.8 Buscar si tiene Beca asignada
      const asignacionBeca = await tx.asignacionBeca.findFirst({
        where: {
          alumnoId: inscripcion.alumnoId,
          cicloId: inscripcion.cicloId,
          estado: 'ACTIVA',
          eliminadoEn: null
        },
        include: { beca: true }
      });

      const becaData = asignacionBeca ? { porcentajeDescuento: Number(asignacionBeca.beca.porcentaje) } : null;

      // 2. Generar Adeudos usando CalculadoraPagos
      const planBase = { meses: planPago.meses };
      
      const adeudosCalculados = CalculadoraPagos.generarCalendario(planBase, tarifas, new Date(inscripcion.fechaIngreso), becaData, descuentoInscripcion, new Date(inscripcion.ciclo.fechaInicio));
      
      const adeudosParaInsertar = adeudosCalculados.map(a => ({
        alumnoId: inscripcion.alumnoId,
        cicloId: inscripcion.cicloId,
        ...a
      }));
      
      await tx.calendarioPago.createMany({ data: adeudosParaInsertar as any });

      return inscActualizada;
    });
  }

  static async quitarPlanPago(input: QuitarPlanPagoInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId }
    });

    if (!inscripcion || inscripcion.eliminadoEn) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada.' });
    }

    if (!inscripcion.planPagoId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esta inscripción no tiene un plan asignado actualmente.' });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Quitar el plan de la inscripción y resetear estado financiero
      const inscActualizada = await tx.inscripcionCiclo.update({
        where: { inscripcionId: input.inscripcionId },
        data: { 
          planPagoId: null,
          estadoFinanciero: 'NO_APLICA'
        }
      });

      // 2. Borrar (hard delete para mantener limpia la BD, o soft delete) los adeudos asociados a este ciclo y alumno
      // Dado que estos son generados automáticamente y no deberían tener pagos aplicados si se quiere borrar.
      // Primero verificar si ya hay pagos aplicados
      const pagosConMonto = await tx.calendarioPago.findFirst({
        where: {
          alumnoId: inscripcion.alumnoId,
          cicloId: inscripcion.cicloId,
          montoPagado: { gt: 0 }
        }
      });

      if (pagosConMonto) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No se puede quitar el plan porque ya hay recibos con pagos aplicados. Debes cancelar los pagos primero.' });
      }

      await tx.calendarioPago.deleteMany({
        where: {
          alumnoId: inscripcion.alumnoId,
          cicloId: inscripcion.cicloId
        }
      });

      return inscActualizada;
    });
  }

  static async getTarifaColegiatura(input: GetTarifaColegiaturaInput) {
    const inscripcion = await prisma.inscripcionCiclo.findUnique({
      where: { inscripcionId: input.inscripcionId },
      include: { alumno: true }
    });

    if (!inscripcion) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscripción no encontrada' });
    }

    const tarifa = await prisma.tarifa.findFirst({
      where: {
        cicloId: inscripcion.cicloId,
        nivelId: inscripcion.alumno.nivelId,
        concepto: 'COLEGIATURA',
        activa: true,
        eliminadoEn: null
      }
    });

    return tarifa ? Number(tarifa.monto) : 0;
  }

  static async deleteInscripcion(inscripcionId: number) {
    return InscripcionesRepository.deleteInscripcion(inscripcionId);
  }
}
