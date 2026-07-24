import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Preparando base de datos para la migración de Docentes ---');

  // 1. Crear tabla docente si no existe
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "docente" (
      "docente_id" SERIAL NOT NULL,
      "nombre_completo" VARCHAR(120) NOT NULL,
      "correo" VARCHAR(255),
      "telefono" VARCHAR(20),
      "especialidad" VARCHAR(100),
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "eliminado_en" TIMESTAMP(3),
      CONSTRAINT "docente_pkey" PRIMARY KEY ("docente_id")
    );
  `);
  console.log('Tabla docente asegurada.');

  // 2. Migrar los usuarios docentes directamente con SQL
  await prisma.$executeRawUnsafe(`
    INSERT INTO "docente" ("docente_id", "nombre_completo", "telefono", "correo", "activo", "creado_en")
    SELECT u.usuario_id, u.nombre_completo, u.telefono, 
           CASE WHEN u.nombre_usuario LIKE '%@%' THEN u.nombre_usuario ELSE NULL END, 
           u.activo, u.creado_en
    FROM "usuario" u
    JOIN "usuario_rol" ur ON u.usuario_id = ur.usuario_id
    JOIN "rol" r ON ur.rol_id = r.rol_id
    WHERE r.codigo = 'DOCENTE'
    ON CONFLICT ("docente_id") DO NOTHING;
  `);
  console.log('Usuarios docentes migrados a la tabla docente.');

  // 3. Ajustar la secuencia de docente_id para evitar colisiones futuras
  await prisma.$executeRawUnsafe(`
    SELECT setval('docente_docente_id_seq', COALESCE((SELECT MAX(docente_id) FROM "docente"), 1));
  `);
  console.log('Secuencia de docente_id ajustada.');

  console.log('--- Preparación completada. Ahora puedes ejecutar npx prisma db push ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
