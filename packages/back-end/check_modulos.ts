import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const modulos = await prisma.modulo.findMany();
  console.log("Modulos en BD:", JSON.stringify(modulos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
