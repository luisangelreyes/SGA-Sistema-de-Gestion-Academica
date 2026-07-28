/*
  Warnings:

  - You are about to drop the column `grado_id` on the `ventana_inscripcion_temprana` table. All the data in the column will be lost.
  - You are about to drop the column `nivel_id` on the `ventana_inscripcion_temprana` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ventana_inscripcion_temprana" DROP CONSTRAINT "ventana_inscripcion_temprana_grado_id_fkey";

-- DropForeignKey
ALTER TABLE "ventana_inscripcion_temprana" DROP CONSTRAINT "ventana_inscripcion_temprana_nivel_id_fkey";

-- AlterTable
ALTER TABLE "ventana_inscripcion_temprana" DROP COLUMN "grado_id",
DROP COLUMN "nivel_id",
ADD COLUMN     "nombre_promo" VARCHAR(100);

-- CreateTable
CREATE TABLE "ventana_inscripcion_grado" (
    "id" SERIAL NOT NULL,
    "ventana_id" INTEGER NOT NULL,
    "grado_id" INTEGER NOT NULL,

    CONSTRAINT "ventana_inscripcion_grado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ventana_inscripcion_grado_ventana_id_grado_id_key" ON "ventana_inscripcion_grado"("ventana_id", "grado_id");

-- AddForeignKey
ALTER TABLE "ventana_inscripcion_grado" ADD CONSTRAINT "ventana_inscripcion_grado_ventana_id_fkey" FOREIGN KEY ("ventana_id") REFERENCES "ventana_inscripcion_temprana"("ventana_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventana_inscripcion_grado" ADD CONSTRAINT "ventana_inscripcion_grado_grado_id_fkey" FOREIGN KEY ("grado_id") REFERENCES "grado"("grado_id") ON DELETE CASCADE ON UPDATE CASCADE;
