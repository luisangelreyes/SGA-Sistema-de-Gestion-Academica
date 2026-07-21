import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cycle = await prisma.cicloEscolar.findFirst({
    where: { nombre: 'ENE-JUN' },
    include: {
      inscripciones: true,
      calendariosPagos: { include: { aplicacionesPago: true } }
    }
  });
  console.log(JSON.stringify(cycle, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
