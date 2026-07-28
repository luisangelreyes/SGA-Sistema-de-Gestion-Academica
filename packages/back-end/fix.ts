import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const grupos = await prisma.grupo.findMany({
    include: {
      grado: {
        include: { materias: true }
      },
      materias: true
    }
  });

  let count = 0;
  for (const g of grupos) {
    for (const m of g.grado.materias) {
      if (!g.materias.some(gm => gm.materiaId === m.materiaId)) {
        await prisma.grupoMateria.create({
          data: {
            grupoId: g.grupoId,
            materiaId: m.materiaId,
            docenteId: m.docenteId || null
          }
        });
        count++;
      }
    }
  }
  console.log(`Migrated ${count} missing subjects to groups.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
