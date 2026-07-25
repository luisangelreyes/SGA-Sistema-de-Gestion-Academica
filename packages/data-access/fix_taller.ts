import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.materia.updateMany({
    where: { tipo: 'taller' },
    data: { tipo: 'club' }
  });
  console.log(`Updated ${res.count} materias from 'taller' to 'club'.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
