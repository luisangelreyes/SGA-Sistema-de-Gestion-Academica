import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Granting Calificaciones permission to all ADMINs...');
  
  const admins = await prisma.usuarioRol.findMany({
    where: { rol: { codigo: 'ADMIN' } },
  });

  for (const admin of admins) {
    await prisma.usuarioPermisoModulo.upsert({
      where: {
        usuarioId_modulo: {
          usuarioId: admin.usuarioId,
          modulo: 'Calificaciones',
        },
      },
      update: {},
      create: {
        usuarioId: admin.usuarioId,
        modulo: 'Calificaciones',
        nivel: 'LECTURA_Y_ESCRITURA',
      },
    });
  }
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
