-- CreateTable
CREATE TABLE "grado" (
    "grado_id" SERIAL NOT NULL,
    "nivel_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "creado_en" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "eliminado_en" TIMESTAMPTZ,

    CONSTRAINT "grado_pkey" PRIMARY KEY ("grado_id")
);

-- AddForeignKey
ALTER TABLE "grado" ADD CONSTRAINT "grado_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "nivel_educativo"("nivel_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Insert default 1st grade for all existing educational levels so existing groups can reference it
INSERT INTO "grado" ("nivel_id", "numero", "nombre")
SELECT "nivel_id", 1, '1º Grado' FROM "nivel_educativo";

-- AlterTable to add grado_id column as nullable first
ALTER TABLE "grupo" ADD COLUMN     "grado_id" INTEGER;

-- Update existing groups to reference the created grade for their level
UPDATE "grupo" g
SET "grado_id" = (
  SELECT "grado_id" FROM "grado" gr
  WHERE gr."nivel_id" = g."nivel_id"
  ORDER BY gr."grado_id" ASC
  LIMIT 1
);

-- Force NOT NULL now that existing rows have been populated
ALTER TABLE "grupo" ALTER COLUMN "grado_id" SET NOT NULL;

-- AlterTable to add other new columns
ALTER TABLE "alumno" ADD COLUMN     "grado_id" INTEGER;
ALTER TABLE "inscripcion_ciclo" ADD COLUMN     "grado_id" INTEGER;
ALTER TABLE "materia" ADD COLUMN     "grado_id" INTEGER;

-- Drop foreign keys first (if they need recreation)
ALTER TABLE "alumno" DROP CONSTRAINT IF EXISTS "alumno_nivel_id_fkey";
ALTER TABLE "grupo" DROP CONSTRAINT IF EXISTS "grupo_ciclo_id_fkey";
ALTER TABLE "grupo" DROP CONSTRAINT IF EXISTS "grupo_nivel_id_fkey";
ALTER TABLE "inscripcion_ciclo" DROP CONSTRAINT IF EXISTS "inscripcion_ciclo_alumno_id_fkey";
ALTER TABLE "inscripcion_ciclo" DROP CONSTRAINT IF EXISTS "inscripcion_ciclo_ciclo_id_fkey";
ALTER TABLE "inscripcion_ciclo" DROP CONSTRAINT IF EXISTS "inscripcion_ciclo_grupo_id_fkey";

-- Add foreign key constraints
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "nivel_educativo"("nivel_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_ciclo_id_fkey" FOREIGN KEY ("ciclo_id") REFERENCES "ciclo_escolar"("ciclo_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "materia" ADD CONSTRAINT "materia_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "alumno" ADD CONSTRAINT "alumno_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "nivel_educativo"("nivel_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inscripcion_ciclo" ADD CONSTRAINT "inscripcion_ciclo_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumno"("alumno_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "inscripcion_ciclo" ADD CONSTRAINT "inscripcion_ciclo_ciclo_id_fkey" FOREIGN KEY ("ciclo_id") REFERENCES "ciclo_escolar"("ciclo_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "inscripcion_ciclo" ADD CONSTRAINT "inscripcion_ciclo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupo"("grupo_id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "inscripcion_ciclo" ADD CONSTRAINT "inscripcion_ciclo_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE NO ACTION ON UPDATE CASCADE;
