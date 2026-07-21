import { prisma, Prisma } from '@sga/data-access';

export class GruposRepository {
  // --- Niveles Educativos ---
  static async getNiveles() {
    return prisma.nivelEducativo.findMany({
      where: { eliminadoEn: null },
      orderBy: { orden: 'asc' }
    });
  }

  static async createNivel(data: Prisma.NivelEducativoCreateInput) {
    return prisma.nivelEducativo.create({ data });
  }

  static async updateNivel(nivelId: number, data: Prisma.NivelEducativoUpdateInput) {
    return prisma.nivelEducativo.update({
      where: { nivelId },
      data
    });
  }

  static async deleteNivel(nivelId: number) {
    return prisma.nivelEducativo.update({
      where: { nivelId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Grados ---
  static async getGrados() {
    return prisma.grado.findMany({
      where: { eliminadoEn: null },
      orderBy: { numero: 'asc' }
    });
  }

  static async createGrado(data: Prisma.GradoUncheckedCreateInput) {
    return prisma.grado.create({ data });
  }

  static async updateGrado(gradoId: number, data: Prisma.GradoUncheckedUpdateInput) {
    return prisma.grado.update({
      where: { gradoId },
      data
    });
  }

  static async deleteGrado(gradoId: number) {
    return prisma.grado.update({
      where: { gradoId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Ciclos Escolares ---
  static async getCiclos() {
    return prisma.cicloEscolar.findMany({
      where: { eliminadoEn: null },
      orderBy: { fechaInicio: 'desc' }
    });
  }

  static async createCiclo(data: Prisma.CicloEscolarUncheckedCreateInput, clonarDesdeCicloId?: number) {
    return prisma.$transaction(async (tx) => {
      if (data.activo) {
        const periodicidad = data.periodicidad || 'ANUAL';
        await tx.cicloEscolar.updateMany({
          where: { activo: true, periodicidad, eliminadoEn: null } as any,
          data: { activo: false, actualizadoEn: new Date() }
        });
      }
      
      const newCiclo = await tx.cicloEscolar.create({ data });

      if (clonarDesdeCicloId) {
        const gruposAntiguos = await tx.grupo.findMany({
          where: { cicloId: clonarDesdeCicloId, eliminadoEn: null }
        });

        if (gruposAntiguos.length > 0) {
          const newGrupos = gruposAntiguos.map(g => ({
            nivelId: g.nivelId,
            cicloId: newCiclo.cicloId,
            nombre: g.nombre,
            cupoMaximo: g.cupoMaximo,
            gradoId: g.gradoId
          }));
          await tx.grupo.createMany({ data: newGrupos });
        }

        const tarifasAntiguas = await tx.tarifa.findMany({
          where: { cicloId: clonarDesdeCicloId, eliminadoEn: null }
        });

        if (tarifasAntiguas.length > 0) {
          const newTarifas = tarifasAntiguas.map(t => ({
            cicloId: newCiclo.cicloId,
            nivelId: t.nivelId,
            concepto: t.concepto,
            monto: t.monto,
            descripcion: t.descripcion,
            activa: t.activa
          }));
          await tx.tarifa.createMany({ data: newTarifas });
        }
      }

      return newCiclo;
    });
  }

  static async updateCicloActivo(cicloId: number, data: Prisma.CicloEscolarUncheckedUpdateInput) {
    const ciclo = await prisma.cicloEscolar.findUnique({
      where: { cicloId },
      select: { periodicidad: true } as any
    }) as any;
    
    const periodicidad = (data.periodicidad as string) || ciclo?.periodicidad || 'ANUAL';

    return prisma.$transaction([
      prisma.cicloEscolar.updateMany({
        where: { activo: true, periodicidad, eliminadoEn: null } as any,
        data: { activo: false, actualizadoEn: new Date() }
      }),
      prisma.cicloEscolar.update({
        where: { cicloId },
        data
      })
    ]);
  }

  static async updateCicloDirectly(cicloId: number, data: Prisma.CicloEscolarUncheckedUpdateInput) {
    return prisma.cicloEscolar.update({
      where: { cicloId },
      data
    });
  }

  static async findCiclo(cicloId: number) {
    return prisma.cicloEscolar.findUnique({ where: { cicloId } });
  }

  static async deleteCiclo(cicloId: number) {
    return prisma.cicloEscolar.update({
      where: { cicloId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Materias ---
  static async getMaterias() {
    return prisma.materia.findMany({
      where: { eliminadoEn: null },
      include: { 
        grado: { 
          include: { 
            nivel: true 
          } 
        }, 
        docente: true, // docente relation
        gruposMaterias: {
          include: {
            grupo: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  static async createMateria(data: Prisma.MateriaUncheckedCreateInput) {
    return prisma.materia.create({ data });
  }

  static async updateMateria(materiaId: number, data: Prisma.MateriaUncheckedUpdateInput) {
    return prisma.materia.update({
      where: { materiaId },
      data
    });
  }

  static async deleteMateria(materiaId: number) {
    return prisma.materia.update({
      where: { materiaId },
      data: { eliminadoEn: new Date() }
    });
  }

  // --- Grupos ---
  static async getGrupos(cicloId?: number) {
    return prisma.grupo.findMany({
      where: {
        eliminadoEn: null,
        ...(cicloId
          ? { cicloId }
          : { ciclo: { activo: true } }
        )
      },
      include: {
        nivel: true,
        ciclo: true,
        grado: true,
        materias: {
          include: {
            materia: true,
            docente: true
          }
        }
      },
      orderBy: [
        { nivel: { orden: 'asc' } },
        { nombre: 'asc' }
      ]
    });
  }

  static async createGrupo(data: Prisma.GrupoUncheckedCreateInput) {
    return prisma.grupo.create({ data });
  }

  static async updateGrupo(grupoId: number, data: Prisma.GrupoUncheckedUpdateInput) {
    return prisma.grupo.update({
      where: { grupoId },
      data
    });
  }

  static async deleteGrupo(grupoId: number) {
    return prisma.grupo.update({
      where: { grupoId },
      data: { eliminadoEn: new Date() }
    });
  }

  static async findGrupoWithCiclo(grupoId: number) {
    return prisma.grupo.findUnique({
      where: { grupoId },
      include: { ciclo: true }
    });
  }

  // --- Asignación Materias a Grupos ---
  static async assignMateriaToGrupo(data: Prisma.GrupoMateriaUncheckedCreateInput) {
    return prisma.grupoMateria.create({
      data,
      include: {
        materia: true,
        docente: true
      }
    });
  }

  static async unassignMateriaFromGrupo(grupoMateriaId: number) {
    // Encapsulado el Hard Delete de tabla pivote
    return prisma.grupoMateria.delete({
      where: { grupoMateriaId }
    });
  }
}
