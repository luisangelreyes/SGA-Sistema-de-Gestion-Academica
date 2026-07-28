import { NivelPermiso } from '@prisma/client';

export const MODULOS_SISTEMA = [
  'Usuarios',
  'Alumnos',
  'Tutores',
  'Inscripciones',
  'Grupos',
  'Materias',
  'Pagos',
  'Becas',
  'Reportes',
  'Configuracion',
  'Calificaciones',
  'Boletas'
] as const;

export function getDefaultPermissions(roles: string[]): { modulo: string, nivel: NivelPermiso }[] {
  // Administrador: Acceso total a todo
  if (roles.includes('ADMIN')) {
    return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA }));
  }

  // Gestor: Acceso total a finanzas/admin, denegado a escolar y usuarios
  if (roles.includes('GESTOR')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Grupos', 'Materias', 'Calificaciones', 'Boletas', 'Usuarios'].includes(m)) {
        return { modulo: m, nivel: NivelPermiso.DENEGADO };
      }
      return { modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA };
    });
  }

  // Control Escolar: Lectura a expedientes, escritura a académico, denegado a finanzas/admin
  if (roles.includes('CONTROL_ESCOLAR')) {
    return MODULOS_SISTEMA.map(m => {
      if (['Alumnos', 'Tutores'].includes(m)) {
        return { modulo: m, nivel: NivelPermiso.LECTURA };
      }
      if (['Grupos', 'Materias', 'Calificaciones', 'Boletas'].includes(m)) {
        return { modulo: m, nivel: NivelPermiso.LECTURA_Y_ESCRITURA };
      }
      return { modulo: m, nivel: NivelPermiso.DENEGADO };
    });
  }

  // Por defecto, denegar todo
  return MODULOS_SISTEMA.map(m => ({ modulo: m, nivel: NivelPermiso.DENEGADO }));
}

