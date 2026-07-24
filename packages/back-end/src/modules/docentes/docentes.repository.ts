import { prisma } from '@sga/data-access';

export class DocentesRepository {
  static async getAll() {
    return prisma.docente.findMany({
      where: { eliminadoEn: null },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  static async getActivos() {
    return prisma.docente.findMany({
      where: { eliminadoEn: null, activo: true },
      orderBy: { nombreCompleto: 'asc' }
    });
  }

  static async create(data: { nombreCompleto: string; correo?: string; telefono?: string; especialidad?: string; activo: boolean }) {
    return prisma.docente.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        correo: data.correo,
        telefono: data.telefono,
        especialidad: data.especialidad,
        activo: data.activo
      }
    });
  }

  static async update(id: number, data: { nombreCompleto?: string; correo?: string; telefono?: string; especialidad?: string; activo?: boolean }) {
    return prisma.docente.update({
      where: { docenteId: id },
      data: {
        ...data,
        actualizadoEn: new Date()
      }
    });
  }

  static async delete(id: number) {
    return prisma.docente.update({
      where: { docenteId: id },
      data: { eliminadoEn: new Date(), activo: false }
    });
  }
}
