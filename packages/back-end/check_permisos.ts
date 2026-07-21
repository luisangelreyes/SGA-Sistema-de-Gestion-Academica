import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const permisos = await prisma.usuarioPermisoModulo.findMany();
  console.log("Permisos:", JSON.stringify(permisos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
