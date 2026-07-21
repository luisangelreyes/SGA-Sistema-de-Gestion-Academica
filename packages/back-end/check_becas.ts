import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const becas = await prisma.beca.findMany();
  console.log("Becas en BD:", JSON.stringify(becas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
