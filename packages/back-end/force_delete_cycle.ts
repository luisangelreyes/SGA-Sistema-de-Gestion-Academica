import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cicloName = 'ENE-JUN';
  const cycle = await prisma.cicloEscolar.findFirst({ where: { nombre: cicloName } });
  
  if (!cycle) {
    console.log('No se encontro el ciclo');
    return;
  }

  const cicloId = cycle.cicloId;
  console.log(`Borrando datos del ciclo ${cicloId} (${cicloName})...`);

  // 1. Borrar pagos (aplicaciones)
  await prisma.aplicacionPago.deleteMany({
    where: { calendarioPago: { cicloId } }
  });

  // 2. Borrar calendarios
  await prisma.calendarioPago.deleteMany({
    where: { cicloId }
  });

  // 3. Borrar inscripciones
  await prisma.inscripcionCiclo.deleteMany({
    where: { cicloId }
  });

  // 4. Borrar grupos de este ciclo
  await prisma.grupo.deleteMany({
    where: { cicloId }
  });

  // 5. Borrar tarifas de este ciclo
  await prisma.tarifa.deleteMany({
    where: { cicloId }
  });

  // 6. Finalmente borrar el ciclo
  await prisma.cicloEscolar.delete({
    where: { cicloId }
  });

  console.log('Ciclo y sus dependencias eliminados con exito!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
