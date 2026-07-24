import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando migración de Docentes ---');

  // 1. Obtener todos los usuarios con rol DOCENTE
  const usuariosDocentes = await prisma.usuario.findMany({
    where: {
      roles: {
        some: {
          rol: { codigo: 'DOCENTE' }
        }
      }
    }
  });

  console.log(`Se encontraron ${usuariosDocentes.length} usuarios con rol DOCENTE.`);

  // 2. Crear los registros en la tabla Docente
  for (const usuario of usuariosDocentes) {
    console.log(`Migrando usuario: ${usuario.nombreCompleto} (ID: ${usuario.usuarioId})...`);

    // Crear el docente si no existe uno con el mismo correo/nombre (simplificado)
    const docente = await prisma.docente.create({
      data: {
        nombreCompleto: usuario.nombreCompleto,
        telefono: usuario.telefono,
        // No tenemos correo en usuario por defecto, podríamos usar nombreUsuario si parece correo
        correo: usuario.nombreUsuario.includes('@') ? usuario.nombreUsuario : null,
        activo: usuario.activo,
        creadoEn: usuario.creadoEn,
      }
    });

    console.log(`-> Creado Docente ID: ${docente.docenteId}`);

    // 3. Actualizar Materias que tenían este docenteId (apuntando al usuarioId)
    // NOTA: Como la FK se actualizó para apuntar a Docente, los IDs viejos en materia.docenteId
    // que coincidían con usuarioId podrían causar error si Docente no tenía los mismos IDs.
    // Para resolver esto:
    
    // Primero, actualizar el ID en materias
    const materiasActualizadas = await prisma.$executeRawUnsafe(`
      UPDATE "materia" SET "docente_id" = ${docente.docenteId} WHERE "docente_id" = ${usuario.usuarioId}
    `);
    
    // Actualizar el ID en grupo_materia
    const gruposMateriasActualizados = await prisma.$executeRawUnsafe(`
      UPDATE "grupo_materia" SET "docente_id" = ${docente.docenteId} WHERE "docente_id" = ${usuario.usuarioId}
    `);

    console.log(`   -> Materias actualizadas: ${materiasActualizadas}`);
    console.log(`   -> GruposMateria actualizados: ${gruposMateriasActualizados}`);

    // 4. Eliminar el rol DOCENTE del usuario
    await prisma.usuarioRol.deleteMany({
      where: {
        usuarioId: usuario.usuarioId,
        rol: { codigo: 'DOCENTE' }
      }
    });
    console.log(`   -> Rol DOCENTE eliminado del usuario ${usuario.usuarioId}`);
    
    // 5. Eliminar lógicamente el usuario ya que no tendrá acceso
    // NOTA: Si el usuario es administrador también, no lo eliminamos
    const rolesRestantes = await prisma.usuarioRol.count({
      where: { usuarioId: usuario.usuarioId }
    });
    
    if (rolesRestantes === 0) {
      await prisma.usuario.update({
        where: { usuarioId: usuario.usuarioId },
        data: { eliminadoEn: new Date(), activo: false }
      });
      console.log(`   -> Usuario ${usuario.usuarioId} marcado como eliminado (sin roles)`);
    } else {
      console.log(`   -> Usuario ${usuario.usuarioId} mantenido activo (tiene otros roles)`);
    }
  }

  console.log('--- Migración completada ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
