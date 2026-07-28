import { DocentesRepository } from './docentes.repository';

export class DocentesService {
  static async getAll() {
    return DocentesRepository.getAll();
  }

  static async getActivos() {
    return DocentesRepository.getActivos();
  }

  static async create(data: { nombreCompleto: string; correo?: string; telefono?: string; especialidad?: string; activo: boolean }) {
    if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
      throw new Error('El nombre completo es requerido.');
    }
    return DocentesRepository.create({
      ...data,
      nombreCompleto: data.nombreCompleto.trim(),
    });
  }

  static async update(id: number, data: { nombreCompleto?: string; correo?: string; telefono?: string; especialidad?: string; activo?: boolean }) {
    if (data.nombreCompleto !== undefined && data.nombreCompleto.trim().length === 0) {
      throw new Error('El nombre completo no puede estar vacío.');
    }
    return DocentesRepository.update(id, data);
  }

  static async delete(id: number) {
    return DocentesRepository.delete(id);
  }
}
