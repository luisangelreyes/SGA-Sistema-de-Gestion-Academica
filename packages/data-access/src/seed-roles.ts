/**
 * Fase 1 — Seed de Roles y Permisos por Perfil
 *
 * Este script garantiza que los tres roles operativos existen en la BD
 * y asigna los permisos de módulo correctos a cualquier usuario que ya
 * esté vinculado a uno de esos roles.
 *
 * Ejecución:
 *   npx ts-node src/seed-roles.ts
 */
import { PrismaClient, NivelPermiso } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Definición de permisos por rol ──────────────────────────────────────────
const PERMISOS_POR_ROL: Record<string, { modulo: string; nivel: NivelPermiso }[]> = {
  ADMIN: [
    { modulo: 'Alumnos',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Tutores',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Inscripciones', nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Pagos',         nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Becas',         nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Configuracion', nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Grupos',        nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Materias',      nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Calificaciones',nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Boletas',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Usuarios',      nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Reportes',      nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
  ],
  GESTOR: [
    { modulo: 'Alumnos',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Tutores',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Inscripciones', nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Pagos',         nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Becas',         nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Configuracion', nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Reportes',      nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    // Acceso denegado explícito a los módulos de Control Escolar
    { modulo: 'Grupos',        nivel: NivelPermiso.DENEGADO },
    { modulo: 'Materias',      nivel: NivelPermiso.DENEGADO },
    { modulo: 'Calificaciones',nivel: NivelPermiso.DENEGADO },
    { modulo: 'Boletas',       nivel: NivelPermiso.DENEGADO },
    { modulo: 'Usuarios',      nivel: NivelPermiso.DENEGADO },
  ],
  CONTROL_ESCOLAR: [
    { modulo: 'Alumnos',       nivel: NivelPermiso.LECTURA },          // Solo puede ver
    { modulo: 'Tutores',       nivel: NivelPermiso.LECTURA },          // Solo puede ver
    { modulo: 'Grupos',        nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Materias',      nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Calificaciones',nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    { modulo: 'Boletas',       nivel: NivelPermiso.LECTURA_Y_ESCRITURA },
    // Acceso denegado a finanzas
    { modulo: 'Inscripciones', nivel: NivelPermiso.DENEGADO },
    { modulo: 'Pagos',         nivel: NivelPermiso.DENEGADO },
    { modulo: 'Becas',         nivel: NivelPermiso.DENEGADO },
    { modulo: 'Configuracion', nivel: NivelPermiso.DENEGADO },
    { modulo: 'Usuarios',      nivel: NivelPermiso.DENEGADO },
    { modulo: 'Reportes',      nivel: NivelPermiso.DENEGADO },
  ],
};

// ─── Definición de roles ──────────────────────────────────────────────────────
const ROLES_OPERATIVOS = [
  { codigo: 'ADMIN',           nombre: 'Administrador',            descripcion: 'Acceso total al sistema.' },
  { codigo: 'GESTOR',          nombre: 'Gestión Administrativa',   descripcion: 'Gestiona alumnos, pagos, inscripciones, becas y configuración.' },
  { codigo: 'CONTROL_ESCOLAR', nombre: 'Control Escolar',          descripcion: 'Gestiona grupos, materias, calificaciones y boletas. Acceso de lectura a expedientes.' },
];

async function main() {
  console.log('\n🌱 FASE 1 — Seed de Roles y Permisos\n');

  // 1. Crear / actualizar roles operativos
  console.log('── Paso 1: Verificando roles...');
  for (const rol of ROLES_OPERATIVOS) {
    await prisma.rol.upsert({
      where:  { codigo: rol.codigo },
      update: { nombre: rol.nombre, descripcion: rol.descripcion },
      create: rol,
    });
    console.log(`   ✅ Rol "${rol.nombre}" (${rol.codigo}) listo.`);
  }

  // 2. Desactivar el rol DOCENTE y CAJERO (soft-delete del rol, sin borrar historial)
  console.log('\n── Paso 2: Desactivando roles obsoletos (DOCENTE, CAJERO)...');
  const rolesObsoletos = ['DOCENTE', 'CAJERO'];
  for (const codigo of rolesObsoletos) {
    const rol = await prisma.rol.findUnique({ where: { codigo } });
    if (rol && !rol.eliminadoEn) {
      await prisma.rol.update({
        where:  { codigo },
        update: { eliminadoEn: new Date() },
      } as any);
      console.log(`   ⚠️  Rol "${codigo}" marcado como eliminado.`);
    } else {
      console.log(`   ℹ️  Rol "${codigo}" ya estaba inactivo o no existe.`);
    }
  }

  // 3. Asignar permisos de módulo a todos los usuarios según su rol activo
  console.log('\n── Paso 3: Actualizando permisos de módulo por usuario...');
  
  for (const codigoRol of Object.keys(PERMISOS_POR_ROL)) {
    const rol = await prisma.rol.findUnique({ where: { codigo: codigoRol } });
    if (!rol) continue;

    // Obtener todos los usuarios activos con este rol
    const usuariosRol = await prisma.usuarioRol.findMany({
      where: { rolId: rol.rolId, activo: true, eliminadoEn: null },
      select: { usuarioId: true },
    });

    if (usuariosRol.length === 0) {
      console.log(`   ℹ️  No hay usuarios con rol ${codigoRol}.`);
      continue;
    }

    for (const { usuarioId } of usuariosRol) {
      for (const permiso of PERMISOS_POR_ROL[codigoRol]) {
        await prisma.usuarioPermisoModulo.upsert({
          where:  { usuarioId_modulo: { usuarioId, modulo: permiso.modulo } },
          update: { nivel: permiso.nivel, activo: true },
          create: { usuarioId, modulo: permiso.modulo, nivel: permiso.nivel, activo: true },
        });
      }
      console.log(`   ✅ Permisos de ${codigoRol} aplicados al usuario ID ${usuarioId}.`);
    }
  }

  console.log('\n🎉 Fase 1 completada. Los roles y permisos están configurados en la BD.\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
