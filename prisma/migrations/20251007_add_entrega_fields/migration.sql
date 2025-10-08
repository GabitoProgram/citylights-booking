-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('PENDIENTE', 'ENTREGADO', 'NO_APLICA');

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "costoEntrega" DOUBLE PRECISION,
ADD COLUMN     "estadoEntrega" "EstadoEntrega" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaEntrega" TIMESTAMP(3),
ADD COLUMN     "observacionesEntrega" TEXT,
ADD COLUMN     "pagoEntrega" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usuarioEntrega" TEXT;