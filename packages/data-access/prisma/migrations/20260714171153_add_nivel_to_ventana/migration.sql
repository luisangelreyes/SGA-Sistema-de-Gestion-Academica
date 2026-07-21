/*
  Warnings:

  - Added the required column `nivel_id` to the `ventana_inscripcion_temprana` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ventana_inscripcion_temprana" ADD COLUMN     "nivel_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ventana_inscripcion_temprana" ADD CONSTRAINT "ventana_inscripcion_temprana_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "nivel_educativo"("nivel_id") ON DELETE RESTRICT ON UPDATE CASCADE;
