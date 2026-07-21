/*
  Warnings:

  - A unique constraint covering the columns `[alumno_id,ciclo_id,grado_id]` on the table `inscripcion_ciclo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ventana_inscripcion_temprana" DROP CONSTRAINT "ventana_inscripcion_temprana_beca_id_fkey";

-- DropIndex
DROP INDEX "inscripcion_ciclo_alumno_id_ciclo_id_key";

-- AlterTable
ALTER TABLE "ventana_inscripcion_temprana" ADD COLUMN     "descuento_inscripcion" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grado_id" INTEGER,
ALTER COLUMN "beca_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_ciclo_alumno_id_ciclo_id_grado_id_key" ON "inscripcion_ciclo"("alumno_id", "ciclo_id", "grado_id");

-- AddForeignKey
ALTER TABLE "ventana_inscripcion_temprana" ADD CONSTRAINT "ventana_inscripcion_temprana_beca_id_fkey" FOREIGN KEY ("beca_id") REFERENCES "beca"("beca_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventana_inscripcion_temprana" ADD CONSTRAINT "ventana_inscripcion_temprana_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE SET NULL ON UPDATE CASCADE;
