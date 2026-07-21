import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de becas promocionales...');

  const becas = [
    { nombreBeca: 'Promoción Inscripción - 30%', criterio: 'PROMOCION_TEMPRANA', porcentaje: 30.00, descripcion: 'Aplica a colegiaturas. 30% descuento.' },
    { nombreBeca: 'Promoción Inscripción - 25%', criterio: 'PROMOCION_TEMPRANA', porcentaje: 25.00, descripcion: 'Aplica a colegiaturas. 25% descuento.' },
    { nombreBeca: 'Promoción Inscripción - 23%', criterio: 'PROMOCION_TEMPRANA', porcentaje: 23.00, descripcion: 'Aplica a colegiaturas. 23% descuento.' },
  ];

  for (const beca of becas) {
    await prisma.beca.create({
      data: beca as any
    });
    console.log(`Beca creada: ${beca.nombreBeca}`);
  }

  console.log('Carga completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
