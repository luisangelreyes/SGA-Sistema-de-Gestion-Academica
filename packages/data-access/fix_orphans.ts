import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Buscando y arreglando referencias huerfanas ---');

  // Buscar materias con docente_id que no exista en la tabla docente
  const materias = await prisma.$executeRawUnsafe(`
    UPDATE "materia"
    SET "docente_id" = NULL
    WHERE "docente_id" IS NOT NULL 
      AND "docente_id" NOT IN (SELECT "docente_id" FROM "docente");
  `);
  
  const grupoMaterias = await prisma.$executeRawUnsafe(`
    UPDATE "grupo_materia"
    SET "docente_id" = NULL
    WHERE "docente_id" IS NOT NULL 
      AND "docente_id" NOT IN (SELECT "docente_id" FROM "docente");
  `);

  console.log(`Materias huerfanas limpiadas: ${materias}`);
  console.log(`GruposMateria huerfanos limpiados: ${grupoMaterias}`);
  console.log('--- Listo para npx prisma db push ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
