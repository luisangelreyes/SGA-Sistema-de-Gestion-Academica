/*
  Warnings:

  - The values [EFECTIVO] on the enum `MetodoPago` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetodoPago_new" AS ENUM ('OTRO', 'DEPOSITO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO');
ALTER TABLE "pago" ALTER COLUMN "metodo_pago" TYPE "MetodoPago_new" USING ("metodo_pago"::text::"MetodoPago_new");
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";
ALTER TYPE "MetodoPago_new" RENAME TO "MetodoPago";
DROP TYPE "MetodoPago_old";
COMMIT;
