-- CreateEnum
CREATE TYPE "EstadoPagoDanos" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "PagoDanos" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "montoDanos" DOUBLE PRECISION NOT NULL,
    "descripcionDanos" TEXT NOT NULL,
    "estadoPago" "EstadoPagoDanos" NOT NULL DEFAULT 'PENDIENTE',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "fechaPago" TIMESTAMP(3),
    "usuarioRegistra" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioActualiza" TEXT,
    "fechaActualiza" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoDanos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagoDanos" ADD CONSTRAINT "PagoDanos_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;