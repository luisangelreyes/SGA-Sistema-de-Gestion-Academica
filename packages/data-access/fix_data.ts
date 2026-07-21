import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing test data for ciclo 2...');
  
  // 1. Delete generated payments and inscriptions for ciclo 2
  await prisma.calendarioPago.deleteMany({
    where: { cicloId: 2 }
  });
  
  await prisma.inscripcionCiclo.deleteMany({
    where: { cicloId: 2 }
  });
  
  // 2. Fix the start date of ciclo 2 to August 2027
  await prisma.cicloEscolar.update({
    where: { cicloId: 2 },
    data: {
      fechaInicio: new Date('2027-08-01T00:00:00.000Z')
    }
  });

  // 3. Check if Tarifas exist for ciclo 2, if not clone from ciclo 1
  const tarifasCiclo2 = await prisma.tarifa.findMany({
    where: { cicloId: 2 }
  });

  if (tarifasCiclo2.length === 0) {
    const tarifasCiclo1 = await prisma.tarifa.findMany({
      where: { cicloId: 1, eliminadoEn: null }
    });

    if (tarifasCiclo1.length > 0) {
      const newTarifas = tarifasCiclo1.map(t => ({
        cicloId: 2,
        nivelId: t.nivelId,
        concepto: t.concepto,
        monto: t.monto,
        descripcion: t.descripcion,
        activa: t.activa
      }));
      await prisma.tarifa.createMany({ data: newTarifas });
      console.log('Tarifas cloned to ciclo 2.');
    }
  }

  console.log('Done fixing data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
